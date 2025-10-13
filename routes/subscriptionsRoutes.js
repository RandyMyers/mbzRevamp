const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Subscriptions
 *     description: subscriptions operations
 */

const subscriptionController = require('../controllers/subscriptionController');

// CRUD
router.post('/', subscriptionController.createSubscription);
router.get('/', subscriptionController.getSubscriptions);
router.get('/:id', subscriptionController.getSubscriptionById);
router.put('/:id', subscriptionController.updateSubscription);
router.delete('/:id', subscriptionController.deleteSubscription);

// Create subscription with payment (NEW)
router.post('/create', subscriptionController.createSubscriptionWithPayment);

// Assign a plan to a user
router.post('/assign', subscriptionController.assignSubscription);
// Renew a subscription
router.post('/:id/renew', subscriptionController.renewSubscription);
// Cancel a subscription
router.post('/:id/cancel', subscriptionController.cancelSubscription);

module.exports = router; 
