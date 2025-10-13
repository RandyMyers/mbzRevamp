const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Suggestions
 *     description: suggestions operations
 */

const suggestionControllers = require('../controllers/suggestionControllers');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ==================== SUGGESTION ROUTES ====================

// CREATE new suggestion

/**
 * @swagger
 * /api/suggestions/create:
 *   post:
 *     summary: Create Create
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/create', suggestionControllers.createSuggestion);

// GET all suggestions with filters

/**
 * @swagger
 * /api/suggestions/list:
 *   get:
 *     summary: Get List
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/list', suggestionControllers.getSuggestions);

// GET single suggestion by ID

/**
 * @swagger
 * /api/suggestions/:id:
 *   get:
 *     summary: Get Item
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', suggestionControllers.getSuggestionById);

// UPDATE suggestion

/**
 * @swagger
 * /api/suggestions/:id:
 *   put:
 *     summary: Update Item
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', suggestionControllers.updateSuggestion);

// DELETE suggestion

/**
 * @swagger
 * /api/suggestions/:id:
 *   delete:
 *     summary: Delete Item
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id', suggestionControllers.deleteSuggestion);

// ==================== VOTING AND COMMENTS ROUTES ====================

// VOTE on suggestion (upvote or downvote)

/**
 * @swagger
 * /api/suggestions/:id/vote:
 *   post:
 *     summary: Create Vote
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:id/vote', suggestionControllers.voteSuggestion);

// ADD comment to suggestion

/**
 * @swagger
 * /api/suggestions/:id/comment:
 *   post:
 *     summary: Create Comment
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:id/comment', suggestionControllers.addSuggestionComment);

// GET suggestion comments

/**
 * @swagger
 * /api/suggestions/:id/comments:
 *   get:
 *     summary: Get Comments
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id/comments', suggestionControllers.getSuggestionComments);

module.exports = router;




