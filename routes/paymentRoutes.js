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
router.post('/initiate', paymentController.initiatePayment);

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
router.post('/upload-proof', paymentController.uploadPaymentProof);

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
router.post('/initiate-squad', paymentController.initiateSquadPayment);

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
router.post('/verify', paymentController.verifyPayment);

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

module.exports = router; 
