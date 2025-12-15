const {
  createGroupService,
  updateProjectStatusService,
  updateGroupService,
  listAllGroupsService,
  setGroupRulesService,
  validateGroupRegistrationService,
  updateStudentLearningPathService,
  addMemberToGroupService,
  updateMemberStatusService,
  autoAssignMembersService,
  getUnassignedStudentsService,
  createTimelineService,
  updateTimelineService,
  deleteTimelineService,
  getGroupByIdService,
} = require("../services/adminService");

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
 * POST /api/admin/groups
 */
async function createGroup(req, res) {
  const { group_name, batch_id } = req.body || {};

  if (!group_name || !batch_id) {
    const errorFields = {};
    if (!group_name) errorFields.group_name = "Nama grup wajib diisi.";
    if (!batch_id) errorFields.batch_id = "Batch ID wajib diisi.";
    return buildErrorResponse(res, 400, "Permintaan tidak valid. Beberapa field wajib diisi.", "VALIDATION_FAILED", errorFields);
  }

  try {
    const group = await createGroupService(req.user.userId, { group_name, batch_id });
    return res.status(201).json({
      message: "Grup berhasil dibuat dan leader telah ditetapkan.",
      group,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message || "Gagal membuat grup.", err.code || "INTERNAL_SERVER_ERROR");
  }
}

/**
 * PUT /api/admin/users/:userId/learning-path
 */
async function updateStudentLearningPath(req, res) {
  const { userId } = req.params;
  const { learning_path } = req.body || {};

  if (!learning_path) {
    return buildErrorResponse(res, 400, "Learning path wajib diisi.", "VALIDATION_FAILED");
  }

  try {
    const user = await updateStudentLearningPathService(userId, { learning_path });
    return res.status(200).json({
      message: "Learning path student berhasil diperbarui oleh admin.",
      data: user,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const status = err.code === "INVALID_LEARNING_PATH" ? 400 : 500;
    return buildErrorResponse(
      res,
      status,
      err.message || "Gagal memperbarui learning path.",
      err.code || "INTERNAL_SERVER_ERROR"
    );
  }
}

/**
 * PUT /api/admin/project/:groupId
 */
async function updateProjectStatus(req, res) {
  const { groupId } = req.params;

  if (!groupId) {
    return buildErrorResponse(res, 400, "ID Grup wajib disediakan di URL.", "VALIDATION_FAILED", { groupId: "groupId is required" });
  }

  try {
    await updateProjectStatusService(groupId);
    return res.status(200).json({
      message: `Status proyek untuk Grup ID ${groupId} berhasil diubah menjadi 'in_progress'.`,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message || "Gagal memperbarui status proyek.", err.code || "INTERNAL_SERVER_ERROR");
  }
}

/**
 * PUT /api/admin/groups/:groupId
 */
async function updateGroup(req, res) {
  const { groupId } = req.params;
  const { group_name, batch_id, status } = req.body || {};

  if (!groupId) {
    return buildErrorResponse(res, 400, "ID Grup wajib disediakan di URL.", "VALIDATION_FAILED", { groupId: "groupId is required" });
  }

  if (group_name === undefined && batch_id === undefined && status === undefined) {
    return buildErrorResponse(res, 400, "Data yang akan diubah wajib disediakan di body.", "NO_DATA_PROVIDED");
  }

  try {
    const group = await updateGroupService(groupId, { group_name, batch_id, status });
    return res.status(200).json({
      message: `Grup ID ${groupId} berhasil diperbarui.`,
      group,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const status = err.code === "NOT_FOUND" ? 404 : 500;
    return buildErrorResponse(res, status, err.message || "Gagal memperbarui grup.", err.code || "INTERNAL_SERVER_ERROR");
  }
}

/**
 * GET /api/admin/groups/:groupId
 */
async function getGroupDetails(req, res) {
  const { groupId } = req.params;

  try {
    const data = await getGroupByIdService(groupId);
    return res.status(200).json({
      message: "Berhasil mengambil detail grup.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message, err.code);
  }
}

/**
 * GET /api/admin/groups
 */
async function listAllGroups(req, res) {
  try {
    const groups = await listAllGroupsService();
    return res.status(200).json({
      message: "Berhasil mengambil semua grup.",
      data: groups,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message || "Gagal mengambil daftar grup.", err.code || "INTERNAL_SERVER_ERROR");
  }
}

/**
 * POST /api/admin/rules
 */
async function setGroupRules(req, res) {
  const { batch_id, rules } = req.body || {};

  if (!batch_id || !Array.isArray(rules) || rules.length === 0) {
    return buildErrorResponse(res, 400, "batch_id dan rules (array) wajib diisi.", "VALIDATION_FAILED");
  }

  try {
    const data = await setGroupRulesService(batch_id, rules);
    return res.status(201).json({
      message: "Aturan grup berhasil disimpan.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message || "Gagal menyimpan aturan grup.", err.code || "INTERNAL_SERVER_ERROR");
  }
}

/**
 * POST /api/admin/groups/:groupId/validate
 */
async function validateGroupRegistration(req, res) {
  const { groupId } = req.params;
  const { status, rejection_reason } = req.body || {};

  if (!groupId || !["accepted", "rejected"].includes(status)) {
    return buildErrorResponse(res, 400, "Status harus 'accepted' atau 'rejected'.", "VALIDATION_FAILED");
  }

  try {
    const group = await validateGroupRegistrationService(groupId, status, rejection_reason);
    return res.status(200).json({
      message: `Grup berhasil divalidasi sebagai ${status}.`,
      data: group,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message || "Gagal memvalidasi grup.", err.code || "INTERNAL_SERVER_ERROR");
  }
}



/**
 * POST /api/admin/timeline
 */
async function createTimeline(req, res) {
  const { title, description, start_at, end_at, batch_id } = req.body || {};

  if (!title || !start_at || !end_at) {
    return buildErrorResponse(res, 400, "Title, Start Date, dan End Date wajib diisi.", "VALIDATION_FAILED");
  }

  try {
    const data = await createTimelineService({ title, description, start_at, end_at, batch_id }); // Import logic handled by previous step implicitly? No I need to import it.
    // Wait, I need to update the import at the top too!
    // But I can't do multiple disjoint edits easily without multi_replace.
    // I will use replace_file_content for this block first, then update import.
    // Actually, let's use multi_replace to be safe and efficient.
    return res.status(201).json({
      message: "Timeline berhasil dibuat.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message || "Gagal membuat timeline.", err.code || "INTERNAL_SERVER_ERROR");
  }
}

/**
 * GET /api/admin/users/unassigned
 */
async function getUnassignedStudents(req, res) {
  const { batch_id } = req.query; // Use query param for GET

  if (!batch_id) {
    return buildErrorResponse(res, 400, "Batch ID wajib diisi sebagai query param.", "VALIDATION_FAILED");
  }

  try {
    const data = await getUnassignedStudentsService(batch_id);
    return res.status(200).json({
      message: "Berhasil mengambil daftar siswa tanpa tim.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message || "Gagal mengambil data.", err.code || "INTERNAL_SERVER_ERROR");
  }
}

/**
 * POST /api/admin/groups/:groupId/members
 */
async function addMemberToGroup(req, res) {
  const { groupId } = req.params;
  const { user_id } = req.body || {};

  if (!groupId || !user_id) {
    return buildErrorResponse(res, 400, "Group ID dan User ID wajib diisi.", "VALIDATION_FAILED");
  }

  try {
    const data = await addMemberToGroupService(groupId, user_id);
    return res.status(201).json({
      message: "Anggota berhasil ditambahkan ke grup.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const status = err.code === "ALREADY_IN_TEAM" ? 409 : 500;
    return buildErrorResponse(res, status, err.message || "Gagal menambahkan anggota.", err.code || "INTERNAL_SERVER_ERROR");
  }
}

/**
 * DELETE /api/admin/groups/:groupId/members/:userId
 */
/**
 * PUT /api/admin/groups/:groupId/members/:userId
 */
async function updateMemberStatus(req, res) {
  const { groupId, userId } = req.params;
  const { status } = req.body || {};

  if (!groupId || !userId) {
    return buildErrorResponse(res, 400, "Group ID dan User ID wajib diisi.", "VALIDATION_FAILED");
  }

  if (!status || !["active", "inactive"].includes(status)) {
    return buildErrorResponse(res, 400, "Status wajib diisi ('active' atau 'inactive').", "VALIDATION_FAILED");
  }

  try {
    await updateMemberStatusService(groupId, userId, status);
    return res.status(200).json({
      message: "Status anggota berhasil diperbarui.",
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message || "Gagal memperbarui status anggota.", err.code || "INTERNAL_SERVER_ERROR");
  }
}

/**
 * POST /api/admin/groups/auto-assign
 */
async function autoAssignMembers(req, res) {
  const { batch_id } = req.body || {};

  if (!batch_id) {
    return buildErrorResponse(res, 400, "Batch ID wajib diisi.", "VALIDATION_FAILED");
  }

  try {
    const result = await autoAssignMembersService(batch_id);
    return res.status(200).json({
      message: "Proses randomisasi anggota berhasil.",
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const status = err.code === "NO_STUDENTS" ? 404 : 500;
    return buildErrorResponse(res, status, err.message || "Gagal melakukan auto-assign.", err.code || "INTERNAL_SERVER_ERROR");
  }
}

/**
 * GET /api/admin/groups/export
 */
async function exportGroups(req, res) {
  try {
    const data = await require("../services/adminService").adminExportGroupsService();
    // Return JSON, frontend can convert to CSV
    return res.status(200).json({
      message: "Berhasil export data grup.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message, err.code);
  }
}

module.exports = {
  createGroup,
  updateProjectStatus,
  updateGroup,
  listAllGroups,
  setGroupRules,
  validateGroupRegistration,
  updateStudentLearningPath,
  addMemberToGroup,
  updateMemberStatus,
  autoAssignMembers,
  getUnassignedStudents,
  createTimeline,
  getGroupDetails,
  exportGroups,
  updateTimeline,
  deleteTimeline,
};

/**
 * PUT /api/admin/timeline/:id
 */
async function updateTimeline(req, res) {
  const { id } = req.params;
  const { title, description, start_at, end_at } = req.body || {};

  if (!id) {
    return buildErrorResponse(res, 400, "ID Timeline wajib diisi.", "VALIDATION_FAILED");
  }

  try {
    const data = await updateTimelineService(id, { title, description, start_at, end_at });
    return res.status(200).json({
      message: "Timeline berhasil diperbarui.",
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message, err.code);
  }
}

/**
 * DELETE /api/admin/timeline/:id
 */
async function deleteTimeline(req, res) {
  const { id } = req.params;

  if (!id) {
    return buildErrorResponse(res, 400, "ID Timeline wajib diisi.", "VALIDATION_FAILED");
  }

  try {
    await deleteTimelineService(id);
    return res.status(200).json({
      message: "Timeline berhasil dihapus.",
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    return buildErrorResponse(res, 500, err.message, err.code);
  }
}
