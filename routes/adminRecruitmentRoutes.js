const express = require('express');
const router = express.Router();
const adminRecruitmentController = require('../controllers/adminRecruitmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication and authorization to all routes
router.use(protect);
router.use(restrictTo('admin', 'hr'));

/**
 * @swagger
 * tags:
 *   name: Admin Recruitment
 *   description: Job posting and applicant management for super admin
 */

// Job Posting Routes
router.get('/job-postings', adminRecruitmentController.listJobPostings);
router.post('/job-postings', adminRecruitmentController.createJobPosting);
router.get('/job-postings/:id', adminRecruitmentController.getJobPostingById);
router.put('/job-postings/:id', adminRecruitmentController.updateJobPosting);
router.delete('/job-postings/:id', adminRecruitmentController.deleteJobPosting);

// Applicant Routes
router.get('/applicants', adminRecruitmentController.listApplicants);
router.patch('/applicants/:id/status', adminRecruitmentController.updateApplicantStatus);
router.post('/applicants/:id/interview', adminRecruitmentController.scheduleInterview);
router.post('/applicants/:id/offer', adminRecruitmentController.makeOffer);

module.exports = router;
