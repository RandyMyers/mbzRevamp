const ContentManagement = require('../models/ContentManagement');
const User = require('../models/users');
const Organization = require('../models/organization');

/**
 * @swagger
 * components:
 *   schemas:
 *     ContentManagement:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         organizationId:
 *           type: string
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         contentType:
 *           type: string
 *           enum: [page, article, announcement, policy, procedure, faq, news, event]
 *         category:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [draft, published, archived, scheduled]
 *         author:
 *           type: string
 *         publishedBy:
 *           type: string
 *         publishedAt:
 *           type: string
 *           format: date-time
 *         featured:
 *           type: boolean
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *         visibility:
 *           type: string
 *           enum: [public, private, staff_only, specific_roles]
 *         allowedRoles:
 *           type: array
 *           items:
 *             type: string
 *         views:
 *           type: number
 *         likes:
 *           type: number
 *         comments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               content:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 */

/**
 * @swagger
 * /api/content-management:
 *   post:
 *     summary: Create content
 *     tags: [Content Management]
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
 *               - content
 *               - contentType
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               contentType:
 *                 type: string
 *                 enum: [page, article, announcement, policy, procedure, faq, news, event]
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived, scheduled]
 *                 default: draft
 *               featured:
 *                 type: boolean
 *                 default: false
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *               visibility:
 *                 type: string
 *                 enum: [public, private, staff_only, specific_roles]
 *                 default: staff_only
 *               allowedRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *               seo:
 *                 type: object
 *                 properties:
 *                   metaTitle:
 *                     type: string
 *                   metaDescription:
 *                     type: string
 *                   keywords:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       201:
 *         description: Content created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ContentManagement'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
const createContent = async (req, res) => {
  try {
    const {
      title,
      content,
      contentType,
      category,
      tags = [],
      status = 'draft',
      featured = false,
      priority = 'medium',
      visibility = 'staff_only',
      allowedRoles = [],
      scheduledFor,
      seo = {}
    } = req.body;

    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const contentDoc = new ContentManagement({
      organizationId,
      title,
      content,
      contentType,
      category,
      tags,
      status,
      featured,
      priority,
      visibility,
      allowedRoles,
      scheduledFor,
      seo,
      author: userId
    });

    await contentDoc.save();
    await contentDoc.populate('author', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: contentDoc
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
 * /api/content-management:
 *   get:
 *     summary: Get content list
 *     tags: [Content Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [page, article, announcement, policy, procedure, faq, news, event]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived, scheduled]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
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
 *         description: Content list retrieved successfully
 */
const getContent = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      contentType,
      status,
      category,
      featured,
      author,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const query = { organizationId };

    if (contentType) query.contentType = contentType;
    if (status) query.status = status;
    if (category) query.category = category;
    if (featured !== undefined) query.featured = featured === 'true';
    if (author) query.author = author;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const content = await ContentManagement.find(query)
      .populate('author', 'firstName lastName email')
      .populate('publishedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ContentManagement.countDocuments(query);

    res.json({
      success: true,
      data: content,
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
 * /api/content-management/{id}:
 *   get:
 *     summary: Get content by ID
 *     tags: [Content Management]
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
 *         description: Content retrieved successfully
 *       404:
 *         description: Content not found
 *       403:
 *         description: Access denied
 */
const getContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const content = await ContentManagement.findOne({
      _id: id,
      organizationId
    })
      .populate('author', 'firstName lastName email')
      .populate('publishedBy', 'firstName lastName email');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Increment view count
    content.views += 1;
    await content.save();

    res.json({
      success: true,
      data: content
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
 * /api/content-management/{id}:
 *   put:
 *     summary: Update content
 *     tags: [Content Management]
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
 *               content:
 *                 type: string
 *               contentType:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *               status:
 *                 type: string
 *               featured:
 *                 type: boolean
 *               priority:
 *                 type: string
 *               visibility:
 *                 type: string
 *               allowedRoles:
 *                 type: array
 *               scheduledFor:
 *                 type: string
 *               seo:
 *                 type: object
 *     responses:
 *       200:
 *         description: Content updated successfully
 *       404:
 *         description: Content not found
 *       403:
 *         description: Access denied
 */
const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const updateData = req.body;

    const content = await ContentManagement.findOne({
      _id: id,
      organizationId
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Save previous version
    content.previousVersions.push({
      content: content.content,
      version: content.version,
      modifiedBy: req.user.id,
      modifiedAt: new Date()
    });

    // Update content
    Object.assign(content, updateData);
    content.version += 1;

    // If publishing, set publishedBy and publishedAt
    if (updateData.status === 'published' && content.status !== 'published') {
      content.publishedBy = req.user.id;
      content.publishedAt = new Date();
    }

    await content.save();
    await content.populate('author', 'firstName lastName email');
    await content.populate('publishedBy', 'firstName lastName email');

    res.json({
      success: true,
      data: content
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
 * /api/content-management/{id}:
 *   delete:
 *     summary: Delete content
 *     tags: [Content Management]
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
 *         description: Content deleted successfully
 *       404:
 *         description: Content not found
 *       403:
 *         description: Access denied
 */
const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const content = await ContentManagement.findOneAndDelete({
      _id: id,
      organizationId
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: 'Content deleted successfully'
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
 * /api/content-management/{id}/publish:
 *   post:
 *     summary: Publish content
 *     tags: [Content Management]
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
 *         description: Content published successfully
 *       404:
 *         description: Content not found
 *       403:
 *         description: Access denied
 */
const publishContent = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const content = await ContentManagement.findOne({
      _id: id,
      organizationId
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    content.status = 'published';
    content.publishedBy = req.user.id;
    content.publishedAt = new Date();

    await content.save();
    await content.populate('publishedBy', 'firstName lastName email');

    res.json({
      success: true,
      data: content
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
 * /api/content-management/{id}/like:
 *   post:
 *     summary: Like content
 *     tags: [Content Management]
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
 *         description: Content liked successfully
 *       404:
 *         description: Content not found
 */
const likeContent = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const content = await ContentManagement.findOne({
      _id: id,
      organizationId
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    content.likes += 1;
    await content.save();

    res.json({
      success: true,
      data: { likes: content.likes }
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
 * /api/content-management/{id}/comment:
 *   post:
 *     summary: Add comment to content
 *     tags: [Content Management]
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment added successfully
 *       404:
 *         description: Content not found
 */
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content: commentContent } = req.body;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    const content = await ContentManagement.findOne({
      _id: id,
      organizationId
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    content.comments.push({
      user: userId,
      content: commentContent,
      createdAt: new Date()
    });

    await content.save();
    await content.populate('comments.user', 'firstName lastName email');

    res.json({
      success: true,
      data: content.comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createContent,
  getContent,
  getContentById,
  updateContent,
  deleteContent,
  publishContent,
  likeContent,
  addComment
};



