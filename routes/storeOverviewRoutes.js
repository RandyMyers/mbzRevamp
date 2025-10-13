/**
 * Store Overview Routes - API endpoints for store overview analytics
 * 
 * This file defines the routes for the store overview tab analytics including:
 * - Store statistics and metrics
 * - Store alerts and notifications  
 * - Store performance comparison
 * - Revenue trends by store
 */

const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: store Overview
 *     description: store overview operations
 */

const storeOverviewController = require('../controllers/storeOverviewController');

// 1. Store Stats - Basic store metrics
// GET /api/store-overview/stats/:organizationId
// Query params: timeRange (7d, 30d, 90d, 12m), userId, displayCurrency
router.get('/stats/:organizationId', storeOverviewController.getStoreStats);

// 2. Store Alerts - Notifications and warnings
// GET /api/store-overview/alerts/:organizationId
router.get('/alerts/:organizationId', storeOverviewController.getStoreAlerts);

// 3. Store Performance Comparison - Store comparison chart
// GET /api/store-overview/performance/:organizationId
// Query params: timeRange (7d, 30d, 90d, 12m)
router.get('/performance/:organizationId', storeOverviewController.getStorePerformanceComparison);

// 4. Store Revenue Trends - Time-based revenue trends
// GET /api/store-overview/revenue-trends/:organizationId
// Query params: timeRange (7d, 30d, 90d, 12m), userId, displayCurrency
router.get('/revenue-trends/:organizationId', storeOverviewController.getStoreRevenueTrends);

module.exports = router; 
