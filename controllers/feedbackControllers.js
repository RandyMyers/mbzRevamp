const Feedback = require('../models/Feedback');
const FeedbackResponse = require('../models/FeedbackResponse');
const Suggestion = require('../models/Suggestion');
const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');
const Organization = require('../models/organization');
const { createAuditLog } = require('../helpers/auditLogHelper');
const { sendNotificationToAdmins } = require('../helpers/notificationHelper');

/**
 * @swagger
 * components:
 *   schemas:
 *     Feedback:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - rating
 *         - userId
 *         - organizationId
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique feedback ID
 *         title:
 *           type: string
 *           description: Feedback title
 *         description:
 *           type: string
 *           description: Feedback description
 *         category:
 *           type: string
 *           default: general
 *           description: Feedback category
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1 to 5
 *         userId:
 *           type: string
 *           format: ObjectId
 *           description: User ID who submitted feedback
 *         organizationId:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Feedback tags
 *         userAgent:
 *           type: string
 *           description: User agent string
 *         ipAddress:
 *           type: string
 *           description: IP address
 *         browser:
 *           type: string
 *           description: Browser information
 *         device:
 *           type: string
 *           description: Device information
 *         status:
 *           type: string
 *           enum: [pending, reviewed, resolved, closed]
 *           description: Feedback status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Feedback creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Feedback last update timestamp
 */

/**
 * @swagger
 * /api/feedback/create:
 *   post:
 *     summary: Create new feedback
 *     tags: [Feedback]
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
 *               - rating
 *               - userId
 *               - organizationId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Feedback title
 *                 example: "Great user experience"
 *               description:
 *                 type: string
 *                 description: Feedback description
 *                 example: "The platform is very intuitive and easy to use"
 *               category:
 *                 type: string
 *                 default: general
 *                 description: Feedback category
 *                 example: "user_experience"
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *                 example: 5
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID who submitted feedback
 *                 example: "507f1f77bcf86cd799439011"
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Feedback tags
 *                 example: ["ui", "usability"]
 *               userAgent:
 *                 type: string
 *                 description: User agent string
 *               ipAddress:
 *                 type: string
 *                 description: IP address
 *               browser:
 *                 type: string
 *                 description: Browser information
 *               device:
 *                 type: string
 *                 description: Device information
 *     responses:
 *       201:
 *         description: Feedback created successfully
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
 *                   example: "Feedback submitted successfully"
 *                 feedback:
 *                   $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: title, description"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to create feedback"
 */
// CREATE new feedback
exports.createFeedback = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      rating,
      userId,
      organizationId,
      tags,
      userAgent,
      ipAddress,
      browser,
      device
    } = req.body;

    // Validate required fields
    const requiredFields = ['title', 'description', 'rating', 'userId', 'organizationId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Create new feedback
    const newFeedback = new Feedback({
      title,
      description,
      category: category || 'general',
      rating,
      userId,
      organizationId,
      tags: tags || [],
      userAgent,
      ipAddress,
      browser,
      device,
      createdBy: userId,
      updatedBy: userId
    });

    const savedFeedback = await newFeedback.save();

    // Create audit log
    await createAuditLog({
      action: 'FEEDBACK_CREATED',
      user: userId,
      resource: 'Feedback',
      resourceId: savedFeedback._id,
      details: {
        title: savedFeedback.title,
        category: savedFeedback.category,
        rating: savedFeedback.rating
      },
      organization: organizationId
    });

    // Send notification to admins
    await sendNotificationToAdmins(organizationId, {
      type: 'feedback_received',
      title: 'New Feedback Received',
      message: `New ${savedFeedback.category} feedback received: ${savedFeedback.title}`,
      data: {
        feedbackId: savedFeedback._id,
        rating: savedFeedback.rating,
        category: savedFeedback.category
      }
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: savedFeedback
    });

  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating feedback',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/feedback/list:
 *   get:
 *     summary: Get all feedback with filters
 *     tags: [Feedback]
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
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, resolved, closed]
 *         description: Filter by feedback status
 *         example: "pending"
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by feedback category
 *         example: "user_experience"
 *       - in: query
 *         name: rating
 *         required: false
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
 *         example: 5
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of feedback items to return
 *         example: 50
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *     responses:
 *       200:
 *         description: Feedback retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 feedback:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feedback'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 50
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Bad request - Organization ID required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Organization ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve feedback"
 */
// GET all feedback with filters
exports.getFeedback = async (req, res) => {
  try {
    const {
      organizationId,
      status,
      category,
      rating,
      hasResponse,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { organizationId };
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (rating) filter.rating = parseInt(rating);
    if (hasResponse !== undefined) filter.hasResponse = hasResponse === 'true';
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const feedback = await Feedback.find(filter)
      .populate('userId', 'fullName email')
      .populate('respondedBy', 'fullName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(filter);

    res.status(200).json({
      success: true,
      feedback,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/feedback/{id}:
 *   get:
 *     summary: Get single feedback by ID
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Feedback ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Feedback retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 feedback:
 *                   $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Bad request - Invalid feedback ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid feedback ID"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Feedback not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Feedback not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve feedback"
 */
// GET single feedback by ID
exports.getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;

    const feedback = await Feedback.findOne({ _id: id, organizationId })
      .populate('userId', 'fullName email')
      .populate('respondedBy', 'fullName email')
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Get responses for this feedback
    const responses = await FeedbackResponse.find({ feedbackId: id })
      .populate('respondedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      feedback,
      responses
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/feedback/{id}:
 *   put:
 *     summary: Update feedback
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Feedback ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Feedback title
 *                 example: "Updated feedback title"
 *               description:
 *                 type: string
 *                 description: Feedback description
 *                 example: "Updated feedback description"
 *               category:
 *                 type: string
 *                 description: Feedback category
 *                 example: "bug_report"
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *                 example: 4
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Feedback tags
 *                 example: ["bug", "critical"]
 *               status:
 *                 type: string
 *                 enum: [pending, reviewed, resolved, closed]
 *                 description: Feedback status
 *                 example: "resolved"
 *     responses:
 *       200:
 *         description: Feedback updated successfully
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
 *                   example: "Feedback updated successfully"
 *                 feedback:
 *                   $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Feedback not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Feedback not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to update feedback"
 */
// UPDATE feedback
exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.body;

    const updateData = { ...req.body, updatedBy: userId };
    delete updateData.userId; // Remove from update data

    const feedback = await Feedback.findOneAndUpdate(
      { _id: id, organizationId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Create audit log
    await createAuditLog({
      action: 'FEEDBACK_UPDATED',
      user: userId,
      resource: 'Feedback',
      resourceId: feedback._id,
      details: {
        title: feedback.title,
        changes: req.body
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      feedback
    });

  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating feedback',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/feedback/{id}:
 *   delete:
 *     summary: Delete feedback
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Feedback ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
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
 *                   example: "Feedback deleted successfully"
 *       400:
 *         description: Bad request - Invalid feedback ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid feedback ID"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Feedback not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Feedback not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to delete feedback"
 */
// DELETE feedback
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.body;

    const feedback = await Feedback.findOneAndDelete({ _id: id, organizationId });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Delete associated responses
    await FeedbackResponse.deleteMany({ feedbackId: id });

    // Create audit log
    await createAuditLog({
      action: 'FEEDBACK_DELETED',
      user: userId,
      resource: 'Feedback',
      resourceId: feedback._id,
      details: {
        title: feedback.title
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting feedback',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/feedback/{id}/respond:
 *   post:
 *     summary: Respond to feedback
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Feedback ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *               - responderId
 *             properties:
 *               response:
 *                 type: string
 *                 description: Response message to the feedback
 *                 example: "Thank you for your feedback. We are working on this issue."
 *               responderId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID who is responding
 *                 example: "507f1f77bcf86cd799439011"
 *               isInternal:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is an internal response
 *                 example: false
 *               status:
 *                 type: string
 *                 enum: [pending, reviewed, resolved, closed]
 *                 description: Updated feedback status
 *                 example: "resolved"
 *     responses:
 *       200:
 *         description: Response added successfully
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
 *                   example: "Response added successfully"
 *                 feedbackResponse:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       format: ObjectId
 *                     feedbackId:
 *                       type: string
 *                       format: ObjectId
 *                     response:
 *                       type: string
 *                     responderId:
 *                       type: string
 *                       format: ObjectId
 *                     isInternal:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Response and responderId are required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Feedback not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Feedback not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to add response"
 */
// RESPOND to feedback
exports.respondToFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, organizationId, response, responseType, isInternal } = req.body;

    const feedback = await Feedback.findOne({ _id: id, organizationId });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Create response
    const newResponse = new FeedbackResponse({
      feedbackId: id,
      response,
      responseType: responseType || 'acknowledgment',
      respondedBy: userId,
      organizationId,
      isInternal: isInternal || false
    });

    const savedResponse = await newResponse.save();

    // Update feedback status
    feedback.status = 'responded';
    feedback.hasResponse = true;
    feedback.responseDate = new Date();
    feedback.respondedBy = userId;
    feedback.updatedBy = userId;
    await feedback.save();

    // Create audit log
    await createAuditLog({
      action: 'FEEDBACK_RESPONDED',
      user: userId,
      resource: 'Feedback',
      resourceId: feedback._id,
      details: {
        title: feedback.title,
        responseType: savedResponse.responseType
      },
      organization: organizationId
    });

    res.status(201).json({
      success: true,
      message: 'Response added successfully',
      response: savedResponse,
      feedback
    });

  } catch (error) {
    console.error('Error responding to feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to feedback',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/feedback/analytics/summary:
 *   get:
 *     summary: Get feedback analytics summary
 *     tags: [Feedback]
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
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *         example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     totalFeedback:
 *                       type: integer
 *                       description: Total number of feedback items
 *                       example: 150
 *                     averageRating:
 *                       type: number
 *                       description: Average rating across all feedback
 *                       example: 4.2
 *                     statusBreakdown:
 *                       type: object
 *                       description: Breakdown by status
 *                       properties:
 *                         pending:
 *                           type: integer
 *                           example: 25
 *                         reviewed:
 *                           type: integer
 *                           example: 50
 *                         resolved:
 *                           type: integer
 *                           example: 60
 *                         closed:
 *                           type: integer
 *                           example: 15
 *                     categoryBreakdown:
 *                       type: object
 *                       description: Breakdown by category
 *                       properties:
 *                         user_experience:
 *                           type: integer
 *                           example: 45
 *                         bug_report:
 *                           type: integer
 *                           example: 30
 *                         feature_request:
 *                           type: integer
 *                           example: 25
 *                         general:
 *                           type: integer
 *                           example: 50
 *                     ratingDistribution:
 *                       type: object
 *                       description: Distribution by rating
 *                       properties:
 *                         "1":
 *                           type: integer
 *                           example: 5
 *                         "2":
 *                           type: integer
 *                           example: 10
 *                         "3":
 *                           type: integer
 *                           example: 20
 *                         "4":
 *                           type: integer
 *                           example: 60
 *                         "5":
 *                           type: integer
 *                           example: 55
 *       400:
 *         description: Bad request - Organization ID required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Organization ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve analytics"
 */
// GET feedback analytics
exports.getFeedbackAnalytics = async (req, res) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    const filter = { organizationId };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Get total feedback count
    const totalFeedback = await Feedback.countDocuments(filter);

    // Get feedback by category
    const feedbackByCategory = await Feedback.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get feedback by rating
    const feedbackByRating = await Feedback.aggregate([
      { $match: filter },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    // Get feedback by status
    const feedbackByStatus = await Feedback.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get average rating
    const averageRating = await Feedback.aggregate([
      { $match: filter },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    // Get response rate
    const responseRate = await Feedback.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: 1 }, responded: { $sum: { $cond: ['$hasResponse', 1, 0] } } } }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalFeedback,
        averageRating: averageRating[0]?.avgRating || 0,
        responseRate: responseRate[0] ? (responseRate[0].responded / responseRate[0].total) * 100 : 0,
        byCategory: feedbackByCategory,
        byRating: feedbackByRating,
        byStatus: feedbackByStatus
      }
    });

  } catch (error) {
    console.error('Error fetching feedback analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback analytics',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/feedback/bulk/status:
 *   put:
 *     summary: Bulk update feedback status
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedbackIds
 *               - status
 *             properties:
 *               feedbackIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *                 description: Array of feedback IDs to update
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *               status:
 *                 type: string
 *                 enum: [pending, reviewed, resolved, closed]
 *                 description: New status for all selected feedback
 *                 example: "resolved"
 *               updateReason:
 *                 type: string
 *                 description: Reason for the status update
 *                 example: "Bulk resolution of resolved issues"
 *     responses:
 *       200:
 *         description: Feedback status updated successfully
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
 *                   example: "Feedback status updated successfully"
 *                 updatedCount:
 *                   type: integer
 *                   description: Number of feedback items updated
 *                   example: 5
 *                 details:
 *                   type: object
 *                   properties:
 *                     updated:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: ObjectId
 *                       example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: ObjectId
 *                       example: []
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Feedback IDs and status are required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to update feedback status"
 */
// BULK update feedback status
exports.bulkUpdateFeedbackStatus = async (req, res) => {
  try {
    const { organizationId, userId, feedbackIds, status } = req.body;

    if (!feedbackIds || !Array.isArray(feedbackIds) || feedbackIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Feedback IDs array is required'
      });
    }

    const result = await Feedback.updateMany(
      { _id: { $in: feedbackIds }, organizationId },
      { status, updatedBy: userId }
    );

    // Create audit log
    await createAuditLog({
      action: 'FEEDBACK_BULK_UPDATED',
      user: userId,
      resource: 'Feedback',
      details: {
        feedbackIds,
        status,
        count: result.modifiedCount
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} feedback items`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error bulk updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk updating feedback',
      error: error.message
    });
  }
}; 