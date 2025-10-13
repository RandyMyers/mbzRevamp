const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Content Management
 *     description: content management operations
 */

const contentManagementControllers = require('../controllers/contentManagementControllers');
const { authenticateToken } = require('../middleware/authMiddleware');

// Content Management Routes

/**
 * @swagger
 * /api/content-management/:
 *   post:
 *     summary: Create Item
 *     tags: [Content Management]
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
router.post('/', authenticateToken, contentManagementControllers.createContent);

/**
 * @swagger
 * /api/content-management/:
 *   get:
 *     summary: Get Item
 *     tags: [Content Management]
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
router.get('/', authenticateToken, contentManagementControllers.getContent);

/**
 * @swagger
 * /api/content-management/:id:
 *   get:
 *     summary: Get Item
 *     tags: [Content Management]
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
router.get('/:id', authenticateToken, contentManagementControllers.getContentById);

/**
 * @swagger
 * /api/content-management/:id:
 *   put:
 *     summary: Update Item
 *     tags: [Content Management]
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
router.put('/:id', authenticateToken, contentManagementControllers.updateContent);

/**
 * @swagger
 * /api/content-management/:id:
 *   delete:
 *     summary: Delete Item
 *     tags: [Content Management]
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
router.delete('/:id', authenticateToken, contentManagementControllers.deleteContent);

/**
 * @swagger
 * /api/content-management/:id/publish:
 *   post:
 *     summary: Create Publish
 *     tags: [Content Management]
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
router.post('/:id/publish', authenticateToken, contentManagementControllers.publishContent);

/**
 * @swagger
 * /api/content-management/:id/like:
 *   post:
 *     summary: Create Like
 *     tags: [Content Management]
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
router.post('/:id/like', authenticateToken, contentManagementControllers.likeContent);

/**
 * @swagger
 * /api/content-management/:id/comment:
 *   post:
 *     summary: Create Comment
 *     tags: [Content Management]
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
router.post('/:id/comment', authenticateToken, contentManagementControllers.addComment);

module.exports = router;





