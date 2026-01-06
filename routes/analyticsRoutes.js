const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Analytics
 *     description: analytics operations
 */

const analyticsController = require('../controllers/analysisControllers');
const emailLogsController = require('../controllers/emailLogsController');
const { protect } = require('../middleware/authMiddleware');
const { requirePlanFeature } = require('../middleware/permissionMiddleware');

// Apply analytics feature check to all analytics routes
// Analytics are available on Basic (limited), Standard (full), and Premium (full) plans
router.use(protect, requirePlanFeature('analytics'));

// Route for Total Revenue

/**
 * @swagger
 * /api/analytics/total-revenue:
 *   get:
 *     summary: Get Total-revenue
 *     tags: [Analytics]
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
router.get('/total-revenue', analyticsController.totalRevenue);

// Route for Revenue Growth

/**
 * @swagger
 * /api/analytics/revenue-growth:
 *   get:
 *     summary: Get Revenue growth comparing current to previous period
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/revenue-growth', analyticsController.revenueGrowth);

// Route for Order Growth

/**
 * @swagger
 * /api/analytics/order-growth:
 *   get:
 *     summary: Get Order growth comparing current to previous period
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/order-growth', analyticsController.orderGrowth);

// Route for Total Orders

/**
 * @swagger
 * /api/analytics/total-orders:
 *   get:
 *     summary: Get Total-orders
 *     tags: [Analytics]
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
router.get('/total-orders', analyticsController.totalOrders);

// Route for New Customers

/**
 * @swagger
 * /api/analytics/new-customers:
 *   get:
 *     summary: Get New-customers
 *     tags: [Analytics]
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
router.get('/new-customers', analyticsController.newCustomers);

// Route for Average Order Value

/**
 * @swagger
 * /api/analytics/average-order-value:
 *   get:
 *     summary: Get Average-order-value
 *     tags: [Analytics]
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
router.get('/average-order-value', analyticsController.averageOrderValue);

// Route for Return Rate

/**
 * @swagger
 * /api/analytics/return-rate:
 *   get:
 *     summary: Get Return-rate
 *     tags: [Analytics]
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
router.get('/return-rate', analyticsController.returnRate);

// Route for Customer Retention Rate

/**
 * @swagger
 * /api/analytics/customer-retention-rate:
 *   get:
 *     summary: Get Customer-retention-rate
 *     tags: [Analytics]
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
router.get('/customer-retention-rate', analyticsController.customerRetentionRate);

// Route for Churn Rate

/**
 * @swagger
 * /api/analytics/churn-rate:
 *   get:
 *     summary: Get customer churn rate
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/churn-rate', analyticsController.churnRate);

// Route for Top Customers

/**
 * @swagger
 * /api/analytics/top-customers:
 *   get:
 *     summary: Get top customers by spending
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/top-customers', analyticsController.topCustomers);

// Route for Sales Time Series

/**
 * @swagger
 * /api/analytics/sales-time-series:
 *   get:
 *     summary: Get daily revenue and orders breakdown
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/sales-time-series', analyticsController.salesTimeSeries);

// Route for Lifetime Value (LTV)

/**
 * @swagger
 * /api/analytics/lifetime-value:
 *   get:
 *     summary: Get Lifetime-value
 *     tags: [Analytics]
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
router.get('/lifetime-value', analyticsController.lifetimeValue);

// Route for Customer Acquisition by Source

/**
 * @swagger
 * /api/analytics/customer-acquisition:
 *   get:
 *     summary: Get Customer-acquisition
 *     tags: [Analytics]
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
router.get('/customer-acquisition', analyticsController.customerAcquisition);

// Route for Product Performance

/**
 * @swagger
 * /api/analytics/product-performance:
 *   get:
 *     summary: Get Product-performance
 *     tags: [Analytics]
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
router.get('/product-performance', analyticsController.productPerformance);

// Route for Funnel Data

/**
 * @swagger
 * /api/analytics/funnel-data:
 *   get:
 *     summary: Get Funnel-data
 *     tags: [Analytics]
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
router.get('/funnel-data', analyticsController.funnelData);

// Route for Retention Data

/**
 * @swagger
 * /api/analytics/retention-data:
 *   get:
 *     summary: Get Retention-data
 *     tags: [Analytics]
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
router.get('/retention-data', analyticsController.retentionData);

// Route for Regional Sales

/**
 * @swagger
 * /api/analytics/regional-sales:
 *   get:
 *     summary: Get Regional-sales
 *     tags: [Analytics]
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
router.get('/regional-sales', analyticsController.regionalSales);

// Email Analytics

/**
 * @swagger
 * /api/analytics/email/delivery-stats:
 *   get:
 *     summary: Get Delivery-stats
 *     tags: [Analytics]
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
router.get('/email/delivery-stats', emailLogsController.getDeliveryStats);

/**
 * @swagger
 * /api/analytics/email/device-stats:
 *   get:
 *     summary: Get Device-stats
 *     tags: [Analytics]
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
router.get('/email/device-stats', emailLogsController.getDeviceStats);

/**
 * @swagger
 * /api/analytics/email/geo-stats:
 *   get:
 *     summary: Get Geo-stats
 *     tags: [Analytics]
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
router.get('/email/geo-stats', emailLogsController.getGeoStats);

module.exports = router;
