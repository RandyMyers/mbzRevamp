const Suggestion = require('../models/Suggestion');
const { createAuditLog } = require('../helpers/auditLogHelper');
const { sendNotificationToAdmins } = require('../helpers/notificationHelper');

/**
 * @swagger
 * components:
 *   schemas:
 *     Suggestion:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - category
 *         - userId
 *         - organizationId
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique suggestion ID
 *         title:
 *           type: string
 *           description: Suggestion title
 *         description:
 *           type: string
 *           description: Suggestion description
 *         category:
 *           type: string
 *           enum: [UI/UX, Feature, Integration, Analytics, Performance, Security, Other]
 *           description: Suggestion category
 *         userId:
 *           type: string
 *           format: ObjectId
 *           description: User who created the suggestion
 *         organizationId:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID
 *         status:
 *           type: string
 *           enum: [new, under-review, planned, implemented, considering, declined]
 *           default: new
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           default: medium
 *         votes:
 *           type: object
 *           properties:
 *             upvotes:
 *               type: number
 *               default: 0
 *             downvotes:
 *               type: number
 *               default: 0
 *             voters:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                     format: ObjectId
 *                   vote:
 *                     type: string
 *                     enum: [upvote, downvote]
 *                   votedAt:
 *                     type: string
 *                     format: date-time
 *         comments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *               content:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               updatedAt:
 *                 type: string
 *                 format: date-time
 *         estimatedEffort:
 *           type: string
 *           enum: [small, medium, large, epic]
 *           default: medium
 *         estimatedTimeline:
 *           type: string
 *           description: Estimated timeline
 *         assignedTo:
 *           type: string
 *           format: ObjectId
 *           description: User assigned to implement
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

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
    const organizationId = req.user?.organization;

    const suggestion = await Suggestion.findOne({ _id: id, organizationId })
      .populate('userId', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .populate('comments.userId', 'fullName email');

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
 * /api/suggestions/{id}:
 *   put:
 *     summary: Update suggestion
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [new, under-review, planned, implemented, considering, declined]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               estimatedEffort:
 *                 type: string
 *                 enum: [small, medium, large, epic]
 *               estimatedTimeline:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *                 format: ObjectId
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Suggestion updated successfully
 *       404:
 *         description: Suggestion not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// UPDATE suggestion
exports.updateSuggestion = async (req, res) => {
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

    const suggestion = await Suggestion.findOneAndUpdate(
      { _id: id, organizationId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    // Create audit log
    await createAuditLog({
      action: 'SUGGESTION_UPDATED',
      user: userId,
      resource: 'Suggestion',
      resourceId: suggestion._id,
      details: {
        title: suggestion.title,
        changes: req.body
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Suggestion updated successfully',
      suggestion
    });

  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating suggestion',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/suggestions/{id}:
 *   delete:
 *     summary: Delete suggestion
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
 *         description: Suggestion deleted successfully
 *       404:
 *         description: Suggestion not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// DELETE suggestion
exports.deleteSuggestion = async (req, res) => {
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

    const suggestion = await Suggestion.findOne({ _id: id, organizationId });

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    // Delete the suggestion
    await Suggestion.findByIdAndDelete(id);

    // Create audit log
    await createAuditLog({
      action: 'SUGGESTION_DELETED',
      user: userId,
      resource: 'Suggestion',
      resourceId: id,
      details: {
        title: suggestion.title
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Suggestion deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting suggestion',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/suggestions/{id}/vote:
 *   post:
 *     summary: Vote on suggestion (upvote or downvote)
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
 *     responses:
 *       200:
 *         description: Vote recorded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
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
        message: 'Invalid vote type. Must be "upvote" or "downvote"'
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
    const existingVoteIndex = suggestion.votes.voters.findIndex(
      voter => voter.userId.toString() === userId.toString()
    );

    if (existingVoteIndex !== -1) {
      // User already voted, update their vote
      const existingVote = suggestion.votes.voters[existingVoteIndex].vote;
      
      if (existingVote === vote) {
        // Same vote, remove it
        suggestion.votes.voters.splice(existingVoteIndex, 1);
        if (vote === 'upvote') {
          suggestion.votes.upvotes -= 1;
        } else {
          suggestion.votes.downvotes -= 1;
        }
      } else {
        // Different vote, update it
        suggestion.votes.voters[existingVoteIndex].vote = vote;
        if (vote === 'upvote') {
          suggestion.votes.upvotes += 1;
          suggestion.votes.downvotes -= 1;
        } else {
          suggestion.votes.downvotes += 1;
          suggestion.votes.upvotes -= 1;
        }
      }
    } else {
      // New vote
      suggestion.votes.voters.push({
        userId,
        vote,
        votedAt: new Date()
      });
      
      if (vote === 'upvote') {
        suggestion.votes.upvotes += 1;
      } else {
        suggestion.votes.downvotes += 1;
      }
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
        vote,
        totalVotes: suggestion.votes.upvotes - suggestion.votes.downvotes
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
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
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

    if (!content || !content.trim()) {
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
    const comment = {
      userId,
      content: content.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    suggestion.comments.push(comment);
    await suggestion.save();

    // Populate the comment with user details
    await suggestion.populate('comments.userId', 'fullName email');

    const addedComment = suggestion.comments[suggestion.comments.length - 1];

    // Create audit log
    await createAuditLog({
      action: 'SUGGESTION_COMMENT_ADDED',
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
      comment: addedComment
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

/**
 * @swagger
 * /api/suggestions/{id}/comments:
 *   get:
 *     summary: Get all comments for a suggestion
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
 *         description: Number of comments per page
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       404:
 *         description: Suggestion not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// GET suggestion comments
exports.getSuggestionComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const organizationId = req.user?.organization;

    const suggestion = await Suggestion.findOne({ _id: id, organizationId })
      .populate('comments.userId', 'fullName email');

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const comments = suggestion.comments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + parseInt(limit));

    const total = suggestion.comments.length;

    res.status(200).json({
      success: true,
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching suggestion comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestion comments',
      error: error.message
    });
  }
};
