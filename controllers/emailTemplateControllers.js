const EmailTemplate = require("../models/emailTemplate"); // Import the EmailTemplate model
const logEvent = require('../helper/logEvent');

/**
 * @swagger
 * components:
 *   schemas:
 *     EmailTemplate:
 *       type: object
 *       required:
 *         - name
 *         - subject
 *         - body
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique email template ID
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           description: Template name
 *         subject:
 *           type: string
 *           description: Email subject line
 *         body:
 *           type: string
 *           description: Email body content (HTML)
 *         variables:
 *           type: object
 *           description: Template variables for personalization
 *         createdBy:
 *           type: string
 *           format: ObjectId
 *           description: User ID who created the template
 *         organization:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether template is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Template creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Template last update timestamp
 */

/**
 * @swagger
 * /api/email-templates/create:
 *   post:
 *     summary: Create a new email template
 *     tags: [Email Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - subject
 *               - body
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Template name
 *                 example: "Welcome Email"
 *               subject:
 *                 type: string
 *                 description: Email subject line
 *                 example: "Welcome to our platform!"
 *               body:
 *                 type: string
 *                 description: Email body content (HTML)
 *                 example: "<h1>Welcome!</h1><p>Hello {{firstName}}, thank you for joining us.</p>"
 *               variables:
 *                 type: object
 *                 description: Template variables for personalization
 *                 example: {"firstName": "string", "company": "string"}
 *               createdBy:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID who created the template
 *                 example: "507f1f77bcf86cd799439011"
 *               organization:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Email template created successfully
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
 *                   example: "Email template created successfully"
 *                 template:
 *                   $ref: '#/components/schemas/EmailTemplate'
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
 *                   example: "Name, subject, and body are required fields"
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
 *                   example: "Failed to create email template"
 */
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
      await logEvent({
        action: 'Email Template Created',
        user: req.user?._id || createdBy,
        resource: 'emailTemplate',
        resourceId: savedEmailTemplate._id,
        details: {
          name: savedEmailTemplate.name,
          subject: savedEmailTemplate.subject,
          organization: savedEmailTemplate.organization
        },
        organization: req.user?.organization || savedEmailTemplate.organization,
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

/**
 * @swagger
 * /api/email-templates/all:
 *   get:
 *     summary: Get all email templates
 *     tags: [Email Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email templates retrieved successfully
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
 *                     $ref: '#/components/schemas/EmailTemplate'
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
 *                   example: "Failed to retrieve email templates"
 */
// GET all email templates
exports.getAllEmailTemplates = async (req, res) => {
  try {
    console.log('=== GET ALL EMAIL TEMPLATES CONTROLLER DEBUG ===');
    console.log('🔍 Request user:', req.user);
    console.log('🔍 User ID:', req.user?._id);
    console.log('🔍 User role:', req.user?.role);
    console.log('🔍 User email:', req.user?.email);
    
    const emailTemplates = await EmailTemplate.find()
      .populate("createdBy organization", "name") // Populate fields with related data
      .exec();
    
    console.log('✅ Found email templates:', emailTemplates.length);
    console.log('🔍 Templates:', emailTemplates.map(t => ({ id: t._id, name: t.name, organization: t.organization })));
    console.log('=== GET ALL EMAIL TEMPLATES CONTROLLER DEBUG END ===');
    
    res.status(200).json({ success: true, emailTemplates });
  } catch (error) {
    console.log('❌ GET ALL EMAIL TEMPLATES CONTROLLER ERROR ===');
    console.log('🔍 Error:', error.message);
    console.log('🔍 Stack:', error.stack);
    console.log('=== GET ALL EMAIL TEMPLATES CONTROLLER ERROR END ===');
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve email templates" });
  }
};

/**
 * @swagger
 * /api/email-templates/organization/{organizationId}:
 *   get:
 *     summary: Get email templates by organization
 *     tags: [Email Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Email templates retrieved successfully
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
 *                     $ref: '#/components/schemas/EmailTemplate'
 *       400:
 *         description: Bad request - Invalid organization ID
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
 *                   example: "Invalid organization ID"
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
 *                   example: "Failed to retrieve email templates"
 */
// GET email templates by organization
exports.getEmailTemplatesByOrganization = async (req, res) => {
  const { organizationId } = req.params; // Assuming organizationId is passed in the URL

  try {
    console.log('=== GET EMAIL TEMPLATES BY ORGANIZATION CONTROLLER DEBUG ===');
    console.log('🔍 Request user:', req.user);
    console.log('🔍 User ID:', req.user?._id);
    console.log('🔍 User role:', req.user?.role);
    console.log('🔍 User organizationId:', req.user?.organizationId);
    console.log('🔍 Requested organizationId:', organizationId);
    console.log('🔍 Params:', req.params);
    
    const emailTemplates = await EmailTemplate.find({ organization: organizationId })
      .populate("createdBy", "name") // Populate the createdBy field with the user's name
      .exec();

    console.log('✅ Found email templates for organization:', emailTemplates.length);
    console.log('🔍 Templates:', emailTemplates.map(t => ({ id: t._id, name: t.name, organization: t.organization })));
    console.log('=== GET EMAIL TEMPLATES BY ORGANIZATION CONTROLLER DEBUG END ===');

    // Return empty array instead of 404 when no templates found
    res.status(200).json({ success: true, emailTemplates });
  } catch (error) {
    console.log('❌ GET EMAIL TEMPLATES BY ORGANIZATION CONTROLLER ERROR ===');
    console.log('🔍 Error:', error.message);
    console.log('🔍 Stack:', error.stack);
    console.log('=== GET EMAIL TEMPLATES BY ORGANIZATION CONTROLLER ERROR END ===');
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve email templates by organization" });
  }
};

/**
 * @swagger
 * /api/email-templates/get/{emailTemplateId}:
 *   get:
 *     summary: Get a specific email template by ID
 *     tags: [Email Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emailTemplateId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Email template ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Email template retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 template:
 *                   $ref: '#/components/schemas/EmailTemplate'
 *       400:
 *         description: Bad request - Invalid template ID
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
 *                   example: "Invalid template ID"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Email template not found
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
 *                   example: "Email template not found"
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
 *                   example: "Failed to retrieve email template"
 */
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

/**
 * @swagger
 * /api/email-templates/update/{emailTemplateId}:
 *   patch:
 *     summary: Update an existing email template
 *     tags: [Email Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emailTemplateId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Email template ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Template name
 *                 example: "Updated Welcome Email"
 *               subject:
 *                 type: string
 *                 description: Email subject line
 *                 example: "Updated welcome message"
 *               body:
 *                 type: string
 *                 description: Email body content (HTML)
 *                 example: "<h1>Updated Welcome!</h1><p>Hello {{firstName}}, welcome back!</p>"
 *               variables:
 *                 type: object
 *                 description: Template variables for personalization
 *                 example: {"firstName": "string", "company": "string", "lastName": "string"}
 *               isActive:
 *                 type: boolean
 *                 description: Whether template is active
 *                 example: true
 *     responses:
 *       200:
 *         description: Email template updated successfully
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
 *                   example: "Email template updated successfully"
 *                 template:
 *                   $ref: '#/components/schemas/EmailTemplate'
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
 *         description: Email template not found
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
 *                   example: "Email template not found"
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
 *                   example: "Failed to update email template"
 */
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
    await logEvent({
      action: 'Email Template Updated',
      user: req.user?._id,
      resource: 'emailTemplate',
      resourceId: updatedEmailTemplate._id,
      details: {
        name: updatedEmailTemplate.name,
        subject: updatedEmailTemplate.subject,
        updatedFields: Object.keys(req.body),
        organization: updatedEmailTemplate.organization
      },
      organization: req.user?.organization || updatedEmailTemplate.organization,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ success: true, emailTemplate: updatedEmailTemplate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update email template" });
  }
};

/**
 * @swagger
 * /api/email-templates/delete/{emailTemplateId}:
 *   delete:
 *     summary: Delete an email template
 *     tags: [Email Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emailTemplateId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Email template ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Email template deleted successfully
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
 *                   example: "Email template deleted successfully"
 *       400:
 *         description: Bad request - Invalid template ID
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
 *                   example: "Invalid template ID"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Email template not found
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
 *                   example: "Email template not found"
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
 *                   example: "Failed to delete email template"
 */
// DELETE an email template
exports.deleteEmailTemplate = async (req, res) => {
  const { emailTemplateId } = req.params;
  try {
    const emailTemplateToDelete = await EmailTemplate.findById(emailTemplateId);
    if (!emailTemplateToDelete) {
      return res.status(404).json({ success: false, message: "Email template not found" });
    }

    // ✅ AUDIT LOG: Email Template Deleted
    await logEvent({
      action: 'Email Template Deleted',
      user: req.user?._id,
      resource: 'emailTemplate',
      resourceId: emailTemplateId,
      details: {
        name: emailTemplateToDelete.name,
        subject: emailTemplateToDelete.subject,
        organization: emailTemplateToDelete.organization
      },
      organization: req.user?.organization || emailTemplateToDelete.organization,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      severity: 'warning'
    });

    await EmailTemplate.findByIdAndDelete(emailTemplateId);
    res.status(200).json({ success: true, message: "Email template deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete email template" });
  }
};
