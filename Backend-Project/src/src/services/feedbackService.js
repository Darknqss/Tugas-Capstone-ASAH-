const { supabase } = require("../config/supabaseClient");

/**
 * Submit 360 Feedback for a team member
 * @param {string} reviewerId - ID of the user giving feedback
 * @param {object} data - { reviewee_source_id, is_member_active, contribution_level, reason }
 */
async function submitFeedbackService(reviewerId, data) {
  const { reviewee_id, reviewee_source_id, is_member_active, contribution_level, reason } = data;

  let revieweeId = reviewee_id;
  let revieweeBatchId = null;

  // 1. Resolve Reviewee ID
  if (revieweeId) {
    // If UUID provided, verify it exists and get batch_id
    const { data: user, error } = await supabase
      .from("users")
      .select("id, batch_id")
      .eq("id", revieweeId)
      .single();

    if (error || !user) {
      throw { code: "USER_NOT_FOUND", message: "User tidak ditemukan." };
    }
    revieweeBatchId = user.batch_id;
  } else if (reviewee_source_id) {
    // If Source ID provided, resolve to UUID
    const { data: reviewee, error: rErr } = await supabase
      .from("users")
      .select("id, batch_id")
      .eq("users_source_id", reviewee_source_id)
      .single();

    if (rErr || !reviewee) {
      throw { code: "USER_NOT_FOUND", message: "ID anggota yang dinilai tidak ditemukan." };
    }
    revieweeId = reviewee.id;
    revieweeBatchId = reviewee.batch_id;
  } else {
      throw { code: "VALIDATION_FAILED", message: "Target user ID tidak valid." };
  }

  if (reviewerId === revieweeId) {
    throw { code: "SELF_REVIEW", message: "Anda tidak dapat menilai diri sendiri." };
  }

  // 2. Validate Membership (Must be in same accepted group)
  // Check Reviewer Group
  const { data: reviewerGroup } = await supabase
    .from("capstone_group_member")
    .select("group_ref")
    .eq("user_ref", reviewerId)
    .eq("state", "active")
    .maybeSingle();

  if (!reviewerGroup) {
    // Cek apakah ada data yang "nyangkut" (ada user_id tapi user_ref null)
    try {
      const { data: user } = await supabase.from("users").select("users_source_id").eq("id", reviewerId).single();
      if (user && user.users_source_id) {
        const { data: corruptMember } = await supabase
          .from("capstone_group_member")
          .select("id")
          .eq("user_id", user.users_source_id)
          .maybeSingle();
        
        if (corruptMember) {
          throw { code: "DATA_ERROR", message: "Data keanggotaan Anda tidak valid (Inkonsistensi Database). Harap jalankan script perbaikan SQL." };
        }
      }
    } catch (ignore) {}

    throw { code: "NO_TEAM", message: "Anda belum terdaftar dalam tim manapun." };
  }

  // Check Reviewee Group
  const { data: revieweeGroup } = await supabase
    .from("capstone_group_member")
    .select("group_ref")
    .eq("user_ref", revieweeId)
    .eq("state", "active")
    .maybeSingle();

  if (!revieweeGroup) {
    throw { code: "DIFFERENT_TEAM", message: "Anggota yang dinilai belum terdaftar dalam grup manapun." };
  }

  if (reviewerGroup.group_ref !== revieweeGroup.group_ref) {
    throw { code: "DIFFERENT_TEAM", message: "Anda hanya dapat menilai anggota tim Anda sendiri (Group ID berbeda)." };
  }

  // 3. Check if already submitted
  const { data: existing } = await supabase
    .from("capstone_360_feedback")
    .select("id")
    .eq("reviewer_user_ref", reviewerId)
    .eq("reviewee_user_ref", revieweeId)
    .single();

  if (existing) {
    throw { code: "ALREADY_SUBMITTED", message: "Anda sudah menilai anggota ini." };
  } 

  // 4. Insert Feedback
  // Use explicit values if provided (and validated?), otherwise derived
  // For safety, we keep using derived values for critical logic, but we can verify consistency? 
  // User asked "kalo responsenya seperti ini", implying they WANT to send it.
  // Let's use the explicit ones if matched, or just rely on derived because it's safer.
  // Actually, let's use the derived ones as primary to ensure data integrity, 
  // BUT if the user passed explicit ones that mismatch, we could throw error?
  // Or just ignore them. The user prompt implies they want to SEND it.
  // If I just ignore them and store derived, the result in DB is the same (correct).
  // But if the user sends WRONG group_id, and I store CORRECT one, that's fine.
  // Let's stick to derived for safety (DB consistency), but allow them in payload without error.
  
  const finalGroupRef = reviewerGroup.group_ref; 
  const finalBatchId = revieweeBatchId;

  const { data: feedback, error } = await supabase
    .from("capstone_360_feedback")
    .insert({
      reviewer_user_ref: reviewerId,
      reviewee_user_ref: revieweeId,
      group_ref: finalGroupRef,
      batch_id: finalBatchId,
      is_member_active,
      contribution_level,
      reason,
      created_at: new Date().toISOString(),
    })
    .select("*, group:group_ref(group_name), reviewee:reviewee_user_ref(name)")
    .single();

  if (error) {
    console.error("Feedback insert error:", error);
    throw { code: "DB_INSERT_FAILED", message: "Gagal mengirim penilaian." };
  }

  // Format response for frontend "beauty"
  return {
    ...feedback,
    submitted_for: feedback.reviewee?.name,
    group_name: feedback.group?.group_name
  };
}

/**
 * Get Feedback Status for a user (Who have I reviewed?)
 */
async function getFeedbackStatusService(userId) {
  // Get all team members
  const { data: myGroup } = await supabase
    .from("capstone_group_member")
    .select("group_ref")
    .eq("user_ref", userId)
    .eq("state", "active")
    .single();

  if (!myGroup) return [];

  const { data: teamMembers } = await supabase
    .from("capstone_group_member")
    .select("user_ref, user_id, users:user_ref(name, users_source_id)")
    .eq("group_ref", myGroup.group_ref)
    .eq("state", "active")
    .neq("user_ref", userId); // Exclude self

  // Get completed reviews with details
  const { data: completedReviews } = await supabase
    .from("capstone_360_feedback")
    .select("reviewee_user_ref, contribution_level, reason, is_member_active, created_at")
    .eq("reviewer_user_ref", userId);

  const reviewsMap = {};
  if (completedReviews) {
    completedReviews.forEach(r => {
      reviewsMap[r.reviewee_user_ref] = r;
    });
  }

  return teamMembers.map(m => {
    const review = reviewsMap[m.user_ref];
    return {
      id: m.user_ref, // User ID (UUID)
      source_id: m.users?.users_source_id || m.user_id,
      name: m.users?.name || "Unknown Member",
      status: review ? "completed" : "pending",
      // Include feedback details if completed
      feedback: review ? {
        contribution_level: review.contribution_level,
        reason: review.reason,
        is_member_active: review.is_member_active,
        submitted_at: review.created_at
      } : null
    };
  });
}

/**
 * Admin: Get Feedback List (with filters)
 */
async function getFeedbackExportService({ batch_id, group_id } = {}) {
  let query = supabase
    .from("capstone_360_feedback")
    .select(`
      id,
      created_at,
      batch_id,
      is_member_active,
      contribution_level,
      reason,
      reviewer:reviewer_user_ref(name, email, users_source_id),
      reviewee:reviewee_user_ref(name, email, users_source_id),
      group:group_ref(group_name)
    `)
    .order("created_at", { ascending: false });

  if (batch_id) {
    query = query.eq("batch_id", batch_id);
  }
  
  if (group_id) {
    query = query.eq("group_ref", group_id);
  }

  const { data, error } = await query;

  if (error) {
    throw { code: "DB_SELECT_FAILED", message: "Gagal mengambil data feedback." };
  }

  return data;
}

module.exports = {
  submitFeedbackService,
  getFeedbackStatusService,
  getFeedbackExportService,
};
