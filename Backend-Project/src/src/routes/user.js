const express = require("express");
const router = express.Router();
const { authenticateCustomJWT } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  listAvailableDocs,
  listProjectTimeline,
  listUseCases,
} = require("../controllers/userController");

// Semua endpoint dilindungi oleh authenticateCustomJWT

// GET /profile
router.get("/profile", authenticateCustomJWT, getProfile);

// PUT /profile (Edit Profile)
router.put("/profile", authenticateCustomJWT, updateProfile);

// GET /docs
router.get("/docs", authenticateCustomJWT, listAvailableDocs);

// GET /timeline
router.get("/timeline", authenticateCustomJWT, listProjectTimeline);

// GET /use-cases
router.get("/use-cases", authenticateCustomJWT, listUseCases);

module.exports = router;