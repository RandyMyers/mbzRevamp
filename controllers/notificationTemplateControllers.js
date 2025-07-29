const NotificationTemplate = require('../models/notificationTemplates');
const { createAuditLog } = require('../helpers/auditLogHelper');

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

// GET all notification templates with pagination and filtering
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

// GET notification template by ID
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