const express = require('express');
const router = express.Router();
const adminOffboarding = require('../controllers/adminOffboardingController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication and authorization middleware
router.use(protect, restrictTo('super-admin', 'hr-manager'));

// Offboarding process routes
router.post('/initiate', adminOffboarding.initiateOffboarding);
router.get('/records', adminOffboarding.getOffboardingRecords);

// Asset collection
router.post('/collect-assets', adminOffboarding.collectCompanyAssets);

// Exit interview
router.post('/exit-interview', adminOffboarding.conductExitInterview);

// Access management
router.post('/revoke-access', adminOffboarding.revokeAccess);

// Final payroll
router.post('/final-payroll', adminOffboarding.finalPayroll);

// Process completion
router.post('/complete', adminOffboarding.completeOffboarding);

module.exports = router;


