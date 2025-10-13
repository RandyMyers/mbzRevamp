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
router.post('/', authenticateToken, emailSignatureControllers.createEmailSignature);
router.get('/', authenticateToken, emailSignatureControllers.getEmailSignatures);
router.get('/:id', authenticateToken, emailSignatureControllers.getEmailSignatureById);
router.put('/:id', authenticateToken, emailSignatureControllers.updateEmailSignature);
router.delete('/:id', authenticateToken, emailSignatureControllers.deleteEmailSignature);
router.post('/:id/set-default', authenticateToken, emailSignatureControllers.setDefaultEmailSignature);
router.post('/:id/use', authenticateToken, emailSignatureControllers.recordUsage);
router.get('/user/:userId', authenticateToken, emailSignatureControllers.getUserEmailSignatures);

module.exports = router;
