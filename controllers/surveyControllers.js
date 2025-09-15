const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');
const Organization = require('../models/organization');
const { createAuditLog } = require('../helpers/auditLogHelper');
const { sendNotificationToAdmins } = require('../helpers/notificationHelper');

/**
 * @swagger
 * components:
 *   schemas:
 *     Survey:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - organizationId
 *         - createdBy
 *         - questions
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique survey ID
 *         title:
 *           type: string
 *           description: Survey title
 *         description:
 *           type: string
 *           description: Survey description
 *         organizationId:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID
 *         createdBy:
 *           type: string
 *           format: ObjectId
 *           description: User who created the survey
 *         questions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [text, rating, multiple-choice, single-choice, boolean]
 *               question:
 *                 type: string
 *               description:
 *                 type: string
 *               required:
 *                 type: boolean
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: string
 *                     label:
 *                       type: string
 *               order:
 *                 type: number
 *         status:
 *           type: string
 *           enum: [draft, active, paused, completed, archived]
 *           default: draft
 *         estimatedTime:
 *           type: string
 *           description: Estimated completion time
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         dueDate:
 *           type: string
 *           format: date-time
 *         totalResponses:
 *           type: number
 *           default: 0
 *         completedResponses:
 *           type: number
 *           default: 0
 *         averageCompletionTime:
 *           type: number
 *           default: 0
 *         allowAnonymous:
 *           type: boolean
 *           default: false
 *         allowMultipleResponses:
 *           type: boolean
 *           default: false
 *         showProgress:
 *           type: boolean
 *           default: true
 *         showResults:
 *           type: boolean
 *           default: false
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         category:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/surveys/create:
 *   post:
 *     summary: Create new survey
 *     tags: [Surveys]
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
 *               - description
 *               - questions
 *             properties:
 *               title:
 *                 type: string
 *                 description: Survey title
 *                 example: "User Experience Survey"
 *               description:
 *                 type: string
 *                 description: Survey description
 *                 example: "Help us improve our platform"
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     type:
 *                       type: string
 *                       enum: [text, rating, multiple-choice, single-choice, boolean]
 *                     question:
 *                       type: string
 *                     description:
 *                       type: string
 *                     required:
 *                       type: boolean
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             type: string
 *                     order:
 *                       type: number
 *               estimatedTime:
 *                 type: string
 *                 example: "5 minutes"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               targetRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *               allowAnonymous:
 *                 type: boolean
 *                 default: false
 *               allowMultipleResponses:
 *                 type: boolean
 *                 default: false
 *               showProgress:
 *                 type: boolean
 *                 default: true
 *               showResults:
 *                 type: boolean
 *                 default: false
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Survey created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// CREATE new survey
exports.createSurvey = async (req, res) => {
  try {
    const userId = req.user?._id;
    const organizationId = req.user?.organization;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const {
      title,
      description,
      questions,
      estimatedTime,
      startDate,
      endDate,
      dueDate,
      targetRoles,
      allowAnonymous,
      allowMultipleResponses,
      showProgress,
      showResults,
      tags,
      category
    } = req.body;

    // Validate required fields
    const requiredFields = ['title', 'description', 'questions'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Create new survey
    const newSurvey = new Survey({
      title,
      description,
      organizationId,
      createdBy: userId,
      questions,
      estimatedTime,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      targetRoles: targetRoles || [],
      allowAnonymous: allowAnonymous || false,
      allowMultipleResponses: allowMultipleResponses || false,
      showProgress: showProgress !== false,
      showResults: showResults || false,
      tags: tags || [],
      category: category || 'general',
      status: 'draft'
    });

    const savedSurvey = await newSurvey.save();

    // Create audit log
    await createAuditLog({
      action: 'SURVEY_CREATED',
      user: userId,
      resource: 'Survey',
      resourceId: savedSurvey._id,
      details: {
        title: savedSurvey.title,
        questionCount: savedSurvey.questions.length
      },
      organization: organizationId
    });

    res.status(201).json({
      success: true,
      message: 'Survey created successfully',
      survey: savedSurvey
    });

  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating survey',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/surveys/list:
 *   get:
 *     summary: Get all surveys with filters
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [draft, active, paused, completed, archived]
 *         description: Filter by survey status
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by survey category
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of surveys per page
 *     responses:
 *       200:
 *         description: Surveys retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// GET all surveys with filters
exports.getSurveys = async (req, res) => {
  try {
    const {
      organizationId,
      status,
      category,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { organizationId };
    
    if (status) filter.status = status;
    if (category) filter.category = category;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const surveys = await Survey.find(filter)
      .populate('createdBy', 'fullName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Survey.countDocuments(filter);

    res.status(200).json({
      success: true,
      surveys,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching surveys',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/surveys/{id}:
 *   get:
 *     summary: Get single survey by ID
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Survey ID
 *     responses:
 *       200:
 *         description: Survey retrieved successfully
 *       404:
 *         description: Survey not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// GET single survey by ID
exports.getSurveyById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organization;

    const survey = await Survey.findOne({ _id: id, organizationId })
      .populate('createdBy', 'fullName email')
      .populate('targetUsers', 'fullName email');

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    res.status(200).json({
      success: true,
      survey
    });

  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching survey',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/surveys/{id}:
 *   put:
 *     summary: Update survey
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Survey ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               questions:
 *                 type: array
 *               status:
 *                 type: string
 *                 enum: [draft, active, paused, completed, archived]
 *               estimatedTime:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Survey updated successfully
 *       404:
 *         description: Survey not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// UPDATE survey
exports.updateSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const organizationId = req.user?.organization;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const updateData = { ...req.body, updatedBy: userId };

    const survey = await Survey.findOneAndUpdate(
      { _id: id, organizationId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Create audit log
    await createAuditLog({
      action: 'SURVEY_UPDATED',
      user: userId,
      resource: 'Survey',
      resourceId: survey._id,
      details: {
        title: survey.title,
        changes: req.body
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Survey updated successfully',
      survey
    });

  } catch (error) {
    console.error('Error updating survey:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating survey',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/surveys/{id}:
 *   delete:
 *     summary: Delete survey
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Survey ID
 *     responses:
 *       200:
 *         description: Survey deleted successfully
 *       404:
 *         description: Survey not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// DELETE survey
exports.deleteSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const organizationId = req.user?.organization;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const survey = await Survey.findOne({ _id: id, organizationId });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Delete associated survey responses
    await SurveyResponse.deleteMany({ surveyId: id });

    // Delete the survey
    await Survey.findByIdAndDelete(id);

    // Create audit log
    await createAuditLog({
      action: 'SURVEY_DELETED',
      user: userId,
      resource: 'Survey',
      resourceId: id,
      details: {
        title: survey.title
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Survey deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting survey',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/surveys/{id}/publish:
 *   post:
 *     summary: Publish survey (change status to active)
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Survey ID
 *     responses:
 *       200:
 *         description: Survey published successfully
 *       404:
 *         description: Survey not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// PUBLISH survey
exports.publishSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const organizationId = req.user?.organization;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const survey = await Survey.findOneAndUpdate(
      { _id: id, organizationId },
      { status: 'active', updatedBy: userId },
      { new: true }
    );

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Create audit log
    await createAuditLog({
      action: 'SURVEY_PUBLISHED',
      user: userId,
      resource: 'Survey',
      resourceId: survey._id,
      details: {
        title: survey.title
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Survey published successfully',
      survey
    });

  } catch (error) {
    console.error('Error publishing survey:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing survey',
      error: error.message
    });
  }
};

// ==================== SURVEY RESPONSE CRUD OPERATIONS ====================

/**
 * @swagger
 * /api/surveys/{id}/responses/submit:
 *   post:
 *     summary: Submit survey response
 *     tags: [Survey Responses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Survey ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - responses
 *             properties:
 *               responses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: number
 *                     answer:
 *                       type: string
 *                     rating:
 *                       type: number
 *                     selectedOptions:
 *                       type: array
 *                       items:
 *                         type: string
 *               isAnonymous:
 *                 type: boolean
 *                 default: false
 *               completionTime:
 *                 type: number
 *                 description: Time taken to complete in minutes
 *     responses:
 *       201:
 *         description: Survey response submitted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// SUBMIT survey response
exports.submitSurveyResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const organizationId = req.user?.organization;
    const { responses, isAnonymous, completionTime } = req.body;

    if (!userId && !isAnonymous) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if survey exists and is active
    const survey = await Survey.findOne({ _id: id, organizationId });
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    if (survey.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Survey is not active'
      });
    }

    // Check if user already responded (if not allowing multiple responses)
    if (!survey.allowMultipleResponses && userId) {
      const existingResponse = await SurveyResponse.findOne({
        surveyId: id,
        userId: userId
      });

      if (existingResponse) {
        return res.status(400).json({
          success: false,
          message: 'You have already responded to this survey'
        });
      }
    }

    // Create survey response
    const newResponse = new SurveyResponse({
      surveyId: id,
      userId: isAnonymous ? null : userId,
      organizationId,
      responses,
      isAnonymous: isAnonymous || false,
      completionTime: completionTime || 0,
      status: 'completed',
      submittedAt: new Date()
    });

    const savedResponse = await newResponse.save();

    // Update survey statistics
    survey.totalResponses += 1;
    survey.completedResponses += 1;
    if (completionTime) {
      survey.averageCompletionTime = 
        ((survey.averageCompletionTime * (survey.completedResponses - 1)) + completionTime) / survey.completedResponses;
    }
    await survey.save();

    // Create audit log
    if (userId) {
      await createAuditLog({
        action: 'SURVEY_RESPONSE_SUBMITTED',
        user: userId,
        resource: 'SurveyResponse',
        resourceId: savedResponse._id,
        details: {
          surveyId: id,
          responseCount: responses.length
        },
        organization: organizationId
      });
    }

    res.status(201).json({
      success: true,
      message: 'Survey response submitted successfully',
      response: savedResponse
    });

  } catch (error) {
    console.error('Error submitting survey response:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting survey response',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/surveys/{id}/responses:
 *   get:
 *     summary: Get all responses for a survey
 *     tags: [Survey Responses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Survey ID
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of responses per page
 *     responses:
 *       200:
 *         description: Survey responses retrieved successfully
 *       404:
 *         description: Survey not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// GET survey responses
exports.getSurveyResponses = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const organizationId = req.user?.organization;

    // Check if survey exists
    const survey = await Survey.findOne({ _id: id, organizationId });
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get responses
    const responses = await SurveyResponse.find({ surveyId: id, organizationId })
      .populate('userId', 'fullName email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SurveyResponse.countDocuments({ surveyId: id, organizationId });

    res.status(200).json({
      success: true,
      responses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching survey responses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching survey responses',
      error: error.message
    });
  }
};



