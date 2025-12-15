const { supabase } = require("../config/supabaseClient");
const { sendTeamValidationEmail } = require("./emailService");

/**
 * Update Student Learning Path (Admin Override)
 */
async function updateStudentLearningPathService(userId, { learning_path }) {
  // Validate Enum
  const validPaths = [
    "Machine Learning (ML)", 
    "Front-End Web & Back-End with AI (FEBE)", 
    "React & Back-End with AI (REBE)"
  ];
  if (!validPaths.includes(learning_path)) {
    throw { 
      code: "INVALID_LEARNING_PATH", 
      message: "Learning Path tidak valid. Pilih antara: ML, FEBE, atau REBE." 
    };
  }

  // Admin Override: No check for previous value ("Bebas")
  const { data: user, error } = await supabase
    .from("users")
    .update({ learning_path, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id, name, email, learning_path")
    .single();

  if (error) {
    throw { code: "DB_UPDATE_FAILED", message: "Gagal memperbarui learning path student." };
  }

  return user;
}

// Helper to generate Group Source ID (CAPS + Timestamp + Random)
function generateGroupSourceId() {
  const timestamp = new Date().getTime().toString().slice(-4);
  const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  return `CAPS-${timestamp}${random}`;
}

/**
 * Create a new capstone group
 */
async function createGroupService(userId, { group_name, batch_id, use_case_id }) {
  // 1. INSERT ke capstone_groups
  const { data: group, error: insertErr } = await supabase
    .from("capstone_groups")
    .insert({
      group_name,
      batch_id,
      creator_user_ref: userId,
      use_case_ref: use_case_id,
      status: "pending_validation",
      created_at: new Date().toISOString(),
      capstone_groups_source_id: generateGroupSourceId(), // Auto-generate CAPS ID
    })
    .select("id, group_name, batch_id, creator_user_ref, status, created_at, capstone_groups_source_id")
    .single();

  if (insertErr || !group) {
    console.error("Supabase INSERT Error (capstone_groups):", insertErr);
    throw { code: "DB_INSERT_FAILED", message: "Gagal membuat grup karena masalah database." };
  }

  // 2. INSERT ke capstone_group_member (Menetapkan Leader)
  const leaderPayload = {
    group_ref: group.id,
    user_ref: userId,
    role: "leader",
    state: "active",
    joined_at: new Date().toISOString(),
  };
  const { error: memberErr } = await supabase
    .from("capstone_group_member")
    .insert(leaderPayload);

  if (memberErr) {
    console.error("Supabase INSERT Error (group_member):", memberErr);
    throw { code: "GROUP_MEMBER_INSERT_FAILED", message: "Grup berhasil dibuat, namun gagal menetapkan leader grup." };
  }

  return group;
}

/**
 * Update project status to in_progress
 */
async function updateProjectStatusService(groupId) {
  const { error } = await supabase
    .from("capstone_groups")
    .update({ status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", groupId);

  if (error) {
    throw { code: "DB_UPDATE_FAILED", message: "Gagal memperbarui status proyek." };
  }
}

/**
 * Remove a member from a group (Admin Manual)
 * Implements SOFT DELETE (updates state to inactive)
 */
async function removeMemberFromGroupService(groupId, userId) {
  const { error } = await supabase
    .from("capstone_group_member")
    .update({ 
      state: "inactive", 
      left_at: new Date().toISOString() 
    })
    .eq("group_ref", groupId)
    .eq("user_ref", userId);

  if (error) {
    throw { code: "DB_UPDATE_FAILED", message: "Gagal menghapus anggota dari tim (Soft Delete)." };
  }
}
/**
 * Update group details
 */
async function updateGroupService(groupId, { group_name, batch_id, status }) {
  const updates = {};
  if (group_name !== undefined) updates.group_name = group_name;
  if (batch_id !== undefined) updates.batch_id = batch_id;
  if (status !== undefined) updates.status = status;

  updates.updated_at = new Date().toISOString();

  const { data: updatedGroup, error } = await supabase
    .from("capstone_groups")
    .update(updates)
    .eq("id", groupId)
    .select("id, group_name, batch_id, updated_at")
    .single();

  if (error) {
    console.error("Supabase UPDATE Error:", error);
    throw { code: "DB_UPDATE_FAILED", message: "Gagal memperbarui data grup karena masalah database." };
  }

  if (!updatedGroup) {
    throw { code: "NOT_FOUND", message: `Grup dengan ID ${groupId} tidak ditemukan.` };
  }

  return updatedGroup;
}

/**
 * List all groups
 */
async function listAllGroupsService() {
  const { data: groups, error } = await supabase
    .from("capstone_groups")
    .select("*, users:creator_user_ref(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase SELECT Error:", error);
    throw { code: "DB_SELECT_FAILED", message: "Gagal mengambil daftar grup." };
  }

  return groups.map((g) => ({
    ...g,
    creator_name: g.users ? g.users.name : null,
    users: undefined,
  }));
}

/**
 * Set group rules
 */
async function setGroupRulesService(batch_id, rules) {
  // 1. Nonaktifkan rules lama
  await supabase
    .from("capstone_group_rules")
    .update({ is_active: false })
    .eq("batch_id", batch_id);

  // 2. Insert rules baru
  const newRules = rules.map((r) => ({
    batch_id,
    user_attribute: r.user_attribute,
    attribute_value: r.attribute_value,
    operator: r.operator,
    value: r.value,
    is_active: true,
    is_required: true,
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("capstone_group_rules")
    .insert(newRules)
    .select();

  if (error) {
    console.error("Supabase INSERT Error (rules):", error);
    throw { code: "DB_INSERT_FAILED", message: "Gagal menyimpan aturan grup." };
  }

  return data;
}

/**
 * Validate group registration
 */
async function validateGroupRegistrationService(groupId, status, rejection_reason) {
  console.log(`[DEBUG] validateGroupRegistrationService HIT! GroupID: ${groupId}, Status: ${status}`);

  // 1. Update status grup
  const updatePayload = {
    status: status,
    updated_at: new Date().toISOString(),
  };

  const { data: group, error } = await supabase
    .from("capstone_groups")
    .update(updatePayload)
    .eq("id", groupId)
    .select("*, creator_user_ref(email, name)")
    .single();

  if (error) {
    console.error("[DEBUG] DB Update Error:", error);
    throw { code: "DB_UPDATE_FAILED", message: "Gagal memvalidasi grup." };
  }
  
  console.log("[DEBUG] Group status updated successfully.");

  // 2. Send Email Notification (Active Members)
  try {
    // Get all user emails in the group
    const { data: members, error: memberError } = await supabase
      .from("capstone_group_member")
      .select("user_ref, users:user_ref(email)")
      .eq("group_ref", groupId)
      .eq("state", "active"); 
      
    if (memberError) {
      console.error("[DEBUG] Member Query Error:", memberError);
    }
    console.log("[DEBUG] Raw Members Query Result:", members);

    if (members && members.length > 0) {
      console.log(`[DEBUG] Found ${members.length} active members.`);
      const emails = members
        .map(m => m.users?.email)
        .filter(email => email); // Filter out null/undefined
      
      console.log(`[DEBUG] Extracted emails:`, emails);

      if (emails.length > 0) {
        // Send async
        sendTeamValidationEmail(emails, group.group_name, status, rejection_reason)
          .then(() => console.log(`[DEBUG] Email sent successfully to ${emails.length} recipients.`))
          .catch(err => console.error("Failed to send validation emails:", err));
      } else {
        console.log("[DEBUG] No valid emails found to send.");
      }
    } else {
      console.log("[DEBUG] No active members found for this group.");
    }
  } catch (emailErr) {
    console.error("Error sending validation emails:", emailErr);
  }

  return group;
}

/**
 * List deliverables with filters
 */
async function listDeliverablesService({ document_type, use_case_id }) {
  let query = supabase
    .from("capstone_group_deliverables")
    .select(`
      id,
      document_type,
      file_path,
      description,
      status,
      submitted_at,
      group_ref,
      capstone_groups!inner(group_name, use_case_ref, capstone_use_case(name))
    `)
    .order("submitted_at", { ascending: false });

  if (document_type) {
    query = query.eq("document_type", document_type);
  }

  if (use_case_id) {
    query = query.eq("capstone_groups.use_case_ref", use_case_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("List Deliverables Error:", error);
    throw { code: "DB_SELECT_FAILED", message: "Gagal mengambil daftar dokumen." };
  }

  // Flatten structure for easier consumption
  return data.map(d => ({
    id: d.id,
    group_name: d.capstone_groups?.group_name,
    use_case_name: d.capstone_groups?.capstone_use_case?.name,
    document_type: d.document_type,
    file_path: d.file_path,
    description: d.description,
    status: d.status,
    submitted_at: d.submitted_at
  }));
}


/**
 * Add a member to a group (Admin Manual)
 */
async function addMemberToGroupService(groupId, userId) {
  // 1. Check if user is already in an active group
  const { data: existing } = await supabase
    .from("capstone_group_member")
    .select("id, group_ref")
    .eq("user_ref", userId)
    .eq("state", "active")
    .maybeSingle();

  if (existing) {
    throw { code: "ALREADY_IN_TEAM", message: "User sudah tergabung dalam tim lain." };
  }

  // 1b. Get User Source ID
  const { data: user } = await supabase
    .from("users")
    .select("users_source_id")
    .eq("id", userId)
    .single();

  if (!user) throw { code: "USER_NOT_FOUND", message: "User tidak ditemukan." };

  // 2. Add to group
  const { data, error } = await supabase
    .from("capstone_group_member")
    .insert({
      group_ref: groupId,
      user_ref: userId,
      user_id: user.users_source_id, // Populate Source ID column
      role: "member",
      state: "active",
      joined_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw { code: "DB_INSERT_FAILED", message: "Gagal menambahkan anggota ke tim." };
  }
  return data;
}

/**
 * Update member status in a group (Admin Manual)
 * Handles Soft Delete (inactive) or Reactivation (active)
 */
async function updateMemberStatusService(groupId, userId, status) {
  const updatePayload = {
    state: status,
    updated_at: new Date().toISOString(),
  };

  // Column 'left_at' does not exist in schema, so we only update state and updated_at
  // if (status === "inactive") {
  //   updatePayload.left_at = new Date().toISOString();
  // } else if (status === "active") {
  //   updatePayload.left_at = null;
  // }

  const { error } = await supabase
    .from("capstone_group_member")
    .update(updatePayload)
    .eq("group_ref", groupId)
    .eq("user_ref", userId);

  if (error) {
    throw { code: "DB_UPDATE_FAILED", message: "Gagal memperbarui status anggota." };
  }
}

/**
 * Auto Assign / Randomize Members
 */
/**
 * Auto Assign / Randomize Members with Rules & Use Case
 */
async function autoAssignMembersService(batchId) {
  // 1. Get All Unassigned Students
  const unassigned = await getUnassignedStudentsService(batchId);

  if (!unassigned || unassigned.length === 0) {
    return { message: "Semua siswa sudah memiliki tim.", assigned_count: 0 };
  }

  // 2. Get Rules for Batch
  const { data: rules } = await supabase
    .from("capstone_group_rules")
    .select("*")
    .eq("batch_id", batchId)
    .eq("is_active", true);

  // 3. Get All Use Cases
  const { data: useCases } = await supabase
    .from("capstone_use_case")
    .from("capstone_use_case")
    .select("id, name, capstone_use_case_source_id");

  // Helper to shuffle array
  const shuffle = (array) => array.sort(() => 0.5 - Math.random());
  
  // Categorize students by Learning Path
  const studentsByPath = {};
  unassigned.forEach(s => {
    const path = s.learning_path || "Unknown";
    if (!studentsByPath[path]) studentsByPath[path] = [];
    studentsByPath[path].push(s);
  });

  // Shuffle each bucket
  Object.keys(studentsByPath).forEach(k => shuffle(studentsByPath[k]));

  const assignments = [];
  let createdGroupsCount = 0;
  const TEAM_SIZE = 3; // Default target size

  // --- TEAM BUILDING LOGIC ---
  // Simple Strategy: Try to fulfill 'count' requirement from rules, then fill rest with random.
  
  // Parse Rules requirements (e.g. { "Machine Learning": 1, "Front-End": 1 })
  const requiredCounts = {};
  if (rules) {
    rules.forEach(r => {
      if (r.user_attribute === 'learning_path' && r.operator === '>=' && r.value) {
        requiredCounts[r.attribute_value] = parseInt(r.value);
      }
    });
  }

  // Identify leftover students pool (initially all)
  let pool = [...unassigned];

  while (pool.length > 0) {
    // Stop if remaining students are too few to form a meaningful group (e.g. < 2), 
    // unless we want to force them into a small group. Let's force them.

    // 1. Prepare ingredients for ONE team
    const teamMembers = [];
    
    // A. Try to satisfy rules first
    for (const [path, reqCount] of Object.entries(requiredCounts)) {
       // Search for students with this path in pool
       // We can't use studentsByPath directory removed/spliced index complexity, 
       // easier to filter pool dynamically or check used set.
       // Let's iterate repeatedly to find available candidates.
       
       let needed = reqCount;
       for (let i = 0; i < pool.length && needed > 0; i++) {
         if (pool[i].learning_path === path) {
           teamMembers.push(pool[i]);
           pool.splice(i, 1); // Remove from pool
           i--; // Adjust index
           needed--;
         }
       }
    }

    // B. Fill the rest with ANYONE from pool (Random) until TEAM_SIZE
    while (teamMembers.length < TEAM_SIZE && pool.length > 0) {
      // Pick random index
      const randIdx = Math.floor(Math.random() * pool.length);
      teamMembers.push(pool[randIdx]);
      pool.splice(randIdx, 1);
    }

    // If we have members, create group
    if (teamMembers.length > 0) {
      createdGroupsCount++;
      const groupName = `Auto Team ${createdGroupsCount} - ${new Date().getTime().toString().slice(-4)}`;
      
      // Pick Random Use Case
      let randomUseCaseId = null;
      if (useCases && useCases.length > 0) {
        randomUseCaseId = useCases[Math.floor(Math.random() * useCases.length)].id;
      }

      // Create Group DB
      const { data: group, error: gErr } = await supabase
        .from("capstone_groups")
        .insert({
            group_name: groupName,
            batch_id: batchId,
            status: "draft",
            created_at: new Date().toISOString(),
            creator_user_ref: teamMembers[0].id, // First member as placeholder creator
            use_case_ref: randomUseCaseId,
            capstone_groups_source_id: generateGroupSourceId(), // Auto-generate CAPS ID
        })
        .select()
        .single();
      
      if (gErr) throw { code: "DB_ERROR", message: "Gagal membuat grup otomatis." };

      // Insert Members
      for (const [idx, member] of teamMembers.entries()) {
        const role = (idx === 0) ? "leader" : "member";
        await supabase.from("capstone_group_member").insert({
            group_ref: group.id,
            user_ref: member.id,
            role: role, 
            state: "active",
            joined_at: new Date().toISOString()
        });
        
        const ucDetail = useCases.find(u => u.id === randomUseCaseId);
        assignments.push({ 
          user: member.name, 
          group: group.group_name, 
          role, 
          use_case: ucDetail ? `${ucDetail.name} (${ucDetail.capstone_use_case_source_id})` : randomUseCaseId 
        });
      }
    }
  }

  return {
    assigned_count: assignments.length,
    groups_created: createdGroupsCount,
    details: assignments
  };
}

/**
 * Get users who do NOT have a team (Unassigned)
 */
async function getUnassignedStudentsService(batchId) {
  // 1. Get All Students in Batch
  const { data: allStudents, error: uErr } = await supabase
    .from("users")
    .select("id, name, email, users_source_id, learning_path")
    .eq("batch_id", batchId)
    .ilike("role", "student");

  if (uErr) {
    throw { code: "DB_ERROR", message: "Gagal mengambil data siswa." };
  }

  // 2. Get Active Members
  const { data: activeMembers, error: mErr } = await supabase
    .from("capstone_group_member")
    .select("user_ref")
    .eq("state", "active");

  if (mErr) {
    throw { code: "DB_ERROR", message: "Gagal mengecek keanggotaan." };
  }

  const activeUserIds = new Set(activeMembers.map(m => m.user_ref));

  // 3. Filter
  // Return students whose ID is NOT in the active set
  const unassigned = allStudents.filter(s => !activeUserIds.has(s.id));

  return unassigned;
}

/**
 * Create a new timeline entry
 */
async function createTimelineService({ title, description, start_at, end_at, batch_id }) {
  if (!batch_id) {
    // Default or require? Let's require batch_id or default to 'asah-batch-1' if common
    // But usually admin should specify. 
  }
  
  const { data, error } = await supabase
    .from("capstone_timeline")
    .insert({
      title,
      description,
      start_at,
      end_at,
      batch_id,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase INSERT Error (createTimeline):", error);
    throw { code: "DB_INSERT_FAILED", message: "Gagal membuat timeline baru." };
  }

  return data;
}

/**
 * Get Group Details by ID (Admin)
 */
async function getGroupByIdService(groupId) {
  const { data: group, error } = await supabase
    .from("capstone_groups")
    .select(`
      *,
      members:capstone_group_member (
        user_ref,
        role,
        state,
        joined_at,
        users:user_ref (name, email, learning_path, university, users_source_id)
      ),
      use_case:capstone_use_case (
        name,
        capstone_use_case_source_id,
        company
      )
    `)
    .eq("id", groupId)
    .single();

  if (error || !group) {
    throw { code: "GROUP_NOT_FOUND", message: "Data grup tidak ditemukan." };
  }

  // Format response
  return {
    ...group,
    members: group.members.map(m => ({
      id: m.user_ref,
      source_id: m.users?.users_source_id,
      name: m.users?.name,
      email: m.users?.email,
      role: m.role,
      status: m.state,
      learning_path: m.users?.learning_path,
      joined_at: m.joined_at
    }))
  };
}

/**
 * Export Groups to CSV-friendly JSON
 */
async function adminExportGroupsService() {
  const { data: groups, error } = await supabase
    .from("capstone_groups")
    .select(`
      id,
      group_name,
      status,
      batch_id,
      created_at,
      capstone_groups_source_id,
      members:capstone_group_member (
        role,
        users:user_ref (name, email, learning_path, university)
      ),
      use_case:capstone_use_case (name, company)
    `)
    .eq("members.state", "active") // Only active members
    .order("created_at", { ascending: false });

  if (error) {
    throw { code: "DB_SELECT_FAILED", message: "Gagal mengambil data untuk export." };
  }

  // Format Flat for CSV
  const exportData = [];
  
  groups.forEach(group => {
    // If group has no members, just push group info
    if (!group.members || group.members.length === 0) {
      exportData.push({
        Group_ID: group.capstone_groups_source_id || group.id,
        Batch_ID: group.batch_id,
        Group_Name: group.group_name,
        Status: group.status,
        Use_Case: group.use_case?.name || "-",
        Company: group.use_case?.company || "-",
        Member_Name: "-",
        Member_Email: "-",
        Role: "-",
        Learning_Path: "-"
      });
    } else {
      group.members.forEach(m => {
        if (!m.users) return; // Skip if user data missing
        exportData.push({
          Group_ID: group.capstone_groups_source_id || group.id,
          Batch_ID: group.batch_id,
          Group_Name: group.group_name,
          Status: group.status,
          Use_Case: group.use_case?.name || "-",
          Company: group.use_case?.company || "-",
          Member_Name: m.users.name,
          Member_Email: m.users.email,
          Role: m.role,
          Learning_Path: m.users.learning_path || "-"
        });
      });
    }
  });

  return exportData;
}

/**
 * Update Timeline
 */
async function updateTimelineService(id, updates) {
  const { title, description, start_at, end_at } = updates;
  const payload = { updated_at: new Date().toISOString() };

  if (title !== undefined) payload.title = title;
  if (description !== undefined) payload.description = description;
  if (start_at !== undefined) payload.start_at = start_at;
  if (end_at !== undefined) payload.end_at = end_at;

  const { data, error } = await supabase
    .from("capstone_timeline")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw { code: "DB_UPDATE_FAILED", message: "Gagal memperbarui timeline." };
  }

  return data;
}

/**
 * Delete Timeline
 */
async function deleteTimelineService(id) {
  const { error } = await supabase
    .from("capstone_timeline")
    .delete()
    .eq("id", id);

  if (error) {
    throw { code: "DB_DELETE_FAILED", message: "Gagal menghapus timeline." };
  }
}

module.exports = {
  createGroupService,
  updateGroupService,
  updateProjectStatusService,
  listAllGroupsService,
  getGroupByIdService,
  setGroupRulesService,
  validateGroupRegistrationService,
  updateStudentLearningPathService,
  listDeliverablesService,
  addMemberToGroupService,
  updateMemberStatusService,
  autoAssignMembersService,
  getUnassignedStudentsService,
  createTimelineService,
  adminExportGroupsService,
  updateTimelineService,
  deleteTimelineService,
};