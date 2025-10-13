const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Inbox
 *     description: inbox operations
 */

const inboxController = require("../controllers/inboxControllers");


/**
 * @swagger
 * /api/inbox/create:
 *   post:
 *     summary: Create Create
 *     tags: [Inbox]
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
router.post("/create", inboxController.createInboxEmail);

/**
 * @swagger
 * /api/inbox/all:
 *   get:
 *     summary: Get All
 *     tags: [Inbox]
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
router.get("/all", inboxController.getAllInboxEmails); // Get all inbox emails for a specific user

/**
 * @swagger
 * /api/inbox/get/:inboxEmailId:
 *   get:
 *     summary: Get Get
 *     tags: [Inbox]
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
router.get("/get/:inboxEmailId", inboxController.getInboxEmailById); // Get a specific inbox email by ID

/**
 * @swagger
 * /api/inbox/update/:inboxEmailId:
 *   patch:
 *     summary: Update Update
 *     tags: [Inbox]
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
router.patch("/update/:inboxEmailId", inboxController.updateInboxEmailStatus); // Update the status of an email

/**
 * @swagger
 * /api/inbox/delete/:inboxEmailId:
 *   delete:
 *     summary: Delete Delete
 *     tags: [Inbox]
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
router.delete("/delete/:inboxEmailId", inboxController.deleteInboxEmail); // Delete a specific inbox email

/**
 * @swagger
 * /api/inbox/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Inbox]
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
router.get("/organization/:organizationId", inboxController.getInboxEmailsByOrganization);

/**
 * @swagger
 * /api/inbox/receiver/:receiverId:
 *   get:
 *     summary: Get Receiver
 *     tags: [Inbox]
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
router.get("/receiver/:receiverId", inboxController.getInboxEmailsByReceiver); // Get inbox emails by specific receiver

/**
 * @swagger
 * /api/inbox/organization/:organizationId:
 *   delete:
 *     summary: Delete Organization
 *     tags: [Inbox]
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
router.delete("/organization/:organizationId", inboxController.deleteAllInboxEmailsByOrganization); // Delete all inbox emails by organization

module.exports = router;
