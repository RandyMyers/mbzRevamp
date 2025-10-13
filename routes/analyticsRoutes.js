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
