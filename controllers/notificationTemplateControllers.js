const NotificationTemplate = require('../models/notificationTemplates');
const { createAuditLog } = require('../helpers/auditLogHelper');

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationTemplate:
 *       type: object
 *       required:
 *         - templateName
 *         - subject
 *         - body
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique notification template ID
 *         templateName:
 *           type: string
 *           description: Template name
 *           example: "Welcome Email Template"
 *         subject:
 *           type: string
 *           description: Email subject line
 *           example: "Welcome to our platform!"
 *         body:
 *           type: string
 *           description: Template body content (HTML)
 *           example: "<h1>Welcome {{userName}}!</h1><p>Thank you for joining us.</p>"
 *         type:
 *           type: string
 *           enum: [email, system]
 *           default: system
 *           description: Notification type
 *           example: "email"
 *         triggerEvent:
 *           type: string
 *           enum: [subscriptionEnd, reminder, invoiceCreated, accountUpdate, custom]
 *           default: custom
 *           description: Event that triggers this notification
 *           example: "subscriptionEnd"
 *         variables:
 *           type: object
 *           description: Template variables for personalization
 *           example: {"userName": "string", "companyName": "string"}
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether template is active
 *           example: true
 *         organization:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID
 *           example: "507f1f77bcf86cd799439011"
 *         createdBy:
 *           type: string
 *           format: ObjectId
 *           description: User ID who created the template
 *           example: "507f1f77bcf86cd799439011"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Template creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Template last update timestamp
 *     
 *     NotificationTemplateCreate:
 *       type: object
 *       required:
 *         - templateName
 *         - subject
 *         - body
 *       properties:
 *         templateName:
 *           type: string
 *           description: Template name
 *           example: "Welcome Email Template"
 *         subject:
 *           type: string
 *           description: Email subject line
 *           example: "Welcome to our platform!"
 *         body:
 *           type: string
 *           description: Template body content (HTML)
 *           example: "<h1>Welcome {{userName}}!</h1><p>Thank you for joining us.</p>"
 *         type:
 *           type: string
 *           enum: [email, system]
 *           default: system
 *           description: Notification type
 *           example: "email"
 *         triggerEvent:
 *           type: string
 *           enum: [subscriptionEnd, reminder, invoiceCreated, accountUpdate, custom]
 *           default: custom
 *           description: Event that triggers this notification
 *           example: "subscriptionEnd"
 *         variables:
 *           type: object
 *           description: Template variables for personalization
 *           example: {"userName": "string", "companyName": "string"}
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether template is active
 *           example: true
 *         organization:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID (optional, defaults to user's organization)
 *           example: "507f1f77bcf86cd799439011"
 *     
 *     NotificationTemplateUpdate:
 *       type: object
 *       properties:
 *         templateName:
 *           type: string
 *           description: Updated template name
 *           example: "Updated Welcome Email Template"
 *         subject:
 *           type: string
 *           description: Updated email subject line
 *           example: "Updated Welcome Message"
 *         body:
 *           type: string
 *           description: Updated template body content (HTML)
 *           example: "<h1>Welcome {{userName}}!</h1><p>We're excited to have you!</p>"
 *         type:
 *           type: string
 *           enum: [email, system]
 *           description: Updated notification type
 *           example: "email"
 *         triggerEvent:
 *           type: string
 *           enum: [subscriptionEnd, reminder, invoiceCreated, accountUpdate, custom]
 *           description: Updated trigger event
 *           example: "subscriptionEnd"
 *         variables:
 *           type: object
 *           description: Updated template variables
 *           example: {"userName": "string", "companyName": "string", "planType": "string"}
 *         isActive:
 *           type: boolean
 *           description: Whether template is active
 *           example: true
 */

/**
 * @swagger
 * /api/notification-templates:
 *   post:
 *     summary: Create a new notification template
 *     tags: [Notification Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationTemplateCreate'
 *     responses:
 *       201:
 *         description: Notification template created successfully
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
 *                   example: "Notification template created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/NotificationTemplate'
 *       400:
 *         description: Bad request - Missing required fields or invalid data
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
 *                   example: "Template name, subject, and body are required"
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
 *                   example: "Error creating notification template"
 */

// CREATE a new notification template
exports.createNotificationTemplate = async (req, res) => {
  try {
    const { 
      templateName, 
      subject, 
      body, 
      type = 'system',
      triggerEvent = 'custom',
      variables = {},
      isActive = true,
      organization 
    } = req.body;

    // Validate required fields
    if (!templateName || !subject || !body) {
      return res.status(400).json({ 
        success: false, 
        message: "Template name, subject, and body are required" 
      });
    }

    // Validate notification type
    const validTypes = ['email', 'system'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid notification type. Must be 'email' or 'system'" 
      });
    }

    // Validate trigger event
    const validTriggerEvents = ['subscriptionEnd', 'reminder', 'invoiceCreated', 'accountUpdate', 'custom'];
    if (!validTriggerEvents.includes(triggerEvent)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid trigger event" 
      });
    }

    // Check if template name already exists
    const existingTemplate = await NotificationTemplate.findOne({ 
      templateName, 
      organization: organization || req.user?.organization 
    });

    if (existingTemplate) {
      return res.status(400).json({ 
        success: false, 
        message: "Template name already exists" 
      });
    }

    // Create the template
    const template = new NotificationTemplate({
      templateName,
      subject,
      body,
      type,
      triggerEvent,
      variables,
      isActive,
      createdBy: req.user?._id,
      organization: organization || req.user?.organization
    });

    const savedTemplate = await template.save();

    // ✅ AUDIT LOG: Notification Template Created
    await createAuditLog({
      action: 'Notification Template Created',
      user: req.user?._id,
      resource: 'notificationTemplate',
      resourceId: savedTemplate._id,
      details: {
        templateName,
        type,
        triggerEvent,
        isActive,
        organization: organization || req.user?.organization,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization || organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: "Notification template created successfully",
      data: savedTemplate
    });
  } catch (error) {
    console.error('Create Notification Template Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create notification template",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/notification-templates:
 *   get:
 *     summary: Get all notification templates with filters and pagination
 *     tags: [Notification Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organization
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID to filter templates
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [email, system]
 *         description: Filter by notification type
 *       - in: query
 *         name: triggerEvent
 *         schema:
 *           type: string
 *           enum: [subscriptionEnd, reminder, invoiceCreated, accountUpdate, custom]
 *         description: Filter by trigger event
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Notification templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 templates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NotificationTemplate'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     pages:
 *                       type: integer
 *                       example: 3
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
 *                   example: "Error retrieving notification templates"
 */

// GET all notification templates
exports.getAllNotificationTemplates = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      triggerEvent, 
      isActive,
      organization,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (type) filter.type = type;
    if (triggerEvent) filter.triggerEvent = triggerEvent;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (organization) filter.organization = organization;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get templates with populated creator
    const templates = await NotificationTemplate.find(filter)
      .populate('createdBy', 'fullName email username')
      .populate('organization', 'name')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await NotificationTemplate.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get All Notification Templates Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get notification templates",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/notification-templates/{id}:
 *   get:
 *     summary: Get a single notification template by ID
 *     tags: [Notification Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Notification template ID
 *       - in: query
 *         name: organization
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID for context
 *     responses:
 *       200:
 *         description: Notification template retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 template:
 *                   $ref: '#/components/schemas/NotificationTemplate'
 *       404:
 *         description: Notification template not found
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
 *                   example: "Notification template not found"
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
 *                   example: "Error retrieving notification template"
 */

// GET single notification template by ID
exports.getNotificationTemplateById = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await NotificationTemplate.findById(templateId)
      .populate('createdBy', 'fullName email username')
      .populate('organization', 'name');

    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification template not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get Notification Template Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get notification template",
      error: error.message 
    });
  }
};

// UPDATE notification template
exports.updateNotificationTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { 
      templateName, 
      subject, 
      body, 
      type, 
      triggerEvent,
      variables,
      isActive 
    } = req.body;

    const template = await NotificationTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification template not found" 
      });
    }

    // Check if template name already exists (if changing name)
    if (templateName && templateName !== template.templateName) {
      const existingTemplate = await NotificationTemplate.findOne({ 
        templateName, 
        organization: template.organization,
        _id: { $ne: templateId }
      });

      if (existingTemplate) {
        return res.status(400).json({ 
          success: false, 
          message: "Template name already exists" 
        });
      }
    }

    // Update fields
    if (templateName) template.templateName = templateName;
    if (subject) template.subject = subject;
    if (body) template.body = body;
    if (type) template.type = type;
    if (triggerEvent) template.triggerEvent = triggerEvent;
    if (variables) template.variables = variables;
    if (isActive !== undefined) template.isActive = isActive;

    const updatedTemplate = await template.save();

    // ✅ AUDIT LOG: Notification Template Updated
    await createAuditLog({
      action: 'Notification Template Updated',
      user: req.user?._id,
      resource: 'notificationTemplate',
      resourceId: updatedTemplate._id,
      details: {
        templateName: updatedTemplate.templateName,
        type: updatedTemplate.type,
        triggerEvent: updatedTemplate.triggerEvent,
        isActive: updatedTemplate.isActive,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: "Notification template updated successfully",
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Update Notification Template Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update notification template",
      error: error.message 
    });
  }
};

// DELETE notification template
exports.deleteNotificationTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await NotificationTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification template not found" 
      });
    }

    await NotificationTemplate.findByIdAndDelete(templateId);

    // ✅ AUDIT LOG: Notification Template Deleted
    await createAuditLog({
      action: 'Notification Template Deleted',
      user: req.user?._id,
      resource: 'notificationTemplate',
      resourceId: templateId,
      details: {
        templateName: template.templateName,
        type: template.type,
        triggerEvent: template.triggerEvent,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization,
      severity: 'warning',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: "Notification template deleted successfully"
    });
  } catch (error) {
    console.error('Delete Notification Template Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete notification template",
      error: error.message 
    });
  }
};

// GET notification templates by organization
exports.getNotificationTemplatesByOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      type, 
      triggerEvent, 
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { organization: organizationId };
    if (type) filter.type = type;
    if (triggerEvent) filter.triggerEvent = triggerEvent;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get templates
    const templates = await NotificationTemplate.find(filter)
      .populate('createdBy', 'fullName email username')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await NotificationTemplate.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Notification Templates By Organization Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get organization notification templates",
      error: error.message 
    });
  }
};

// GET active notification templates
exports.getActiveNotificationTemplates = async (req, res) => {
  try {
    const { organization } = req.query;

    // Build filter
    const filter = { isActive: true };
    if (organization) filter.organization = organization;

    const templates = await NotificationTemplate.find(filter)
      .populate('createdBy', 'fullName email username')
      .populate('organization', 'name')
      .sort({ templateName: 1 });

    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get Active Notification Templates Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get active notification templates",
      error: error.message 
    });
  }
};

// DUPLICATE notification template
exports.duplicateNotificationTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { newTemplateName } = req.body;

    if (!newTemplateName) {
      return res.status(400).json({ 
        success: false, 
        message: "New template name is required" 
      });
    }

    const originalTemplate = await NotificationTemplate.findById(templateId);
    if (!originalTemplate) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification template not found" 
      });
    }

    // Check if new template name already exists
    const existingTemplate = await NotificationTemplate.findOne({ 
      templateName: newTemplateName, 
      organization: originalTemplate.organization 
    });

    if (existingTemplate) {
      return res.status(400).json({ 
        success: false, 
        message: "Template name already exists" 
      });
    }

    // Create duplicate template
    const duplicateTemplate = new NotificationTemplate({
      templateName: newTemplateName,
      subject: originalTemplate.subject,
      body: originalTemplate.body,
      type: originalTemplate.type,
      triggerEvent: originalTemplate.triggerEvent,
      variables: originalTemplate.variables,
      isActive: false, // Set to inactive by default
      createdBy: req.user?._id,
      organization: originalTemplate.organization
    });

    const savedDuplicate = await duplicateTemplate.save();

    // ✅ AUDIT LOG: Notification Template Duplicated
    await createAuditLog({
      action: 'Notification Template Duplicated',
      user: req.user?._id,
      resource: 'notificationTemplate',
      resourceId: savedDuplicate._id,
      details: {
        originalTemplateId: templateId,
        originalTemplateName: originalTemplate.templateName,
        newTemplateName,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: "Notification template duplicated successfully",
      data: savedDuplicate
    });
  } catch (error) {
    console.error('Duplicate Notification Template Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to duplicate notification template",
      error: error.message 
    });
  }
};