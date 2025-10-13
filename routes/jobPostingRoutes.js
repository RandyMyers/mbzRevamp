const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Job Postings
 *     description: job postings operations
 */

const jobPostingControllers = require('../controllers/jobPostingControllers');
const { authenticateToken } = require('../middleware/authMiddleware');

// Job Posting Routes

/**
 * @swagger
 * /api/job-postings/:
 *   post:
 *     summary: Create Item
 *     tags: [Job Postings]
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
router.post('/', authenticateToken, jobPostingControllers.createJobPosting);

/**
 * @swagger
 * /api/job-postings/:
 *   get:
 *     summary: Get Item
 *     tags: [Job Postings]
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
router.get('/', authenticateToken, jobPostingControllers.getJobPostings);

/**
 * @swagger
 * /api/job-postings/:id:
 *   get:
 *     summary: Get Item
 *     tags: [Job Postings]
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
router.get('/:id', authenticateToken, jobPostingControllers.getJobPostingById);

/**
 * @swagger
 * /api/job-postings/:id:
 *   put:
 *     summary: Update Item
 *     tags: [Job Postings]
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
router.put('/:id', authenticateToken, jobPostingControllers.updateJobPosting);

/**
 * @swagger
 * /api/job-postings/:id:
 *   delete:
 *     summary: Delete Item
 *     tags: [Job Postings]
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
router.delete('/:id', authenticateToken, jobPostingControllers.deleteJobPosting);

/**
 * @swagger
 * /api/job-postings/:id/publish:
 *   post:
 *     summary: Create Publish
 *     tags: [Job Postings]
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
router.post('/:id/publish', authenticateToken, jobPostingControllers.publishJobPosting);

/**
 * @swagger
 * /api/job-postings/:id/close:
 *   post:
 *     summary: Create Close
 *     tags: [Job Postings]
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
router.post('/:id/close', authenticateToken, jobPostingControllers.closeJobPosting);

/**
 * @swagger
 * /api/job-postings/:id/apply:
 *   post:
 *     summary: Create Apply
 *     tags: [Job Postings]
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
router.post('/:id/apply', authenticateToken, jobPostingControllers.applyForJob);

/**
 * @swagger
 * /api/job-postings/:id/applications:
 *   get:
 *     summary: Get Applications
 *     tags: [Job Postings]
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
router.get('/:id/applications', authenticateToken, jobPostingControllers.getJobApplications);

module.exports = router;





