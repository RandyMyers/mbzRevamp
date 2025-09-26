const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createDraft,
  getDrafts,
  getDraftById,
  updateDraft,
  deleteDraft,
  getDraftsByOrganization,
  sendDraft
} = require("../controllers/draftControllers");

// Create a new draft email
router.post("/", protect, createDraft);

// Get all draft emails
router.get("/", protect, getDrafts);

// Get draft emails by organization
router.get("/organization/:organizationId", protect, getDraftsByOrganization);

// Get a specific draft email by ID
router.get("/:draftId", protect, getDraftById);

// Update a draft email
router.patch("/:draftId", protect, updateDraft);

// Delete a draft email
router.delete("/:draftId", protect, deleteDraft);

// Send a draft email
router.post("/:draftId/send", protect, sendDraft);

module.exports = router; 
