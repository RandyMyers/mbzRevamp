const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Archived
 *     description: archived operations
 */

const { protect } = require("../middleware/authMiddleware");
const {
  createArchivedEmail,
  getArchivedEmails,
  getArchivedEmailById,
  updateArchivedEmail,
  deleteArchivedEmail,
  getArchivedEmailsByOrganization,
  moveToArchive,
  restoreFromArchive,
  bulkMoveToArchive
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

// Move email to archive
router.post("/move-to-archive", protect, moveToArchive);

// Restore email from archive
router.post("/restore/:archivedEmailId", protect, restoreFromArchive);

// Bulk move emails to archive
router.post("/bulk-archive", protect, bulkMoveToArchive);

module.exports = router; 
 
