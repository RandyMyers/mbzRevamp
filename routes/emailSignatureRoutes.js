const express = require('express');
const router = express.Router();
const emailSignatureController = require('../controllers/emailSignatureController');
const { protect } = require('../middleware/authMiddleware');

// GET all signatures for user
router.get('/', protect, emailSignatureController.getUserSignatures);

// GET default signature
router.get('/default', protect, emailSignatureController.getDefaultSignature);

// CREATE new signature
router.post('/', protect, emailSignatureController.createSignature);

// UPDATE signature
router.put('/:signatureId', protect, emailSignatureController.updateSignature);

// DELETE signature (soft delete)
router.delete('/:signatureId', protect, emailSignatureController.deleteSignature);

// SET default signature
router.patch('/:signatureId/default', protect, emailSignatureController.setDefaultSignature);

module.exports = router;

