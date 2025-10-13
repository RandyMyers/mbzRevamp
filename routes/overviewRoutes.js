const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Overview
 *     description: overview operations
 */

const overviewController = require('../controllers/overviewController');

// Get overview statistics

/**
 * @swagger
 * /api/overview/stats/:userId:
 *   get:
 *     summary: Get Stats
 *     tags: [Overview]
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
router.get('/stats/:userId', overviewController.getOverviewStats);

// Get sales trend data

/**
 * @swagger
 * /api/overview/sales-trend/:userId:
 *   get:
 *     summary: Get Sales-trend
 *     tags: [Overview]
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
router.get('/sales-trend/:userId', overviewController.getSalesTrend);

// Get order sources breakdown

/**
 * @swagger
 * /api/overview/order-sources/:userId:
 *   get:
 *     summary: Get Order-sources
 *     tags: [Overview]
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
router.get('/order-sources/:userId', overviewController.getOrderSources);

// Get top products

/**
 * @swagger
 * /api/overview/top-products/:userId:
 *   get:
 *     summary: Get Top-products
 *     tags: [Overview]
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
router.get('/top-products/:userId', overviewController.getTopProducts);

// Get recent orders

/**
 * @swagger
 * /api/overview/recent-orders/:userId:
 *   get:
 *     summary: Get Recent-orders
 *     tags: [Overview]
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
router.get('/recent-orders/:userId', overviewController.getRecentOrders);

// Test endpoint for debugging product images

/**
 * @swagger
 * /api/overview/test-product-images/:userId:
 *   get:
 *     summary: Get Test-product-images
 *     tags: [Overview]
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
router.get('/test-product-images/:userId', overviewController.testProductImages);

// Get product categories distribution for pie chart

/**
 * @swagger
 * /api/overview/product-categories/:userId:
 *   get:
 *     summary: Get Product-categories
 *     tags: [Overview]
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
router.get('/product-categories/:userId', overviewController.getProductCategoriesDistribution);

// Get stock status distribution for pie chart

/**
 * @swagger
 * /api/overview/stock-status/:userId:
 *   get:
 *     summary: Get Stock-status
 *     tags: [Overview]
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
router.get('/stock-status/:userId', overviewController.getStockStatusDistribution);

module.exports = router; 
