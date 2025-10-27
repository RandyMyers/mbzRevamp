const JobPosting = require('../models/JobPosting');
const Applicant = require('../models/Applicant');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Comment = require('../models/Comment');
const HRFileUploadService = require('../services/hrFileUploadService');

/**
 * @swagger
 * /api/admin/recruitment/job-postings:
 *   get:
 *     summary: List all job postings
 *     tags: [Admin Recruitment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Open, Closed]
 *         description: Filter by job posting status
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       200:
 *         description: List of job postings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JobPosting'
 */
exports.listJobPostings = async (req, res, next) => {
  try {
    const { status, department, search, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const jobPostings = await JobPosting.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('applicants', 'name email status appliedDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await JobPosting.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobPostings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error('Error listing job postings:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job postings',
      message: `Failed to retrieve job postings: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/recruitment/job-postings:
 *   post:
 *     summary: Create a new job posting
 *     tags: [Admin Recruitment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - department
 *               - location
 *               - type
 *               - description
 *               - deadline
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Senior Frontend Developer"
 *               department:
 *                 type: string
 *                 example: "Engineering"
 *               location:
 *                 type: string
 *                 enum: [Remote, Hybrid, On-site]
 *                 example: "Remote"
 *               type:
 *                 type: string
 *                 enum: [Full-time, Part-time, Contract, Internship]
 *                 example: "Full-time"
 *               description:
 *                 type: string
 *                 example: "We are looking for a senior frontend developer..."
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               responsibilities:
 *                 type: array
 *                 items:
 *                   type: string
 *               salaryRange:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: number
 *                   max:
 *                     type: number
 *                   currency:
 *                     type: string
 *               deadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Job posting created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
exports.createJobPosting = async (req, res, next) => {
  try {
    const {
      title,
      department,
      location,
      type,
      description,
      requirements = [],
      responsibilities = [],
      salaryRange,
      deadline,
      tags = [],
      experienceLevel = 'Mid Level',
      workSchedule = 'Full-time'
    } = req.body;

    // Validate required fields
    if (!title || !department || !location || !type || !description || !deadline) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Title, department, location, type, description, and deadline are required'
      });
    }

    // Validate deadline is in the future
    if (new Date(deadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deadline',
        message: 'Deadline must be in the future'
      });
    }

    const jobPosting = await JobPosting.create({
      title,
      department,
      location,
      type,
      description,
      requirements,
      responsibilities,
      salaryRange,
      deadline,
      tags,
      experienceLevel,
      workSchedule,
      createdBy: req.user.id,
      status: 'Draft'
    });

    res.status(201).json({
      success: true,
      data: jobPosting,
      message: 'Job posting created successfully'
    });
  } catch (err) {
    console.error('Error creating job posting:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create job posting',
      message: `Failed to create the job posting: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/recruitment/job-postings/{id}:
 *   get:
 *     summary: Get job posting by ID
 *     tags: [Admin Recruitment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job posting details
 *       404:
 *         description: Job posting not found
 */
exports.getJobPostingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const jobPosting = await JobPosting.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate({
        path: 'applicants',
        populate: {
          path: 'notes',
          populate: {
            path: 'authorId',
            select: 'firstName lastName'
          }
        }
      });

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        error: 'Job posting not found',
        message: 'The requested job posting does not exist'
      });
    }

    res.status(200).json({
      success: true,
      data: jobPosting
    });
  } catch (err) {
    console.error('Error fetching job posting:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid job posting ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job posting',
      message: `Failed to retrieve the job posting: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/recruitment/job-postings/{id}:
 *   put:
 *     summary: Update job posting
 *     tags: [Admin Recruitment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Draft, Open, Closed]
 *     responses:
 *       200:
 *         description: Job posting updated successfully
 *       404:
 *         description: Job posting not found
 */
exports.updateJobPosting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const jobPosting = await JobPosting.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        error: 'Job posting not found',
        message: 'The requested job posting does not exist'
      });
    }

    res.status(200).json({
      success: true,
      data: jobPosting,
      message: 'Job posting updated successfully'
    });
  } catch (err) {
    console.error('Error updating job posting:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid job posting ID format'
      });
    }
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update job posting',
      message: `Failed to update the job posting: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/recruitment/job-postings/{id}:
 *   delete:
 *     summary: Delete job posting
 *     tags: [Admin Recruitment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job posting deleted successfully
 *       404:
 *         description: Job posting not found
 */
exports.deleteJobPosting = async (req, res, next) => {
  try {
    const { id } = req.params;

    const jobPosting = await JobPosting.findByIdAndDelete(id);

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        error: 'Job posting not found',
        message: 'The requested job posting does not exist'
      });
    }

    // Also delete associated applicants
    await Applicant.deleteMany({ jobId: id });

    res.status(200).json({
      success: true,
      message: 'Job posting and associated applicants deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting job posting:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid job posting ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete job posting',
      message: `Failed to delete the job posting: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/recruitment/applicants:
 *   get:
 *     summary: List applicants
 *     tags: [Admin Recruitment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *         description: Filter by job posting ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Under Review, Interview Scheduled, Offered, Hired, Rejected]
 *         description: Filter by applicant status
 *     responses:
 *       200:
 *         description: List of applicants
 */
exports.listApplicants = async (req, res, next) => {
  try {
    const { jobId, status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (jobId) query.jobId = jobId;
    if (status) query.status = status;

    const applicants = await Applicant.find(query)
      .populate('jobId', 'title department')
      .populate('notes', 'text timestamp authorId')
      .sort({ appliedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Applicant.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applicants,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error('Error listing applicants:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applicants',
      message: `Failed to retrieve applicants: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/recruitment/applicants/{id}/status:
 *   patch:
 *     summary: Update applicant status
 *     tags: [Admin Recruitment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Under Review, Interview Scheduled, Offered, Hired, Rejected]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Applicant status updated successfully
 */
exports.updateApplicantStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'Status is required'
      });
    }

    const applicant = await Applicant.findById(id);
    if (!applicant) {
      return res.status(404).json({
        success: false,
        error: 'Applicant not found',
        message: 'The requested applicant does not exist'
      });
    }

    await applicant.updateStatus(status, req.user.id, reason);

    res.status(200).json({
      success: true,
      data: applicant,
      message: 'Applicant status updated successfully'
    });
  } catch (err) {
    console.error('Error updating applicant status:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid applicant ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update applicant status',
      message: `Failed to update the applicant status: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/recruitment/applicants/{id}/interview:
 *   post:
 *     summary: Schedule interview for applicant
 *     tags: [Admin Recruitment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduledDate
 *               - interviewType
 *             properties:
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               interviewType:
 *                 type: string
 *                 enum: [Phone, Video, In-Person, Technical]
 *               interviewer:
 *                 type: string
 *               location:
 *                 type: string
 *               meetingLink:
 *                 type: string
 *     responses:
 *       200:
 *         description: Interview scheduled successfully
 */
exports.scheduleInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const interviewData = req.body;

    const applicant = await Applicant.findById(id);
    if (!applicant) {
      return res.status(404).json({
        success: false,
        error: 'Applicant not found',
        message: 'The requested applicant does not exist'
      });
    }

    await applicant.scheduleInterview(interviewData);

    res.status(200).json({
      success: true,
      data: applicant,
      message: 'Interview scheduled successfully'
    });
  } catch (err) {
    console.error('Error scheduling interview:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid applicant ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to schedule interview',
      message: `Failed to schedule the interview: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/recruitment/applicants/{id}/offer:
 *   post:
 *     summary: Make offer to applicant
 *     tags: [Admin Recruitment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - salary
 *               - startDate
 *             properties:
 *               salary:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               responseDeadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Offer made successfully
 */
exports.makeOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const offerData = req.body;

    const applicant = await Applicant.findById(id);
    if (!applicant) {
      return res.status(404).json({
        success: false,
        error: 'Applicant not found',
        message: 'The requested applicant does not exist'
      });
    }

    await applicant.makeOffer(offerData);

    res.status(200).json({
      success: true,
      data: applicant,
      message: 'Offer made successfully'
    });
  } catch (err) {
    console.error('Error making offer:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid applicant ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to make offer',
      message: 'An error occurred while making the offer. Please try again.'
    });
  }
};

/**
 * @swagger
 * /api/admin/recruitment/applicants:
 *   post:
 *     summary: Create new applicant with resume upload
 *     tags: [Admin Recruitment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - name
 *               - email
 *               - phone
 *               - resume
 *             properties:
 *               jobId:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               resume:
 *                 type: string
 *                 format: binary
 *               coverLetter:
 *                 type: string
 *     responses:
 *       201:
 *         description: Applicant created successfully
 */
exports.createApplicant = async (req, res, next) => {
  try {
    const { jobId, name, email, phone, coverLetter } = req.body;

    // Validate required fields
    if (!jobId || !name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Job ID, name, email, and phone are required'
      });
    }

    // Check if file is uploaded
    if (!req.files || !req.files.resume) {
      return res.status(400).json({
        success: false,
        error: 'No resume uploaded',
        message: 'Please upload a resume file'
      });
    }

    // Check if job posting exists
    const jobPosting = await JobPosting.findById(jobId);
    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        error: 'Job posting not found',
        message: 'The specified job posting does not exist'
      });
    }

    // Check if applicant already exists for this job
    const existingApplicant = await Applicant.findOne({ jobId, email });
    if (existingApplicant) {
      return res.status(409).json({
        success: false,
        error: 'Already applied',
        message: 'You have already applied for this position'
      });
    }

    // Upload resume to Cloudinary
    let resumeUrl;
    try {
      const uploadResult = await HRFileUploadService.uploadResume(req.files.resume, `temp_${Date.now()}`);
      resumeUrl = uploadResult.url;
    } catch (uploadError) {
      return res.status(400).json({
        success: false,
        error: 'Resume upload failed',
        message: uploadError.message
      });
    }

    // Create applicant
    const applicant = await Applicant.create({
      jobId,
      name,
      email,
      phone,
      resume: resumeUrl,
      coverLetter,
      status: 'Under Review'
    });

    // Add applicant to job posting
    jobPosting.applicants.push(applicant._id);
    await jobPosting.save();

    res.status(201).json({
      success: true,
      data: applicant,
      message: 'Application submitted successfully'
    });
  } catch (err) {
    console.error('Error creating applicant:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create applicant',
      message: `Failed to create the applicant: ${err.message}`
    });
  }
};
