const { listDeliverablesService } = require("../services/adminService");
const { buildErrorResponse } = require("../utils/respons");

/**
 * GET /api/admin/deliverables
 */
async function listDeliverables(req, res) {
  const { type, use_case } = req.query;

  try {
    const data = await listDeliverablesService({
      document_type: type,
      use_case_id: use_case,
    });

    return res.status(200).json({
      message: "Berhasil mengambil daftar dokumen.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(
      res,
      500,
      err.message || "Gagal mengambil daftar dokumen.",
      err.code || "INTERNAL_SERVER_ERROR"
    );
  }
}

module.exports = {
  listDeliverables,
};
