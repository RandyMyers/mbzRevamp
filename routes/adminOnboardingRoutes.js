const express = require('express');
const router = express.Router();
const adminOnboardingController = require('../controllers/adminOnboardingController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication and authorization to all routes
router.use(protect);
router.use(restrictTo('admin', 'hr'));

/**
 * @swagger
 * tags:
 *   name: Admin Onboarding
 *   description: Employee onboarding task management for super admin
 */

// Onboarding Task Routes
router.get('/tasks', adminOnboardingController.listOnboardingTasks);
router.post('/tasks', adminOnboardingController.createOnboardingTask);
router.get('/tasks/:id', adminOnboardingController.getOnboardingTaskById);
router.patch('/tasks/:id/start', adminOnboardingController.startTask);
router.patch('/tasks/:id/complete', adminOnboardingController.completeTask);
router.post('/tasks/:id/comment', adminOnboardingController.addComment);
router.patch('/tasks/:id/approve', adminOnboardingController.approveTask);

// Analytics Routes
router.get('/analytics', adminOnboardingController.getOnboardingAnalytics);

module.exports = router;
