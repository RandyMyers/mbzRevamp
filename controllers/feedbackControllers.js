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
 *                   example: "Error creating feedback"
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