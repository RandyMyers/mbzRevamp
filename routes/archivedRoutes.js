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

/**
 * @swagger
 * /api/archived/:
 *   post:
 *     summary: Create Item
 *     tags: [Archived]
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
router.post("/", protect, createArchivedEmail);

// Get all archived emails

/**
 * @swagger
 * /api/archived/:
 *   get:
 *     summary: Get Item
 *     tags: [Archived]
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
router.get("/", protect, getArchivedEmails);

// Get archived emails by organization

/**
 * @swagger
 * /api/archived/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Archived]
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
router.get("/organization/:organizationId", protect, getArchivedEmailsByOrganization);

// Get a specific archived email by ID

/**
 * @swagger
 * /api/archived/:archivedEmailId:
 *   get:
 *     summary: Get Item
 *     tags: [Archived]
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
router.get("/:archivedEmailId", protect, getArchivedEmailById);

// Update an archived email

/**
 * @swagger
 * /api/archived/:archivedEmailId:
 *   patch:
 *     summary: Update Item
 *     tags: [Archived]
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
router.patch("/:archivedEmailId", protect, updateArchivedEmail);

// Delete an archived email

/**
 * @swagger
 * /api/archived/:archivedEmailId:
 *   delete:
 *     summary: Delete Item
 *     tags: [Archived]
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
router.delete("/:archivedEmailId", protect, deleteArchivedEmail);

// Move email to archive

/**
 * @swagger
 * /api/archived/move-to-archive:
 *   post:
 *     summary: Create Move-to-archive
 *     tags: [Archived]
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
router.post("/move-to-archive", protect, moveToArchive);

// Restore email from archive

/**
 * @swagger
 * /api/archived/restore/:archivedEmailId:
 *   post:
 *     summary: Create Restore
 *     tags: [Archived]
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
router.post("/restore/:archivedEmailId", protect, restoreFromArchive);

// Bulk move emails to archive

/**
 * @swagger
 * /api/archived/bulk-archive:
 *   post:
 *     summary: Create Bulk-archive
 *     tags: [Archived]
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
router.post("/bulk-archive", protect, bulkMoveToArchive);

module.exports = router; 
 
