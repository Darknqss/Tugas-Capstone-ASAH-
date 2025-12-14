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
  const { reviewee_source_id, is_member_active, contribution_level, reason } = req.body;

  if (!reviewee_source_id || is_member_active === undefined || !contribution_level || !reason) {
    return buildErrorResponse(
      res,
      400,
      "Semua field wajib diisi (ID anggota, status aktif, level kontribusi, alasan).",
      "VALIDATION_FAILED"
    );
  }

  try {
    const data = await submitFeedbackService(req.user.userId, {
      reviewee_source_id,
      is_member_active,
      contribution_level,
      reason,
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
  try {
    const data = await getFeedbackExportService();
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
