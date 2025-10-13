const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customers
 *     description: customers operations
 */

const customerController = require('../controllers/customerControllers');

router.post('/create', customerController.createCustomer);
router.get('/organization/:organizationId', customerController.getCustomersByOrganizationId);
router.get('/all', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.patch('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.get('/store/:storeId', customerController.getCustomersByStoreId);

// DELETE all customers for a specific store
router.delete('/store/:storeId', customerController.deleteAllCustomersByStore);

// WooCommerce sync routes
router.post('/woocommerce/sync-customers/:storeId/:organizationId', customerController.syncCustomers);
router.post('/woocommerce/sync/:customerId', customerController.syncCustomerToWooCommerce);
router.post('/woocommerce/retry-sync/:customerId', customerController.retryCustomerWooCommerceSync);

module.exports = router;
