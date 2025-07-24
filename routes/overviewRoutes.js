const express = require('express');
const router = express.Router();
const overviewController = require('../controllers/overviewController');

// Get overview statistics
router.get('/stats/:userId', overviewController.getOverviewStats);

// Get sales trend data
router.get('/sales-trend/:userId', overviewController.getSalesTrend);

// Get order sources breakdown
router.get('/order-sources/:userId', overviewController.getOrderSources);

// Get top products
router.get('/top-products/:userId', overviewController.getTopProducts);

// Get recent orders
router.get('/recent-orders/:userId', overviewController.getRecentOrders);

// Test endpoint for debugging product images
router.get('/test-product-images/:userId', overviewController.testProductImages);

// Get product categories distribution for pie chart
router.get('/product-categories/:userId', overviewController.getProductCategoriesDistribution);

// Get stock status distribution for pie chart
router.get('/stock-status/:userId', overviewController.getStockStatusDistribution);

module.exports = router; 