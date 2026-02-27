const EmailTemplate = require("../models/emailTemplate"); // Import the EmailTemplate model
const logEvent = require('../helper/logEvent');
const { createAuditLog } = require('../helpers/auditLogHelper');
const { 
  getAllVariables, 
  getVariablesByCategory, 
  getVariableDefinition, 
  getNestedValue,
  extractVariablesFromContent 
} = require('../config/emailTemplateVariables');

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
 * /api/email/templates/create:
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
    const { name, subject, body, variables, createdBy, organization, store } = req.body;

    // Validate required fields
    if (!name || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Name, subject, and body are required fields"
      });
    }
    
    // Validate template name format
    if (name.length < 3 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Template name must be between 3 and 100 characters"
      });
    }

    // Validate ObjectIds
    const mongoose = require('mongoose');
    if (createdBy && !mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid createdBy ID format"
      });
    }
    
    if (organization && !mongoose.Types.ObjectId.isValid(organization)) {
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
    }

    // Only add the organization field if it's provided
    if (organization) {
      emailTemplateData.organization = organization;
    }

    // Only add the store field if it's provided
    if (store) {
      emailTemplateData.store = store;
    }

    const newEmailTemplate = new EmailTemplate(emailTemplateData);
    const savedEmailTemplate = await newEmailTemplate.save();
    
    try {
      await createAuditLog({
        action: 'Email Template Created',
        user: req.user?._id || req.user?.userId,
        resource: 'emailTemplate',
        resourceId: savedEmailTemplate._id,
        details: { name: savedEmailTemplate.name, subject: savedEmailTemplate.subject },
        organization: req.user?.organization || savedEmailTemplate.organization,
        severity: 'info',
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      });
    } catch (auditError) {
      // Don't fail the main operation if audit logging fails
    }
    
    res.status(201).json({ success: true, emailTemplate: savedEmailTemplate });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Validation error", 
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Template name already exists" 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid ID format provided" 
      });
    }
    
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
 * /api/email/templates/all:
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
    const emailTemplates = await EmailTemplate.find()
      .populate("createdBy organization", "name")
      .exec();

    res.status(200).json({ success: true, emailTemplates });
  } catch (error) {
    console.error('Failed to retrieve email templates:', error.message);
    res.status(500).json({ success: false, message: "Failed to retrieve email templates" });
  }
};

/**
 * @swagger
 * /api/email/templates/organization/{organizationId}:
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
// GET email templates by organization (with optional store filter)
exports.getEmailTemplatesByOrganization = async (req, res) => {
  const { organizationId } = req.params; // Assuming organizationId is passed in the URL
  const { storeId } = req.query;

  try {
    // Build query with optional store filter
    const query = { organization: organizationId };
    if (storeId && storeId !== 'all') {
      query.store = storeId;
    }

    const emailTemplates = await EmailTemplate.find(query)
      .populate("createdBy", "name") // Populate the createdBy field with the user's name
      .populate("store", "name") // Populate store field
      .exec();

    // Return empty array instead of 404 when no templates found
    res.status(200).json({ success: true, emailTemplates });
  } catch (error) {
    console.error('Failed to retrieve email templates by organization:', error.message);
    res.status(500).json({ success: false, message: "Failed to retrieve email templates by organization" });
  }
};

/**
 * @swagger
 * /api/email/templates/get/{emailTemplateId}:
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
 * /api/email/templates/update/{emailTemplateId}:
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
    await createAuditLog({
      action: 'Email Template Updated',
      user: req.user?._id || req.user?.userId,
      resource: 'emailTemplate',
      resourceId: updatedEmailTemplate._id,
      details: { name: updatedEmailTemplate.name, subject: updatedEmailTemplate.subject },
      organization: req.user?.organization || updatedEmailTemplate.organization,
      severity: 'info',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({ success: true, emailTemplate: updatedEmailTemplate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update email template" });
  }
};

/**
 * @swagger
 * /api/email/templates/delete/{emailTemplateId}:
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
    await createAuditLog({
      action: 'Email Template Deleted',
      user: req.user?._id || req.user?.userId,
      resource: 'emailTemplate',
      resourceId: emailTemplateToDelete._id,
      details: { name: emailTemplateToDelete.name, subject: emailTemplateToDelete.subject },
      organization: req.user?.organization || emailTemplateToDelete.organization,
      severity: 'info',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    await EmailTemplate.findByIdAndDelete(emailTemplateId);
    res.status(200).json({ success: true, message: "Email template deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete email template" });
  }
};

/**
 * @swagger
 * /api/email/templates/variables:
 *   get:
 *     summary: Get all available variables for email templates
 *     tags: [Email Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available variables retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     variables:
 *                       type: object
 *                       description: All available variables
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Available variable categories
 *                     totalVariables:
 *                       type: integer
 *                       description: Total number of available variables
 *       500:
 *         description: Server error
 */
// Get all available variables for email templates
exports.getAvailableVariables = async (req, res) => {
  try {
    const variables = getAllVariables();
    const categories = Object.keys(require('../config/emailTemplateVariables').CUSTOMER_FIELD_VARIABLES);
    
    res.status(200).json({
      success: true,
      data: {
        variables,
        categories,
        totalVariables: Object.keys(variables).length
      }
    });
  } catch (error) {
    console.error('Error getting available variables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available variables'
    });
  }
};

/**
 * @swagger
 * /api/email/templates/validate-variables:
 *   post:
 *     summary: Validate template variables against available variables
 *     tags: [Email Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               templateContent:
 *                 type: string
 *                 description: Template content to validate
 *                 example: "Hello {{first_name}}, welcome to {{billing_company}}!"
 *               variables:
 *                 type: object
 *                 description: Variables defined in template
 *                 example: {"first_name": {...}, "billing_company": {...}}
 *     responses:
 *       200:
 *         description: Variables validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: array
 *                       description: Valid variables
 *                     invalid:
 *                       type: array
 *                       description: Invalid variable names
 *                     missing:
 *                       type: array
 *                       description: Variables used in content but not defined
 *       500:
 *         description: Server error
 */
// Validate template variables against available variables
exports.validateTemplateVariables = async (req, res) => {
  try {
    const { templateContent, variables } = req.body;
    
    const validationResults = {
      valid: [],
      invalid: [],
      missing: []
    };
    
    // Check each variable in the template
    for (const [varName, varDef] of Object.entries(variables || {})) {
      const definition = getVariableDefinition(varName);
      if (definition) {
        validationResults.valid.push({
          name: varName,
          definition
        });
      } else {
        validationResults.invalid.push(varName);
      }
    }
    
    // Extract variables from template content
    const contentVariables = extractVariablesFromContent(templateContent);
    const definedVariables = Object.keys(variables || {});
    
    // Find variables used in content but not defined
    contentVariables.forEach(varName => {
      if (!definedVariables.includes(varName)) {
        validationResults.missing.push(varName);
      }
    });
    
    res.status(200).json({
      success: true,
      data: validationResults
    });
  } catch (error) {
    console.error('Error validating template variables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate template variables'
    });
  }
};
