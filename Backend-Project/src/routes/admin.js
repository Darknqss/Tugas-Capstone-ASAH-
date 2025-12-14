const express = require("express");
const router = express.Router();
const { authenticateCustomJWT, authorizeRoles } = require("../middleware/auth");
const {
  createGroup,
  updateGroup,
  updateProjectStatus,
  listAllGroups,
  setGroupRules,
  validateGroupRegistration,
  updateStudentLearningPath,
} = require("../controllers/adminController");
const { listDeliverables } = require("../controllers/adminDeliverableController");
const {
  adminListWorksheets,
  validateWorksheet,
} = require("../controllers/worksheetController");
const { adminGetFeedbackExport } = require("../controllers/feedbackController");

// --- Rute Grup ---

// Create Group
router.post(
  "/groups",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]), // Pastikan role sesuai (admin huruf kecil/besar tergantung sistem, user prompt bilang "admin")
  createGroup
);

// Update Group
router.put(
  "/groups/:groupId",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  updateGroup
);

// List All Groups
router.get(
  "/groups",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  listAllGroups
);

// Update Student Learning Path (Override)
router.put(
  "/users/:userId/learning-path",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  updateStudentLearningPath
);

// --- Rute Project Status ---

// Update Project Status
router.put(
  "/project/:groupId",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  updateProjectStatus
);

// --- Rute Rules & Validation ---

// Set Group Rules
router.post(
  "/rules",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  setGroupRules
);

// Validate Group Registration
router.post(
  "/groups/:groupId/validate",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  validateGroupRegistration
);

// List Deliverables (Filtered)
router.get(
  "/deliverables",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  listDeliverables
);

// List Worksheets
router.get(
  "/worksheets",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  adminListWorksheets
);

// Validate Worksheet
router.put(
  "/worksheets/:id/validate",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  validateWorksheet
);

// Export Feedback Data
router.get(
  "/feedback/export",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  adminGetFeedbackExport
);

module.exports = router;
