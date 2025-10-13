const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Webhooks
 *     description: webhooks operations
 */

const webhookController = require('../controllers/webhookController');

// Dynamic WooCommerce webhook endpoints with store identification

/**
 * @swagger
 * /api/webhooks/woocommerce/:webhookIdentifier/order.created:
 *   post:
 *     summary: Create Order.created
 *     tags: [Webhooks]
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
router.post('/woocommerce/:webhookIdentifier/order.created', webhookController.handleOrderCreated);

/**
 * @swagger
 * /api/webhooks/woocommerce/:webhookIdentifier/order.updated:
 *   post:
 *     summary: Create Order.updated
 *     tags: [Webhooks]
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
router.post('/woocommerce/:webhookIdentifier/order.updated', webhookController.handleOrderUpdated);

/**
 * @swagger
 * /api/webhooks/woocommerce/:webhookIdentifier/order.deleted:
 *   post:
 *     summary: Create Order.deleted
 *     tags: [Webhooks]
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
router.post('/woocommerce/:webhookIdentifier/order.deleted', webhookController.handleOrderDeleted);


/**
 * @swagger
 * /api/webhooks/woocommerce/:webhookIdentifier/customer.created:
 *   post:
 *     summary: Create Customer.created
 *     tags: [Webhooks]
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
router.post('/woocommerce/:webhookIdentifier/customer.created', webhookController.handleCustomerCreated);

/**
 * @swagger
 * /api/webhooks/woocommerce/:webhookIdentifier/customer.updated:
 *   post:
 *     summary: Create Customer.updated
 *     tags: [Webhooks]
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
router.post('/woocommerce/:webhookIdentifier/customer.updated', webhookController.handleCustomerUpdated);

/**
 * @swagger
 * /api/webhooks/woocommerce/:webhookIdentifier/customer.deleted:
 *   post:
 *     summary: Create Customer.deleted
 *     tags: [Webhooks]
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
router.post('/woocommerce/:webhookIdentifier/customer.deleted', webhookController.handleCustomerDeleted);



/**
 * @swagger
 * /api/webhooks/woocommerce/:webhookIdentifier/product.created:
 *   post:
 *     summary: Create Product.created
 *     tags: [Webhooks]
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
router.post('/woocommerce/:webhookIdentifier/product.created', webhookController.handleProductCreated);

/**
 * @swagger
 * /api/webhooks/woocommerce/:webhookIdentifier/product.updated:
 *   post:
 *     summary: Create Product.updated
 *     tags: [Webhooks]
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
router.post('/woocommerce/:webhookIdentifier/product.updated', webhookController.handleProductUpdated);

/**
 * @swagger
 * /api/webhooks/woocommerce/:webhookIdentifier/product.deleted:
 *   post:
 *     summary: Create Product.deleted
 *     tags: [Webhooks]
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
router.post('/woocommerce/:webhookIdentifier/product.deleted', webhookController.handleProductDeleted);

// Webhook management endpoints

/**
 * @swagger
 * /api/webhooks/create:
 *   post:
 *     summary: Create Create
 *     tags: [Webhooks]
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
router.post('/create', webhookController.createWebhook);

/**
 * @swagger
 * /api/webhooks/list:
 *   get:
 *     summary: Get List
 *     tags: [Webhooks]
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
router.get('/list', webhookController.listWebhooks);

/**
 * @swagger
 * /api/webhooks/:id:
 *   get:
 *     summary: Get Item
 *     tags: [Webhooks]
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
router.get('/:id', webhookController.getWebhook);

/**
 * @swagger
 * /api/webhooks/:id:
 *   put:
 *     summary: Update Item
 *     tags: [Webhooks]
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
router.put('/:id', webhookController.updateWebhook);

/**
 * @swagger
 * /api/webhooks/:id:
 *   delete:
 *     summary: Delete Item
 *     tags: [Webhooks]
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
router.delete('/:id', webhookController.deleteWebhook);

// Webhook delivery logs

/**
 * @swagger
 * /api/webhooks/:id/deliveries:
 *   get:
 *     summary: Get Deliveries
 *     tags: [Webhooks]
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
router.get('/:id/deliveries', webhookController.getWebhookDeliveries);

/**
 * @swagger
 * /api/webhooks/:id/deliveries/:deliveryId:
 *   get:
 *     summary: Get Deliveries
 *     tags: [Webhooks]
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
router.get('/:id/deliveries/:deliveryId', webhookController.getWebhookDelivery);

// Webhook testing

/**
 * @swagger
 * /api/webhooks/:id/test:
 *   post:
 *     summary: Create Test
 *     tags: [Webhooks]
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
router.post('/:id/test', webhookController.testWebhook);

// Bulk webhook management

/**
 * @swagger
 * /api/webhooks/bulk/update:
 *   put:
 *     summary: Update Update
 *     tags: [Webhooks]
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
router.put('/bulk/update', webhookController.bulkUpdateWebhooks);

// Webhook statistics

/**
 * @swagger
 * /api/webhooks/stats:
 *   get:
 *     summary: Get Stats
 *     tags: [Webhooks]
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
router.get('/stats', webhookController.getWebhookStats);

module.exports = router;  
