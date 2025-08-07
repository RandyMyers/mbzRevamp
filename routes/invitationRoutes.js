const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, invitationController.createInvitation);
router.get('/', protect, invitationController.getInvitations);
router.get('/:invitationId', protect, invitationController.getInvitationById);
router.post('/:invitationId/resend', protect, invitationController.resendInvitation);
router.post('/:invitationId/cancel', protect, invitationController.cancelInvitation);
router.post('/accept', invitationController.acceptInvitation); // No auth needed for accepting invitations
router.delete('/:invitationId', protect, invitationController.deleteInvitation);

module.exports = router; 