const express = require('express');
const router = express.Router();
const suggestionControllers = require('../controllers/suggestionControllers');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ==================== SUGGESTION ROUTES ====================

// CREATE new suggestion
router.post('/create', suggestionControllers.createSuggestion);

// GET all suggestions with filters
router.get('/list', suggestionControllers.getSuggestions);

// GET single suggestion by ID
router.get('/:id', suggestionControllers.getSuggestionById);

// UPDATE suggestion
router.put('/:id', suggestionControllers.updateSuggestion);

// DELETE suggestion
router.delete('/:id', suggestionControllers.deleteSuggestion);

// ==================== VOTING AND COMMENTS ROUTES ====================

// VOTE on suggestion (upvote or downvote)
router.post('/:id/vote', suggestionControllers.voteSuggestion);

// ADD comment to suggestion
router.post('/:id/comment', suggestionControllers.addSuggestionComment);

// GET suggestion comments
router.get('/:id/comments', suggestionControllers.getSuggestionComments);

module.exports = router;



