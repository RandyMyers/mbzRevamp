const express = require('express');
const router = express.Router();
const feedbackControllers = require('../controllers/feedbackControllers');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ==================== FEEDBACK ROUTES ====================

// CREATE new feedback
router.post('/create', feedbackControllers.createFeedback);

// GET all feedback with filters
router.get('/list', feedbackControllers.getFeedback);

// GET single feedback by ID
router.get('/:id', feedbackControllers.getFeedbackById);

// UPDATE feedback
router.put('/:id', feedbackControllers.updateFeedback);

// DELETE feedback
router.delete('/:id', feedbackControllers.deleteFeedback);

// RESPOND to feedback
router.post('/:id/respond', feedbackControllers.respondToFeedback);

// GET feedback analytics
router.get('/analytics/summary', feedbackControllers.getFeedbackAnalytics);

// BULK update feedback status
router.put('/bulk/status', feedbackControllers.bulkUpdateFeedbackStatus);

module.exports = router; 
