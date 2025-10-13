const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Receivers
 *     description: receivers operations
 */

const receiverController = require("../controllers/receiverControllers"); // Adjust the path as necessary
const { protect } = require("../middleware/authMiddleware");

// CREATE a new Receiver

/**
 * @swagger
 * /api/receivers/create:
 *   post:
 *     summary: Create Create
 *     tags: [Receivers]
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
router.post("/create", protect, receiverController.createReceiver);

// GET all Receivers for a specific User

/**
 * @swagger
 * /api/receivers/user/:userId:
 *   get:
 *     summary: Get User
 *     tags: [Receivers]
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
router.get("/user/:userId", protect, receiverController.getReceiversByUser);

// GET all Receivers for a specific Organization

/**
 * @swagger
 * /api/receivers/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Receivers]
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
router.get("/organization/:organizationId", protect, receiverController.getReceiversByOrganization);

// GET a specific Receiver by ID

/**
 * @swagger
 * /api/receivers/:receiverId:
 *   get:
 *     summary: Get Item
 *     tags: [Receivers]
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
router.get("/:receiverId", protect, receiverController.getReceiverById);

// UPDATE a Receiver by ID

/**
 * @swagger
 * /api/receivers/update/:receiverId:
 *   patch:
 *     summary: Update Update
 *     tags: [Receivers]
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
router.patch("/update/:receiverId", protect, receiverController.updateReceiver);

// DELETE a Receiver by ID

/**
 * @swagger
 * /api/receivers/delete/:receiverId:
 *   delete:
 *     summary: Delete Delete
 *     tags: [Receivers]
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
router.delete("/delete/:receiverId", protect, receiverController.deleteReceiver);

// DEACTIVATE a Receiver by ID

/**
 * @swagger
 * /api/receivers/:receiverId/deactivate:
 *   patch:
 *     summary: Update Deactivate
 *     tags: [Receivers]
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
router.patch("/:receiverId/deactivate", protect, receiverController.deactivateReceiver);

// MANUAL TRIGGER: Check for new incoming emails for a specific receiver

/**
 * @swagger
 * /api/receivers/:receiverId/check-incoming:
 *   post:
 *     summary: Create Check-incoming
 *     tags: [Receivers]
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
router.post("/:receiverId/check-incoming", protect, receiverController.triggerIncomingEmailCheck);

// MANUAL TRIGGER: Perform full email sync for a specific receiver

/**
 * @swagger
 * /api/receivers/:receiverId/full-sync:
 *   post:
 *     summary: Create Full-sync
 *     tags: [Receivers]
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
router.post("/:receiverId/full-sync", protect, receiverController.triggerFullEmailSync);

// MANUAL TRIGGER: Custom email sync (incoming or full) for a specific receiver

/**
 * @swagger
 * /api/receivers/:receiverId/custom-sync:
 *   post:
 *     summary: Create Custom-sync
 *     tags: [Receivers]
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
router.post("/:receiverId/custom-sync", protect, receiverController.triggerCustomEmailSync);

// LEGACY: Manual trigger for backward compatibility

/**
 * @swagger
 * /api/receivers/:receiverId/fetch-emails:
 *   post:
 *     summary: Create Fetch-emails
 *     tags: [Receivers]
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
router.post("/:receiverId/fetch-emails", protect, receiverController.triggerEmailFetch);

module.exports = router;
