const EmailTemplate = require("../models/emailTemplate"); // Import the EmailTemplate model
const { createAuditLog, logCRUDOperation } = require('../helpers/auditLogHelper');

// CREATE a new email template
exports.createEmailTemplate = async (req, res) => {
  try {
    console.log('=== EMAIL TEMPLATE CREATION START ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', req.headers);
    
    const { name, subject, body, variables, createdBy, organization } = req.body;
    console.log('=== EMAIL TEMPLATE CREATION DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User object:', req.user);
    console.log('Extracted fields:', { name, subject, body, variables, createdBy, organization });
    
    // Validate required fields
    if (!name || !subject || !body) {
      console.log('Missing required fields:', { name: !!name, subject: !!subject, body: !!body });
      return res.status(400).json({
        success: false,
        message: "Name, subject, and body are required fields"
      });
    }
    
    // Validate template name format
    if (name.length < 3 || name.length > 100) {
      console.log('Invalid name length:', name.length);
      return res.status(400).json({
        success: false,
        message: "Template name must be between 3 and 100 characters"
      });
    }

    // Validate ObjectIds
    const mongoose = require('mongoose');
    if (createdBy && !mongoose.Types.ObjectId.isValid(createdBy)) {
      console.log('Invalid createdBy ObjectId:', createdBy);
      return res.status(400).json({
        success: false,
        message: "Invalid createdBy ID format"
      });
    }
    
    if (organization && !mongoose.Types.ObjectId.isValid(organization)) {
      console.log('Invalid organization ObjectId:', organization);
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID format"
      });
    }

    const emailTemplateData = {
      name,
      subject,
      body,
      createdBy,
    };

    // Add variables if provided and not empty
    if (variables && Object.keys(variables).length > 0) {
      emailTemplateData.variables = variables;
      console.log('Variables added:', variables);
    }

    // Only add the organization field if it's provided
    if (organization) {
      emailTemplateData.organization = organization;
      console.log('Organization added:', organization);
    }

    console.log('Email template data to save:', emailTemplateData);
    
    // Check database connection
    console.log('Database connection state:', mongoose.connection.readyState);
    
    const newEmailTemplate = new EmailTemplate(emailTemplateData);
    console.log('EmailTemplate model created successfully');
    
    const savedEmailTemplate = await newEmailTemplate.save();
    console.log('Email template saved successfully:', savedEmailTemplate._id);
    
    // ✅ AUDIT LOG: Email Template Created
    try {
      console.log('Attempting to create audit log...');
      await createAuditLog({
        action: 'Email Template Created',
        user: req.user?._id || createdBy,
        resource: 'emailTemplate',
        resourceId: savedEmailTemplate._id,
        details: {
          name: savedEmailTemplate.name,
          subject: savedEmailTemplate.subject,
          organization: savedEmailTemplate.organization,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        organization: req.user?.organization || savedEmailTemplate.organization,
        severity: 'info',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      console.log('Audit log created successfully');
    } catch (auditError) {
      console.error('Audit log error (non-blocking):', auditError);
      // Don't fail the main operation if audit logging fails
    }
    
    console.log('=== EMAIL TEMPLATE CREATION SUCCESS ===');
    res.status(201).json({ success: true, emailTemplate: savedEmailTemplate });
  } catch (error) {
    console.error('=== EMAIL TEMPLATE ERROR DETAILS ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      console.log('Validation error details:', Object.values(error.errors).map(err => err.message));
      return res.status(400).json({ 
        success: false, 
        message: "Validation error", 
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      console.log('Duplicate key error');
      return res.status(400).json({ 
        success: false, 
        message: "Template name already exists" 
      });
    }
    
    if (error.name === 'CastError') {
      console.log('Cast error - invalid ObjectId');
      return res.status(400).json({ 
        success: false, 
        message: "Invalid ID format provided" 
      });
    }
    
    console.error('=== UNKNOWN ERROR - RETURNING 500 ===');
    res.status(500).json({ 
      success: false, 
      message: "Failed to create email template",
      error: error.message,
      errorName: error.name,
      errorCode: error.code
    });
  }
};


// GET all email templates
exports.getAllEmailTemplates = async (req, res) => {
  try {
    const emailTemplates = await EmailTemplate.find()
      .populate("createdBy organization", "name") // Populate fields with related data
      .exec();
    res.status(200).json({ success: true, emailTemplates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve email templates" });
  }
};

// GET email templates by organization
exports.getEmailTemplatesByOrganization = async (req, res) => {
  const { organizationId } = req.params; // Assuming organizationId is passed in the URL

  try {
    const emailTemplates = await EmailTemplate.find({ organization: organizationId })
      .populate("createdBy", "name") // Populate the createdBy field with the user's name
      .exec();

    if (!emailTemplates.length) {
      return res.status(404).json({ success: false, message: "No email templates found for this organization" });
    }

    res.status(200).json({ success: true, emailTemplates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve email templates by organization" });
  }
};

// GET a single email template by ID
exports.getEmailTemplateById = async (req, res) => {
  const { emailTemplateId } = req.params;
  try {
    const emailTemplate = await EmailTemplate.findById(emailTemplateId)
      .populate("createdBy organization", "name")
      .exec();
    if (!emailTemplate) {
      return res.status(404).json({ success: false, message: "Email template not found" });
    }
    res.status(200).json({ success: true, emailTemplate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve email template" });
  }
};

// UPDATE an existing email template
exports.updateEmailTemplate = async (req, res) => {
  const { emailTemplateId } = req.params;
  const { name, subject, body, variables, isActive } = req.body;

  try {
    const updatedEmailTemplate = await EmailTemplate.findByIdAndUpdate(
      emailTemplateId,
      { name, subject, body, variables, isActive, updatedAt: Date.now() },
      { new: true } // return the updated email template
    );

    if (!updatedEmailTemplate) {
      return res.status(404).json({ success: false, message: "Email template not found" });
    }

    // ✅ AUDIT LOG: Email Template Updated
    await createAuditLog({
      action: 'Email Template Updated',
      user: req.user?._id,
      resource: 'emailTemplate',
      resourceId: updatedEmailTemplate._id,
      details: {
        name: updatedEmailTemplate.name,
        subject: updatedEmailTemplate.subject,
        updatedFields: Object.keys(req.body),
        organization: updatedEmailTemplate.organization,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization || updatedEmailTemplate.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ success: true, emailTemplate: updatedEmailTemplate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update email template" });
  }
};

// DELETE an email template
exports.deleteEmailTemplate = async (req, res) => {
  const { emailTemplateId } = req.params;
  try {
    const emailTemplateToDelete = await EmailTemplate.findById(emailTemplateId);
    if (!emailTemplateToDelete) {
      return res.status(404).json({ success: false, message: "Email template not found" });
    }

    // ✅ AUDIT LOG: Email Template Deleted
    await createAuditLog({
      action: 'Email Template Deleted',
      user: req.user?._id,
      resource: 'emailTemplate',
      resourceId: emailTemplateId,
      details: {
        name: emailTemplateToDelete.name,
        subject: emailTemplateToDelete.subject,
        organization: emailTemplateToDelete.organization,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization || emailTemplateToDelete.organization,
      severity: 'warning',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    await EmailTemplate.findByIdAndDelete(emailTemplateId);
    res.status(200).json({ success: true, message: "Email template deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete email template" });
  }
};
