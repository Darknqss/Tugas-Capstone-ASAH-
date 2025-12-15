const { supabase } = require("../config/supabaseClient");

/**
 * Submit a deliverable (Project Plan, Final Report, Video)
 * @param {string} userId
 * @param {object} data { document_type, file_path, description }
 */
async function submitDeliverableService(userId, { document_type, file_path, description }) {
  // 1. Get User's Group
  const { data: membership, error: memErr } = await supabase
    .from("capstone_group_member")
    .select("group_ref, capstone_groups(use_case_ref)")
    .eq("user_ref", userId)
    .maybeSingle();

  if (memErr) {
    throw { code: "DB_ERROR", message: "Gagal mengambil data keanggotaan." };
  }

  if (!membership) {
    throw { code: "NO_TEAM", message: "Anda belum bergabung dengan tim manapun." };
  }

  const groupId = membership.group_ref;
  const useCaseId = membership.capstone_groups?.use_case_ref;

  // 2. Validate Document Type
  const validTypes = ["PROJECT_PLAN", "FINAL_REPORT", "PRESENTATION_VIDEO"];
  if (!validTypes.includes(document_type)) {
    throw { 
      code: "INVALID_DOC_TYPE", 
      message: `Tipe dokumen tidak valid. Harus salah satu dari: ${validTypes.join(", ")}` 
    };
  }

  // 3. Insert Deliverable
  const payload = {
    group_ref: groupId,
    use_case_ref: useCaseId,
    document_type,
    file_path,
    description,
    status: "SUBMITTED",
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("capstone_group_deliverables")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Submit Deliverable Error:", error);
    throw { code: "DB_INSERT_FAILED", message: "Gagal mengumpulkan dokumen." };
  }

  return data;
}

module.exports = {
  submitDeliverableService,
};
