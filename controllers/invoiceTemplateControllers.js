const InvoiceTemplate = require('../models/InvoiceTemplate');
const ReceiptTemplate = require('../models/ReceiptTemplate');
const Organization = require('../models/organization');
const { createAuditLog } = require('../helpers/auditLogHelper');
const cloudinary = require('cloudinary').v2;
const cloudinaryConfig = require('../config/cloudinary');

// Configure Cloudinary
cloudinary.config(cloudinaryConfig);

/**
 * @swagger
 * components:
 *   schemas:
 *     InvoiceTemplate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique invoice template ID
 *         name:
 *           type: string
 *           description: Template name
 *         userId:
 *           type: string
 *           format: ObjectId
 *           description: User ID who created the template (required for user-created templates, optional for system defaults)
 *         templateType:
 *           type: string
 *           enum: [professional, modern, minimal, classic, creative, custom]
 *           default: professional
 *           description: Template style type
 *         isDefault:
 *           type: boolean
 *           default: false
 *           description: Whether this is the default template
 *         isSystemDefault:
 *           type: boolean
 *           default: false
 *           description: Whether this is a system-wide default template
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether template is active
 *         companyInfo:
 *           type: object
 *           description: Company information for the template
 *           properties:
 *             name:
 *               type: string
 *               description: Company name
 *             email:
 *               type: string
 *               format: email
 *               description: Company email
 *             phone:
 *               type: string
 *               description: Company phone
 *             address:
 *               type: object
 *               description: Company address
 *               properties:
 *                 street:
 *                   type: string
 *                   description: Street address
 *                 city:
 *                   type: string
 *                   description: City
 *                 state:
 *                   type: string
 *                   description: State/Province
 *                 zipCode:
 *                   type: string
 *                   description: ZIP/Postal code
 *                 country:
 *                   type: string
 *                   description: Country
 *             website:
 *               type: string
 *               description: Company website
 *             logo:
 *               type: string
 *               description: Company logo URL
 *         design:
 *           type: object
 *           description: Template design settings
 *           properties:
 *             primaryColor:
 *               type: string
 *               default: "#000000"
 *               description: Primary brand color
 *             secondaryColor:
 *               type: string
 *               default: "#666666"
 *               description: Secondary color
 *             backgroundColor:
 *               type: string
 *               default: "#ffffff"
 *               description: Background color
 *             fontFamily:
 *               type: string
 *               default: "Arial, sans-serif"
 *               description: Font family
 *             fontSize:
 *               type: number
 *               default: 12
 *               description: Base font size
 *             headerFontSize:
 *               type: number
 *               default: 18
 *               description: Header font size
 *             footerFontSize:
 *               type: number
 *               default: 10
 *               description: Footer font size
 *         layout:
 *           type: object
 *           description: Template layout configuration
 *           properties:
 *             showLogo:
 *               type: boolean
 *               default: true
 *               description: Show/hide company logo
 *             logoPosition:
 *               type: string
 *               enum: [top-left, top-right, top-center]
 *               default: top-left
 *               description: Logo position
 *             showCompanyInfo:
 *               type: boolean
 *               default: true
 *               description: Show/hide company information
 *             showCustomerInfo:
 *               type: boolean
 *               default: true
 *               description: Show/hide customer information
 *             showItemsTable:
 *               type: boolean
 *               default: true
 *               description: Show/hide items table
 *             showTotals:
 *               type: boolean
 *               default: true
 *               description: Show/hide totals section
 *             showTerms:
 *               type: boolean
 *               default: true
 *               description: Show/hide terms and conditions
 *             showNotes:
 *               type: boolean
 *               default: true
 *               description: Show/hide notes section
 *             showFooter:
 *               type: boolean
 *               default: true
 *               description: Show/hide footer
 *         content:
 *           type: object
 *           description: Template content structure
 *           properties:
 *             headerText:
 *               type: string
 *               description: Custom header text
 *             footerText:
 *               type: string
 *               description: Custom footer text
 *             defaultTerms:
 *               type: string
 *               description: Default terms and conditions
 *             defaultNotes:
 *               type: string
 *               description: Default notes
 *             currencySymbol:
 *               type: string
 *               default: "$"
 *               description: Currency symbol
 *             dateFormat:
 *               type: string
 *               default: "MM/DD/YYYY"
 *               description: Date format
 *         fields:
 *           type: object
 *           description: Template field display configuration
 *           properties:
 *             showInvoiceNumber:
 *               type: boolean
 *               default: true
 *               description: Show/hide invoice number
 *             showIssueDate:
 *               type: boolean
 *               default: true
 *               description: Show/hide issue date
 *             showDueDate:
 *               type: boolean
 *               default: true
 *               description: Show/hide due date
 *             showCustomerAddress:
 *               type: boolean
 *               default: true
 *               description: Show/hide customer address
 *             showCustomerEmail:
 *               type: boolean
 *               default: true
 *               description: Show/hide customer email
 *             showCustomerPhone:
 *               type: boolean
 *               default: true
 *               description: Show/hide customer phone
 *             showItemDescription:
 *               type: boolean
 *               default: true
 *               description: Show/hide item descriptions
 *             showItemQuantity:
 *               type: boolean
 *               default: true
 *               description: Show/hide item quantities
 *             showItemUnitPrice:
 *               type: boolean
 *               default: true
 *               description: Show/hide unit prices
 *             showItemTotal:
 *               type: boolean
 *               default: true
 *               description: Show/hide item totals
 *             showSubtotal:
 *               type: boolean
 *               default: true
 *               description: Show/hide subtotal
 *             showTax:
 *               type: boolean
 *               default: true
 *               description: Show/hide tax amount
 *             showDiscount:
 *               type: boolean
 *               default: true
 *               description: Show/hide discount amount
 *             showTotal:
 *               type: boolean
 *               default: true
 *               description: Show/hide total amount
 *         createdBy:
 *           type: string
 *           format: ObjectId
 *           description: User ID who created the template (required for user-created templates, optional for system defaults)
 *         updatedBy:
 *           type: string
 *           format: ObjectId
 *           description: User ID who last updated the template
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Template creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Template last update timestamp
 *     
 *     ReceiptTemplate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique receipt template ID
 *         name:
 *           type: string
 *           description: Template name
 *         userId:
 *           type: string
 *           format: ObjectId
 *           description: User ID who created the template (required for user-created templates, optional for system defaults)
 *         templateType:
 *           type: string
 *           enum: [professional, modern, minimal, classic, creative, custom]
 *           default: professional
 *           description: Template style type
 *         isDefault:
 *           type: boolean
 *           default: false
 *           description: Whether this is the default template
 *         isSystemDefault:
 *           type: boolean
 *           default: false
 *           description: Whether this is a system-wide default template
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether template is active
 *         companyInfo:
 *           type: object
 *           description: Company information for the template
 *         design:
 *           type: object
 *           description: Template design settings
 *         layout:
 *           type: object
 *           description: Template layout configuration
 *         content:
 *           type: object
 *           description: Template content structure
 *         fields:
 *           type: object
 *           description: Template field mappings
 *         createdBy:
 *           type: string
 *           format: ObjectId
 *           description: User ID who created the template (required for user-created templates, optional for system defaults)
 *         updatedBy:
 *           type: string
 *           format: ObjectId
 *           description: User ID who last updated the template
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Template creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Template last update timestamp
 */

// ==================== INVOICE TEMPLATES ====================

/**
 * @swagger
 * /api/invoice/templates/invoice/create:
 *   post:
 *     summary: Create a new invoice template
 *     tags: [Invoice Templates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - userId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *                 example: "Professional Invoice Template"
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID who created the template
 *                 example: "507f1f77bcf86cd799439011"
 *               templateType:
 *                 type: string
 *                 enum: [professional, casual, modern, classic]
 *                 default: professional
 *                 description: Template style type
 *                 example: "professional"
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is the default template
 *                 example: false
 *               companyInfo:
 *                 type: object
 *                 description: Company information for the template
 *                 example: {"name": "My Company", "address": "123 Business St", "phone": "+1-555-0123", "email": "contact@mycompany.com"}
 *               design:
 *                 type: object
 *                 description: Template design settings
 *                 example: {"colors": {"primary": "#007bff"}, "fonts": {"heading": "Arial"}}
 *               layout:
 *                 type: object
 *                 description: Template layout configuration
 *                 example: {"header": {"height": "100px"}, "body": {"margin": "20px"}}
 *               content:
 *                 type: object
 *                 description: Template content structure
 *                 example: {"sections": ["header", "customer", "items", "totals", "footer"]}
 *               fields:
 *                 type: object
 *                 description: Template field mappings
 *                 example: {"customer": {"name": "customerName"}, "items": {"table": "itemsTable"}}
 *     responses:
 *       201:
 *         description: Invoice template created successfully
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
 *                   example: "Invoice template created successfully"
 *                 template:
 *                   $ref: '#/components/schemas/InvoiceTemplate'
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
 *                   example: "Missing required fields: name, userId"
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
 *                   example: "Error creating invoice template"
 */

/**
 * @swagger
 * /api/invoice/templates/invoice/list:
 *   get:
 *     summary: Get all active invoice templates
 *     tags: [Invoice Templates]
 *     responses:
 *       200:
 *         description: Invoice templates retrieved successfully
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
 *                     $ref: '#/components/schemas/InvoiceTemplate'
 *                 count:
 *                   type: integer
 *                   example: 5
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/invoice/templates/invoice/{id}:
 *   get:
 *     summary: Get a single invoice template by ID
 *     tags: [Invoice Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Invoice template ID
 *       - in: query
 *     responses:
 *       200:
 *         description: Invoice template retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 template:
 *                   $ref: '#/components/schemas/InvoiceTemplate'
 *       404:
 *         description: Invoice template not found
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/invoice/templates/invoice/{id}:
 *   put:
 *     summary: Update an invoice template
 *     tags: [Invoice Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Invoice template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 required: true
 *                 description: User ID making the update
 *               name:
 *                 type: string
 *                 description: Updated template name
 *               templateType:
 *                 type: string
 *                 enum: [professional, casual, modern, classic]
 *                 description: Updated template type
 *               companyInfo:
 *                 type: object
 *                 description: Updated company information
 *               design:
 *                 type: object
 *                 description: Updated design settings
 *               layout:
 *                 type: object
 *                 description: Updated layout configuration
 *               content:
 *                 type: object
 *                 description: Updated content structure
 *               fields:
 *                 type: object
 *                 description: Updated field mappings
 *     responses:
 *       200:
 *         description: Invoice template updated successfully
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
 *                   example: "Invoice template updated successfully"
 *                 template:
 *                   $ref: '#/components/schemas/InvoiceTemplate'
 *       404:
 *         description: Invoice template not found
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/invoice/templates/invoice/{id}:
 *   delete:
 *     summary: Delete an invoice template
 *     tags: [Invoice Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Invoice template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID deleting the template
 *     responses:
 *       200:
 *         description: Invoice template deleted successfully
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
 *                   example: "Invoice template deleted successfully"
 *       404:
 *         description: Invoice template not found
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/invoice/templates/invoice/{id}/set-default:
 *   post:
 *     summary: Set an invoice template as default
 *     tags: [Invoice Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Invoice template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID setting the default
 *     responses:
 *       200:
 *         description: Default invoice template set successfully
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
 *                   example: "Default invoice template set successfully"
 *                 template:
 *                   $ref: '#/components/schemas/InvoiceTemplate'
 *       404:
 *         description: Invoice template not found
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

// CREATE invoice template
exports.createInvoiceTemplate = async (req, res) => {
  try {
    const {
      name,
      userId,
      templateType,
      isDefault,
      companyInfo,
      design,
      layout,
      content,
      fields
    } = req.body;

    // Validate required fields - only name and userId needed now
    const requiredFields = ['name', 'userId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Create new invoice template (global)
    const newTemplate = new InvoiceTemplate({
      name,
      userId,
      templateType: templateType || 'professional',
      isDefault: isDefault || false,
      companyInfo: companyInfo || {},
      design: design || {},
      layout: layout || {},
      content: content || {},
      fields: fields || {},
      createdBy: userId,
      updatedBy: userId
    });

    const savedTemplate = await newTemplate.save();

    // Create audit log
    await createAuditLog({
      action: 'INVOICE_TEMPLATE_CREATED',
      user: userId,
      resource: 'InvoiceTemplate',
      resourceId: savedTemplate._id,
      details: {
        name: savedTemplate.name,
        templateType: savedTemplate.templateType
      },
    });

    res.status(201).json({
      success: true,
      message: 'Invoice template created successfully',
      template: savedTemplate
    });

  } catch (error) {
    console.error('Error creating invoice template:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating invoice template',
      error: error.message
    });
  }
};

// GET all invoice templates (global - accessible by all users)
exports.getInvoiceTemplates = async (req, res) => {
  try {
    // Get all active templates - no queries needed
    const templates = await InvoiceTemplate.find({ isActive: true })
      .populate('userId', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      templates,
      count: templates.length
    });

  } catch (error) {
    console.error('Error fetching invoice templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice templates',
      error: error.message
    });
  }
};

// GET single invoice template by ID (global access)
exports.getInvoiceTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    // All templates are now global - no organizationId needed
    const template = await InvoiceTemplate.findById(id)
      .populate('userId', 'fullName email')
      .populate('updatedBy', 'fullName email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Invoice template not found'
      });
    }

    res.status(200).json({
      success: true,
      template
    });

  } catch (error) {
    console.error('Error fetching invoice template:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice template',
      error: error.message
    });
  }
};

// UPDATE invoice template
exports.updateInvoiceTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const updateData = { ...req.body, updatedBy: userId };
    delete updateData.userId; // Remove from update data

    const template = await InvoiceTemplate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Invoice template not found'
      });
    }

    // Create audit log
    await createAuditLog({
      action: 'INVOICE_TEMPLATE_UPDATED',
      user: userId,
      resource: 'InvoiceTemplate',
      resourceId: template._id,
      details: {
        name: template.name,
        changes: req.body
      },
    });

    res.status(200).json({
      success: true,
      message: 'Invoice template updated successfully',
      template
    });

  } catch (error) {
    console.error('Error updating invoice template:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating invoice template',
      error: error.message
    });
  }
};

// DELETE invoice template
exports.deleteInvoiceTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const template = await InvoiceTemplate.findByIdAndDelete(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Invoice template not found'
      });
    }

    // Create audit log
    await createAuditLog({
      action: 'INVOICE_TEMPLATE_DELETED',
      user: userId,
      resource: 'InvoiceTemplate',
      resourceId: template._id,
      details: {
        name: template.name
      },
    });

    res.status(200).json({
      success: true,
      message: 'Invoice template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting invoice template:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting invoice template',
      error: error.message
    });
  }
};

// SET default invoice template
exports.setDefaultInvoiceTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Find the template first
    const template = await InvoiceTemplate.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Invoice template not found'
      });
    }

    // Set as default - this will trigger the pre-save middleware to unset other defaults
    template.isDefault = true;
    template.updatedBy = userId;
    
    // Save the template (this will trigger the pre-save middleware)
    await template.save();

    // Create audit log
    await createAuditLog({
      action: 'INVOICE_TEMPLATE_SET_DEFAULT',
      user: userId,
      resource: 'InvoiceTemplate',
      resourceId: template._id,
      details: {
        name: template.name
      },
    });

    res.status(200).json({
      success: true,
      message: 'Default invoice template set successfully',
      template
    });

  } catch (error) {
    console.error('Error setting default invoice template:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting default invoice template',
      error: error.message
    });
  }
};

// ==================== RECEIPT TEMPLATES ====================

/**
 * @swagger
 * /api/invoice/templates/receipt/create:
 *   post:
 *     summary: Create a new receipt template
 *     tags: [Receipt Templates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - userId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *                 example: "Professional Receipt Template"
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID who created the template
 *                 example: "507f1f77bcf86cd799439011"
 *               templateType:
 *                 type: string
 *                 enum: [professional, casual, modern, classic]
 *                 default: professional
 *                 description: Template style type
 *                 example: "professional"
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is the default template
 *                 example: false
 *               companyInfo:
 *                 type: object
 *                 description: Company information for the template
 *                 example: {"name": "My Company", "address": "123 Business St", "phone": "+1-555-0123", "email": "contact@mycompany.com"}
 *               design:
 *                 type: object
 *                 description: Template design settings
 *                 example: {"colors": {"primary": "#007bff"}, "fonts": {"heading": "Arial"}}
 *               layout:
 *                 type: object
 *                 description: Template layout configuration
 *                 example: {"header": {"height": "100px"}, "body": {"margin": "20px"}}
 *               content:
 *                 type: object
 *                 description: Template content structure
 *                 example: {"sections": ["header", "customer", "items", "totals", "footer"]}
 *               fields:
 *                 type: object
 *                 description: Template field mappings
 *                 example: {"customer": {"name": "customerName"}, "items": {"table": "itemsTable"}}
 *     responses:
 *       201:
 *         description: Receipt template created successfully
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
 *                   example: "Receipt template created successfully"
 *                 template:
 *                   $ref: '#/components/schemas/ReceiptTemplate'
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
 *                   example: "Missing required fields: name, userId"
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
 *                   example: "Error creating receipt template"
 */

/**
 * @swagger
 * /api/invoice/templates/receipt/list:
 *   get:
 *     summary: Get all active receipt templates
 *     tags: [Receipt Templates]
 *     responses:
 *       200:
 *         description: Receipt templates retrieved successfully
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
 *                     $ref: '#/components/schemas/ReceiptTemplate'
 *                 count:
 *                   type: integer
 *                   example: 5
 *       500:
 *         description: Server error
 */

// CREATE receipt template
exports.createReceiptTemplate = async (req, res) => {
  try {
    const {
      name,
      userId,
      templateType,
      isDefault,
      companyInfo,
      design,
      layout,
      content,
      fields
    } = req.body;

    // Validate required fields - only name and userId needed now
    const requiredFields = ['name', 'userId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Create new receipt template (global)
    const newTemplate = new ReceiptTemplate({
      name,
      userId,
      templateType: templateType || 'professional',
      isDefault: isDefault || false,
      companyInfo: companyInfo || {},
      design: design || {},
      layout: layout || {},
      content: content || {},
      fields: fields || {},
      createdBy: userId,
      updatedBy: userId
    });

    const savedTemplate = await newTemplate.save();

    // Create audit log
    await createAuditLog({
      action: 'RECEIPT_TEMPLATE_CREATED',
      user: userId,
      resource: 'ReceiptTemplate',
      resourceId: savedTemplate._id,
      details: {
        name: savedTemplate.name,
        templateType: savedTemplate.templateType
      },
    });

    res.status(201).json({
      success: true,
      message: 'Receipt template created successfully',
      template: savedTemplate
    });

  } catch (error) {
    console.error('Error creating receipt template:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating receipt template',
      error: error.message
    });
  }
};

// GET all receipt templates
exports.getReceiptTemplates = async (req, res) => {
  try {
    // Get all active templates - no queries needed
    const templates = await ReceiptTemplate.find({ isActive: true })
      .populate('userId', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      templates,
      count: templates.length
    });

  } catch (error) {
    console.error('Error fetching receipt templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receipt templates',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/invoice/templates/receipt/{id}:
 *   get:
 *     summary: Get a single receipt template by ID
 *     tags: [Receipt Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Receipt template ID
 *       - in: query
 *     responses:
 *       200:
 *         description: Receipt template retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 template:
 *                   $ref: '#/components/schemas/ReceiptTemplate'
 *       404:
 *         description: Receipt template not found
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

// GET single receipt template by ID (global access)
exports.getReceiptTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    // All templates are now global - no organizationId needed
    const template = await ReceiptTemplate.findById(id)
      .populate('userId', 'fullName email')
      .populate('updatedBy', 'fullName email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Receipt template not found'
      });
    }

    res.status(200).json({
      success: true,
      template
    });

  } catch (error) {
    console.error('Error fetching receipt template:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receipt template',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/invoice/templates/receipt/{id}:
 *   put:
 *     summary: Update a receipt template
 *     tags: [Receipt Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Receipt template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 required: true
 *                 description: User ID making the update
 *               name:
 *                 type: string
 *                 description: Updated template name
 *               templateType:
 *                 type: string
 *                 enum: [professional, casual, modern, classic]
 *                 description: Updated template type
 *               companyInfo:
 *                 type: object
 *                 description: Updated company information
 *               design:
 *                 type: object
 *                 description: Updated design settings
 *               layout:
 *                 type: object
 *                 description: Updated layout configuration
 *               content:
 *                 type: object
 *                 description: Updated content structure
 *               fields:
 *                 type: object
 *                 description: Updated field mappings
 *     responses:
 *       200:
 *         description: Receipt template updated successfully
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
 *                   example: "Receipt template updated successfully"
 *                 template:
 *                   $ref: '#/components/schemas/ReceiptTemplate'
 *       404:
 *         description: Receipt template not found
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

// UPDATE receipt template
exports.updateReceiptTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const updateData = { ...req.body, updatedBy: userId };
    delete updateData.userId; // Remove from update data

    const template = await ReceiptTemplate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Receipt template not found'
      });
    }

    // Create audit log
    await createAuditLog({
      action: 'RECEIPT_TEMPLATE_UPDATED',
      user: userId,
      resource: 'ReceiptTemplate',
      resourceId: template._id,
      details: {
        name: template.name,
        changes: req.body
      },
    });

    res.status(200).json({
      success: true,
      message: 'Receipt template updated successfully',
      template
    });

  } catch (error) {
    console.error('Error updating receipt template:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating receipt template',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/invoice/templates/receipt/{id}:
 *   delete:
 *     summary: Delete a receipt template
 *     tags: [Receipt Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Receipt template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID deleting the template
 *     responses:
 *       200:
 *         description: Receipt template deleted successfully
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
 *                   example: "Receipt template deleted successfully"
 *       404:
 *         description: Receipt template not found
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

// DELETE receipt template
exports.deleteReceiptTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const template = await ReceiptTemplate.findByIdAndDelete(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Receipt template not found'
      });
    }

    // Create audit log
    await createAuditLog({
      action: 'RECEIPT_TEMPLATE_DELETED',
      user: userId,
      resource: 'ReceiptTemplate',
      resourceId: template._id,
      details: {
        name: template.name
      },
    });

    res.status(200).json({
      success: true,
      message: 'Receipt template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting receipt template:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting receipt template',
      error: error.message
    });
  }
};

// SET default receipt template
exports.setDefaultReceiptTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Find the template first
    const template = await ReceiptTemplate.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Receipt template not found'
      });
    }

    // Set as default - this will trigger the pre-save middleware to unset other defaults
    template.isDefault = true;
    template.updatedBy = userId;
    
    // Save the template (this will trigger the pre-save middleware)
    await template.save();

    // Create audit log
    await createAuditLog({
      action: 'RECEIPT_TEMPLATE_SET_DEFAULT',
      user: userId,
      resource: 'ReceiptTemplate',
      resourceId: template._id,
      details: {
        name: template.name
      },
    });

    res.status(200).json({
      success: true,
      message: 'Default receipt template set successfully',
      template
    });

  } catch (error) {
    console.error('Error setting default receipt template:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting default receipt template',
      error: error.message
    });
  }
};

// ==================== SYSTEM DEFAULT TEMPLATES ====================

/**
 * @swagger
 * /api/invoice/templates/system-defaults/invoice:
 *   get:
 *     summary: Get all system default invoice templates
 *     tags: [System Default Templates]
 *     parameters:
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *           enum: [professional, modern, minimal, classic, creative, custom]
 *         description: Filter by template type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: System default invoice templates retrieved successfully
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
 *                     $ref: '#/components/schemas/InvoiceTemplate'
 *                 count:
 *                   type: integer
 *                   example: 5
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/invoice/templates/system-defaults/receipt:
 *   get:
 *     summary: Get all system default receipt templates
 *     tags: [System Default Templates]
 *     parameters:
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *           enum: [professional, modern, minimal, classic, creative, custom]
 *         description: Filter by template type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: System default receipt templates retrieved successfully
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
 *                     $ref: '#/components/schemas/ReceiptTemplate'
 *                 count:
 *                   type: integer
 *                   example: 5
 *       500:
 *         description: Server error
 */

// GET system default invoice templates
exports.getSystemDefaultInvoiceTemplates = async (req, res) => {
  try {
    const { templateType, isActive } = req.query;

    // Build filter object for system defaults
    const filter = { isSystemDefault: true };
    
    if (templateType) filter.templateType = templateType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Execute query
    const templates = await InvoiceTemplate.find(filter)
      .sort({ templateType: 1, name: 1 });

    res.status(200).json({
      success: true,
      templates,
      count: templates.length
    });

  } catch (error) {
    console.error('Error fetching system default invoice templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system default invoice templates',
      error: error.message
    });
  }
};

// GET system default receipt templates
exports.getSystemDefaultReceiptTemplates = async (req, res) => {
  try {
    const { templateType, isActive } = req.query;

    // Build filter object for system defaults
    const filter = { isSystemDefault: true };
    
    if (templateType) filter.templateType = templateType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Execute query
    const templates = await ReceiptTemplate.find(filter)
      .sort({ templateType: 1, name: 1 });

    res.status(200).json({
      success: true,
      templates,
      count: templates.length
    });

  } catch (error) {
    console.error('Error fetching system default receipt templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system default receipt templates',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/invoice/templates/defaults/invoice:
 *   get:
 *     summary: Get all default invoice templates (organization + system defaults)
 *     tags: [Invoice Templates]
 *     parameters:
 *       - in: query
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *           enum: [professional, modern, minimal, classic, creative, custom]
 *         description: Filter by template type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Default invoice templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 organizationDefaults:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InvoiceTemplate'
 *                 systemDefaults:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InvoiceTemplate'
 *                 count:
 *                   type: number
 *       500:
 *         description: Server error
 */
// GET all default invoice templates (global defaults)
exports.getAllDefaultInvoiceTemplates = async (req, res) => {
  try {
    const { templateType, isActive } = req.query;

    // Build filter object for all defaults (no organizationId needed)
    const filter = { isDefault: true, isActive: true };
    
    if (templateType) {
      filter.templateType = templateType;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Get all default templates (global)
    const defaultTemplates = await InvoiceTemplate.find(filter)
      .populate('userId', 'fullName email')
      .sort({ templateType: 1, name: 1 });

    res.status(200).json({
      success: true,
      templates: defaultTemplates,
      count: defaultTemplates.length
    });

  } catch (error) {
    console.error('Error fetching all default invoice templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all default invoice templates',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/invoice/templates/defaults/receipt:
 *   get:
 *     summary: Get all default receipt templates (organization + system defaults)
 *     tags: [Receipt Templates]
 *     parameters:
 *       - in: query
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *           enum: [professional, modern, minimal, classic, creative, custom]
 *         description: Filter by template type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Default receipt templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 organizationDefaults:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReceiptTemplate'
 *                 systemDefaults:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReceiptTemplate'
 *                 count:
 *                   type: number
 *       500:
 *         description: Server error
 */
// GET all default receipt templates (global defaults)
exports.getAllDefaultReceiptTemplates = async (req, res) => {
  try {
    const { templateType, isActive } = req.query;

    // Build filter object for all defaults (no organizationId needed)
    const filter = { isDefault: true, isActive: true };
    
    if (templateType) {
      filter.templateType = templateType;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Get all default templates (global)
    const defaultTemplates = await ReceiptTemplate.find(filter)
      .populate('userId', 'fullName email')
      .sort({ templateType: 1, name: 1 });

    res.status(200).json({
      success: true,
      templates: defaultTemplates,
      count: defaultTemplates.length
    });

  } catch (error) {
    console.error('Error fetching all default receipt templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all default receipt templates',
      error: error.message
    });
  }
};

// ==================== ORGANIZATION TEMPLATE ENDPOINTS ====================

/**
 * @swagger
 * /api/invoice/templates/organization/{organizationId}/default:
 *   get:
 *     summary: Get organization's default invoice template with customizations
 *     tags: [Invoice Templates]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization's default template retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 template:
 *                   type: object
 *                   description: Base template merged with organization customizations
 *                 organizationSettings:
 *                   type: object
 *                   description: Organization-specific customizations
 *       404:
 *         description: Organization or template not found
 *       500:
 *         description: Server error
 */
exports.getOrganizationDefaultTemplate = async (req, res) => {
  try {
    const { organizationId } = req.params;

    // Fetch organization with template reference
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check if organization has a default invoice template set
    const templateId = organization.invoiceSettings?.defaultInvoiceTemplate;

    if (!templateId) {
      return res.status(404).json({
        success: false,
        message: 'Organization has no default invoice template set'
      });
    }

    // Fetch the base template
    const baseTemplate = await InvoiceTemplate.findById(templateId);

    if (!baseTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Default template not found'
      });
    }

    // Get organization-specific customizations
    const orgSettings = organization.organizationTemplateSettings?.invoiceTemplate || {};

    // Merge base template with organization customizations
    const mergedTemplate = {
      _id: baseTemplate._id,
      name: baseTemplate.name,
      templateType: baseTemplate.templateType,
      isDefault: true,

      // Merge company info - org customizations override base template
      companyInfo: {
        name: orgSettings.storeInfo?.name || baseTemplate.companyInfo?.name,
        email: orgSettings.email || baseTemplate.companyInfo?.email,
        phone: orgSettings.customFields?.phone || baseTemplate.companyInfo?.phone,
        website: orgSettings.storeInfo?.website || baseTemplate.companyInfo?.website,
        logo: orgSettings.storeInfo?.logo || baseTemplate.companyInfo?.logo,
        address: {
          street: orgSettings.customFields?.address?.street || baseTemplate.companyInfo?.address?.street,
          city: orgSettings.customFields?.address?.city || baseTemplate.companyInfo?.address?.city,
          state: orgSettings.customFields?.address?.state || baseTemplate.companyInfo?.address?.state,
          zipCode: orgSettings.customFields?.address?.zipCode || baseTemplate.companyInfo?.address?.zipCode,
          country: orgSettings.customFields?.address?.country || baseTemplate.companyInfo?.address?.country
        }
      },

      // Merge design settings - org customizations override base template
      design: {
        ...baseTemplate.design,
        primaryColor: orgSettings.design?.primaryColor || baseTemplate.design?.primaryColor,
        secondaryColor: orgSettings.design?.secondaryColor || baseTemplate.design?.secondaryColor,
        backgroundColor: orgSettings.design?.backgroundColor || baseTemplate.design?.backgroundColor
      },

      // Merge layout settings - org customizations override base template
      layout: {
        ...baseTemplate.layout,
        logoPosition: orgSettings.layout?.logoPosition || baseTemplate.layout?.logoPosition
      },

      // Keep base template content and fields as-is
      content: baseTemplate.content,
      fields: baseTemplate.fields
    };

    res.status(200).json({
      success: true,
      template: mergedTemplate,
      organizationSettings: orgSettings
    });

  } catch (error) {
    console.error('Error fetching organization default template:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching organization default template',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/invoice/templates/organization/{organizationId}/settings:
 *   put:
 *     summary: Update organization's template customizations (company info, colors, etc.)
 *     tags: [Invoice Templates]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 required: true
 *                 description: User ID making the update
 *               companyName:
 *                 type: string
 *                 description: Company name
 *               email:
 *                 type: string
 *                 description: Company email
 *               phone:
 *                 type: string
 *                 description: Company phone
 *               address:
 *                 type: object
 *                 description: Company address
 *               website:
 *                 type: string
 *                 description: Company website
 *               logo:
 *                 type: string
 *                 description: Company logo URL
 *               primaryColor:
 *                 type: string
 *                 description: Primary brand color (hex)
 *               secondaryColor:
 *                 type: string
 *                 description: Secondary brand color (hex)
 *               logoPosition:
 *                 type: string
 *                 enum: [top-left, top-right, top-center]
 *                 description: Logo position
 *     responses:
 *       200:
 *         description: Organization template settings updated successfully
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
exports.updateOrganizationTemplateSettings = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const {
      userId,
      companyName,
      email,
      phone,
      address,
      website,
      logo,
      primaryColor,
      secondaryColor,
      logoPosition
    } = req.body;

    // Fetch organization
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Initialize organizationTemplateSettings if it doesn't exist
    if (!organization.organizationTemplateSettings) {
      organization.organizationTemplateSettings = {};
    }
    if (!organization.organizationTemplateSettings.invoiceTemplate) {
      organization.organizationTemplateSettings.invoiceTemplate = {};
    }

    const invoiceSettings = organization.organizationTemplateSettings.invoiceTemplate;

    // Update store info (company name, website, logo)
    if (!invoiceSettings.storeInfo) {
      invoiceSettings.storeInfo = {};
    }
    if (companyName !== undefined) invoiceSettings.storeInfo.name = companyName;
    if (website !== undefined) invoiceSettings.storeInfo.website = website;
    if (logo !== undefined) invoiceSettings.storeInfo.logo = logo;

    // Update email
    if (email !== undefined) {
      invoiceSettings.email = email;
    }

    // Update custom fields (phone, address)
    if (!invoiceSettings.customFields) {
      invoiceSettings.customFields = {};
    }
    if (phone !== undefined) {
      invoiceSettings.customFields.phone = phone;
    }
    if (address !== undefined) {
      invoiceSettings.customFields.address = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        country: address.country || ''
      };
    }

    // Update design settings (colors)
    if (!invoiceSettings.design) {
      invoiceSettings.design = {};
    }
    if (primaryColor !== undefined) invoiceSettings.design.primaryColor = primaryColor;
    if (secondaryColor !== undefined) invoiceSettings.design.secondaryColor = secondaryColor;

    // Update layout settings
    if (!invoiceSettings.layout) {
      invoiceSettings.layout = {};
    }
    if (logoPosition !== undefined) invoiceSettings.layout.logoPosition = logoPosition;

    // Save organization
    organization.organizationTemplateSettings.invoiceTemplate = invoiceSettings;
    organization.updatedAt = Date.now();
    await organization.save();

    // Create audit log
    await createAuditLog({
      action: 'ORGANIZATION_TEMPLATE_SETTINGS_UPDATED',
      user: userId,
      resource: 'Organization',
      resourceId: organization._id,
      details: {
        organizationName: organization.name,
        updatedSettings: {
          companyName,
          email,
          phone,
          address,
          website,
          logo,
          primaryColor,
          secondaryColor,
          logoPosition
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Organization template settings updated successfully',
      settings: organization.organizationTemplateSettings.invoiceTemplate
    });

  } catch (error) {
    console.error('Error updating organization template settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating organization template settings',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/invoice/templates/organization/{organizationId}/set-default/{templateId}:
 *   put:
 *     summary: Set organization's default invoice template
 *     tags: [Invoice Templates]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Template ID to set as default
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID making the update
 *     responses:
 *       200:
 *         description: Default template set successfully
 *       404:
 *         description: Organization or template not found
 *       500:
 *         description: Server error
 */
exports.setOrganizationDefaultTemplate = async (req, res) => {
  try {
    const { organizationId, templateId } = req.params;
    const { userId } = req.body;

    // Validate template exists
    const template = await InvoiceTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Fetch organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Initialize invoiceSettings if it doesn't exist
    if (!organization.invoiceSettings) {
      organization.invoiceSettings = {};
    }

    // Set the default invoice template reference
    organization.invoiceSettings.defaultInvoiceTemplate = templateId;
    organization.updatedAt = Date.now();
    await organization.save();

    // Create audit log
    await createAuditLog({
      action: 'ORGANIZATION_DEFAULT_TEMPLATE_SET',
      user: userId,
      resource: 'Organization',
      resourceId: organization._id,
      details: {
        organizationName: organization.name,
        templateId: templateId,
        templateName: template.name,
        templateType: template.templateType
      }
    });

    res.status(200).json({
      success: true,
      message: 'Default invoice template set successfully',
      organization: {
        _id: organization._id,
        name: organization.name,
        defaultTemplateId: templateId
      },
      template: {
        _id: template._id,
        name: template.name,
        templateType: template.templateType
      }
    });

  } catch (error) {
    console.error('Error setting organization default template:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting organization default template',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/invoice/templates/organization/{organizationId}/upload-logo:
 *   post:
 *     summary: Upload logo for organization's invoice template
 *     tags: [Invoice Templates]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - logo
 *               - userId
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo image file (PNG, JPG, JPEG, SVG)
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID uploading the logo
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
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
 *                   example: "Logo uploaded successfully"
 *                 logoUrl:
 *                   type: string
 *                   example: "https://res.cloudinary.com/xxx/invoice_template_logos/logo.png"
 *       400:
 *         description: No logo file uploaded or invalid file type
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
exports.uploadOrganizationTemplateLogo = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { userId } = req.body;

    // Check if logo file was uploaded
    if (!req.files || !req.files.logo) {
      return res.status(400).json({
        success: false,
        message: 'No logo file uploaded'
      });
    }

    const logoFile = req.files.logo;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'];
    if (!allowedTypes.includes(logoFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PNG, JPG, JPEG, and SVG files are allowed'
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (logoFile.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit'
      });
    }

    // Fetch organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Upload logo to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(logoFile.tempFilePath, {
      folder: 'invoice_template_logos',
      resource_type: 'auto'
    });

    // Initialize organizationTemplateSettings if needed
    if (!organization.organizationTemplateSettings) {
      organization.organizationTemplateSettings = {};
    }
    if (!organization.organizationTemplateSettings.invoiceTemplate) {
      organization.organizationTemplateSettings.invoiceTemplate = {};
    }
    if (!organization.organizationTemplateSettings.invoiceTemplate.storeInfo) {
      organization.organizationTemplateSettings.invoiceTemplate.storeInfo = {};
    }

    // Update logo URL
    organization.organizationTemplateSettings.invoiceTemplate.storeInfo.logo = uploadResult.secure_url;
    organization.updatedAt = Date.now();
    await organization.save();

    // Create audit log
    await createAuditLog({
      action: 'ORGANIZATION_TEMPLATE_LOGO_UPLOADED',
      user: userId,
      resource: 'Organization',
      resourceId: organization._id,
      details: {
        organizationName: organization.name,
        logoUrl: uploadResult.secure_url
      }
    });

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      logoUrl: uploadResult.secure_url
    });

  } catch (error) {
    console.error('Error uploading organization template logo:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading logo',
      error: error.message
    });
  }
};