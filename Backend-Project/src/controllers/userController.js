const {
  getProfileService,
  listAvailableDocsService,
  listProjectTimelineService,
  listUseCasesService,

  createDocService,
  updateProfileService,
  getGroupRulesService,
  registerTeamService,
  getTeamService,
} = require("../services/userService");
const { sendTeamRegistrationEmail } = require("../services/emailService");
const { supabase } = require("../config/supabaseClient");

// Helper untuk format error response
const buildErrorResponse = (res, status, message, code, fields = {}) => {
  return res.status(status).json({
    message,
    error: {
      code,
      ...(Object.keys(fields).length > 0 && { fields }),
    },
    meta: { timestamp: new Date().toISOString() },
  });
};

/**
 * GET /api/user/profile
 */
async function getProfile(req, res) {
  try {
    const user = await getProfileService(req.user.userId);
    return res.status(200).json({
      message: "Berhasil mengambil profil pengguna.",
      data: user,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const status = err.code === "USER_NOT_FOUND" ? 404 : 500;
    return buildErrorResponse(
      res,
      status,
      err.message || "Gagal mengambil profil.",
      err.code || "INTERNAL_SERVER_ERROR"
    );
  }
}

/**
 * PUT /api/user/profile
 */
async function updateProfile(req, res) {
  const { name, university, learning_group, learning_path } = req.body;

  try {
    const user = await updateProfileService(req.user.userId, {
      name,
      university,
      learning_group,
      learning_path,
    });
    return res.status(200).json({
      message: "Profil berhasil diperbarui.",
      data: user,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const status = err.code === "LEARNING_PATH_LOCKED" || err.code === "INVALID_LEARNING_PATH" ? 400 : 500;
    return buildErrorResponse(
      res,
      status,
      err.message || "Gagal memperbarui profil.",
      err.code || "INTERNAL_SERVER_ERROR"
    );
  }
}

/**
 * GET /api/user/docs
 */
async function listAvailableDocs(req, res) {
  try {
    const docs = await listAvailableDocsService();
    return res.status(200).json({
      message: "Berhasil mengambil daftar dokumen.",
      data: docs,
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

/**
 * GET /api/user/timeline
 */
async function listProjectTimeline(req, res) {
  try {
    const timelines = await listProjectTimelineService(req.user.userId);
    return res.status(200).json({
      message: "Berhasil mengambil timeline proyek.",
      data: timelines,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const status = err.code === "USER_NOT_FOUND" ? 404 : 500;
    return buildErrorResponse(
      res,
      status,
      err.message || "Gagal mengambil timeline.",
      err.code || "INTERNAL_SERVER_ERROR"
    );
  }
}

/**
 * GET /api/user/use-cases
 */
async function listUseCases(req, res) {
  try {
    const useCases = await listUseCasesService();
    return res.status(200).json({
      message: "Berhasil mengambil daftar use cases.",
      data: useCases,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(
      res,
      500,
      err.message || "Gagal mengambil daftar use cases.",
      err.code || "INTERNAL_SERVER_ERROR"
    );
  }
}

/**
 * POST /api/group/docs
 */
async function createDoc(req, res) {
  const { group_id, url, title } = req.body || {};

  if (!group_id || !url) {
    return buildErrorResponse(
      res,
      400,
      "group_id dan url wajib diisi.",
      "VALIDATION_FAILED"
    );
  }

  try {
    const data = await createDocService(req.user.userId, {
      group_id,
      url,
      title,
    });
    return res.status(201).json({
      message: "Dokumen berhasil dibuat.",
      doc_id: data.id,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(
      res,
      500,
      err.message || "Gagal mengupload dokumen.",
      err.code || "INTERNAL_SERVER_ERROR"
    );
  }
}

/**
 * GET /api/group/rules
 */
async function getGroupRules(req, res) {
  try {
    const rules = await getGroupRulesService(req.user.userId);
    return res.status(200).json({
      message: "Berhasil mengambil aturan grup.",
      data: rules,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const status = err.code === "USER_BATCH_NOT_FOUND" ? 404 : 500;
    return buildErrorResponse(
      res,
      status,
      err.message || "Gagal mengambil aturan grup.",
      err.code || "INTERNAL_SERVER_ERROR"
    );
  }
}

/**
 * POST /api/group/register
 */
async function registerTeam(req, res) {
  const { group_name, member_source_ids, use_case_source_id } = req.body;

  if (
    !group_name ||
    !Array.isArray(member_source_ids) ||
    member_source_ids.length === 0 ||
    !use_case_source_id
  ) {
    return buildErrorResponse(
      res,
      400,
      "Nama grup, daftar ID anggota (Source ID), dan Use Case ID (Source ID) wajib diisi.",
      "VALIDATION_FAILED"
    );
  }

  try {
    const group = await registerTeamService(req.user.userId, {
      group_name,
      member_source_ids,
      use_case_source_id,
    });

    // Fetch emails for notification
    const { data: members } = await supabase
      .from("capstone_group_member")
      .select("users(email)")
      .eq("group_ref", group.id);

    const emails = members?.map((m) => m.users?.email).filter((e) => e) || [];

    // Send Email (Async, don't block response)
    sendTeamRegistrationEmail(emails, group.group_name).catch(console.error);

    return res.status(201).json({
      message: "Pendaftaran tim berhasil dikirim dan menunggu validasi.",
      data: { group_id: group.id, status: group.status },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const status = [
      "INVALID_MEMBER_ID",
      "DOUBLE_SUBMISSION",
      "INVALID_COMPOSITION",
      "RULES_NOT_FOUND",
      "VALIDATION_FAILED",
      "REGISTRATION_CLOSED",
      "PROFILE_INCOMPLETE"
    ].includes(err.code)
      ? 400
      : 500;
    return buildErrorResponse(
      res,
      status,
      err.message || "Gagal mendaftarkan tim.",
      err.code || "INTERNAL_SERVER_ERROR",
      err.fields || {}
    );
  }
}

/**
 * GET /api/group/my-team
 */
async function getTeam(req, res) {
  try {
    const team = await getTeamService(req.user.userId);
    return res.status(200).json({
      message: "Berhasil mengambil data tim.",
      data: team,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const status = err.code === "NO_TEAM" ? 404 : 500;
    return buildErrorResponse(
      res,
      status,
      err.message || "Gagal mengambil data tim.",
      err.code || "INTERNAL_SERVER_ERROR"
    );
  }
}

module.exports = {
  getProfile,
  listAvailableDocs,
  listProjectTimeline,
  listUseCases,
  updateProfile,
  createDoc,
  getGroupRules,
  registerTeam,
  getTeam,
};
