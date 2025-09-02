const InvoiceTemplate = require('../models/InvoiceTemplate');
const ReceiptTemplate = require('../models/ReceiptTemplate');
const Organization = require('../models/organization');
const { createAuditLog } = require('../helpers/auditLogHelper');

/**
 * @swagger
 * components:
 *   schemas:
 *     InvoiceTemplate:
 *       type: object
 *       required:
 *         - name
 *         - organizationId
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique invoice template ID
 *         name:
 *           type: string
 *           description: Template name
 *         organizationId:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID
 *         userId:
 *           type: string
 *           format: ObjectId
 *           description: User ID who created the template
 *         templateType:
 *           type: string
 *           enum: [professional, minimal, modern, classic, creative]
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
 *             address:
 *               type: string
 *               description: Company address
 *             phone:
 *               type: string
 *               description: Company phone
 *             email:
 *               type: string
 *               format: email
 *               description: Company email
 *             logo:
 *               type: string
 *               description: Company logo URL
 *         design:
 *           type: object
 *           description: Template design settings
 *           properties:
 *             colors:
 *               type: object
 *               description: Color scheme
 *             fonts:
 *               type: object
 *               description: Font settings
 *             spacing:
 *               type: object
 *               description: Spacing settings
 *         layout:
 *           type: object
 *           description: Template layout configuration
 *           properties:
 *             header:
 *               type: object
 *               description: Header layout
 *             body:
 *               type: object
 *               description: Body layout
 *             footer:
 *               type: object
 *               description: Footer layout
 *         content:
 *           type: object
 *           description: Template content structure
 *           properties:
 *             sections:
 *               type: array
 *               description: Template sections
 *             placeholders:
 *               type: array
 *               description: Dynamic content placeholders
 *         fields:
 *           type: object
 *           description: Template field mappings
 *           properties:
 *             customer:
 *               type: object
 *               description: Customer field mappings
 *             items:
 *               type: object
 *               description: Items field mappings
 *             totals:
 *               type: object
 *               description: Totals field mappings
 *         createdBy:
 *           type: string
 *           format: ObjectId
 *           description: User ID who created the template
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
 *         - organizationId
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique receipt template ID
 *         name:
 *           type: string
 *           description: Template name
 *         organizationId:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID
 *         userId:
 *           type: string
 *           format: ObjectId
 *           description: User ID who created the template
 *         templateType:
 *           type: string
 *           enum: [professional, minimal, modern, classic, creative]
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
 *           description: User ID who created the template
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
 *               - organizationId
 *               - userId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *                 example: "Professional Invoice Template"
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
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
 *                   example: "Missing required fields: name, organizationId"
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
 *     summary: Get all invoice templates with filters and pagination
 *     tags: [Invoice Templates]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *           enum: [professional, casual, modern, classic]
 *         description: Filter by template type
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
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/invoice/templates/invoice/{id}:
 *   get:
 *     summary: Get a single invoice template by ID
 *     tags: [Invoice Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Invoice template ID
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
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
 *     security:
 *       - bearerAuth: []
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
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 required: true
 *                 description: Organization ID
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
 *     security:
 *       - bearerAuth: []
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
 *               - organizationId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID deleting the template
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
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
 *     security:
 *       - bearerAuth: []
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
 *               - organizationId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID setting the default
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
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
      organizationId,
      userId,
      templateType,
      isDefault,
      companyInfo,
      design,
      layout,
      content,
      fields
    } = req.body;

    // Validate required fields
    const requiredFields = ['name', 'organizationId', 'userId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Create new invoice template
    const newTemplate = new InvoiceTemplate({
      name,
      organizationId,
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
      organization: organizationId
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

// GET all invoice templates
exports.getInvoiceTemplates = async (req, res) => {
  try {
    const {
      organizationId,
      isActive,
      templateType,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { organizationId };
    
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (templateType) filter.templateType = templateType;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const templates = await InvoiceTemplate.find(filter)
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InvoiceTemplate.countDocuments(filter);

    res.status(200).json({
      success: true,
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
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

// GET single invoice template by ID
exports.getInvoiceTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;

    const template = await InvoiceTemplate.findOne({ _id: id, organizationId })
      .populate('createdBy', 'fullName email')
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
    const { userId, organizationId } = req.body;

    const updateData = { ...req.body, updatedBy: userId };
    delete updateData.userId; // Remove from update data

    const template = await InvoiceTemplate.findOneAndUpdate(
      { _id: id, organizationId },
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
      organization: organizationId
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
    const { userId, organizationId } = req.body;

    const template = await InvoiceTemplate.findOneAndDelete({ _id: id, organizationId });

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
      organization: organizationId
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
    const { userId, organizationId } = req.body;

    const template = await InvoiceTemplate.findOneAndUpdate(
      { _id: id, organizationId },
      { isDefault: true, updatedBy: userId },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Invoice template not found'
      });
    }

    // Create audit log
    await createAuditLog({
      action: 'INVOICE_TEMPLATE_SET_DEFAULT',
      user: userId,
      resource: 'InvoiceTemplate',
      resourceId: template._id,
      details: {
        name: template.name
      },
      organization: organizationId
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
 *               - organizationId
 *               - userId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *                 example: "Professional Receipt Template"
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
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
 *                   example: "Missing required fields: name, organizationId"
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
 *     summary: Get all receipt templates with filters and pagination
 *     tags: [Receipt Templates]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *           enum: [professional, casual, modern, classic]
 *         description: Filter by template type
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
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

// CREATE receipt template
exports.createReceiptTemplate = async (req, res) => {
  try {
    const {
      name,
      organizationId,
      userId,
      templateType,
      isDefault,
      companyInfo,
      design,
      layout,
      content,
      fields
    } = req.body;

    // Validate required fields
    const requiredFields = ['name', 'organizationId', 'userId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Create new receipt template
    const newTemplate = new ReceiptTemplate({
      name,
      organizationId,
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
      organization: organizationId
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
    const {
      organizationId,
      isActive,
      templateType,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { organizationId };
    
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (templateType) filter.templateType = templateType;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const templates = await ReceiptTemplate.find(filter)
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ReceiptTemplate.countDocuments(filter);

    res.status(200).json({
      success: true,
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Receipt template ID
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
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

// GET single receipt template by ID
exports.getReceiptTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;

    const template = await ReceiptTemplate.findOne({ _id: id, organizationId })
      .populate('createdBy', 'fullName email')
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
 *     security:
 *       - bearerAuth: []
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
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 required: true
 *                 description: Organization ID
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
    const { userId, organizationId } = req.body;

    const updateData = { ...req.body, updatedBy: userId };
    delete updateData.userId; // Remove from update data

    const template = await ReceiptTemplate.findOneAndUpdate(
      { _id: id, organizationId },
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
      organization: organizationId
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
 *     security:
 *       - bearerAuth: []
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
 *               - organizationId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID deleting the template
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
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
    const { userId, organizationId } = req.body;

    const template = await ReceiptTemplate.findOneAndDelete({ _id: id, organizationId });

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
      organization: organizationId
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
    const { userId, organizationId } = req.body;

    const template = await ReceiptTemplate.findOneAndUpdate(
      { _id: id, organizationId },
      { isDefault: true, updatedBy: userId },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Receipt template not found'
      });
    }

    // Create audit log
    await createAuditLog({
      action: 'RECEIPT_TEMPLATE_SET_DEFAULT',
      user: userId,
      resource: 'ReceiptTemplate',
      resourceId: template._id,
      details: {
        name: template.name
      },
      organization: organizationId
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *           enum: [professional, minimal, modern, classic, creative]
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
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/invoice/templates/system-defaults/receipt:
 *   get:
 *     summary: Get all system default receipt templates
 *     tags: [System Default Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *           enum: [professional, minimal, modern, classic, creative]
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
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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