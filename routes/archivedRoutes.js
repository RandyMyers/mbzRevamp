const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createArchivedEmail,
  getArchivedEmails,
  getArchivedEmailById,
  updateArchivedEmail,
  deleteArchivedEmail,
  getArchivedEmailsByOrganization
} = require("../controllers/archivedControllers");

// Create a new archived email
router.post("/", protect, createArchivedEmail);

// Get all archived emails
router.get("/", protect, getArchivedEmails);

// Get archived emails by organization
router.get("/organization/:organizationId", protect, getArchivedEmailsByOrganization);

// Get a specific archived email by ID
router.get("/:archivedEmailId", protect, getArchivedEmailById);

// Update an archived email
router.patch("/:archivedEmailId", protect, updateArchivedEmail);

// Delete an archived email
router.delete("/:archivedEmailId", protect, deleteArchivedEmail);

module.exports = router; 
 