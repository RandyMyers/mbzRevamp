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
router.post('/', authenticateToken, jobPostingControllers.createJobPosting);
router.get('/', authenticateToken, jobPostingControllers.getJobPostings);
router.get('/:id', authenticateToken, jobPostingControllers.getJobPostingById);
router.put('/:id', authenticateToken, jobPostingControllers.updateJobPosting);
router.delete('/:id', authenticateToken, jobPostingControllers.deleteJobPosting);
router.post('/:id/publish', authenticateToken, jobPostingControllers.publishJobPosting);
router.post('/:id/close', authenticateToken, jobPostingControllers.closeJobPosting);
router.post('/:id/apply', authenticateToken, jobPostingControllers.applyForJob);
router.get('/:id/applications', authenticateToken, jobPostingControllers.getJobApplications);

module.exports = router;





