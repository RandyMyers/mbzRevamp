const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Email Signatures
 *     description: email signatures operations
 */

const emailSignatureControllers = require('../controllers/emailSignatureControllers');
const { authenticateToken } = require('../middleware/authMiddleware');

// Email Signature Routes

/**
 * @swagger
 * /api/email-signatures/:
 *   post:
 *     summary: Create Item
 *     tags: [Email Signatures]
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
router.post('/', authenticateToken, emailSignatureControllers.createEmailSignature);

/**
 * @swagger
 * /api/email-signatures/:
 *   get:
 *     summary: Get Item
 *     tags: [Email Signatures]
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
router.get('/', authenticateToken, emailSignatureControllers.getEmailSignatures);

/**
 * @swagger
 * /api/email-signatures/:id:
 *   get:
 *     summary: Get Item
 *     tags: [Email Signatures]
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
router.get('/:id', authenticateToken, emailSignatureControllers.getEmailSignatureById);

/**
 * @swagger
 * /api/email-signatures/:id:
 *   put:
 *     summary: Update Item
 *     tags: [Email Signatures]
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
router.put('/:id', authenticateToken, emailSignatureControllers.updateEmailSignature);

/**
 * @swagger
 * /api/email-signatures/:id:
 *   delete:
 *     summary: Delete Item
 *     tags: [Email Signatures]
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
router.delete('/:id', authenticateToken, emailSignatureControllers.deleteEmailSignature);

/**
 * @swagger
 * /api/email-signatures/:id/set-default:
 *   post:
 *     summary: Create Set-default
 *     tags: [Email Signatures]
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
router.post('/:id/set-default', authenticateToken, emailSignatureControllers.setDefaultEmailSignature);

/**
 * @swagger
 * /api/email-signatures/:id/use:
 *   post:
 *     summary: Create Use
 *     tags: [Email Signatures]
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
router.post('/:id/use', authenticateToken, emailSignatureControllers.recordUsage);

/**
 * @swagger
 * /api/email-signatures/user/:userId:
 *   get:
 *     summary: Get User
 *     tags: [Email Signatures]
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
router.get('/user/:userId', authenticateToken, emailSignatureControllers.getUserEmailSignatures);

module.exports = router;
