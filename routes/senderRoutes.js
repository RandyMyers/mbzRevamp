const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Senders
 *     description: senders operations
 */

const senderController = require("../controllers/senderControllers");
const { protect } = require("../middleware/authMiddleware");

// CREATE a new sender

/**
 * @swagger
 * /api/senders/create:
 *   post:
 *     summary: Create Create
 *     tags: [Senders]
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
router.post("/create", protect, senderController.createSender);

// GET all senders for a user

/**
 * @swagger
 * /api/senders/user/:userId:
 *   get:
 *     summary: Get User
 *     tags: [Senders]
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
router.get("/user/:userId", protect, senderController.getSendersByUser);

// GET all senders for a specific organization

/**
 * @swagger
 * /api/senders/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Senders]
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
router.get("/organization/:organizationId", protect, senderController.getSendersByOrganization);  // New route for organization

// GET a specific sender by ID

/**
 * @swagger
 * /api/senders/:senderId:
 *   get:
 *     summary: Get Item
 *     tags: [Senders]
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
router.get("/:senderId", protect, senderController.getSenderById);

// UPDATE sender details

/**
 * @swagger
 * /api/senders/update/:senderId:
 *   patch:
 *     summary: Update Update
 *     tags: [Senders]
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
router.patch("/update/:senderId", protect, senderController.updateSender);

// DELETE a sender

/**
 * @swagger
 * /api/senders/:senderId:
 *   delete:
 *     summary: Delete Item
 *     tags: [Senders]
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
router.delete("/:senderId", protect, senderController.deleteSender);

// RESET the daily email limit for a sender

/**
 * @swagger
 * /api/senders/reset-limit/:senderId:
 *   patch:
 *     summary: Update Reset-limit
 *     tags: [Senders]
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
router.patch("/reset-limit/:senderId", protect, senderController.resetDailyLimit);

module.exports = router;
