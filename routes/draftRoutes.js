const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Drafts
 *     description: drafts operations
 */

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

/**
 * @swagger
 * /api/drafts/:
 *   post:
 *     summary: Create Item
 *     tags: [Drafts]
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
router.post("/", protect, createDraft);

// Get all draft emails

/**
 * @swagger
 * /api/drafts/:
 *   get:
 *     summary: Get Item
 *     tags: [Drafts]
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
router.get("/", protect, getDrafts);

// Get draft emails by organization

/**
 * @swagger
 * /api/drafts/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Drafts]
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
router.get("/organization/:organizationId", protect, getDraftsByOrganization);

// Get a specific draft email by ID

/**
 * @swagger
 * /api/drafts/:draftId:
 *   get:
 *     summary: Get Item
 *     tags: [Drafts]
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
router.get("/:draftId", protect, getDraftById);

// Update a draft email

/**
 * @swagger
 * /api/drafts/:draftId:
 *   patch:
 *     summary: Update Item
 *     tags: [Drafts]
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
router.patch("/:draftId", protect, updateDraft);

// Delete a draft email

/**
 * @swagger
 * /api/drafts/:draftId:
 *   delete:
 *     summary: Delete Item
 *     tags: [Drafts]
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
router.delete("/:draftId", protect, deleteDraft);

// Send a draft email

/**
 * @swagger
 * /api/drafts/:draftId/send:
 *   post:
 *     summary: Create Send
 *     tags: [Drafts]
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
router.post("/:draftId/send", protect, sendDraft);

module.exports = router; 
