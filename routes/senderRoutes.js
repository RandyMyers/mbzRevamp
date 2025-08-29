const express = require("express");
const router = express.Router();
const senderController = require("../controllers/senderControllers");
const { protect } = require("../middleware/authMiddleware");

// CREATE a new sender
router.post("/create", protect, senderController.createSender);

// GET all senders for a user
router.get("/user/:userId", protect, senderController.getSendersByUser);

// GET all senders for a specific organization
router.get("/organization/:organizationId", protect, senderController.getSendersByOrganization);  // New route for organization

// GET a specific sender by ID
router.get("/:senderId", protect, senderController.getSenderById);

// UPDATE sender details
router.patch("/update/:senderId", protect, senderController.updateSender);

// DELETE a sender
router.delete("/:senderId", protect, senderController.deleteSender);

// RESET the daily email limit for a sender
router.patch("/reset-limit/:senderId", protect, senderController.resetDailyLimit);

module.exports = router;
