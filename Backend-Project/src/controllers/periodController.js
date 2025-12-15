const {
  createPeriodService,
  listPeriodsService,
} = require("../services/periodService");
const { buildErrorResponse } = require("../utils/respons");

/**
 * POST /api/admin/periods
 */
async function createPeriod(req, res) {
  const { batch_id, title, start_date, end_date } = req.body;

  if (!batch_id || !title || !start_date || !end_date) {
    return buildErrorResponse(
      res,
      400,
      "Batch ID, title, start date, dan end date wajib diisi.",
      "VALIDATION_FAILED"
    );
  }

  try {
    const data = await createPeriodService({ batch_id, title, start_date, end_date });
    return res.status(201).json({
      message: "Periode check-in berhasil dibuat.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message, err.code);
  }
}

/**
 * GET /api/periods
 */
async function listPeriods(req, res) {
  const { batch_id } = req.query;

  try {
    const data = await listPeriodsService({ batch_id });
    return res.status(200).json({
      message: "Berhasil mengambil daftar periode.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message, err.code);
  }
}

module.exports = {
  createPeriod,
  listPeriods,
  sendReminder,
};

/**
 * POST /api/admin/periods/:id/remind
 */
async function sendReminder(req, res) {
  const { id } = req.params;

  try {
    const data = await require("../services/periodService").sendPeriodReminderService(id);
    return res.status(200).json({
      message: "Pengingat berhasil dikirim.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message, err.code);
  }
}
