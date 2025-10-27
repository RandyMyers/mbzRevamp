const express = require('express');
const router = express.Router();
const adminReporting = require('../controllers/adminReportingController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication and authorization middleware
router.use(protect, restrictTo('super-admin', 'hr-manager', 'analyst'));

// HR reporting routes
router.get('/hr-overview', adminReporting.generateHRReports);
router.get('/employee-analytics', adminReporting.employeeAnalytics);
router.get('/turnover-analysis', adminReporting.turnoverAnalysis);
router.get('/performance-metrics', adminReporting.performanceMetrics);
router.get('/cost-analysis', adminReporting.costAnalysis);
router.get('/demographic-reports', adminReporting.demographicReports);

module.exports = router;


