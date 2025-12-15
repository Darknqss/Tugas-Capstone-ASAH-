const {
  submitFeedbackService,
  getFeedbackStatusService,
  getFeedbackExportService,
} = require("../services/feedbackService");
const { buildErrorResponse } = require("../utils/respons");

/**
 * POST /api/group/feedback
 */
async function submitFeedback(req, res) {
  const { reviewee_id, reviewee_source_id, is_member_active, contribution_level, reason, group_ref, batch_id } = req.body;

  if ((!reviewee_id && !reviewee_source_id) || is_member_active === undefined || !contribution_level || !reason) {
    return buildErrorResponse(
      res,
      400,
      "Semua field wajib diisi (Target User ID/Source ID, status aktif, level kontribusi, alasan).",
      "VALIDATION_FAILED"
    );
  }

  try {
    const data = await submitFeedbackService(req.user.userId, {
      reviewee_id,
      reviewee_source_id,
      is_member_active,
      contribution_level,
      reason,
      group_ref, // Optional / Explicit
      batch_id   // Optional / Explicit
    });

    return res.status(201).json({
      message: "Penilaian berhasil dikirim.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const status = [
      "USER_NOT_FOUND",
      "SELF_REVIEW",
      "DIFFERENT_TEAM",
      "NO_TEAM",
      "ALREADY_SUBMITTED"
    ].includes(err.code) ? 400 : 500;

    return buildErrorResponse(
      res,
      status,
      err.message || "Gagal mengirim penilaian.",
      err.code || "INTERNAL_SERVER_ERROR"
    );
  }
}

/**
 * GET /api/group/feedback/status
 */
async function getFeedbackStatus(req, res) {
  try {
    const data = await getFeedbackStatusService(req.user.userId);
    return res.status(200).json({
      message: "Berhasil mengambil status penilaian.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message, err.code);
  }
}

/**
 * GET /api/admin/feedback/export
 */
async function adminGetFeedbackExport(req, res) {
  const { batch_id, group_id } = req.query; // Get filters from query

  try {
    const data = await getFeedbackExportService({ batch_id, group_id });
    return res.status(200).json({
      message: "Berhasil mengambil data export feedback.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message, err.code);
  }
}

module.exports = {
  submitFeedback,
  getFeedbackStatus,
  adminGetFeedbackExport,
};
