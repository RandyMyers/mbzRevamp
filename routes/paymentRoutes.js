const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: payments operations
 */

const paymentController = require('../controllers/paymentController');

// Endpoint to initiate a payment
router.post('/initiate', paymentController.initiatePayment);

// Endpoint to upload payment proof (bank transfer)
router.post('/upload-proof', paymentController.uploadPaymentProof);

// Endpoint to initiate Squad payment
router.post('/initiate-squad', paymentController.initiateSquadPayment);

// NEW: Payment verification endpoint
router.post('/verify', paymentController.verifyPayment);

// NEW: Payment webhook endpoints
router.post('/webhook/flutterwave', paymentController.handleFlutterwaveWebhook);
router.post('/webhook/paystack', paymentController.handlePaystackWebhook);
router.post('/webhook/squad', paymentController.handleSquadWebhook);

module.exports = router; 
