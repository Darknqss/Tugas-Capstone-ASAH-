const { supabase } = require("../config/supabaseClient");
const { sendEmail } = require("./emailService"); // Assuming email service is used here or available

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

/**
 * Create a new capstone group
 */
async function createGroupService(userId, { group_name, batch_id }) {
  // 1. INSERT ke capstone_groups
  const { data: group, error: insertErr } = await supabase
    .from("capstone_groups")
    .insert({
      group_name,
      batch_id,
      creator_user_ref: userId,
      status: "draft",
      created_at: new Date().toISOString(),
    })
    .select("id, group_name, batch_id, creator_user_ref, status, created_at")
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
    throw { code: "DB_UPDATE_FAILED", message: "Gagal memvalidasi grup." };
  }

  // 2. Mock Email Notification
  const emailSubject = status === "accepted" ? "Pendaftaran Tim Diterima" : "Pendaftaran Tim Ditolak";
  const emailBody = status === "accepted" 
    ? `Selamat! Tim Anda ${group.group_name} telah diterima.` 
    : `Maaf, tim Anda ditolak. Alasan: ${rejection_reason || "Tidak memenuhi kriteria."}`;
  
  console.log(`[MOCK EMAIL] To: ${group.creator_user_ref?.email}, Subject: ${emailSubject}, Body: ${emailBody}`);

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

module.exports = {
  createGroupService,
  updateGroupService,
  updateProjectStatusService,
  listAllGroupsService,
  setGroupRulesService,
  validateGroupRegistrationService,
  updateStudentLearningPathService,
  listDeliverablesService,
};
