const Invoice = require('../models/Invoice');
const InvoiceTemplate = require('../models/InvoiceTemplate');
const Customer = require('../models/customers');
const Store = require('../models/store');
const Organization = require('../models/organization');
const { createAuditLog } = require('../helpers/auditLogHelper');
const { sendNotificationToAdmins } = require('../helpers/notificationHelper');
const cloudinary = require('cloudinary').v2;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// CREATE a new invoice
exports.createInvoice = async (req, res) => {
  try {
    const {
      customerId,
      storeId,
      organizationId,
      userId,
      customerName,
      customerEmail,
      customerAddress,
      items,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      currency,
      dueDate,
      notes,
      terms,
      type,
      templateId
    } = req.body;

    // Validate required fields
    const requiredFields = ['customerId', 'storeId', 'organizationId', 'userId', 'customerName', 'customerEmail', 'items', 'totalAmount'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber(organizationId);

    // Create new invoice
    const newInvoice = new Invoice({
      invoiceNumber,
      customerId,
      storeId,
      organizationId,
      userId,
      customerName,
      customerEmail,
      customerAddress,
      items,
      subtotal: subtotal || 0,
      taxAmount: taxAmount || 0,
      discountAmount: discountAmount || 0,
      totalAmount,
      currency: currency || 'USD',
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes,
      terms,
      type: type || 'one_time',
      templateId,
      createdBy: userId,
      updatedBy: userId
    });

    // Calculate totals
    newInvoice.calculateTotals();

    const savedInvoice = await newInvoice.save();

    // Create audit log
    await createAuditLog({
      action: 'INVOICE_CREATED',
      user: userId,
      resource: 'Invoice',
      resourceId: savedInvoice._id,
      details: {
        invoiceNumber: savedInvoice.invoiceNumber,
        customerName: savedInvoice.customerName,
        totalAmount: savedInvoice.totalAmount
      },
      organization: organizationId
    });

    // Send notification to admins
    await sendNotificationToAdmins(organizationId, {
      type: 'invoice_created',
      title: 'New Invoice Created',
      message: `Invoice ${savedInvoice.invoiceNumber} has been created for ${savedInvoice.customerName}`,
      data: {
        invoiceId: savedInvoice._id,
        invoiceNumber: savedInvoice.invoiceNumber
      }
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice: savedInvoice
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message
    });
  }
};

// GET all invoices with filters
exports.getInvoices = async (req, res) => {
  try {
    const {
      organizationId,
      status,
      customerId,
      storeId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { organizationId };
    
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (storeId) filter.storeId = storeId;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const invoices = await Invoice.find(filter)
      .populate('customerId', 'name email')
      .populate('storeId', 'name')
      .populate('createdBy', 'fullName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    res.status(200).json({
      success: true,
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message
    });
  }
};

// GET single invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;

    const invoice = await Invoice.findOne({ _id: id, organizationId })
      .populate('customerId', 'name email phone address')
      .populate('storeId', 'name url')
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .populate('templateId');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message
    });
  }
};

// UPDATE invoice
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.body;

    const updateData = { ...req.body, updatedBy: userId };
    delete updateData.userId; // Remove from update data

    const invoice = await Invoice.findOneAndUpdate(
      { _id: id, organizationId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Recalculate totals if items changed
    if (req.body.items) {
      invoice.calculateTotals();
      await invoice.save();
    }

    // Create audit log
    await createAuditLog({
      action: 'INVOICE_UPDATED',
      user: userId,
      resource: 'Invoice',
      resourceId: invoice._id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        changes: req.body
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      invoice
    });

  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating invoice',
      error: error.message
    });
  }
};

// DELETE invoice (soft delete)
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.body;

    const invoice = await Invoice.findOneAndUpdate(
      { _id: id, organizationId },
      { status: 'cancelled', updatedBy: userId },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Create audit log
    await createAuditLog({
      action: 'INVOICE_CANCELLED',
      user: userId,
      resource: 'Invoice',
      resourceId: invoice._id,
      details: {
        invoiceNumber: invoice.invoiceNumber
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Invoice cancelled successfully',
      invoice
    });

  } catch (error) {
    console.error('Error cancelling invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling invoice',
      error: error.message
    });
  }
};

// DOWNLOAD invoice as PDF
exports.downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;

    const invoice = await Invoice.findOne({ _id: id, organizationId })
      .populate('customerId', 'name email phone address')
      .populate('storeId', 'name')
      .populate('templateId');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Generate PDF (simplified version)
    const doc = new PDFDocument();
    const filename = `invoice-${invoice.invoiceNumber}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${invoice.issueDate.toLocaleDateString()}`);
    doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`);
    doc.moveDown();
    doc.text(`Customer: ${invoice.customerName}`);
    doc.text(`Email: ${invoice.customerEmail}`);
    doc.moveDown();
    
    // Add items table
    doc.text('Items:', { underline: true });
    invoice.items.forEach(item => {
      doc.text(`${item.name} - Qty: ${item.quantity} - Price: $${item.unitPrice} - Total: $${item.totalPrice}`);
    });
    doc.moveDown();
    doc.text(`Subtotal: $${invoice.subtotal}`);
    doc.text(`Tax: $${invoice.taxAmount}`);
    doc.text(`Discount: $${invoice.discountAmount}`);
    doc.text(`Total: $${invoice.totalAmount}`, { underline: true });
    
    doc.end();

  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading invoice',
      error: error.message
    });
  }
};

// EMAIL invoice
exports.emailInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId, userId, recipientEmail } = req.body;

    const invoice = await Invoice.findOne({ _id: id, organizationId })
      .populate('customerId', 'name email')
      .populate('storeId', 'name');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Update email status
    invoice.emailSent = true;
    invoice.emailSentDate = new Date();
    invoice.emailRecipients.push({
      email: recipientEmail || invoice.customerEmail,
      sentAt: new Date(),
      status: 'sent'
    });
    invoice.updatedBy = userId;
    await invoice.save();

    // Create audit log
    await createAuditLog({
      action: 'INVOICE_EMAILED',
      user: userId,
      resource: 'Invoice',
      resourceId: invoice._id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        recipientEmail: recipientEmail || invoice.customerEmail
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Invoice sent successfully',
      invoice
    });

  } catch (error) {
    console.error('Error emailing invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error emailing invoice',
      error: error.message
    });
  }
};

// BULK generate invoices
exports.bulkGenerateInvoices = async (req, res) => {
  try {
    const { organizationId, userId, orders } = req.body;

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Orders array is required'
      });
    }

    const generatedInvoices = [];

    for (const order of orders) {
      try {
        // Generate invoice number
        const invoiceNumber = await Invoice.generateInvoiceNumber(organizationId);

        // Create invoice from order
        const newInvoice = new Invoice({
          invoiceNumber,
          customerId: order.customerId,
          storeId: order.storeId,
          organizationId,
          userId,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          items: order.items,
          subtotal: order.subtotal,
          taxAmount: order.taxAmount,
          discountAmount: order.discountAmount,
          totalAmount: order.totalAmount,
          currency: order.currency || 'USD',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          type: 'one_time',
          createdBy: userId,
          updatedBy: userId
        });

        newInvoice.calculateTotals();
        const savedInvoice = await newInvoice.save();
        generatedInvoices.push(savedInvoice);

      } catch (error) {
        console.error(`Error generating invoice for order ${order.id}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated ${generatedInvoices.length} invoices successfully`,
      invoices: generatedInvoices
    });

  } catch (error) {
    console.error('Error bulk generating invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk generating invoices',
      error: error.message
    });
  }
}; 