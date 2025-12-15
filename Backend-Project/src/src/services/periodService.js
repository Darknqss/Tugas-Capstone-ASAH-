const { supabase } = require("../config/supabaseClient");

/**
 * Create a new period (Admin)
 */
async function createPeriodService({ batch_id, title, start_date, end_date }) {
  const { data, error } = await supabase
    .from("capstone_periods")
    .insert({
      batch_id,
      title,
      start_date,
      end_date,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Create period error:", error);
    throw { code: "DB_INSERT_FAILED", message: "Gagal membuat periode check-in." };
  }

  return data;
}

/**
 * List active periods for a batch
 */
async function listPeriodsService({ batch_id }) {
  let query = supabase
    .from("capstone_periods")
    .select("*")
    .order("start_date", { ascending: true });

  if (batch_id) {
    query = query.eq("batch_id", batch_id);
  }

  const { data, error } = await query;

  if (error) {
    throw { code: "DB_SELECT_FAILED", message: "Gagal mengambil daftar periode." };
  }

  return data;
}

/**
 * Get period details by ID
 */
async function getPeriodByIdService(periodId) {
  const { data, error } = await supabase
    .from("capstone_periods")
    .select("*")
    .eq("id", periodId)
    .single();

  if (error || !data) {
    throw { code: "PERIOD_NOT_FOUND", message: "Periode tidak ditemukan." };
  }

  return data;
}

module.exports = {
  createPeriodService,
  listPeriodsService,
  getPeriodByIdService,
  sendPeriodReminderService,
};

const { sendWorksheetReminderEmail } = require("./emailService");

/**
 * Send reminder to students who haven't submitted for a period
 */
async function sendPeriodReminderService(periodId) {
  // 1. Get Period Details
  const period = await getPeriodByIdService(periodId);

  // 2. Get all students in the batch
  const { data: students, error: studentErr } = await supabase
    .from("users")
    .select("id, email, name")
    .eq("batch_id", period.batch_id)
    .eq("batch_id", period.batch_id)
    .ilike("role", "student"); // Case-insensitive check

  if (studentErr) {
    console.error("Error fetching students:", studentErr);
    throw { code: "DB_ERROR", message: "Gagal mengambil data siswa." };
  }
  
  console.log(`[ReminderDebug] Found ${students.length} students in batch ${period.batch_id}`);

  // 3. Get students who HAVE submitted for this period
  // We check period_id directly (if updated) OR fallback to date range overlap if needed.
  // Since we updated logic to use period_start/end, checking overlap or specific period field if added.
  // Let's assume we check by period dates match for now as per previous service logic.
  const { data: submissions, error: subErr } = await supabase
    .from("capstone_worksheets")
    .select("user_ref")
    .eq("period_start", period.start_date)
    .eq("period_end", period.end_date);
  
  if (subErr) {
    console.error("Error fetching submissions:", subErr);
    throw { code: "DB_ERROR", message: "Gagal mengambil data submission." };
  }
  
  console.log(`[ReminderDebug] Found ${submissions.length} matching submissions.`);

  const submittedUserIds = new Set(submissions.map(s => s.user_ref));

  // 4. Filter Non-Submitters
  const missingStudents = students.filter(s => !submittedUserIds.has(s.id));
  const missingEmails = missingStudents.map(s => s.email).filter(e => e); // ensure not null
  
  console.log(`[ReminderDebug] Missing students count: ${missingStudents.length}`);

  // 5. Send Emails
  if (missingEmails.length > 0) {
    await sendWorksheetReminderEmail(missingEmails, period.title, period.end_date);
  }

  return {
    period_title: period.title,
    reminded_count: missingEmails.length,
  };
}
