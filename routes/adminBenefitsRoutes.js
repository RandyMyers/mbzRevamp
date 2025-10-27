const express = require('express');
const router = express.Router();
const adminBenefits = require('../controllers/adminBenefitsController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication and authorization middleware
router.use(protect, restrictTo('super-admin', 'hr-manager'));

// Benefits management routes
router.get('/', adminBenefits.listBenefits);
router.post('/', adminBenefits.createBenefit);
router.put('/:id', adminBenefits.updateBenefit);
router.delete('/:id', adminBenefits.deleteBenefit);

// Employee benefits assignment
router.post('/assign', adminBenefits.assignBenefit);
router.delete('/remove', adminBenefits.removeBenefit);

// Eligibility and costs
router.get('/eligibility/:employeeId', adminBenefits.benefitEligibility);
router.get('/costs', adminBenefits.benefitCosts);

module.exports = router;


