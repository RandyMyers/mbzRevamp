const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: dashboard operations
 */

const dashboardOverviewController = require('../controllers/dashboardOverviewController');
const dashboardController = require('../controllers/dashboardController');
const orderController = require('../controllers/orderControllers');
const { protect } = require('../middleware/authMiddleware');

// Dashboard overview with all metrics (comprehensive)

/**
 * @swagger
 * /api/dashboard/overview/:organizationId:
 *   get:
 *     summary: Get Overview
 *     tags: [Dashboard]
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
router.get('/overview/:organizationId', protect, dashboardOverviewController.getDashboardOverview);

// Dashboard basic stats (legacy - keeping for backward compatibility)

/**
 * @swagger
 * /api/dashboard/stats/:organizationId:
 *   get:
 *     summary: Get Stats
 *     tags: [Dashboard]
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
router.get('/stats/:organizationId', protect, dashboardController.getOverviewStats);

// Individual dashboard components

/**
 * @swagger
 * /api/dashboard/sales-trend/:organizationId:
 *   get:
 *     summary: Get Sales-trend
 *     tags: [Dashboard]
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
router.get('/sales-trend/:organizationId', protect, dashboardController.getSalesTrend);

/**
 * @swagger
 * /api/dashboard/top-products/:organizationId:
 *   get:
 *     summary: Get Top-products
 *     tags: [Dashboard]
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
router.get('/top-products/:organizationId', protect, dashboardController.getTopProducts);

/**
 * @swagger
 * /api/dashboard/customer-metrics/:organizationId:
 *   get:
 *     summary: Get Customer-metrics
 *     tags: [Dashboard]
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
router.get('/customer-metrics/:organizationId', protect, dashboardController.getCustomerMetrics);

/**
 * @swagger
 * /api/dashboard/notifications/:organizationId:
 *   get:
 *     summary: Get Notifications
 *     tags: [Dashboard]
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
router.get('/notifications/:organizationId', protect, dashboardController.getNotifications);

/**
 * @swagger
 * /api/dashboard/recent-orders/:organizationId:
 *   get:
 *     summary: Get Recent-orders
 *     tags: [Dashboard]
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
router.get('/recent-orders/:organizationId', protect, orderController.getRecentOrders);

module.exports = router; 
