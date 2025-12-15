const express = require("express");
const router = express.Router();
const { authenticateCustomJWT, authorizeRoles } = require("../middleware/auth");
const {
  createGroup,
  updateGroup,
  updateProjectStatus,
  listAllGroups,
  getGroupDetails,
  setGroupRules,
  validateGroupRegistration,
  updateStudentLearningPath,
  addMemberToGroup,
  updateMemberStatus,
  autoAssignMembers,
  getUnassignedStudents,
  createTimeline,
  exportGroups,
  updateTimeline,
  deleteTimeline,
} = require("../controllers/adminController");
const { listDeliverables } = require("../controllers/adminDeliverableController");
const {
  adminListWorksheets,
  validateWorksheet,
} = require("../controllers/worksheetController");
const { adminGetFeedbackExport } = require("../controllers/feedbackController");
const { createPeriod, sendReminder } = require("../controllers/periodController");

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

// Get Group Details
router.get(
  "/groups/:groupId",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  getGroupDetails
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

// Get Unassigned Students
router.get(
    "/users/unassigned",
    authenticateCustomJWT,
    authorizeRoles(["ADMIN"]),
    getUnassignedStudents
);

// Add Member to Group
router.post(
    "/groups/:groupId/members",
    authenticateCustomJWT,
    authorizeRoles(["ADMIN"]),
    addMemberToGroup
);
  
// Update Member Status (Active/Inactive)
router.put(
    "/groups/:groupId/members/:userId",
    authenticateCustomJWT,
    authorizeRoles(["ADMIN"]),
    updateMemberStatus
);

// Auto Assign (Randomize)
router.post(
    "/groups/auto-assign",
    authenticateCustomJWT,
    authorizeRoles(["ADMIN"]),
    autoAssignMembers
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
router.put(
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

// Export Groups
router.get(
  "/groups/export",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  exportGroups
);

// Create Timeline (NEW)
router.post(
  "/timeline",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  createTimeline
);

// Update Timeline
router.put(
  "/timeline/:id",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  updateTimeline
);

// Delete Timeline
router.delete(
  "/timeline/:id",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  deleteTimeline
);

// Create Check-in Period
router.post(
  "/periods",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  createPeriod
);

// Send Period Reminder
router.post(
  "/periods/:id/remind",
  authenticateCustomJWT,
  authorizeRoles(["ADMIN"]),
  sendReminder
);

module.exports = router;
