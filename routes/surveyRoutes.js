const express = require('express');
const router = express.Router();
const surveyControllers = require('../controllers/surveyControllers');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ==================== SURVEY ROUTES ====================

// CREATE new survey
router.post('/create', surveyControllers.createSurvey);

// GET all surveys with filters
router.get('/list', surveyControllers.getSurveys);

// GET single survey by ID
router.get('/:id', surveyControllers.getSurveyById);

// UPDATE survey
router.put('/:id', surveyControllers.updateSurvey);

// DELETE survey
router.delete('/:id', surveyControllers.deleteSurvey);

// PUBLISH survey (change status to active)
router.post('/:id/publish', surveyControllers.publishSurvey);

// ==================== SURVEY RESPONSE ROUTES ====================

// SUBMIT survey response
router.post('/:id/responses/submit', surveyControllers.submitSurveyResponse);

// GET survey responses
router.get('/:id/responses', surveyControllers.getSurveyResponses);

module.exports = router;
