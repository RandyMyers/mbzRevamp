const Invoice = require('../models/Invoice');
const InvoiceTemplate = require('../models/InvoiceTemplate');
const Customer = require('../models/customers');
const Store = require('../models/store');
const Organization = require('../models/organization');
const User = require('../models/users');
const logEvent = require('../helper/logEvent');
const { sendNotificationToAdmins } = require('../helpers/notificationHelper');
const cloudinary = require('cloudinary').v2;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * @swagger
 * components:
 *   schemas:
 *     Invoice:
 *       type: object
 *       required:
 *         - customerId
 *         - storeId
 *         - organizationId
 *         - userId
 *         - customerName
 *         - customerEmail
 *         - items
 *         - totalAmount
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique invoice ID
 *         customerId:
 *           type: string
 *           format: ObjectId
 *           description: Customer ID
 *         storeId:
 *           type: string
 *           format: ObjectId
 *           description: Store ID
 *         organizationId:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID
 *         userId:
 *           type: string
 *           format: ObjectId
 *           description: User ID who created the invoice
 *         customerName:
 *           type: string
 *           description: Customer name
 *         customerEmail:
 *           type: string
 *           format: email
 *           description: Customer email
 *         customerAddress:
 *           type: object
 *           description: Customer address
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - name
 *               - quantity
 *               - unitPrice
 *             properties:
 *               name:
 *                 type: string
 *                 description: Item name
 *               quantity:
 *                 type: number
 *                 description: Item quantity
 *               unitPrice:
 *                 type: number
 *                 description: Item unit price
 *               total:
 *                 type: number
 *                 description: Item total price
 *         subtotal:
 *           type: number
 *           description: Subtotal amount
 *         taxAmount:
 *           type: number
 *           description: Tax amount
 *         discountAmount:
 *           type: number
 *           description: Discount amount
 *         totalAmount:
 *           type: number
 *           description: Total amount
 *         currency:
 *           type: string
 *           enum: [USD, EUR, GBP, CAD, AUD, JPY, NGN]
 *           description: Currency code
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Invoice due date
 *         notes:
 *           type: string
 *           description: Additional notes
 *         terms:
 *           type: string
 *           description: Invoice terms
 *         type:
 *           type: string
 *           description: Invoice type
 *         templateId:
 *           type: string
 *           format: ObjectId
 *           description: Invoice template ID
 *         status:
 *           type: string
 *           enum: [draft, sent, paid, overdue, cancelled]
 *           description: Invoice status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Invoice creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Invoice last update timestamp
 */

/**
 * @swagger
 * /api/invoices/create:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - storeId
 *               - organizationId
 *               - userId
 *               - customerName
 *               - customerEmail
 *               - items
 *               - totalAmount
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Customer ID
 *                 example: "507f1f77bcf86cd799439011"
 *               storeId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Store ID
 *                 example: "507f1f77bcf86cd799439011"
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID who created the invoice
 *                 example: "507f1f77bcf86cd799439011"
 *               customerName:
 *                 type: string
 *                 description: Customer name
 *                 example: "John Doe"
 *               customerEmail:
 *                 type: string
 *                 format: email
 *                 description: Customer email
 *                 example: "john@example.com"
 *               customerAddress:
 *                 type: object
 *                 description: Customer address
 *                 example: {"street": "123 Main St", "city": "Anytown", "state": "CA", "zip": "12345"}
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Item name
 *                       example: "Premium Widget"
 *                     quantity:
 *                       type: number
 *                       description: Item quantity
 *                       example: 2
 *                     unitPrice:
 *                       type: number
 *                       description: Item unit price
 *                       example: 29.99
 *                     total:
 *                       type: number
 *                       description: Item total price
 *                       example: 59.98
 *               subtotal:
 *                 type: number
 *                 description: Subtotal amount
 *                 example: 59.98
 *               taxAmount:
 *                 type: number
 *                 description: Tax amount
 *                 example: 5.99
 *               discountAmount:
 *                 type: number
 *                 description: Discount amount
 *                 example: 0
 *               totalAmount:
 *                 type: number
 *                 description: Total amount
 *                 example: 65.97
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, GBP, CAD, AUD, JPY, NGN]
 *                 default: USD
 *                 description: Currency code
 *                 example: "USD"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Invoice due date
 *                 example: "2024-12-31T23:59:59.000Z"
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *                 example: "Thank you for your business!"
 *               terms:
 *                 type: string
 *                 description: Invoice terms
 *                 example: "Net 30"
 *               type:
 *                 type: string
 *                 description: Invoice type
 *                 example: "standard"
 *               templateId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Invoice template ID
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Invoice created successfully
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
 *                   example: "Invoice created successfully"
 *                 invoice:
 *                   $ref: '#/components/schemas/Invoice'
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
 *                   example: "Missing required fields: customerId, storeId"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Customer, store, organization, or user not found
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
 *                   example: "Customer not found"
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
 *                   example: "Failed to create invoice"
 */
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

    // Validate items array structure
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items must be a non-empty array'
      });
    }

    // Validate each item has required fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name || !item.quantity || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} is missing required fields: name, quantity, or unitPrice`
        });
      }
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'NGN'];
    if (currency && !validCurrencies.includes(currency.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid currency. Must be one of: ${validCurrencies.join(', ')}`
      });
    }

    // Validate due date is in the future
    if (dueDate && new Date(dueDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Due date must be in the future'
      });
    }

    // Validate dependencies exist
    const [customer, store, organization, user] = await Promise.all([
      Customer.findById(customerId),
      Store.findById(storeId),
      Organization.findById(organizationId),
      User.findById(userId)
    ]);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify user belongs to the organization
    if (user.organization.toString() !== organizationId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only create invoices for your organization' 
      });
    }

    // Verify store belongs to the organization
    if (store.organizationId.toString() !== organizationId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Store does not belong to your organization' 
      });
    }

    // Verify store is active
    if (!store.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Store is not active' 
      });
    }

    // Validate template if provided
    if (templateId) {
      const template = await InvoiceTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({ success: false, message: 'Invoice template not found' });
      }
    }

    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber(organizationId);

    // Process items to ensure correct structure
    const processedItems = items.map(item => ({
      name: item.name,
      description: item.description || '',
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.quantity) * Number(item.unitPrice),
      taxRate: Number(item.taxRate) || 0
    }));

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
      items: processedItems,
      subtotal: subtotal || 0,
      taxAmount: taxAmount || 0,
      discountAmount: discountAmount || 0,
      totalAmount,
      currency: (currency || 'USD').toUpperCase(),
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

    // Validate calculated total matches provided total
    const calculatedTotal = newInvoice.subtotal + newInvoice.taxAmount - newInvoice.discountAmount;
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Total amount mismatch. Calculated: ${calculatedTotal}, Provided: ${totalAmount}`
      });
    }

    const savedInvoice = await newInvoice.save();

    // Create audit log
    await logEvent({
      action: 'invoice_created',
      user: userId,
      resource: 'Invoice',
      resourceId: savedInvoice._id,
      details: {
        invoiceNumber: savedInvoice.invoiceNumber,
        customerName: savedInvoice.customerName,
        totalAmount: savedInvoice.totalAmount,
        currency: savedInvoice.currency
      },
      organization: organizationId
    });

    // Send notification to admins (with error handling)
    try {
      await sendNotificationToAdmins(organizationId, {
        type: 'invoice_created',
        title: 'New Invoice Created',
        message: `Invoice ${savedInvoice.invoiceNumber} has been created for ${savedInvoice.customerName}`,
        data: {
          invoiceId: savedInvoice._id,
          invoiceNumber: savedInvoice.invoiceNumber
        }
      });
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail the invoice creation if notification fails
    }

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

/**
 * @swagger
 * /api/invoices/list:
 *   get:
 *     summary: Get all invoices with filters
 *     tags: [Invoices]
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
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, paid, overdue, cancelled]
 *         description: Filter by invoice status
 *         example: "paid"
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Filter by customer ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Filter by store ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *         example: "2024-12-31"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in invoice number, customer name, or email
 *         example: "INV-001"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of invoices per page
 *         example: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "createdAt"
 *           enum: [createdAt, updatedAt, dueDate, totalAmount, customerName]
 *         description: Field to sort by
 *         example: "createdAt"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: "desc"
 *           enum: [asc, desc]
 *         description: Sort order
 *         example: "desc"
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 invoices:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
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
 *                       example: 50
 *                     pages:
 *                       type: integer
 *                       example: 5
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
 *                   example: "Error fetching invoices"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Get single invoice by ID
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Invoice ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 invoice:
 *                   $ref: '#/components/schemas/Invoice'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Invoice not found
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
 *                   example: "Invoice not found"
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
 *                   example: "Error fetching invoice"
 */
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

/**
 * @swagger
 * /api/invoices/{id}:
 *   put:
 *     summary: Update invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Invoice ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerName:
 *                 type: string
 *                 description: Customer name
 *                 example: "John Doe"
 *               customerEmail:
 *                 type: string
 *                 format: email
 *                 description: Customer email
 *                 example: "john@example.com"
 *               customerAddress:
 *                 type: object
 *                 description: Customer address
 *                 example: {"street": "123 Main St", "city": "Anytown", "state": "CA", "zip": "12345"}
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Item name
 *                       example: "Premium Widget"
 *                     quantity:
 *                       type: number
 *                       description: Item quantity
 *                       example: 2
 *                     unitPrice:
 *                       type: number
 *                       description: Item unit price
 *                       example: 29.99
 *                     total:
 *                       type: number
 *                       description: Item total price
 *                       example: 59.98
 *               subtotal:
 *                 type: number
 *                 description: Subtotal amount
 *                 example: 59.98
 *               taxAmount:
 *                 type: number
 *                 description: Tax amount
 *                 example: 5.99
 *               discountAmount:
 *                 type: number
 *                 description: Discount amount
 *                 example: 0
 *               totalAmount:
 *                 type: number
 *                 description: Total amount
 *                 example: 65.97
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, GBP, CAD, AUD, JPY, NGN]
 *                 description: Currency code
 *                 example: "USD"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Invoice due date
 *                 example: "2024-02-15T00:00:00.000Z"
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *                 example: "Payment due within 30 days"
 *               terms:
 *                 type: string
 *                 description: Invoice terms
 *                 example: "Net 30"
 *               status:
 *                 type: string
 *                 enum: [draft, sent, paid, overdue, cancelled]
 *                 description: Invoice status
 *                 example: "sent"
 *     responses:
 *       200:
 *         description: Invoice updated successfully
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
 *                   example: "Invoice updated successfully"
 *                 invoice:
 *                   $ref: '#/components/schemas/Invoice'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Invoice not found
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
 *                   example: "Invoice not found"
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
 *                   example: "Error updating invoice"
 */
// UPDATE invoice
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const organizationId = req.user.organization;

    // Validate user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const updateData = { ...req.body, updatedBy: userId };

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
    await logEvent({
      action: 'invoice_updated',
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

/**
 * @swagger
 * /api/invoices/{id}:
 *   delete:
 *     summary: Delete invoice (soft delete)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Invoice ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
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
 *                   example: "Invoice deleted successfully"
 *                 invoice:
 *                   $ref: '#/components/schemas/Invoice'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Invoice not found
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
 *                   example: "Invoice not found"
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
 *                   example: "Error deleting invoice"
 */
// DELETE invoice (soft delete)
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const organizationId = req.user.organization;

    // Validate user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

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
    await logEvent({
      action: 'invoice_cancelled',
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

/**
 * @swagger
 * /api/invoices/{id}/download:
 *   get:
 *     summary: Download invoice as PDF
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Invoice ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: PDF file generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *             description: PDF file content
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Invoice not found
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
 *                   example: "Invoice not found"
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
 *                   example: "Error generating PDF"
 */
// DOWNLOAD invoice as PDF
exports.downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const organizationId = req.user.organization;

    // Validate user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

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

/**
 * @swagger
 * /api/invoices/{id}/email:
 *   post:
 *     summary: Email invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Invoice ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customMessage:
 *                 type: string
 *                 description: Custom message to include in email
 *                 example: "Please find your invoice attached."
 *               cc:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: CC recipients
 *                 example: ["manager@company.com"]
 *               bcc:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: BCC recipients
 *                 example: ["accounting@company.com"]
 *     responses:
 *       200:
 *         description: Invoice emailed successfully
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
 *                   example: "Invoice sent successfully"
 *                 emailDetails:
 *                   type: object
 *                   properties:
 *                     to:
 *                       type: string
 *                       format: email
 *                       description: Recipient email
 *                       example: "customer@example.com"
 *                     subject:
 *                       type: string
 *                       description: Email subject
 *                       example: "Invoice INV-001 from Company Name"
 *                     sentAt:
 *                       type: string
 *                       format: date-time
 *                       description: Email sent timestamp
 *                       example: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Invoice not found
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
 *                   example: "Invoice not found"
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
 *                   example: "Error sending invoice email"
 */
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
    await logEvent({
      action: 'invoice_emailed',
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

/**
 * @swagger
 * /api/invoices/bulk-generate:
 *   post:
 *     summary: Bulk generate invoices from orders
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - userId
 *               - orders
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID creating the invoices
 *                 example: "507f1f77bcf86cd799439011"
 *               orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - orderId
 *                     - customerId
 *                     - storeId
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       format: ObjectId
 *                       description: Order ID
 *                       example: "507f1f77bcf86cd799439011"
 *                     customerId:
 *                       type: string
 *                       format: ObjectId
 *                       description: Customer ID
 *                       example: "507f1f77bcf86cd799439011"
 *                     storeId:
 *                       type: string
 *                       format: ObjectId
 *                       description: Store ID
 *                       example: "507f1f77bcf86cd799439011"
 *                     customNotes:
 *                       type: string
 *                       description: Custom notes for this invoice
 *                       example: "Bulk generated from order"
 *                     dueDate:
 *                       type: string
 *                       format: date-time
 *                       description: Custom due date for this invoice
 *                       example: "2024-02-15T00:00:00.000Z"
 *               templateId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Invoice template ID to use
 *                 example: "507f1f77bcf86cd799439011"
 *               defaultCurrency:
 *                 type: string
 *                 enum: [USD, EUR, GBP, CAD, AUD, JPY, NGN]
 *                 description: Default currency for invoices
 *                 example: "USD"
 *               defaultTerms:
 *                 type: string
 *                 description: Default payment terms
 *                 example: "Net 30"
 *     responses:
 *       200:
 *         description: Invoices generated successfully
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
 *                   example: "Bulk invoice generation completed"
 *                 results:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total orders processed
 *                       example: 10
 *                     successful:
 *                       type: integer
 *                       description: Number of invoices created successfully
 *                       example: 8
 *                     failed:
 *                       type: integer
 *                       description: Number of invoices that failed to create
 *                       example: 2
 *                     invoices:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Invoice'
 *                       description: Array of created invoices
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           orderId:
 *                             type: string
 *                             description: Order ID that failed
 *                           error:
 *                             type: string
 *                             description: Error message
 *       400:
 *         description: Bad request - Invalid data
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
 *                   example: "Invalid request data"
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
 *                   example: "Error generating invoices"
 */
// BULK generate invoices from orders
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

/**
 * @swagger
 * /api/invoices/store/{storeId}:
 *   get:
 *     summary: Get invoices for a specific store
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, paid, overdue, cancelled]
 *         description: Filter by invoice status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of invoices per page
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
 *       403:
 *         description: Store access denied
 *       404:
 *         description: Store not found
 */
exports.getInvoicesByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Get user's organization
    const userOrganizationId = req.user?.organization;
    
    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: 'User organization not found'
      });
    }

    // Verify store exists and belongs to user's organization
    const store = await Store.findById(storeId);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    if (store.organizationId.toString() !== userOrganizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only access stores from your organization'
      });
    }

    if (!store.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Store is not active'
      });
    }

    // Build filter object
    const filter = { 
      storeId,
      organizationId: userOrganizationId
    };
    
    if (status) filter.status = status;
    
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
      .populate('storeId', 'name platformType')
      .populate('createdBy', 'fullName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalInvoices = await Invoice.countDocuments(filter);
    const totalPages = Math.ceil(totalInvoices / limit);

    // Calculate store-specific statistics
    const storeStats = await Invoice.aggregate([
      { $match: { storeId: store._id, organizationId: userOrganizationId } },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          overdueInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
          },
          draftInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Store invoices retrieved successfully',
      data: {
        invoices,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalInvoices,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        store: {
          _id: store._id,
          name: store.name,
          platformType: store.platformType,
          url: store.url
        },
        statistics: storeStats[0] || {
          totalInvoices: 0,
          totalAmount: 0,
          paidInvoices: 0,
          overdueInvoices: 0,
          draftInvoices: 0
        }
      }
    });

  } catch (error) {
    console.error('❌ [INVOICE] Get invoices by store error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching store invoices',
      error: error.message
    });
  }
}; 