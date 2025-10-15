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
router.get('/', getInvitations);
router.get('/:id', getInvitationById);
router.put('/:id', updateInvitation);
router.delete('/:id', deleteInvitation);
router.post('/:id/resend', resendInvitation);

module.exports = router; 
