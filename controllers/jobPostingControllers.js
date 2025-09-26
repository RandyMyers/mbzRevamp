const JobPosting = require('../models/JobPosting');
const User = require('../models/users');
const Organization = require('../models/organization');

/**
 * @swagger
 * components:
 *   schemas:
 *     JobPosting:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         organizationId:
 *           type: string
 *         title:
 *           type: string
 *         department:
 *           type: string
 *         location:
 *           type: string
 *         employmentType:
 *           type: string
 *           enum: [full_time, part_time, contract, internship, temporary]
 *         experienceLevel:
 *           type: string
 *           enum: [entry, mid, senior, executive]
 *         description:
 *           type: string
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *         responsibilities:
 *           type: array
 *           items:
 *             type: string
 *         benefits:
 *           type: array
 *           items:
 *             type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         salaryRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *             currency:
 *               type: string
 *         status:
 *           type: string
 *           enum: [draft, published, closed, cancelled]
 *         publishedBy:
 *           type: string
 *         publishedAt:
 *           type: string
 *           format: date-time
 *         applicationDeadline:
 *           type: string
 *           format: date
 *         startDate:
 *           type: string
 *           format: date
 *         applicationCount:
 *           type: number
 *         viewCount:
 *           type: number
 *         isRemote:
 *           type: boolean
 *         isUrgent:
 *           type: boolean
 *         tags:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/job-postings:
 *   post:
 *     summary: Create job posting
 *     tags: [Job Postings]
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
 *               - employmentType
 *               - experienceLevel
 *               - description
 *               - requirements
 *               - responsibilities
 *             properties:
 *               title:
 *                 type: string
 *               department:
 *                 type: string
 *               location:
 *                 type: string
 *               employmentType:
 *                 type: string
 *                 enum: [full_time, part_time, contract, internship, temporary]
 *               experienceLevel:
 *                 type: string
 *                 enum: [entry, mid, senior, executive]
 *               description:
 *                 type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               responsibilities:
 *                 type: array
 *                 items:
 *                   type: string
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               skills:
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
 *                     default: NGN
 *               status:
 *                 type: string
 *                 enum: [draft, published, closed, cancelled]
 *                 default: draft
 *               applicationDeadline:
 *                 type: string
 *                 format: date
 *               startDate:
 *                 type: string
 *                 format: date
 *               isRemote:
 *                 type: boolean
 *                 default: false
 *               isUrgent:
 *                 type: boolean
 *                 default: false
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Job posting created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/JobPosting'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
const createJobPosting = async (req, res) => {
  try {
    const {
      title,
      department,
      location,
      employmentType,
      experienceLevel,
      description,
      requirements,
      responsibilities,
      benefits = [],
      skills = [],
      salaryRange = {},
      status = 'draft',
      applicationDeadline,
      startDate,
      isRemote = false,
      isUrgent = false,
      tags = []
    } = req.body;

    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const jobPosting = new JobPosting({
      organizationId,
      title,
      department,
      location,
      employmentType,
      experienceLevel,
      description,
      requirements,
      responsibilities,
      benefits,
      skills,
      salaryRange: {
        ...salaryRange,
        currency: salaryRange.currency || 'NGN'
      },
      status,
      applicationDeadline,
      startDate,
      isRemote,
      isUrgent,
      tags,
      publishedBy: userId
    });

    await jobPosting.save();
    await jobPosting.populate('publishedBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: jobPosting
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/job-postings:
 *   get:
 *     summary: Get job postings
 *     tags: [Job Postings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, closed, cancelled]
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: employmentType
 *         schema:
 *           type: string
 *       - in: query
 *         name: experienceLevel
 *         schema:
 *           type: string
 *       - in: query
 *         name: isRemote
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isUrgent
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Job postings retrieved successfully
 */
const getJobPostings = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      status,
      department,
      employmentType,
      experienceLevel,
      isRemote,
      isUrgent,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const query = { organizationId };

    if (status) query.status = status;
    if (department) query.department = department;
    if (employmentType) query.employmentType = employmentType;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (isRemote !== undefined) query.isRemote = isRemote === 'true';
    if (isUrgent !== undefined) query.isUrgent = isUrgent === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const jobPostings = await JobPosting.find(query)
      .populate('publishedBy', 'firstName lastName email')
      .sort({ isUrgent: -1, publishedAt: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await JobPosting.countDocuments(query);

    res.json({
      success: true,
      data: jobPostings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/job-postings/{id}:
 *   get:
 *     summary: Get job posting by ID
 *     tags: [Job Postings]
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
 *         description: Job posting retrieved successfully
 *       404:
 *         description: Job posting not found
 */
const getJobPostingById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const jobPosting = await JobPosting.findOne({
      _id: id,
      organizationId
    })
      .populate('publishedBy', 'firstName lastName email');

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Increment view count
    jobPosting.viewCount += 1;
    await jobPosting.save();

    res.json({
      success: true,
      data: jobPosting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/job-postings/{id}:
 *   put:
 *     summary: Update job posting
 *     tags: [Job Postings]
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
 *               department:
 *                 type: string
 *               location:
 *                 type: string
 *               employmentType:
 *                 type: string
 *               experienceLevel:
 *                 type: string
 *               description:
 *                 type: string
 *               requirements:
 *                 type: array
 *               responsibilities:
 *                 type: array
 *               benefits:
 *                 type: array
 *               skills:
 *                 type: array
 *               salaryRange:
 *                 type: object
 *               status:
 *                 type: string
 *               applicationDeadline:
 *                 type: string
 *               startDate:
 *                 type: string
 *               isRemote:
 *                 type: boolean
 *               isUrgent:
 *                 type: boolean
 *               tags:
 *                 type: array
 *     responses:
 *       200:
 *         description: Job posting updated successfully
 *       404:
 *         description: Job posting not found
 *       403:
 *         description: Access denied
 */
const updateJobPosting = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const updateData = req.body;

    const jobPosting = await JobPosting.findOne({
      _id: id,
      organizationId
    });

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // If publishing, set publishedAt
    if (updateData.status === 'published' && jobPosting.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    Object.assign(jobPosting, updateData);
    await jobPosting.save();
    await jobPosting.populate('publishedBy', 'firstName lastName email');

    res.json({
      success: true,
      data: jobPosting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/job-postings/{id}:
 *   delete:
 *     summary: Delete job posting
 *     tags: [Job Postings]
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
 *       403:
 *         description: Access denied
 */
const deleteJobPosting = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const jobPosting = await JobPosting.findOneAndDelete({
      _id: id,
      organizationId
    });

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    res.json({
      success: true,
      message: 'Job posting deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/job-postings/{id}/publish:
 *   post:
 *     summary: Publish job posting
 *     tags: [Job Postings]
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
 *         description: Job posting published successfully
 *       404:
 *         description: Job posting not found
 *       403:
 *         description: Access denied
 */
const publishJobPosting = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const jobPosting = await JobPosting.findOne({
      _id: id,
      organizationId
    });

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    jobPosting.status = 'published';
    jobPosting.publishedAt = new Date();
    await jobPosting.save();
    await jobPosting.populate('publishedBy', 'firstName lastName email');

    res.json({
      success: true,
      data: jobPosting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/job-postings/{id}/close:
 *   post:
 *     summary: Close job posting
 *     tags: [Job Postings]
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
 *         description: Job posting closed successfully
 *       404:
 *         description: Job posting not found
 *       403:
 *         description: Access denied
 */
const closeJobPosting = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const jobPosting = await JobPosting.findOne({
      _id: id,
      organizationId
    });

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    jobPosting.status = 'closed';
    await jobPosting.save();

    res.json({
      success: true,
      data: jobPosting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/job-postings/{id}/apply:
 *   post:
 *     summary: Apply for job posting
 *     tags: [Job Postings]
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
 *               coverLetter:
 *                 type: string
 *               resume:
 *                 type: object
 *                 properties:
 *                   filename:
 *                     type: string
 *                   originalName:
 *                     type: string
 *                   url:
 *                     type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application submitted successfully
 *       404:
 *         description: Job posting not found
 *       400:
 *         description: Application deadline passed or job not published
 */
const applyForJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { coverLetter, resume, notes } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const jobPosting = await JobPosting.findOne({
      _id: id,
      organizationId
    });

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    if (jobPosting.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Job posting is not published'
      });
    }

    if (jobPosting.applicationDeadline && new Date() > new Date(jobPosting.applicationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed'
      });
    }

    // Check if user already applied
    const existingApplication = jobPosting.applications.find(
      app => app.candidateId.toString() === userId
    );

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    jobPosting.applications.push({
      candidateId: userId,
      appliedAt: new Date(),
      coverLetter,
      resume,
      notes
    });

    jobPosting.applicationCount += 1;
    await jobPosting.save();

    res.json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/job-postings/{id}/applications:
 *   get:
 *     summary: Get job posting applications
 *     tags: [Job Postings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [applied, reviewed, shortlisted, interviewed, rejected, hired]
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 *       404:
 *         description: Job posting not found
 *       403:
 *         description: Access denied
 */
const getJobApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    const organizationId = req.user.organizationId;

    const jobPosting = await JobPosting.findOne({
      _id: id,
      organizationId
    }).populate('applications.candidateId', 'firstName lastName email phone');

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    let applications = jobPosting.applications;
    if (status) {
      applications = applications.filter(app => app.status === status);
    }

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createJobPosting,
  getJobPostings,
  getJobPostingById,
  updateJobPosting,
  deleteJobPosting,
  publishJobPosting,
  closeJobPosting,
  applyForJob,
  getJobApplications
};





