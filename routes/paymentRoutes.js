const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: payments operations
 */

const paymentController = require('../controllers/paymentController');

// Endpoint to initiate a payment

/**
 * @swagger
 * /api/payments/initiate:
 *   post:
 *     summary: Create Initiate
 *     tags: [Payments]
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
router.post('/initiate', protect, paymentController.initiatePayment);

// Endpoint to upload payment proof (bank transfer)

/**
 * @swagger
 * /api/payments/upload-proof:
 *   post:
 *     summary: Create Upload-proof
 *     tags: [Payments]
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
router.post('/upload-proof', protect, paymentController.uploadPaymentProof);

// Endpoint to initiate Squad payment

/**
 * @swagger
 * /api/payments/initiate-squad:
 *   post:
 *     summary: Create Initiate-squad
 *     tags: [Payments]
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
router.post('/initiate-squad', protect, paymentController.initiateSquadPayment);

// NEW: Payment verification endpoint

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Create Verify
 *     tags: [Payments]
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
router.post('/verify', protect, paymentController.verifyPayment);

// NEW: Payment webhook endpoints

/**
 * @swagger
 * /api/payments/webhook/flutterwave:
 *   post:
 *     summary: Create Flutterwave
 *     tags: [Payments]
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
router.post('/webhook/flutterwave', paymentController.handleFlutterwaveWebhook);

/**
 * @swagger
 * /api/payments/webhook/paystack:
 *   post:
 *     summary: Create Paystack
 *     tags: [Payments]
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
router.post('/webhook/paystack', paymentController.handlePaystackWebhook);

/**
 * @swagger
 * /api/payments/webhook/squad:
 *   post:
 *     summary: Create Squad
 *     tags: [Payments]
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
router.post('/webhook/squad', paymentController.handleSquadWebhook);

// NEW: Flutterwave configuration endpoint

/**
 * @swagger
 * /api/payments/flutterwave-config:
 *   get:
 *     summary: Get Flutterwave config for inline checkout
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paymentId
 *         schema:
 *           type: string
 *         description: Payment ID to get config for
 *     responses:
 *       200:
 *         description: Flutterwave config retrieved
 *       404:
 *         description: Gateway not configured
 *       500:
 *         description: Server error
 */
router.get('/flutterwave-config', protect, paymentController.getFlutterwaveConfig);

// NEW: Gateway public key endpoint (no auth required for frontend SDK)

/**
 * @swagger
 * /api/payments/gateway-public-key/{type}:
 *   get:
 *     summary: Get gateway public key
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [flutterwave, paystack, squad]
 *     responses:
 *       200:
 *         description: Public key retrieved
 *       404:
 *         description: Gateway not found
 */
router.get('/gateway-public-key/:type', paymentController.getGatewayPublicKey);

// NEW: Bank details endpoint

/**
 * @swagger
 * /api/payments/bank-details/{currency}:
 *   get:
 *     summary: Get bank details for transfers
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *           enum: [USD, EUR, GBP, NGN]
 *     responses:
 *       200:
 *         description: Bank details retrieved
 *       404:
 *         description: Currency not supported
 */
router.get('/bank-details/:currency', paymentController.getBankDetails);

// ========== PAYMENT METHOD ROUTES ==========
const paymentMethodController = require('../controllers/paymentMethodController');

/**
 * @swagger
 * /api/payments/payment-methods:
 *   get:
 *     summary: Get user's saved payment methods
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved payment methods
 *       401:
 *         description: Unauthorized
 */
router.get('/payment-methods', protect, paymentMethodController.getPaymentMethods);

/**
 * @swagger
 * /api/payments/payment-methods/default:
 *   get:
 *     summary: Get user's default payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default payment method or null
 *       401:
 *         description: Unauthorized
 */
router.get('/payment-methods/default', protect, paymentMethodController.getDefaultPaymentMethod);

/**
 * @swagger
 * /api/payments/payment-methods/{id}/default:
 *   put:
 *     summary: Set a payment method as default
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment method set as default
 *       404:
 *         description: Payment method not found
 */
router.put('/payment-methods/:id/default', protect, paymentMethodController.setDefaultPaymentMethod);

/**
 * @swagger
 * /api/payments/payment-methods/{id}:
 *   delete:
 *     summary: Delete a saved payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment method deleted
 *       404:
 *         description: Payment method not found
 */
router.delete('/payment-methods/:id', protect, paymentMethodController.deletePaymentMethod);

/**
 * @swagger
 * /api/payments/subscriptions/{id}/auto-renew:
 *   put:
 *     summary: Toggle auto-renewal for a subscription
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               autoRenew:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Auto-renewal setting updated
 *       404:
 *         description: Subscription not found
 */
router.put('/subscriptions/:id/auto-renew', protect, paymentMethodController.toggleAutoRenew);

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Get user's payment/transaction history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of transactions
 *       401:
 *         description: Unauthorized
 */
router.get('/history', protect, paymentMethodController.getPaymentHistory);

module.exports = router; 
