const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: WooCommerce Reports
 *     description: woocommerce reports operations
 */

const wooCommerceReportsController = require('../controllers/wooCommerceReportsController');

// Sales report (totals, grouped)

/**
 * @swagger
 * /api/woocommerce/reports/sales:
 *   get:
 *     summary: Get Sales
 *     tags: [WooCommerce Reports]
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
router.get('/reports/sales', wooCommerceReportsController.getMultiStoreSales);
// Orders report (counts, grouped)

/**
 * @swagger
 * /api/woocommerce/reports/orders:
 *   get:
 *     summary: Get Orders
 *     tags: [WooCommerce Reports]
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
router.get('/reports/orders', wooCommerceReportsController.getMultiStoreOrdersReport);
// Products report (sales, inventory, top sellers)

/**
 * @swagger
 * /api/woocommerce/reports/products:
 *   get:
 *     summary: Get Products
 *     tags: [WooCommerce Reports]
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
router.get('/reports/products', wooCommerceReportsController.getMultiStoreProductsReport);

// Customers report (new, returning, totals)

/**
 * @swagger
 * /api/woocommerce/reports/customers:
 *   get:
 *     summary: Get Customers
 *     tags: [WooCommerce Reports]
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
router.get('/reports/customers', wooCommerceReportsController.getMultiStoreCustomersReport);
// Coupons report

/**
 * @swagger
 * /api/woocommerce/reports/coupons:
 *   get:
 *     summary: Get Coupons
 *     tags: [WooCommerce Reports]
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
router.get('/reports/coupons', wooCommerceReportsController.getMultiStoreCouponsReport);
// Reviews report

/**
 * @swagger
 * /api/woocommerce/reports/reviews:
 *   get:
 *     summary: Get Reviews
 *     tags: [WooCommerce Reports]
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
router.get('/reports/reviews', wooCommerceReportsController.getMultiStoreReviewsReport);
// Categories report

/**
 * @swagger
 * /api/woocommerce/reports/categories:
 *   get:
 *     summary: Get Categories
 *     tags: [WooCommerce Reports]
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
router.get('/reports/categories', wooCommerceReportsController.getMultiStoreCategoriesReport);
// Tags report

/**
 * @swagger
 * /api/woocommerce/reports/tags:
 *   get:
 *     summary: Get Tags
 *     tags: [WooCommerce Reports]
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
router.get('/reports/tags', wooCommerceReportsController.getMultiStoreTagsReport);
// Attributes report

/**
 * @swagger
 * /api/woocommerce/reports/attributes:
 *   get:
 *     summary: Get Attributes
 *     tags: [WooCommerce Reports]
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
router.get('/reports/attributes', wooCommerceReportsController.getMultiStoreAttributesReport);
// Top Sellers report

/**
 * @swagger
 * /api/woocommerce/reports/top-sellers:
 *   get:
 *     summary: Get Top-sellers
 *     tags: [WooCommerce Reports]
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
router.get('/reports/top-sellers', wooCommerceReportsController.getMultiStoreTopSellersReport);
// Taxes report

/**
 * @swagger
 * /api/woocommerce/reports/taxes:
 *   get:
 *     summary: Get Taxes
 *     tags: [WooCommerce Reports]
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
router.get('/reports/taxes', wooCommerceReportsController.getMultiStoreTaxesReport);
// Downloads report

/**
 * @swagger
 * /api/woocommerce/reports/downloads:
 *   get:
 *     summary: Get Downloads
 *     tags: [WooCommerce Reports]
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
router.get('/reports/downloads', wooCommerceReportsController.getMultiStoreDownloadsReport);
// Stock report

/**
 * @swagger
 * /api/woocommerce/reports/stock:
 *   get:
 *     summary: Get Stock
 *     tags: [WooCommerce Reports]
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
router.get('/reports/stock', wooCommerceReportsController.getMultiStoreStockReport);

module.exports = router; 
