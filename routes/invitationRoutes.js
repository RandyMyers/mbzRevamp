const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Invitations
 *     description: invitations operations
 */

const { authenticateUser } = require('../middlewares/authMiddleware');
const {
  createInvitation,
  getInvitations,
  getInvitationById,
  updateInvitation,
  deleteInvitation,
  resendInvitation,
  testEmailConfig,
  acceptInvitation
} = require('../controllers/invitationController');

// Test email configuration endpoint

/**
 * @swagger
 * /api/invitations/test-email-config:
 *   get:
 *     summary: Get Test-email-config
 *     tags: [Invitations]
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
router.get('/test-email-config', authenticateUser, testEmailConfig);

// Public route for accepting invitations (no authenticateToken needed)

/**
 * @swagger
 * /api/invitations/accept:
 *   post:
 *     summary: Create Accept
 *     tags: [Invitations]
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
router.post('/accept', acceptInvitation);

// Protected routes
router.use(authenticateUser);

/**
 * @swagger
 * /api/invitations/:
 *   post:
 *     summary: Create Item
 *     tags: [Invitations]
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
router.post('/', createInvitation);

/**
 * @swagger
 * /api/invitations/:
 *   get:
 *     summary: Get Item
 *     tags: [Invitations]
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
router.get('/', getInvitations);

/**
 * @swagger
 * /api/invitations/:id:
 *   get:
 *     summary: Get Item
 *     tags: [Invitations]
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
router.get('/:id', getInvitationById);

/**
 * @swagger
 * /api/invitations/:id:
 *   put:
 *     summary: Update Item
 *     tags: [Invitations]
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
router.put('/:id', updateInvitation);

/**
 * @swagger
 * /api/invitations/:id:
 *   delete:
 *     summary: Delete Item
 *     tags: [Invitations]
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
router.delete('/:id', deleteInvitation);

/**
 * @swagger
 * /api/invitations/:id/resend:
 *   post:
 *     summary: Create Resend
 *     tags: [Invitations]
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
router.post('/:id/resend', resendInvitation);

module.exports = router; 
