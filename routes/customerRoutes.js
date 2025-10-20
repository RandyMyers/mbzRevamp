const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customers
 *     description: customers operations
 */

const customerController = require('../controllers/customerControllers');


/**
 * @swagger
 * /api/customers/create:
 *   post:
 *     summary: Create Create
 *     tags: [Customers]
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
router.post('/create', customerController.createCustomer);

/**
 * @swagger
 * /api/customers/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Customers]
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
router.get('/organization/:organizationId', require('../middleware/authMiddleware').protect, customerController.getCustomersByOrganizationId);

/**
 * @swagger
 * /api/customers/all:
 *   get:
 *     summary: Get All
 *     tags: [Customers]
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
router.get('/all', customerController.getAllCustomers);

/**
 * @swagger
 * /api/customers/:id:
 *   get:
 *     summary: Get Item
 *     tags: [Customers]
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
router.get('/:id', customerController.getCustomerById);

/**
 * @swagger
 * /api/customers/:id:
 *   patch:
 *     summary: Update Item
 *     tags: [Customers]
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
router.patch('/:id', customerController.updateCustomer);

/**
 * @swagger
 * /api/customers/:id:
 *   delete:
 *     summary: Delete Item
 *     tags: [Customers]
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
router.delete('/:id', customerController.deleteCustomer);

/**
 * @swagger
 * /api/customers/store/:storeId:
 *   get:
 *     summary: Get Store
 *     tags: [Customers]
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
router.get('/store/:storeId', customerController.getCustomersByStoreId);

// DELETE all customers for a specific store

/**
 * @swagger
 * /api/customers/store/:storeId:
 *   delete:
 *     summary: Delete Store
 *     tags: [Customers]
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
router.delete('/store/:storeId', customerController.deleteAllCustomersByStore);

// WooCommerce sync routes

/**
 * @swagger
 * /api/customers/woocommerce/sync-customers/:storeId/:organizationId:
 *   post:
 *     summary: Create Sync-customers
 *     tags: [Customers]
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
router.post('/woocommerce/sync-customers/:storeId/:organizationId', customerController.syncCustomers);

// HIDDEN FROM SWAGGER - Not used by frontend
// /**
//  * @swagger
//  * /api/customers/woocommerce/sync/:customerId:
//  *   post:
//  *     summary: Create Sync
//  *     tags: [Customers]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: "Operation completed successfully"
//  *       401:
//  *         description: Unauthorized
//  *       500:
//  *         description: Server error
//  */
router.post('/woocommerce/sync/:customerId', customerController.syncCustomerToWooCommerce);

// HIDDEN FROM SWAGGER - Not used by frontend
// /**
//  * @swagger
//  * /api/customers/woocommerce/retry-sync/:customerId:
//  *   post:
//  *     summary: Create Retry-sync
//  *     tags: [Customers]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: "Operation completed successfully"
//  *       401:
//  *         description: Unauthorized
//  *       500:
//  *         description: Server error
//  */
router.post('/woocommerce/retry-sync/:customerId', customerController.retryCustomerWooCommerceSync);

module.exports = router;
