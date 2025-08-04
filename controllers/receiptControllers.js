const Receipt = require('../models/Receipt');
const ReceiptTemplate = require('../models/ReceiptTemplate');
const Customer = require('../models/customers');
const Store = require('../models/store');
const Organization = require('../models/organization');
const { createAuditLog } = require('../helpers/auditLogHelper');
const { sendNotificationToAdmins } = require('../helpers/notificationHelper');
const cloudinary = require('cloudinary').v2;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// CREATE a new receipt
exports.createReceipt = async (req, res) => {
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
      paymentMethod,
      paymentMethodDetails,
      transactionId,
      transactionDate,
      description,
      type,
      templateId
    } = req.body;

    // Validate required fields
    const requiredFields = ['customerId', 'storeId', 'organizationId', 'userId', 'customerName', 'customerEmail', 'items', 'totalAmount', 'paymentMethod'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Generate receipt number
    const receiptNumber = await Receipt.generateReceiptNumber(organizationId);

    // Create new receipt
    const newReceipt = new Receipt({
      receiptNumber,
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
      paymentMethod,
      paymentMethodDetails,
      transactionId,
      transactionDate: transactionDate || new Date(),
      description,
      type: type || 'purchase',
      templateId,
      createdBy: userId,
      updatedBy: userId
    });

    // Calculate totals
    newReceipt.calculateTotals();

    const savedReceipt = await newReceipt.save();

    // Create audit log
    await createAuditLog({
      action: 'RECEIPT_CREATED',
      user: userId,
      resource: 'Receipt',
      resourceId: savedReceipt._id,
      details: {
        receiptNumber: savedReceipt.receiptNumber,
        customerName: savedReceipt.customerName,
        totalAmount: savedReceipt.totalAmount,
        paymentMethod: savedReceipt.paymentMethod
      },
      organization: organizationId
    });

    // Send notification to admins
    await sendNotificationToAdmins(organizationId, {
      type: 'receipt_created',
      title: 'New Receipt Created',
      message: `Receipt ${savedReceipt.receiptNumber} has been created for ${savedReceipt.customerName}`,
      data: {
        receiptId: savedReceipt._id,
        receiptNumber: savedReceipt.receiptNumber
      }
    });

    res.status(201).json({
      success: true,
      message: 'Receipt created successfully',
      receipt: savedReceipt
    });

  } catch (error) {
    console.error('Error creating receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating receipt',
      error: error.message
    });
  }
};

// GET all receipts with filters
exports.getReceipts = async (req, res) => {
  try {
    const {
      organizationId,
      status,
      customerId,
      storeId,
      paymentMethod,
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
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { receiptNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const receipts = await Receipt.find(filter)
      .populate('customerId', 'name email')
      .populate('storeId', 'name')
      .populate('createdBy', 'fullName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Receipt.countDocuments(filter);

    res.status(200).json({
      success: true,
      receipts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receipts',
      error: error.message
    });
  }
};

// GET single receipt by ID
exports.getReceiptById = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;

    const receipt = await Receipt.findOne({ _id: id, organizationId })
      .populate('customerId', 'name email phone address')
      .populate('storeId', 'name url')
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .populate('templateId');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    res.status(200).json({
      success: true,
      receipt
    });

  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receipt',
      error: error.message
    });
  }
};

// UPDATE receipt
exports.updateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.body;

    const updateData = { ...req.body, updatedBy: userId };
    delete updateData.userId; // Remove from update data

    const receipt = await Receipt.findOneAndUpdate(
      { _id: id, organizationId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    // Recalculate totals if items changed
    if (req.body.items) {
      receipt.calculateTotals();
      await receipt.save();
    }

    // Create audit log
    await createAuditLog({
      action: 'RECEIPT_UPDATED',
      user: userId,
      resource: 'Receipt',
      resourceId: receipt._id,
      details: {
        receiptNumber: receipt.receiptNumber,
        changes: req.body
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Receipt updated successfully',
      receipt
    });

  } catch (error) {
    console.error('Error updating receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating receipt',
      error: error.message
    });
  }
};

// DELETE receipt (soft delete)
exports.deleteReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.body;

    const receipt = await Receipt.findOneAndUpdate(
      { _id: id, organizationId },
      { status: 'cancelled', updatedBy: userId },
      { new: true }
    );

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    // Create audit log
    await createAuditLog({
      action: 'RECEIPT_CANCELLED',
      user: userId,
      resource: 'Receipt',
      resourceId: receipt._id,
      details: {
        receiptNumber: receipt.receiptNumber
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Receipt cancelled successfully',
      receipt
    });

  } catch (error) {
    console.error('Error cancelling receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling receipt',
      error: error.message
    });
  }
};

// DOWNLOAD receipt as PDF
exports.downloadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;

    const receipt = await Receipt.findOne({ _id: id, organizationId })
      .populate('customerId', 'name email phone address')
      .populate('storeId', 'name')
      .populate('templateId');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    // Generate PDF (simplified version)
    const doc = new PDFDocument();
    const filename = `receipt-${receipt.receiptNumber}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text('RECEIPT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt Number: ${receipt.receiptNumber}`);
    doc.text(`Date: ${receipt.transactionDate.toLocaleDateString()}`);
    doc.text(`Payment Method: ${receipt.paymentMethod}`);
    if (receipt.transactionId) {
      doc.text(`Transaction ID: ${receipt.transactionId}`);
    }
    doc.moveDown();
    doc.text(`Customer: ${receipt.customerName}`);
    doc.text(`Email: ${receipt.customerEmail}`);
    doc.moveDown();
    
    // Add items table
    doc.text('Items:', { underline: true });
    receipt.items.forEach(item => {
      doc.text(`${item.name} - Qty: ${item.quantity} - Price: $${item.unitPrice} - Total: $${item.totalPrice}`);
    });
    doc.moveDown();
    doc.text(`Subtotal: $${receipt.subtotal}`);
    doc.text(`Tax: $${receipt.taxAmount}`);
    doc.text(`Discount: $${receipt.discountAmount}`);
    doc.text(`Total: $${receipt.totalAmount}`, { underline: true });
    doc.moveDown();
    doc.text('Thank you for your purchase!', { align: 'center' });
    
    doc.end();

  } catch (error) {
    console.error('Error downloading receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading receipt',
      error: error.message
    });
  }
};

// EMAIL receipt
exports.emailReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId, userId, recipientEmail } = req.body;

    const receipt = await Receipt.findOne({ _id: id, organizationId })
      .populate('customerId', 'name email')
      .populate('storeId', 'name');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    // Update email status
    receipt.emailSent = true;
    receipt.emailSentDate = new Date();
    receipt.emailRecipients.push({
      email: recipientEmail || receipt.customerEmail,
      sentAt: new Date(),
      status: 'sent'
    });
    receipt.updatedBy = userId;
    await receipt.save();

    // Create audit log
    await createAuditLog({
      action: 'RECEIPT_EMAILED',
      user: userId,
      resource: 'Receipt',
      resourceId: receipt._id,
      details: {
        receiptNumber: receipt.receiptNumber,
        recipientEmail: recipientEmail || receipt.customerEmail
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Receipt sent successfully',
      receipt
    });

  } catch (error) {
    console.error('Error emailing receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Error emailing receipt',
      error: error.message
    });
  }
};

// PROCESS refund
exports.processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, organizationId, refundAmount, refundReason } = req.body;

    const receipt = await Receipt.findOne({ _id: id, organizationId });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    if (receipt.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Receipt has already been refunded'
      });
    }

    // Update receipt with refund information
    receipt.status = 'refunded';
    receipt.refundAmount = refundAmount || receipt.totalAmount;
    receipt.refundDate = new Date();
    receipt.refundReason = refundReason;
    receipt.updatedBy = userId;
    await receipt.save();

    // Create audit log
    await createAuditLog({
      action: 'RECEIPT_REFUNDED',
      user: userId,
      resource: 'Receipt',
      resourceId: receipt._id,
      details: {
        receiptNumber: receipt.receiptNumber,
        refundAmount: receipt.refundAmount,
        refundReason: receipt.refundReason
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      receipt
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
};

// BULK generate receipts from orders
exports.bulkGenerateReceipts = async (req, res) => {
  try {
    const { organizationId, userId, orders } = req.body;

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Orders array is required'
      });
    }

    const generatedReceipts = [];

    for (const order of orders) {
      try {
        // Generate receipt number
        const receiptNumber = await Receipt.generateReceiptNumber(organizationId);

        // Create receipt from order
        const newReceipt = new Receipt({
          receiptNumber,
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
          paymentMethod: order.paymentMethod || 'Credit Card',
          transactionId: order.transactionId,
          transactionDate: new Date(),
          type: 'purchase',
          createdBy: userId,
          updatedBy: userId
        });

        newReceipt.calculateTotals();
        const savedReceipt = await newReceipt.save();
        generatedReceipts.push(savedReceipt);

      } catch (error) {
        console.error(`Error generating receipt for order ${order.id}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated ${generatedReceipts.length} receipts successfully`,
      receipts: generatedReceipts
    });

  } catch (error) {
    console.error('Error bulk generating receipts:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk generating receipts',
      error: error.message
    });
  }
}; 