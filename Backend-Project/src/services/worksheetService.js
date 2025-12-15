const { supabase } = require("../config/supabaseClient");

const { getPeriodByIdService } = require("./periodService");

/**
 * Submit a new worksheet (Check-in)
 * @param {string} userId - ID of the student
 * @param {object} data - { activity_description, proof_url, period_id }
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

  // 2. Validate Period & Get Dates
  if (!data.period_id) {
    throw { code: "VALIDATION_FAILED", message: "Period ID wajib diisi." };
  }

  const period = await getPeriodByIdService(data.period_id);

  // 2b. Logic Status: Check Late Submission
  const submittedAt = new Date();
  const periodEnd = new Date(period.end_date);
  
  // Set end of day for periodEnd (23:59:59)
  periodEnd.setHours(23, 59, 59, 999);

  let initialStatus = "submitted";
  if (submittedAt > periodEnd) {
    initialStatus = "submitted_late";
  }

  // 3. Insert Worksheet
  // Note: We're storing period_id if your table has it, OR just start/end dates.
  // Assuming the user's legacy table supports start/end, we'll map them from the period.
  // Ideally, you should ADD check_in_period_ref to capstone_worksheets, but for now we follow the existing fields.
  const { data: worksheet, error } = await supabase
    .from("capstone_worksheets")
    .insert({
      user_ref: userId,
      group_ref: groupRef,
      batch_id: user.batch_id,
      activity_description: data.activity_description,
      proof_url: data.proof_url,
      period_start: period.start_date, // Auto-filled from Period
      period_end: period.end_date,     // Auto-filled from Period
      status: initialStatus,
      submitted_at: submittedAt.toISOString(),
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
  // Valid status: 'completed' (Selesai), 'completed_late' (Selesai Terlambat), 'missed' (Tidak Selesai)
  // Also keeping 'submitted' or 'submitted_late' if reverting is needed, but for validation mainly these 3.
  const validStatuses = ["completed", "completed_late", "missed"];
  
  if (!validStatuses.includes(status)) {
    throw { code: "INVALID_STATUS", message: "Invalid status value. Use: completed, completed_late, or missed." };
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
