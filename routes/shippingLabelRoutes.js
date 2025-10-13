const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Shipping Labels
 *     description: shipping labels operations
 */

const shippingLabelController = require('../controllers/shippingLabelController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Generate shipping label for an order

/**
 * @swagger
 * /api/shipping-labels/generate/:orderId:
 *   post:
 *     summary: Create Generate
 *     tags: [Shipping Labels]
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
router.post('/generate/:orderId', shippingLabelController.generateShippingLabel);

// Get shipping label by order ID

/**
 * @swagger
 * /api/shipping-labels/order/:orderId:
 *   get:
 *     summary: Get Order
 *     tags: [Shipping Labels]
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
router.get('/order/:orderId', shippingLabelController.getShippingLabelByOrder);

// Get all shipping labels for organization

/**
 * @swagger
 * /api/shipping-labels/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Shipping Labels]
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
router.get('/organization/:organizationId', shippingLabelController.getShippingLabelsByOrganization);

// Bulk generate shipping labels

/**
 * @swagger
 * /api/shipping-labels/bulk-generate/:organizationId:
 *   post:
 *     summary: Create Bulk-generate
 *     tags: [Shipping Labels]
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
router.post('/bulk-generate/:organizationId', shippingLabelController.bulkGenerateShippingLabels);

// Generate PDF for shipping label

/**
 * @swagger
 * /api/shipping-labels/:labelId/pdf:
 *   get:
 *     summary: Get Pdf
 *     tags: [Shipping Labels]
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
router.get('/:labelId/pdf', shippingLabelController.generateShippingLabelPDF);

// Update shipping label status

/**
 * @swagger
 * /api/shipping-labels/:labelId/status:
 *   patch:
 *     summary: Update Status
 *     tags: [Shipping Labels]
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
router.patch('/:labelId/status', shippingLabelController.updateShippingLabelStatus);

// Delete shipping label

/**
 * @swagger
 * /api/shipping-labels/:labelId:
 *   delete:
 *     summary: Delete Item
 *     tags: [Shipping Labels]
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
router.delete('/:labelId', shippingLabelController.deleteShippingLabel);

// Get shipping label by ID (must be last to avoid conflicts with specific routes)

/**
 * @swagger
 * /api/shipping-labels/:labelId:
 *   get:
 *     summary: Get Item
 *     tags: [Shipping Labels]
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
router.get('/:labelId', shippingLabelController.getShippingLabelById);

module.exports = router; 
