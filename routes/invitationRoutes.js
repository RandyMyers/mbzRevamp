const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
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
router.get('/test-email-config', protect, testEmailConfig);

// Public route for accepting invitations (no auth needed)
router.post('/accept', acceptInvitation);

// Protected routes
router.use(protect);
router.post('/', createInvitation);
router.get('/', getInvitations);
router.get('/:id', getInvitationById);
router.put('/:id', updateInvitation);
router.delete('/:id', deleteInvitation);
router.post('/:id/resend', resendInvitation);

module.exports = router; 