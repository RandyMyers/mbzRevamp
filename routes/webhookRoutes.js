const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Dynamic WooCommerce webhook endpoints with store identification
router.post('/woocommerce/:webhookIdentifier/order.created', webhookController.handleOrderCreated);
router.post('/woocommerce/:webhookIdentifier/order.updated', webhookController.handleOrderUpdated);
router.post('/woocommerce/:webhookIdentifier/order.deleted', webhookController.handleOrderDeleted);

router.post('/woocommerce/:webhookIdentifier/customer.created', webhookController.handleCustomerCreated);
router.post('/woocommerce/:webhookIdentifier/customer.updated', webhookController.handleCustomerUpdated);
router.post('/woocommerce/:webhookIdentifier/customer.deleted', webhookController.handleCustomerDeleted);


router.post('/woocommerce/:webhookIdentifier/product.created', webhookController.handleProductCreated);
router.post('/woocommerce/:webhookIdentifier/product.updated', webhookController.handleProductUpdated);
router.post('/woocommerce/:webhookIdentifier/product.deleted', webhookController.handleProductDeleted);

// Webhook management endpoints
router.post('/create', webhookController.createWebhook);
router.get('/list', webhookController.listWebhooks);
router.get('/:id', webhookController.getWebhook);
router.put('/:id', webhookController.updateWebhook);
router.delete('/:id', webhookController.deleteWebhook);

// Webhook delivery logs
router.get('/:id/deliveries', webhookController.getWebhookDeliveries);
router.get('/:id/deliveries/:deliveryId', webhookController.getWebhookDelivery);

// Webhook testing
router.post('/:id/test', webhookController.testWebhook);

// Bulk webhook management
router.put('/bulk/update', webhookController.bulkUpdateWebhooks);

// Webhook statistics
router.get('/stats', webhookController.getWebhookStats);

module.exports = router;  