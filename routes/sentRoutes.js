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

/**
 * @swagger
 * /api/sent/:
 *   get:
 *     summary: Get Item
 *     tags: [Sent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", protect, getSentEmails);

// Get sent emails by organization

/**
 * @swagger
 * /api/sent/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Sent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/organization/:organizationId", protect, getSentEmailsByOrganization);

// Get a specific sent email by ID

/**
 * @swagger
 * /api/sent/:sentEmailId:
 *   get:
 *     summary: Get Item
 *     tags: [Sent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/:sentEmailId", protect, getSentEmailById);

// Delete a sent email

/**
 * @swagger
 * /api/sent/:sentEmailId:
 *   delete:
 *     summary: Delete Item
 *     tags: [Sent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete("/:sentEmailId", protect, deleteSentEmail);

// Resend a sent email

/**
 * @swagger
 * /api/sent/:sentEmailId/resend:
 *   post:
 *     summary: Create Resend
 *     tags: [Sent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/:sentEmailId/resend", protect, resendEmail);

module.exports = router; 
