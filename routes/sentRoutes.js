const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Sent
 *     description: sent operations
 */

const { protect } = require("../middleware/authMiddleware");
const {
  getSentEmails,
  getSentEmailById,
  deleteSentEmail,
  getSentEmailsByOrganization,
  resendEmail
} = require("../controllers/sentControllers");

// Get all sent emails
router.get("/", protect, getSentEmails);

// Get sent emails by organization
router.get("/organization/:organizationId", protect, getSentEmailsByOrganization);

// Get a specific sent email by ID
router.get("/:sentEmailId", protect, getSentEmailById);

// Delete a sent email
router.delete("/:sentEmailId", protect, deleteSentEmail);

// Resend a sent email
router.post("/:sentEmailId/resend", protect, resendEmail);

module.exports = router; 
