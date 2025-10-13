const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Advanced Analytics
 *     description: advanced analytics operations
 */

const analytics = require('../controllers/advancedAnalyticsController');

// Sales Analytics

/**
 * @swagger
 * /api/advanced-analytics/sales/total-revenue:
 *   get:
 *     summary: Get Total-revenue
 *     tags: [Advanced Analytics]
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
router.get('/sales/total-revenue', analytics.totalRevenueByPeriod);

/**
 * @swagger
 * /api/advanced-analytics/sales/revenue-by-product:
 *   get:
 *     summary: Get Revenue-by-product
 *     tags: [Advanced Analytics]
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
router.get('/sales/revenue-by-product', analytics.revenueByProduct);

/**
 * @swagger
 * /api/advanced-analytics/sales/order-status-distribution:
 *   get:
 *     summary: Get Order-status-distribution
 *     tags: [Advanced Analytics]
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
router.get('/sales/order-status-distribution', analytics.orderStatusDistribution);

// Customer Analytics

/**
 * @swagger
 * /api/advanced-analytics/customers/new-vs-returning:
 *   get:
 *     summary: Get New-vs-returning
 *     tags: [Advanced Analytics]
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
router.get('/customers/new-vs-returning', analytics.newVsReturningCustomers);

/**
 * @swagger
 * /api/advanced-analytics/customers/acquisition-sources:
 *   get:
 *     summary: Get Acquisition-sources
 *     tags: [Advanced Analytics]
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
router.get('/customers/acquisition-sources', analytics.acquisitionSources);

/**
 * @swagger
 * /api/advanced-analytics/customers/lifetime-value:
 *   get:
 *     summary: Get Lifetime-value
 *     tags: [Advanced Analytics]
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
router.get('/customers/lifetime-value', analytics.customerLifetimeValue);

/**
 * @swagger
 * /api/advanced-analytics/customers/repeat-purchase-rate:
 *   get:
 *     summary: Get Repeat-purchase-rate
 *     tags: [Advanced Analytics]
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
router.get('/customers/repeat-purchase-rate', analytics.repeatPurchaseRate);

/**
 * @swagger
 * /api/advanced-analytics/customers/retention-cohort:
 *   get:
 *     summary: Get Retention-cohort
 *     tags: [Advanced Analytics]
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
router.get('/customers/retention-cohort', analytics.retentionCohort);

/**
 * @swagger
 * /api/advanced-analytics/customers/geographic-distribution:
 *   get:
 *     summary: Get Geographic-distribution
 *     tags: [Advanced Analytics]
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
router.get('/customers/geographic-distribution', analytics.geographicDistribution);

// Product Performance

/**
 * @swagger
 * /api/advanced-analytics/products/best-sellers:
 *   get:
 *     summary: Get Best-sellers
 *     tags: [Advanced Analytics]
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
router.get('/products/best-sellers', analytics.bestSellers);

/**
 * @swagger
 * /api/advanced-analytics/products/low-stock:
 *   get:
 *     summary: Get Low-stock
 *     tags: [Advanced Analytics]
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
router.get('/products/low-stock', analytics.lowStock);

// Order Funnel

/**
 * @swagger
 * /api/advanced-analytics/funnel/abandoned-cart-rate:
 *   get:
 *     summary: Get Abandoned-cart-rate
 *     tags: [Advanced Analytics]
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
router.get('/funnel/abandoned-cart-rate', analytics.abandonedCartRate);

// ... Add more analytics endpoints as needed ...

module.exports = router; 
// ... Add more analytics endpoints as needed ...

module.exports = router; 
