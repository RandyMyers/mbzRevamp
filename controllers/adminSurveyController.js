const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');
const User = require('../models/users');
const Organization = require('../models/organization');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Surveys
 *     description: Manage staff surveys
 */

/**
 * @swagger
 * /api/admin/hr/surveys:
 *   get:
 *     summary: List surveys
 *     tags: [Admin Surveys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
exports.listSurveys = async (req, res, next) => {
  try {
    const items = await Survey.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, surveys: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/surveys:
 *   post:
 *     summary: Create survey
 *     tags: [Admin Surveys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string }
 *               dueDate: { type: string, format: date-time }
 *               questions: { type: array }
 *               recipients: { type: array }
 *     responses:
 *       201: { description: Created }
 */
exports.createSurvey = async (req, res, next) => {
  try {
    if (!req.body.title) throw new BadRequestError('title required');
    const doc = await Survey.create(req.body);
    res.status(201).json({ success: true, survey: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/surveys/{id}:
 *   patch:
 *     summary: Update a survey
 *     tags: [Admin Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: Updated }
 */
exports.updateSurvey = async (req, res, next) => {
  try {
    const doc = await Survey.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) throw new NotFoundError('survey not found');
    res.status(200).json({ success: true, survey: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/surveys/{id}/publish:
 *   post:
 *     summary: Publish a survey
 *     tags: [Admin Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Published }
 */
exports.publishSurvey = async (req, res, next) => {
  try {
    const doc = await Survey.findById(req.params.id);
    if (!doc) throw new NotFoundError('survey not found');
    doc.status = 'published';
    await doc.save();
    res.status(200).json({ success: true, survey: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/surveys/{id}/responses:
 *   get:
 *     summary: Get survey responses with user details (Super Admin)
 *     tags: [Admin Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: organizationId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by organization ID
 *     responses:
 *       200:
 *         description: Survey responses with user details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 responses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         format: ObjectId
 *                       surveyId:
 *                         type: string
 *                         format: ObjectId
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             format: ObjectId
 *                           fullName:
 *                             type: string
 *                           email:
 *                             type: string
 *                       organizationId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             format: ObjectId
 *                           name:
 *                             type: string
 *                       isAnonymous:
 *                         type: boolean
 *                       responses:
 *                         type: array
 *                       status:
 *                         type: string
 *                       submittedAt:
 *                         type: string
 *                         format: date-time
 *                       timeSpent:
 *                         type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalResponses:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       404:
 *         description: Survey not found
 *       500:
 *         description: Server error
 */
exports.getSurveyResponses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, organizationId } = req.query;
    
    // Check if survey exists
    const survey = await Survey.findById(id);
    if (!survey) {
      throw new NotFoundError('Survey not found');
    }

    // Build query filter
    const filter = { surveyId: id };
    if (organizationId) {
      filter.organizationId = organizationId;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Get responses with user and organization details
    const responses = await SurveyResponse.find(filter)
      .populate('userId', 'fullName email role department')
      .populate('organizationId', 'name organizationCode')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const totalResponses = await SurveyResponse.countDocuments(filter);
    const totalPages = Math.ceil(totalResponses / limitNum);

    // Calculate response statistics
    const stats = {
      totalResponses,
      completedResponses: await SurveyResponse.countDocuments({ ...filter, status: 'completed' }),
      anonymousResponses: await SurveyResponse.countDocuments({ ...filter, isAnonymous: true }),
      averageTimeSpent: 0
    };

    // Calculate average time spent
    const timeSpentData = await SurveyResponse.aggregate([
      { $match: filter },
      { $group: { _id: null, avgTime: { $avg: '$timeSpent' } } }
    ]);
    
    if (timeSpentData.length > 0) {
      stats.averageTimeSpent = Math.round(timeSpentData[0].avgTime || 0);
    }

    res.status(200).json({
      success: true,
      responses,
      stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalResponses,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: limitNum
      }
    });

  } catch (err) { 
    next(err); 
  }
};

/**
 * @swagger
 * /api/admin/hr/surveys/{id}/responses/export:
 *   get:
 *     summary: Export survey responses to CSV (Super Admin)
 *     tags: [Admin Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey ID
 *       - in: query
 *         name: organizationId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by organization ID
 *     responses:
 *       200:
 *         description: CSV file with survey responses
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       404:
 *         description: Survey not found
 *       500:
 *         description: Server error
 */
exports.exportSurveyResponses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;
    
    // Check if survey exists
    const survey = await Survey.findById(id);
    if (!survey) {
      throw new NotFoundError('Survey not found');
    }

    // Build query filter
    const filter = { surveyId: id };
    if (organizationId) {
      filter.organizationId = organizationId;
    }

    // Get all responses with user and organization details
    const responses = await SurveyResponse.find(filter)
      .populate('userId', 'fullName email role department')
      .populate('organizationId', 'name organizationCode')
      .sort({ submittedAt: -1 });

    // Create CSV content
    let csvContent = 'Response ID,User Name,User Email,Organization,Department,Role,Submitted At,Time Spent (seconds),Status,Anonymous\n';
    
    responses.forEach(response => {
      const userName = response.userId ? response.userId.fullName : 'Anonymous';
      const userEmail = response.userId ? response.userId.email : 'N/A';
      const organization = response.organizationId ? response.organizationId.name : 'N/A';
      const department = response.userId ? (response.userId.department || 'N/A') : 'N/A';
      const role = response.userId ? (response.userId.role || 'N/A') : 'N/A';
      const submittedAt = response.submittedAt ? new Date(response.submittedAt).toISOString() : 'N/A';
      const timeSpent = response.timeSpent || 0;
      const status = response.status || 'N/A';
      const isAnonymous = response.isAnonymous ? 'Yes' : 'No';

      csvContent += `${response._id},${userName},${userEmail},${organization},${department},${role},${submittedAt},${timeSpent},${status},${isAnonymous}\n`;
    });

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="survey-${id}-responses-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.status(200).send(csvContent);

  } catch (err) { 
    next(err); 
  }
};

















