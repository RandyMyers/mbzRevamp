const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Chat Integration
 *     description: chat integration operations
 */

const chatIntegrationController = require('../controllers/chatIntegrationController');


/**
 * @swagger
 * /api/chat-integrations/create:
 *   post:
 *     summary: Create Create
 *     tags: [Chat Integration]
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
router.post('/create', chatIntegrationController.createChatIntegration);

/**
 * @swagger
 * /api/chat-integrations/all:
 *   get:
 *     summary: Get All
 *     tags: [Chat Integration]
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
router.get('/all', chatIntegrationController.getAllChatIntegrations);

/**
 * @swagger
 * /api/chat-integrations/get/:id:
 *   get:
 *     summary: Get Get
 *     tags: [Chat Integration]
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
router.get('/get/:id', chatIntegrationController.getChatIntegrationById);

/**
 * @swagger
 * /api/chat-integrations/update/:id:
 *   put:
 *     summary: Update Update
 *     tags: [Chat Integration]
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
router.put('/update/:id', chatIntegrationController.updateChatIntegration);

/**
 * @swagger
 * /api/chat-integrations/delete/:id:
 *   delete:
 *     summary: Delete Delete
 *     tags: [Chat Integration]
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
router.delete('/delete/:id', chatIntegrationController.deleteChatIntegration);

module.exports = router;
