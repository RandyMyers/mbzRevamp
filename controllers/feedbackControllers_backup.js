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
    const userId = req.user?._id;
    const organizationId = req.user?.organization;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const updateData = { ...req.body, updatedBy: userId };

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
    const userId = req.user?._id;
    const organizationId = req.user?.organization;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

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
    const userId = req.user?._id;
    const organizationId = req.user?.organization;
    const { response, responseType, isInternal } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

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
    const userId = req.user?._id;
    const organizationId = req.user?.organization;
    const { feedbackIds, status } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

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

// ==================== SURVEY CRUD OPERATIONS ====================

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
    const { organizationId } = req.query;

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

    const survey = await Survey.findOneAndDelete({ _id: id, organizationId });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Delete associated responses
    await SurveyResponse.deleteMany({ surveyId: id });

    // Create audit log
    await createAuditLog({
      action: 'SURVEY_DELETED',
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
 *     summary: Get survey responses
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
    const responses = await SurveyResponse.find({ surveyId: id })
      .populate('userId', 'fullName email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SurveyResponse.countDocuments({ surveyId: id });

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

// ==================== SUGGESTION CRUD OPERATIONS ====================

/**
 * @swagger
 * /api/suggestions/create:
 *   post:
 *     summary: Create new suggestion
 *     tags: [Suggestions]
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
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 description: Suggestion title
 *                 example: "Add dark mode theme"
 *               description:
 *                 type: string
 *                 description: Suggestion description
 *                 example: "Please add a dark mode option for better user experience"
 *               category:
 *                 type: string
 *                 enum: [UI/UX, Feature, Integration, Analytics, Performance, Security, Other]
 *                 description: Suggestion category
 *                 example: "UI/UX"
 *               estimatedEffort:
 *                 type: string
 *                 enum: [small, medium, large, epic]
 *                 default: medium
 *                 description: Estimated effort required
 *               estimatedTimeline:
 *                 type: string
 *                 description: Estimated timeline
 *                 example: "2-3 weeks"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Suggestion tags
 *                 example: ["ui", "theme", "accessibility"]
 *     responses:
 *       201:
 *         description: Suggestion created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// CREATE new suggestion
exports.createSuggestion = async (req, res) => {
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
      category,
      estimatedEffort,
      estimatedTimeline,
      tags
    } = req.body;

    // Validate required fields
    const requiredFields = ['title', 'description', 'category'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Create new suggestion
    const newSuggestion = new Suggestion({
      title,
      description,
      category,
      userId,
      organizationId,
      estimatedEffort: estimatedEffort || 'medium',
      estimatedTimeline,
      tags: tags || [],
      createdBy: userId,
      updatedBy: userId
    });

    const savedSuggestion = await newSuggestion.save();

    // Create audit log
    await createAuditLog({
      action: 'SUGGESTION_CREATED',
      user: userId,
      resource: 'Suggestion',
      resourceId: savedSuggestion._id,
      details: {
        title: savedSuggestion.title,
        category: savedSuggestion.category
      },
      organization: organizationId
    });

    res.status(201).json({
      success: true,
      message: 'Suggestion created successfully',
      suggestion: savedSuggestion
    });

  } catch (error) {
    console.error('Error creating suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating suggestion',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/suggestions/list:
 *   get:
 *     summary: Get all suggestions with filters
 *     tags: [Suggestions]
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
 *           enum: [new, under-review, planned, implemented, considering, declined]
 *         description: Filter by suggestion status
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by suggestion category
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
 *         description: Number of suggestions per page
 *     responses:
 *       200:
 *         description: Suggestions retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// GET all suggestions with filters
exports.getSuggestions = async (req, res) => {
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
    const suggestions = await Suggestion.find(filter)
      .populate('userId', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Suggestion.countDocuments(filter);

    res.status(200).json({
      success: true,
      suggestions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestions',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/suggestions/{id}:
 *   get:
 *     summary: Get single suggestion by ID
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Suggestion ID
 *     responses:
 *       200:
 *         description: Suggestion retrieved successfully
 *       404:
 *         description: Suggestion not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// GET single suggestion by ID
exports.getSuggestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;

    const suggestion = await Suggestion.findOne({ _id: id, organizationId })
      .populate('userId', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email');

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    res.status(200).json({
      success: true,
      suggestion
    });

  } catch (error) {
    console.error('Error fetching suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestion',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/suggestions/{id}/vote:
 *   post:
 *     summary: Vote on suggestion (upvote/downvote)
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Suggestion ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vote
 *             properties:
 *               vote:
 *                 type: string
 *                 enum: [upvote, downvote]
 *                 description: Vote type
 *                 example: "upvote"
 *     responses:
 *       200:
 *         description: Vote recorded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Suggestion not found
 *       500:
 *         description: Server error
 */
// VOTE on suggestion
exports.voteSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const organizationId = req.user?.organization;
    const { vote } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!vote || !['upvote', 'downvote'].includes(vote)) {
      return res.status(400).json({
        success: false,
        message: 'Vote must be either "upvote" or "downvote"'
      });
    }

    const suggestion = await Suggestion.findOne({ _id: id, organizationId });
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    // Check if user already voted
    const existingVote = suggestion.votes.voters.find(
      voter => voter.userId.toString() === userId.toString()
    );

    if (existingVote) {
      // Update existing vote
      if (existingVote.vote === vote) {
        return res.status(400).json({
          success: false,
          message: 'You have already voted with this option'
        });
      }

      // Remove old vote count
      if (existingVote.vote === 'upvote') {
        suggestion.votes.upvotes -= 1;
      } else {
        suggestion.votes.downvotes -= 1;
      }

      // Update vote
      existingVote.vote = vote;
    } else {
      // Add new vote
      suggestion.votes.voters.push({
        userId: userId,
        vote: vote,
        votedAt: new Date()
      });
    }

    // Update vote counts
    if (vote === 'upvote') {
      suggestion.votes.upvotes += 1;
    } else {
      suggestion.votes.downvotes += 1;
    }

    await suggestion.save();

    // Create audit log
    await createAuditLog({
      action: 'SUGGESTION_VOTED',
      user: userId,
      resource: 'Suggestion',
      resourceId: suggestion._id,
      details: {
        title: suggestion.title,
        vote: vote
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      suggestion: {
        _id: suggestion._id,
        votes: suggestion.votes
      }
    });

  } catch (error) {
    console.error('Error voting on suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Error voting on suggestion',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/suggestions/{id}/comment:
 *   post:
 *     summary: Add comment to suggestion
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Suggestion ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Comment content
 *                 example: "Great idea! This would really improve the user experience."
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Suggestion not found
 *       500:
 *         description: Server error
 */
// ADD comment to suggestion
exports.addSuggestionComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const organizationId = req.user?.organization;
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const suggestion = await Suggestion.findOne({ _id: id, organizationId });
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    // Add comment
    const newComment = {
      userId: userId,
      content: content.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    suggestion.comments.push(newComment);
    await suggestion.save();

    // Populate the comment with user details
    await suggestion.populate('comments.userId', 'fullName email');

    // Create audit log
    await createAuditLog({
      action: 'SUGGESTION_COMMENTED',
      user: userId,
      resource: 'Suggestion',
      resourceId: suggestion._id,
      details: {
        title: suggestion.title,
        commentLength: content.length
      },
      organization: organizationId
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment
    });

  } catch (error) {
    console.error('Error adding comment to suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment to suggestion',
      error: error.message
    });
  }
}; 