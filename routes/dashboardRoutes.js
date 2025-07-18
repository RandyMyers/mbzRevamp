const express = require('express');
const router = express.Router();
const dashboardOverviewController = require('../controllers/dashboardOverviewController');
const dashboardController = require('../controllers/dashboardController');
const orderController = require('../controllers/orderControllers');
const { protect } = require('../middleware/authMiddleware');

// Dashboard overview with all metrics (comprehensive)
router.get('/overview/:organizationId', protect, dashboardOverviewController.getDashboardOverview);

// Dashboard basic stats (legacy - keeping for backward compatibility)
router.get('/stats/:organizationId', protect, dashboardController.getOverviewStats);

// Individual dashboard components
router.get('/sales-trend/:organizationId', protect, dashboardController.getSalesTrend);
router.get('/top-products/:organizationId', protect, dashboardController.getTopProducts);
router.get('/customer-metrics/:organizationId', protect, dashboardController.getCustomerMetrics);
router.get('/notifications/:organizationId', protect, dashboardController.getNotifications);
router.get('/recent-orders/:organizationId', protect, orderController.getRecentOrders);

module.exports = router; 