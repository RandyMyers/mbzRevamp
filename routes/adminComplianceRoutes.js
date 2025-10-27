const express = require('express');
const router = express.Router();
const adminCompliance = require('../controllers/adminComplianceController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication and authorization middleware
router.use(protect, restrictTo('super-admin', 'hr-manager', 'compliance-officer'));

// Compliance management routes
router.get('/requirements', adminCompliance.trackComplianceRequirements);
router.get('/reports', adminCompliance.generateComplianceReports);

// Training and certification
router.post('/schedule-training', adminCompliance.scheduleTraining);
router.get('/track-certifications', adminCompliance.trackCertifications);

// Audit and tracking
router.get('/audit-trail', adminCompliance.auditTrail);

module.exports = router;


