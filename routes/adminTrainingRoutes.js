const express = require('express');
const router = express.Router();
const adminTrainingController = require('../controllers/adminTrainingController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication and authorization to all routes
router.use(protect);
router.use(restrictTo('admin', 'hr'));

/**
 * @swagger
 * tags:
 *   name: Admin Training
 *   description: Training materials and enrollment management for super admin
 */

// Training Material Routes
router.get('/materials', adminTrainingController.listTrainingMaterials);
router.post('/materials', adminTrainingController.createTrainingMaterial);
router.get('/materials/:id', adminTrainingController.getTrainingMaterialById);

// Training Enrollment Routes
router.get('/enrollments', adminTrainingController.listTrainingEnrollments);
router.post('/enrollments', adminTrainingController.enrollEmployee);
router.patch('/enrollments/:id/progress', adminTrainingController.updateTrainingProgress);
router.post('/enrollments/:id/assignment', adminTrainingController.submitAssignment);

// Analytics Routes
router.get('/analytics', adminTrainingController.getTrainingAnalytics);

module.exports = router;
