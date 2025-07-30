const express = require("express");
const router = express.Router();
const emailController = require("../controllers/emailControllers");
const emailLogsController = require("../controllers/emailLogsController");
const { protect } = require('../middleware/authMiddleware');

router.post("/create", protect, emailController.createEmail);
router.get("/all", protect, emailController.getAllEmails);
router.get("/get/:emailId", protect, emailController.getEmailById);
router.patch("/update/:emailId", protect, emailController.updateEmail);
router.delete("/delete/:emailId", protect, emailController.deleteEmail);
// Route to get emails by status
router.get("/status/:status", protect, emailController.getEmailsByStatus);

// --- Analytics endpoints ---
router.get("/analytics/delivery-stats", protect, emailLogsController.getDeliveryStats);
router.get("/analytics/device-stats", protect, emailLogsController.getDeviceStats);
router.get("/analytics/geo-stats", protect, emailLogsController.getGeoStats);
router.get("/analytics/performance", protect, emailLogsController.getEmailPerformance);
router.get("/analytics/engagement", protect, emailLogsController.getEmailEngagement);
router.get("/analytics/real-time", protect, emailLogsController.getRealTimeTracking);
router.post("/analytics/log", protect, emailController.logEmailAnalytics);
// --- End analytics endpoints ---

module.exports = router;
