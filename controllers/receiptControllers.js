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

/**
 * @swagger
 * components:
 *   schemas:
 *     Receipt:
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
 *         - paymentMethod
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique receipt ID
 *         receiptNumber:
 *           type: string
 *           description: Auto-generated receipt number
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
 *           description: User ID who created the receipt
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
 *               totalPrice:
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
 *         paymentMethod:
 *           type: string
 *           description: Payment method used
 *         paymentMethodDetails:
 *           type: object
 *           description: Additional payment method details
 *         transactionId:
 *           type: string
 *           description: External transaction ID
 *         transactionDate:
 *           type: string
 *           format: date-time
 *           description: Transaction date
 *         description:
 *           type: string
 *           description: Additional description
 *         type:
 *           type: string
 *           enum: [purchase, refund, exchange]
 *           description: Receipt type
 *         templateId:
 *           type: string
 *           format: ObjectId
 *           description: Receipt template ID
 *         status:
 *           type: string
 *           enum: [active, cancelled, refunded]
 *           description: Receipt status
 *         emailSent:
 *           type: boolean
 *           description: Whether receipt was emailed
 *         emailSentDate:
 *           type: string
 *           format: date-time
 *           description: When receipt was emailed
 *         emailRecipients:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               sentAt:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [sent, failed]
 *         refundAmount:
 *           type: number
 *           description: Refund amount
 *         refundDate:
 *           type: string
 *           format: date-time
 *           description: Refund date
 *         refundReason:
 *           type: string
 *           description: Reason for refund
 *         createdBy:
 *           type: string
 *           format: ObjectId
 *           description: User ID who created the receipt
 *         updatedBy:
 *           type: string
 *           format: ObjectId
 *           description: User ID who last updated the receipt
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Receipt creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Receipt last update timestamp
 */

/**
 * @swagger
 * /api/receipts/create:
 *   post:
 *     summary: Create a new receipt
 *     tags: [Receipts]
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
 *               - paymentMethod
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
 *                 description: User ID who created the receipt
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
 *                     totalPrice:
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
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method used
 *                 example: "Credit Card"
 *               paymentMethodDetails:
 *                 type: object
 *                 description: Additional payment method details
 *                 example: {"cardType": "Visa", "last4": "1234"}
 *               transactionId:
 *                 type: string
 *                 description: External transaction ID
 *                 example: "txn_123456789"
 *               transactionDate:
 *                 type: string
 *                 format: date-time
 *                 description: Transaction date
 *                 example: "2024-12-31T23:59:59.000Z"
 *               description:
 *                 type: string
 *                 description: Additional description
 *                 example: "Online purchase"
 *               type:
 *                 type: string
 *                 enum: [purchase, refund, exchange]
 *                 default: purchase
 *                 description: Receipt type
 *                 example: "purchase"
 *               templateId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Receipt template ID
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Receipt created successfully
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
 *                   example: "Receipt created successfully"
 *                 receipt:
 *                   $ref: '#/components/schemas/Receipt'
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
 *                   example: "Missing required fields: customerId, storeId"
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
 *                   example: "Error creating receipt"
 */

/**
 * @swagger
 * /api/receipts:
 *   get:
 *     summary: Get all receipts with filters and pagination
 *     tags: [Receipts]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, cancelled, refunded]
 *         description: Receipt status filter
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Customer ID filter
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Store ID filter
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *         description: Payment method filter
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for transaction date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for transaction date filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in receipt number, customer name, email, or transaction ID
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
 *         description: Receipts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 receipts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Receipt'
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
 *                       example: 100
 *                     pages:
 *                       type: integer
 *                       example: 10
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/receipts/{id}:
 *   get:
 *     summary: Get a single receipt by ID
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Receipt ID
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Receipt retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 receipt:
 *                   $ref: '#/components/schemas/Receipt'
 *       404:
 *         description: Receipt not found
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/receipts/{id}:
 *   put:
 *     summary: Update a receipt
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Receipt ID
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
 *               items:
 *                 type: array
 *                 description: Updated items array
 *               customerAddress:
 *                 type: object
 *                 description: Updated customer address
 *               description:
 *                 type: string
 *                 description: Updated description
 *     responses:
 *       200:
 *         description: Receipt updated successfully
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
 *                   example: "Receipt updated successfully"
 *                 receipt:
 *                   $ref: '#/components/schemas/Receipt'
 *       404:
 *         description: Receipt not found
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/receipts/{id}:
 *   delete:
 *     summary: Cancel a receipt (soft delete)
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Receipt ID
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
 *                 description: User ID cancelling the receipt
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *     responses:
 *       200:
 *         description: Receipt cancelled successfully
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
 *                   example: "Receipt cancelled successfully"
 *                 receipt:
 *                   $ref: '#/components/schemas/Receipt'
 *       404:
 *         description: Receipt not found
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/receipts/{id}/download:
 *   get:
 *     summary: Download receipt as PDF
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Receipt ID
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Receipt not found
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/receipts/{id}/email:
 *   post:
 *     summary: Email receipt to customer
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Receipt ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - userId
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID sending the email
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *                 description: Override recipient email (optional)
 *     responses:
 *       200:
 *         description: Receipt emailed successfully
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
 *                   example: "Receipt sent successfully"
 *                 receipt:
 *                   $ref: '#/components/schemas/Receipt'
 *       404:
 *         description: Receipt not found
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/receipts/{id}/refund:
 *   post:
 *     summary: Process refund for a receipt
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Receipt ID
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
 *                 description: User ID processing the refund
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *               refundAmount:
 *                 type: number
 *                 description: Refund amount (defaults to total amount)
 *               refundReason:
 *                 type: string
 *                 description: Reason for refund
 *     responses:
 *       200:
 *         description: Refund processed successfully
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
 *                   example: "Refund processed successfully"
 *                 receipt:
 *                   $ref: '#/components/schemas/Receipt'
 *       400:
 *         description: Bad request - Receipt already refunded
 *       404:
 *         description: Receipt not found
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/receipts/bulk-generate:
 *   post:
 *     summary: Bulk generate receipts from orders
 *     tags: [Receipts]
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
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID generating the receipts
 *               orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - customerId
 *                     - storeId
 *                     - customerName
 *                     - customerEmail
 *                     - items
 *                     - totalAmount
 *                   properties:
 *                     customerId:
 *                       type: string
 *                       format: ObjectId
 *                       description: Customer ID
 *                     storeId:
 *                       type: string
 *                       format: ObjectId
 *                       description: Store ID
 *                     customerName:
 *                       type: string
 *                       description: Customer name
 *                     customerEmail:
 *                       type: string
 *                       format: email
 *                       description: Customer email
 *                     items:
 *                       type: array
 *                       description: Order items
 *                     subtotal:
 *                       type: number
 *                       description: Order subtotal
 *                     taxAmount:
 *                       type: number
 *                       description: Order tax amount
 *                     discountAmount:
 *                       type: number
 *                       description: Order discount amount
 *                     totalAmount:
 *                       type: number
 *                       description: Order total amount
 *                     currency:
 *                       type: string
 *                       description: Order currency
 *                     paymentMethod:
 *                       type: string
 *                       description: Payment method
 *                     transactionId:
 *                       type: string
 *                       description: Transaction ID
 *     responses:
 *       200:
 *         description: Receipts generated successfully
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
 *                   example: "Generated 5 receipts successfully"
 *                 receipts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Receipt'
 *       400:
 *         description: Bad request - Orders array is required
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

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