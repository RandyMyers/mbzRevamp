const Receipt = require('../models/Receipt');
const ReceiptTemplate = require('../models/ReceiptTemplate');
const Customer = require('../models/customers');
const Store = require('../models/store');
const Organization = require('../models/organization');
const Subscription = require('../models/subscriptions');
const Payment = require('../models/payment');
const { createAuditLog } = require('../helpers/auditLogHelper');
const { sendNotificationToAdmins } = require('../helpers/notificationHelper');
const { getVariablesByScenario } = require('../config/receiptTemplateVariables');
const cloudinary = require('cloudinary').v2;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const templateMergerService = require('../services/templateMergerService');

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
 *         multipart/form-data:
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
 *               companyInfo:
 *                 type: object
 *                 description: Company information override for this receipt
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Company name
 *                     example: "Acme Corp"
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Company email
 *                     example: "billing@acme.com"
 *                   phone:
 *                     type: string
 *                     description: Company phone
 *                     example: "+1 (555) 123-4567"
 *                   address:
 *                     type: object
 *                     description: Company address
 *                     properties:
 *                       street:
 *                         type: string
 *                         example: "123 Business St"
 *                       city:
 *                         type: string
 *                         example: "New York"
 *                       state:
 *                         type: string
 *                         example: "NY"
 *                       zipCode:
 *                         type: string
 *                         example: "10001"
 *                       country:
 *                         type: string
 *                         example: "USA"
 *                   logo:
 *                     type: string
 *                     description: Company logo URL
 *                     example: "https://example.com/logo.png"
 *                   logoPosition:
 *                     type: string
 *                     enum: [top-left, top-right, top-center]
 *                     description: Logo position on receipt
 *                     example: "top-left"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Company logo file (PNG, JPG, JPEG, SVG) - optional
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

/**
 * @swagger
 * /api/receipts/orders/generate:
 *   post:
 *     summary: Generate receipt from WooCommerce order
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
 *               - orderId
 *               - organizationId
 *               - userId
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: ObjectId
 *                 description: WooCommerce order ID
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID generating the receipt
 *     responses:
 *       201:
 *         description: Order receipt generated successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/receipts/subscriptions/generate:
 *   post:
 *     summary: Generate receipt from subscription payment
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
 *               - subscriptionId
 *               - paymentId
 *               - organizationId
 *               - userId
 *             properties:
 *               subscriptionId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Subscription ID
 *               paymentId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Payment ID
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID generating the receipt
 *     responses:
 *       201:
 *         description: Subscription receipt generated successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Subscription, payment, or organization not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/receipts/templates/preferences:
 *   put:
 *     summary: Set receipt template preferences for organization
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
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID updating preferences
 *               defaultOrderTemplate:
 *                 type: string
 *                 format: ObjectId
 *                 description: Default template for WooCommerce orders
 *               defaultSubscriptionTemplate:
 *                 type: string
 *                 format: ObjectId
 *                 description: Default template for subscription payments
 *               autoGenerateOrderReceipts:
 *                 type: boolean
 *                 description: Auto-generate receipts for orders
 *               autoGenerateSubscriptionReceipts:
 *                 type: boolean
 *                 description: Auto-generate receipts for subscriptions
 *     responses:
 *       200:
 *         description: Template preferences updated successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/receipts/templates/preferences/{organizationId}:
 *   get:
 *     summary: Get receipt template preferences for organization
 *     tags: [Receipts]
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
 *     responses:
 *       200:
 *         description: Template preferences retrieved successfully
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/receipts/templates/available/{scenario}:
 *   get:
 *     summary: Get available templates for scenario
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scenario
 *         required: true
 *         schema:
 *           type: string
 *           enum: [woocommerce_order, subscription_payment]
 *         description: Receipt scenario
 *     responses:
 *       200:
 *         description: Available templates retrieved successfully
 *       400:
 *         description: Invalid scenario
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/receipts/templates/random/{scenario}:
 *   get:
 *     summary: Get random template for scenario
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scenario
 *         required: true
 *         schema:
 *           type: string
 *           enum: [woocommerce_order, subscription_payment]
 *         description: Receipt scenario
 *     responses:
 *       200:
 *         description: Random template retrieved successfully
 *       400:
 *         description: Invalid scenario
 *       404:
 *         description: No templates available
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/receipts/{id}/pdf/{scenario}:
 *   get:
 *     summary: Download receipt as PDF with scenario-specific formatting
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
 *       - in: path
 *         name: scenario
 *         required: true
 *         schema:
 *           type: string
 *           enum: [woocommerce_order, subscription_payment]
 *         description: Receipt scenario
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
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

// CREATE a new receipt
exports.createReceipt = async (req, res) => {
  try {
    const {
      customerId,
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
      type
    } = req.body;

    // Handle logo upload if provided
    let logoUrl = null;
    if (req.files && req.files.logo) {
      try {
        const logoFile = req.files.logo;
        
        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
        if (!allowedTypes.includes(logoFile.mimetype)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid logo file type. Only PNG, JPG, JPEG, and SVG files are allowed.'
          });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (logoFile.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: 'Logo file size too large. Maximum size is 5MB.'
          });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const publicId = `logos/${organizationId || 'default'}/${userId}_${timestamp}`;

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(logoFile.tempFilePath, {
          public_id: publicId,
          folder: 'elapix/logos',
          resource_type: 'auto',
          transformation: [
            { width: 300, height: 300, crop: 'limit' }, // Resize if needed
            { quality: 'auto' }
          ]
        });

        logoUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('❌ [RECEIPT] Logo upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload logo'
        });
      }
    }

    // Validate required fields (storeId is now automatic - uses organization default)
    const requiredFields = ['customerId', 'organizationId', 'userId', 'customerName', 'customerEmail', 'items', 'totalAmount', 'paymentMethod'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Get organization with template settings
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Get organization's default store (first active store)
    const defaultStore = await Store.findOne({ 
      organizationId: organizationId, 
      isActive: true 
    });
    
    if (!defaultStore) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active store found for this organization. Please add a store first.' 
      });
    }

    // Get merged company info from organization template settings using default store
    // Note: Receipts use the same template system as invoices (organizationTemplateSettings)
    let mergedCompanyInfo = null;
    try {
      mergedCompanyInfo = await templateMergerService.getMergedCompanyInfoForGeneration(organizationId, defaultStore._id, 'receipt');
    } catch (error) {
      console.error('Error getting merged company info:', error);
      // Continue without merged company info if there's an error
    }

    // Generate receipt number
    const receiptNumber = await Receipt.generateReceiptNumber(organizationId);

    // Create new receipt using organization defaults
    const newReceipt = new Receipt({
      receiptNumber,
      customerId,
      storeId: defaultStore._id, // Use organization's default store
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
      // Use merged company info from organization template settings (includes template data)
      companyInfo: mergedCompanyInfo ? {
        ...mergedCompanyInfo,
        ...(logoUrl && { logo: logoUrl })
      } : (logoUrl ? { logo: logoUrl } : undefined),
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
    const userId = req.user._id;
    const organizationId = req.user.organization;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const {
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
    const userId = req.user._id;
    const organizationId = req.user.organization;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

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
    const userId = req.user._id;
    const organizationId = req.user.organization;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

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
    const userId = req.user._id;
    const organizationId = req.user.organization;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

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
    const userId = req.user._id;
    const organizationId = req.user.organization;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

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
    const userId = req.user._id;
    const organizationId = req.user.organization;
    const { recipientEmail } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

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
    const userId = req.user._id;
    const organizationId = req.user.organization;
    const { refundAmount, refundReason } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

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
    const userId = req.user._id;
    const organizationId = req.user.organization;
    const { orders } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Orders array is required'
      });
    }

    const generatedReceipts = [];

    // Get merged company info for all receipts (same organization and store)
    let mergedCompanyInfo = null;
    try {
      const firstOrder = orders[0];
      mergedCompanyInfo = await templateMergerService.getMergedCompanyInfoForGeneration(organizationId, firstOrder.storeId, 'receipt');
    } catch (error) {
      console.error('Error getting merged company info for bulk generation:', error);
      // Continue without merged company info if there's an error
    }

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
          // Use merged company info from organization template settings
          companyInfo: mergedCompanyInfo,
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

// ==================== NEW FUNCTIONS FOR TWO-SCENARIO SYSTEM ====================

// Generate receipt from WooCommerce order
exports.generateOrderReceipt = async (req, res) => {
  try {
    const { orderId, organizationId, userId } = req.body;

    if (!orderId || !organizationId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, organizationId, userId'
      });
    }

    // Get order details
    const Order = require('../models/order');
    const order = await Order.findOne({ _id: orderId, organizationId })
      .populate('customerId', 'name email phone address')
      .populate('storeId', 'name url');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get organization with template settings
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Get organization's default store (first active store)
    const defaultStore = await Store.findOne({ 
      organizationId: organizationId, 
      isActive: true 
    });
    
    if (!defaultStore) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active store found for this organization. Please add a store first.' 
      });
    }

    // Get merged company info from organization template settings using default store
    // Note: Receipts use the same template system as invoices (organizationTemplateSettings)
    let mergedCompanyInfo = null;
    try {
      mergedCompanyInfo = await templateMergerService.getMergedCompanyInfoForGeneration(organizationId, defaultStore._id, 'receipt');
    } catch (error) {
      console.error('Error getting merged company info:', error);
      // Continue without merged company info if there's an error
    }

    // Generate receipt number
    const receiptNumber = await Receipt.generateReceiptNumber(organizationId);

    // Create receipt from order using organization defaults
    const newReceipt = new Receipt({
      receiptNumber,
      customerId: order.customerId || order.customer_id || order.userId?._id || userId, // WooCommerce orders use customer_id
      storeId: defaultStore._id, // Use organization's default store
      organizationId,
      userId,
      customerName: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim() || 'Customer',
      customerEmail: order.billing?.email || 'customer@example.com',
      customerAddress: {
        street: order.billing?.address_1 || '',
        city: order.billing?.city || '',
        state: order.billing?.state || '',
        zipCode: order.billing?.postcode || '',
        country: order.billing?.country || ''
      },
      items: order.line_items?.map(item => ({
        name: item.name,
        description: item.meta_data?.find(m => m.key === 'description')?.value || '',
        quantity: item.quantity,
        unitPrice: parseFloat(item.price),
        totalPrice: parseFloat(item.total),
        taxRate: 0
      })) || [],
      subtotal: parseFloat(order.total) - parseFloat(order.total_tax || 0),
      taxAmount: parseFloat(order.total_tax || 0),
      discountAmount: parseFloat(order.discount_total || 0),
      totalAmount: parseFloat(order.total),
      currency: order.currency || 'USD',
      paymentMethod: order.payment_method_title || 'Credit Card',
      transactionId: order.transaction_id || '',
      transactionDate: order.date_created || new Date(),
      description: order.customer_note || '',
      type: 'purchase',
      scenario: 'woocommerce_order',
      // Use merged company info from organization template settings (includes template data)
      companyInfo: mergedCompanyInfo,
      createdBy: userId,
      updatedBy: userId
    });

    newReceipt.calculateTotals();
    const savedReceipt = await newReceipt.save();

    // Create audit log
    await createAuditLog({
      action: 'ORDER_RECEIPT_GENERATED',
      user: userId,
      resource: 'Receipt',
      resourceId: savedReceipt._id,
      details: {
        receiptNumber: savedReceipt.receiptNumber,
        orderId: order._id,
        totalAmount: savedReceipt.totalAmount
      },
      organization: organizationId
    });

    res.status(201).json({
      success: true,
      message: 'Order receipt generated successfully',
      receipt: savedReceipt
    });

  } catch (error) {
    console.error('Error generating order receipt:', error);

    // Handle validation errors with 400 status
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + Object.values(error.errors).map(e => e.message).join(', '),
        error: error.message
      });
    }

    // Handle other errors with 500 status
    res.status(500).json({
      success: false,
      message: 'Error generating order receipt',
      error: error.message
    });
  }
};

// Generate receipt from subscription payment
exports.generateSubscriptionReceipt = async (req, res) => {
  try {
    const { subscriptionId, paymentId, organizationId, userId } = req.body;

    if (!subscriptionId || !paymentId || !organizationId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subscriptionId, paymentId, organizationId, userId'
      });
    }

    // Get subscription and payment details
    const subscription = await Subscription.findById(subscriptionId)
      .populate('plan', 'name description price')
      .populate('user', 'fullName email');
    
    const payment = await Payment.findById(paymentId);
    const organization = await Organization.findById(organizationId);

    if (!subscription || !payment || !organization) {
      return res.status(404).json({
        success: false,
        message: 'Subscription, payment, or organization not found'
      });
    }

    // Get template (default or random)
    const template = await getTemplateForScenario('subscription_payment', organizationId);

    // Generate receipt number
    const receiptNumber = await Receipt.generateReceiptNumber(organizationId);

    // Create receipt from subscription
    const newReceipt = new Receipt({
      receiptNumber,
      organizationId,
      userId,
      subscriptionId,
      paymentId,
      items: [{
        name: subscription.plan?.name || 'Subscription Plan',
        description: subscription.plan?.description || '',
        quantity: 1,
        unitPrice: payment.amount,
        totalPrice: payment.amount,
        taxRate: 0
      }],
      subtotal: payment.amount,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: payment.amount,
      currency: payment.currency || 'USD',
      paymentMethod: payment.gateway || 'Credit Card',
      transactionId: payment.reference,
      transactionDate: payment.createdAt || new Date(),
      description: `Subscription payment for ${subscription.billingInterval} plan`,
      type: 'subscription',
      scenario: 'subscription_payment',
      templateId: template._id,
      createdBy: userId,
      updatedBy: userId
    });

    newReceipt.calculateTotals();
    const savedReceipt = await newReceipt.save();

    // Create audit log
    await createAuditLog({
      action: 'SUBSCRIPTION_RECEIPT_GENERATED',
      user: userId,
      resource: 'Receipt',
      resourceId: savedReceipt._id,
      details: {
        receiptNumber: savedReceipt.receiptNumber,
        subscriptionId: subscription._id,
        paymentId: payment._id,
        totalAmount: savedReceipt.totalAmount
      },
      organization: organizationId
    });

    res.status(201).json({
      success: true,
      message: 'Subscription receipt generated successfully',
      receipt: savedReceipt
    });

  } catch (error) {
    console.error('Error generating subscription receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating subscription receipt',
      error: error.message
    });
  }
};

// Set receipt template preferences
exports.setReceiptTemplatePreferences = async (req, res) => {
  try {
    const { organizationId, userId, defaultOrderTemplate, defaultSubscriptionTemplate } = req.body;

    if (!organizationId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: organizationId, userId'
      });
    }

    // Update organization's receipt template preferences
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Update template preferences
    organization.receiptSettings = {
      defaultOrderTemplate,
      defaultSubscriptionTemplate,
      autoGenerateOrderReceipts: req.body.autoGenerateOrderReceipts !== undefined ? req.body.autoGenerateOrderReceipts : true,
      autoGenerateSubscriptionReceipts: req.body.autoGenerateSubscriptionReceipts !== undefined ? req.body.autoGenerateSubscriptionReceipts : true
    };

    await organization.save();

    // Create audit log
    await createAuditLog({
      action: 'RECEIPT_TEMPLATE_PREFERENCES_UPDATED',
      user: userId,
      resource: 'Organization',
      resourceId: organizationId,
      details: {
        defaultOrderTemplate,
        defaultSubscriptionTemplate
      },
      organization: organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Receipt template preferences updated successfully',
      preferences: organization.receiptSettings
    });

  } catch (error) {
    console.error('Error setting receipt template preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting receipt template preferences',
      error: error.message
    });
  }
};

// Get receipt template preferences
exports.getReceiptTemplatePreferences = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Get available templates for each scenario
    const orderTemplates = await ReceiptTemplate.find({
      $or: [
        { scenario: 'woocommerce_order' },
        { scenario: 'universal' }
      ],
      isActive: true
    }).select('name description templateType scenario');

    const subscriptionTemplates = await ReceiptTemplate.find({
      $or: [
        { scenario: 'subscription_payment' },
        { scenario: 'universal' }
      ],
      isActive: true
    }).select('name description templateType scenario');

    res.status(200).json({
      success: true,
      preferences: organization.receiptSettings || {},
      availableTemplates: {
        order: orderTemplates,
        subscription: subscriptionTemplates
      }
    });

  } catch (error) {
    console.error('Error getting receipt template preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting receipt template preferences',
      error: error.message
    });
  }
};

// Get available templates for scenario
exports.getAvailableTemplates = async (req, res) => {
  try {
    const { scenario } = req.params;

    if (!['woocommerce_order', 'subscription_payment'].includes(scenario)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scenario. Must be woocommerce_order or subscription_payment'
      });
    }

    const templates = await ReceiptTemplate.find({
      $or: [
        { scenario: scenario },
        { scenario: 'universal' }
      ],
      isActive: true
    }).select('name description templateType scenario isSystemDefault');

    res.status(200).json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('Error getting available templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting available templates',
      error: error.message
    });
  }
};

// Get random template for scenario
exports.getRandomTemplate = async (req, res) => {
  try {
    const { scenario } = req.params;

    if (!['woocommerce_order', 'subscription_payment'].includes(scenario)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scenario. Must be woocommerce_order or subscription_payment'
      });
    }

    const templates = await ReceiptTemplate.find({
      $or: [
        { scenario: scenario },
        { scenario: 'universal' }
      ],
      isActive: true
    });

    if (templates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No templates available for this scenario'
      });
    }

    // Get random template
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

    res.status(200).json({
      success: true,
      template: randomTemplate
    });

  } catch (error) {
    console.error('Error getting random template:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting random template',
      error: error.message
    });
  }
};

// Enhanced PDF generation with scenario support
exports.generateReceiptPDF = async (req, res) => {
  try {
    const { id, scenario } = req.params;
    const userId = req.user._id;
    const organizationId = req.user.organization;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const receipt = await Receipt.findOne({ _id: id, organizationId, scenario })
      .populate('customerId', 'name email phone address')
      .populate('storeId', 'name url')
      .populate('subscriptionId', 'billingInterval startDate endDate')
      .populate('paymentId', 'reference gateway amount currency')
      .populate('templateId');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    // Generate PDF with scenario-specific template
    const doc = new PDFDocument();
    const filename = `receipt-${receipt.receiptNumber}-${scenario}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);
    
    // Add content to PDF based on scenario
    if (scenario === 'woocommerce_order') {
      await generateOrderReceiptPDF(doc, receipt);
    } else if (scenario === 'subscription_payment') {
      await generateSubscriptionReceiptPDF(doc, receipt);
    } else {
      // Fallback to generic receipt
      await generateGenericReceiptPDF(doc, receipt);
    }
    
    doc.end();

  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating receipt PDF',
      error: error.message
    });
  }
};

// Generate PDF for WooCommerce order receipt
async function generateOrderReceiptPDF(doc, receipt) {
  // Header
  doc.fontSize(20).text('RECEIPT', { align: 'center' });
  doc.moveDown();
  
  // Receipt details
  doc.fontSize(12).text(`Receipt Number: ${receipt.receiptNumber}`);
  doc.text(`Date: ${receipt.transactionDate.toLocaleDateString()}`);
  doc.text(`Payment Method: ${receipt.paymentMethod}`);
  if (receipt.transactionId) {
    doc.text(`Transaction ID: ${receipt.transactionId}`);
  }
  doc.moveDown();
  
  // Customer information
  doc.text(`Customer: ${receipt.customerName}`);
  doc.text(`Email: ${receipt.customerEmail}`);
  if (receipt.customerAddress) {
    doc.text(`Address: ${receipt.customerAddress.street}, ${receipt.customerAddress.city}, ${receipt.customerAddress.state} ${receipt.customerAddress.zipCode}`);
  }
  doc.moveDown();
  
  // Items table
  doc.text('Items:', { underline: true });
  receipt.items.forEach(item => {
    doc.text(`${item.name} - Qty: ${item.quantity} - Price: $${item.unitPrice} - Total: $${item.totalPrice}`);
  });
  doc.moveDown();
  
  // Totals
  doc.text(`Subtotal: $${receipt.subtotal}`);
  doc.text(`Tax: $${receipt.taxAmount}`);
  doc.text(`Discount: $${receipt.discountAmount}`);
  doc.text(`Total: $${receipt.totalAmount}`, { underline: true });
  doc.moveDown();
  doc.text('Thank you for your purchase!', { align: 'center' });
}

// Generate PDF for subscription payment receipt
async function generateSubscriptionReceiptPDF(doc, receipt) {
  // Header
  doc.fontSize(20).text('SUBSCRIPTION RECEIPT', { align: 'center' });
  doc.moveDown();
  
  // Receipt details
  doc.fontSize(12).text(`Receipt Number: ${receipt.receiptNumber}`);
  doc.text(`Date: ${receipt.transactionDate.toLocaleDateString()}`);
  doc.text(`Payment Method: ${receipt.paymentMethod}`);
  if (receipt.transactionId) {
    doc.text(`Transaction ID: ${receipt.transactionId}`);
  }
  doc.moveDown();
  
  // Subscription information
  if (receipt.subscriptionId) {
    doc.text(`Subscription ID: ${receipt.subscriptionId._id}`);
    doc.text(`Billing Interval: ${receipt.subscriptionId.billingInterval}`);
    doc.text(`Start Date: ${receipt.subscriptionId.startDate?.toLocaleDateString()}`);
    doc.text(`End Date: ${receipt.subscriptionId.endDate?.toLocaleDateString()}`);
  }
  doc.moveDown();
  
  // Payment information
  if (receipt.paymentId) {
    doc.text(`Payment Reference: ${receipt.paymentId.reference}`);
    doc.text(`Payment Gateway: ${receipt.paymentId.gateway}`);
  }
  doc.moveDown();
  
  // Items (subscription plan)
  doc.text('Subscription Details:', { underline: true });
  receipt.items.forEach(item => {
    doc.text(`${item.name} - ${item.description}`);
    doc.text(`Amount: $${item.totalPrice}`);
  });
  doc.moveDown();
  
  // Totals
  doc.text(`Subtotal: $${receipt.subtotal}`);
  doc.text(`Tax: $${receipt.taxAmount}`);
  doc.text(`Discount: $${receipt.discountAmount}`);
  doc.text(`Total: $${receipt.totalAmount}`, { underline: true });
  doc.moveDown();
  doc.text('Thank you for your subscription!', { align: 'center' });
}

// Generate generic PDF receipt
async function generateGenericReceiptPDF(doc, receipt) {
  // Header
  doc.fontSize(20).text('RECEIPT', { align: 'center' });
  doc.moveDown();
  
  // Receipt details
  doc.fontSize(12).text(`Receipt Number: ${receipt.receiptNumber}`);
  doc.text(`Date: ${receipt.transactionDate.toLocaleDateString()}`);
  doc.text(`Payment Method: ${receipt.paymentMethod}`);
  if (receipt.transactionId) {
    doc.text(`Transaction ID: ${receipt.transactionId}`);
  }
  doc.moveDown();
  
  // Items
  doc.text('Items:', { underline: true });
  receipt.items.forEach(item => {
    doc.text(`${item.name} - Qty: ${item.quantity} - Price: $${item.unitPrice} - Total: $${item.totalPrice}`);
  });
  doc.moveDown();
  
  // Totals
  doc.text(`Subtotal: $${receipt.subtotal}`);
  doc.text(`Tax: $${receipt.taxAmount}`);
  doc.text(`Discount: $${receipt.discountAmount}`);
  doc.text(`Total: $${receipt.totalAmount}`, { underline: true });
  doc.moveDown();
  doc.text('Thank you for your payment!', { align: 'center' });
}

// Helper function to get template for scenario
async function getTemplateForScenario(scenario, organizationId) {
  try {
    // Get organization's template preferences
    const organization = await Organization.findById(organizationId);
    
    let templateId = null;
    if (organization?.receiptSettings) {
      templateId = scenario === 'woocommerce_order' 
        ? organization.receiptSettings.defaultOrderTemplate
        : organization.receiptSettings.defaultSubscriptionTemplate;
    }

    // If default template is set, use it
    if (templateId) {
      const template = await ReceiptTemplate.findById(templateId);
      if (template && template.isActive) {
        return template;
      }
    }

    // Otherwise, get random template for scenario
    const templates = await ReceiptTemplate.find({
      $or: [
        { scenario: scenario },
        { scenario: 'universal' }
      ],
      isActive: true
    });

    if (templates.length === 0) {
      throw new Error('No templates available for this scenario');
    }

    return templates[Math.floor(Math.random() * templates.length)];

  } catch (error) {
    console.error('Error getting template for scenario:', error);
    throw error;
  }
}

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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



    const {

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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;

    const { recipientEmail } = req.body;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;

    const { refundAmount, refundReason } = req.body;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;

    const { orders } = req.body;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



    const {

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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;

    const { recipientEmail } = req.body;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;

    const { refundAmount, refundReason } = req.body;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;

    const { orders } = req.body;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



    const {

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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;

    const { recipientEmail } = req.body;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;

    const { refundAmount, refundReason } = req.body;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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

    const userId = req.user._id;

    const organizationId = req.user.organization;

    const { orders } = req.body;



    if (!userId) {

      return res.status(401).json({

        success: false,

        message: 'Authentication required'

      });

    }



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