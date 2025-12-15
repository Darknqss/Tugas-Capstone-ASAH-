const {
  submitWorksheetService,
  getMyWorksheetsService,
  getAllWorksheetsService,
  validateWorksheetService,
} = require("../services/worksheetService");
const { buildErrorResponse } = require("../utils/respons");

/**
 * POST /api/group/worksheets
 */
async function submitWorksheet(req, res) {
  const { activity_description, proof_url, period_id } = req.body;

  if (!activity_description || !proof_url || !period_id) {
    return buildErrorResponse(
      res,
      400,
      "Deskripsi, bukti URL, dan Period ID wajib diisi.",
      "VALIDATION_FAILED"
    );
  }

  try {
    const data = await submitWorksheetService(req.user.userId, {
      activity_description,
      proof_url,
      period_id,
    });

    return res.status(201).json({
      message: "Worksheet berhasil dikumpulkan.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(
      res,
      err.code === "NO_TEAM" ? 400 : 500,
      err.message,
      err.code
    );
  }
}

/**
 * GET /api/group/worksheets
 */
async function getMyWorksheets(req, res) {
  try {
    const data = await getMyWorksheetsService(req.user.userId);
    return res.status(200).json({
      message: "Berhasil mengambil riwayat worksheet.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message, err.code);
  }
}

/**
 * GET /api/admin/worksheets
 */
async function adminListWorksheets(req, res) {
  const { batch_id, status, user_id } = req.query;

  try {
    const data = await getAllWorksheetsService({ batch_id, status, user_id });
    return res.status(200).json({
      message: "Berhasil mengambil daftar worksheet.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message, err.code);
  }
}

/**
 * PUT /api/admin/worksheets/:id/validate
 */
async function validateWorksheet(req, res) {
  const { id } = req.params;
  const { status, feedback } = req.body;

  try {
    const data = await validateWorksheetService(id, { status, feedback });
    return res.status(200).json({
      message: "Worksheet berhasil divalidasi.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(
      res,
      err.code === "INVALID_STATUS" ? 400 : 500,
      err.message,
      err.code
    );
  }
}

module.exports = {
  submitWorksheet,
  getMyWorksheets,
  adminListWorksheets,
  validateWorksheet,
};
