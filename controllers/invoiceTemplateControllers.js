const InvoiceTemplate = require('../models/InvoiceTemplate');
const ReceiptTemplate = require('../models/ReceiptTemplate');
const Organization = require('../models/organization');
const { createAuditLog } = require('../helpers/auditLogHelper');

// ==================== INVOICE TEMPLATES ====================

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