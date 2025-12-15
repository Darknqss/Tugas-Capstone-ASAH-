const express = require("express");
const router = express.Router();
const { authenticateCustomJWT } = require("../middleware/auth");
const { listPeriods } = require("../controllers/periodController");

// List active periods (Public/Student)
// Assuming it requires auth to see, but contract implied generic access.
// We'll add auth for consistency.
router.get("/", authenticateCustomJWT, listPeriods);

module.exports = router;
