const Feedback = require('../models/Feedback');
const FeedbackResponse = require('../models/FeedbackResponse');
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
 *           enum: [new, under-review, responded, resolved, closed]
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
 *                 enum: [general, product, usability, support, feature, bug, other]
 *                 default: general
 *                 description: Feedback category
 *                 example: "usability"
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *                 example: 5
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
      category = 'general',
      rating,
      tags = [],
      userAgent,
      ipAddress,
      browser,
      device
    } = req.body;

    // Validate required fields
    const requiredFields = ['title', 'description', 'rating'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Create new feedback
    const newFeedback = new Feedback({
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
      device,
      createdBy: userId,
      updatedBy: userId
    });

    const savedFeedback = await newFeedback.save();

    // Send notification to admins
    await sendNotificationToAdmins({
      type: 'feedback_submitted',
      title: 'New Feedback Received',
      message: `New feedback from ${req.user.fullName}: ${title}`,
      data: {
        feedbackId: savedFeedback._id,
        userId,
        organizationId
      }
    });

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
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [new, under-review, responded, resolved, closed]
 *         description: Filter by feedback status
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *           enum: [general, product, usability, support, feature, bug, other]
 *         description: Filter by feedback category
 *       - in: query
 *         name: rating
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
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
 *         description: Number of feedback items per page
 *     responses:
 *       200:
 *         description: Feedback retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// GET all feedback with filters
exports.getFeedback = async (req, res) => {
  try {
    const {
      organizationId,
      status,
      category,
      rating,
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
 *     responses:
 *       200:
 *         description: Feedback retrieved successfully
 *       404:
 *         description: Feedback not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// GET single feedback by ID
exports.getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organization;

    const feedback = await Feedback.findOne({ _id: id, organizationId })
      .populate('userId', 'fullName email')
      .populate('respondedBy', 'fullName email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Get feedback responses
    const responses = await FeedbackResponse.find({ feedbackId: id })
      .populate('respondedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      feedback: {
        ...feedback.toObject(),
        responses
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
 *               category:
 *                 type: string
 *                 enum: [general, product, usability, support, feature, bug, other]
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               status:
 *                 type: string
 *                 enum: [new, under-review, responded, resolved, closed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Feedback updated successfully
 *       404:
 *         description: Feedback not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
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
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
 *       404:
 *         description: Feedback not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
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

    const feedback = await Feedback.findOne({ _id: id, organizationId });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Delete associated feedback responses
    await FeedbackResponse.deleteMany({ feedbackId: id });

    // Delete the feedback
    await Feedback.findByIdAndDelete(id);

    // Create audit log
    await createAuditLog({
      action: 'FEEDBACK_DELETED',
      user: userId,
      resource: 'Feedback',
      resourceId: id,
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *                 description: Response content
 *               responseType:
 *                 type: string
 *                 enum: [acknowledgment, update, resolution, question]
 *                 default: acknowledgment
 *               isInternal:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Response added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// RESPOND to feedback
exports.respondToFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const organizationId = req.user?.organization;
    const { response, responseType = 'acknowledgment', isInternal = false } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!response || !response.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Response content is required'
      });
    }

    // Check if feedback exists
    const feedback = await Feedback.findOne({ _id: id, organizationId });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Create feedback response
    const newResponse = new FeedbackResponse({
      feedbackId: id,
      response: response.trim(),
      responseType,
      respondedBy: userId,
      organizationId,
      isInternal
    });

    const savedResponse = await newResponse.save();

    // Update feedback status and response info
    feedback.status = 'responded';
    feedback.hasResponse = true;
    feedback.responseDate = new Date();
    feedback.respondedBy = userId;
    await feedback.save();

    // Create audit log
    await createAuditLog({
      action: 'FEEDBACK_RESPONDED',
      user: userId,
      resource: 'Feedback',
      resourceId: feedback._id,
      details: {
        title: feedback.title,
        responseType,
        responseLength: response.length
      },
      organization: organizationId
    });

    res.status(201).json({
      success: true,
      message: 'Response added successfully',
      response: savedResponse
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
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// GET feedback analytics
exports.getFeedbackAnalytics = async (req, res) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    // Build date filter
    const dateFilter = { organizationId };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get analytics data
    const [
      totalFeedback,
      statusCounts,
      categoryCounts,
      ratingStats,
      recentFeedback
    ] = await Promise.all([
      Feedback.countDocuments(dateFilter),
      Feedback.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Feedback.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Feedback.aggregate([
        { $match: dateFilter },
        { $group: { 
          _id: null, 
          averageRating: { $avg: '$rating' },
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' }
        }}
      ]),
      Feedback.find(dateFilter)
        .populate('userId', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const analytics = {
      totalFeedback,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      categoryCounts: categoryCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      ratingStats: ratingStats[0] || { averageRating: 0, minRating: 0, maxRating: 0 },
      recentFeedback
    };

    res.status(200).json({
      success: true,
      analytics
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
 *               status:
 *                 type: string
 *                 enum: [new, under-review, responded, resolved, closed]
 *                 description: New status to set
 *     responses:
 *       200:
 *         description: Feedback status updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// BULK update feedback status
exports.bulkUpdateFeedbackStatus = async (req, res) => {
  try {
    const { feedbackIds, status } = req.body;
    const userId = req.user?._id;
    const organizationId = req.user?.organization;

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

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Update feedback status
    const result = await Feedback.updateMany(
      { _id: { $in: feedbackIds }, organizationId },
      { status, updatedBy: userId }
    );

    // Create audit log
    await createAuditLog({
      action: 'FEEDBACK_BULK_STATUS_UPDATE',
      user: userId,
      resource: 'Feedback',
      resourceId: feedbackIds.join(','),
      details: {
        feedbackCount: feedbackIds.length,
        newStatus: status
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} feedback items`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error bulk updating feedback status:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk updating feedback status',
      error: error.message
    });
  }
};



