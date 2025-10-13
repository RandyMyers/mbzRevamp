const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Payment Gateway Keys
 *     description: payment gateway keys operations
 */

const paymentGatewayKeyController = require('../controllers/paymentGatewayKeyController');

// CRUD endpoints

/**
 * @swagger
 * /api/payment-gateways/:
 *   get:
 *     summary: Get Item
 *     tags: [Payment Gateway Keys]
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
router.get('/', paymentGatewayKeyController.getAllKeys);

/**
 * @swagger
 * /api/payment-gateways/:type:
 *   get:
 *     summary: Get Item
 *     tags: [Payment Gateway Keys]
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
router.get('/:type', paymentGatewayKeyController.getKey);

/**
 * @swagger
 * /api/payment-gateways/:
 *   post:
 *     summary: Create Item
 *     tags: [Payment Gateway Keys]
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
router.post('/', paymentGatewayKeyController.createKey);

/**
 * @swagger
 * /api/payment-gateways/:type:
 *   put:
 *     summary: Update Item
 *     tags: [Payment Gateway Keys]
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
router.put('/:type', paymentGatewayKeyController.updateKey);

/**
 * @swagger
 * /api/payment-gateways/:type:
 *   delete:
 *     summary: Delete Item
 *     tags: [Payment Gateway Keys]
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
router.delete('/:type', paymentGatewayKeyController.deleteKey);

// Public endpoint to get the public key for a payment gateway

/**
 * @swagger
 * /api/payment-gateways/:type/public-key:
 *   get:
 *     summary: Get Public-key
 *     tags: [Payment Gateway Keys]
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
router.get('/:type/public-key', paymentGatewayKeyController.getPublicKey);

module.exports = router; 
