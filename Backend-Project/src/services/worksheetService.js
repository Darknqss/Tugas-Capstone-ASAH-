const { supabase } = require("../config/supabaseClient");

/**
 * Submit a new worksheet (Check-in)
 * @param {string} userId - ID of the student
 * @param {object} data - { activity_description, proof_url, period_start, period_end }
 */
async function submitWorksheetService(userId, data) {
  // 1. Get User's Group & Batch Info
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("batch_id, capstone_group_member(group_ref)")
    .eq("id", userId)
    .single();

  if (userErr || !user) {
    throw { code: "USER_NOT_FOUND", message: "User not found." };
  }

  const groupRef = user.capstone_group_member?.[0]?.group_ref;
  if (!groupRef) {
    throw { code: "NO_TEAM", message: "User does not belong to a team." };
  }

  // 2. Insert Worksheet
  const { data: worksheet, error } = await supabase
    .from("capstone_worksheets")
    .insert({
      user_ref: userId,
      group_ref: groupRef,
      batch_id: user.batch_id,
      activity_description: data.activity_description,
      proof_url: data.proof_url,
      period_start: data.period_start,
      period_end: data.period_end,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Worksheet insert error:", error);
    throw { code: "DB_INSERT_FAILED", message: "Failed to submit worksheet." };
  }

  return worksheet;
}

/**
 * User: List my worksheets
 */
async function getMyWorksheetsService(userId) {
  const { data, error } = await supabase
    .from("capstone_worksheets")
    .select("*")
    .eq("user_ref", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw { code: "DB_SELECT_FAILED", message: "Failed to fetch worksheets." };
  }
  return data;
}

/**
 * Admin: List worksheets (with filters)
 * @param {object} filters - { batch_id, status, user_id }
 */
async function getAllWorksheetsService({ batch_id, status, user_id }) {
  let query = supabase
    .from("capstone_worksheets")
    .select("*, users:user_ref(name, email), capstone_groups:group_ref(group_name)")
    .order("created_at", { ascending: false });

  if (batch_id) query = query.eq("batch_id", batch_id);
  if (status) query = query.eq("status", status);
  if (user_id) query = query.eq("user_ref", user_id);

  const { data, error } = await query;

  if (error) {
    throw { code: "DB_SELECT_FAILED", message: "Failed to fetch worksheets." };
  }
  return data;
}

/**
 * Admin: Validate worksheet
 */
async function validateWorksheetService(worksheetId, { status, feedback }) {
  if (!["approved", "rejected", "late"].includes(status)) {
    throw { code: "INVALID_STATUS", message: "Invalid status value." };
  }

  const { data, error } = await supabase
    .from("capstone_worksheets")
    .update({ status, feedback })
    .eq("id", worksheetId)
    .select()
    .single();

  if (error) {
    throw { code: "DB_UPDATE_FAILED", message: "Failed to validate worksheet." };
  }
  return data;
}

module.exports = {
  submitWorksheetService,
  getMyWorksheetsService,
  getAllWorksheetsService,
  validateWorksheetService,
};
