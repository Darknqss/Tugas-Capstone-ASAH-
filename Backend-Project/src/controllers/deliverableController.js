const { submitDeliverableService } = require("../services/deliverableService");
const { buildErrorResponse } = require("../utils/respons");

/**
 * POST /api/group/deliverables
 */
async function submitDeliverable(req, res) {
  const { document_type, file_path, description } = req.body;

  if (!document_type || !file_path) {
    return buildErrorResponse(
      res,
      400,
      "Tipe dokumen dan file path wajib diisi.",
      "VALIDATION_FAILED"
    );
  }

  try {
    const data = await submitDeliverableService(req.user.userId, {
      document_type,
      file_path,
      description,
    });

    return res.status(201).json({
      message: "Dokumen berhasil dikumpulkan.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const status = [
      "NO_TEAM",
      "INVALID_DOC_TYPE",
      "VALIDATION_FAILED"
    ].includes(err.code) ? 400 : 500;

    return buildErrorResponse(
      res,
      status,
      err.message || "Gagal mengumpulkan dokumen.",
      err.code || "INTERNAL_SERVER_ERROR"
    );
  }
}

module.exports = {
  submitDeliverable,
};
