const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Receipts
 *     description: receipts operations
 */

const receiptControllers = require('../controllers/receiptControllers');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ==================== RECEIPT ROUTES ====================

// CREATE new receipt

/**
 * @swagger
 * /api/receipts/create:
 *   post:
 *     summary: Create Create
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/create', receiptControllers.createReceipt);

// GET all receipts with filters

/**
 * @swagger
 * /api/receipts/:
 *   get:
 *     summary: Get Item
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', receiptControllers.getReceipts);

/**
 * @swagger
 * /api/receipts/list:
 *   get:
 *     summary: Get List
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/list', receiptControllers.getReceipts);

// GET single receipt by ID

/**
 * @swagger
 * /api/receipts/:id:
 *   get:
 *     summary: Get Item
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', receiptControllers.getReceiptById);

// UPDATE receipt

/**
 * @swagger
 * /api/receipts/:id:
 *   put:
 *     summary: Update Item
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', receiptControllers.updateReceipt);

// DELETE receipt (soft delete)

/**
 * @swagger
 * /api/receipts/:id:
 *   delete:
 *     summary: Delete Item
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id', receiptControllers.deleteReceipt);

// DOWNLOAD receipt as PDF

/**
 * @swagger
 * /api/receipts/:id/download:
 *   get:
 *     summary: Get Download
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id/download', receiptControllers.downloadReceipt);

// EMAIL receipt

/**
 * @swagger
 * /api/receipts/:id/email:
 *   post:
 *     summary: Create Email
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:id/email', receiptControllers.emailReceipt);

// PROCESS refund

/**
 * @swagger
 * /api/receipts/:id/refund:
 *   post:
 *     summary: Create Refund
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:id/refund', receiptControllers.processRefund);

// BULK generate receipts from orders

/**
 * @swagger
 * /api/receipts/bulk-generate:
 *   post:
 *     summary: Create Bulk-generate
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/bulk-generate', receiptControllers.bulkGenerateReceipts);

// ==================== NEW TWO-SCENARIO ROUTES ====================

// Order receipt generation

/**
 * @swagger
 * /api/receipts/orders/generate:
 *   post:
 *     summary: Create Generate
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/orders/generate', receiptControllers.generateOrderReceipt);

// Subscription receipt generation

/**
 * @swagger
 * /api/receipts/subscriptions/generate:
 *   post:
 *     summary: Create Generate
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/subscriptions/generate', receiptControllers.generateSubscriptionReceipt);

// Receipt template management

/**
 * @swagger
 * /api/receipts/templates/preferences:
 *   put:
 *     summary: Update Preferences
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/templates/preferences', receiptControllers.setReceiptTemplatePreferences);

/**
 * @swagger
 * /api/receipts/templates/preferences/:organizationId:
 *   get:
 *     summary: Get Preferences
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/templates/preferences/:organizationId', receiptControllers.getReceiptTemplatePreferences);

/**
 * @swagger
 * /api/receipts/templates/available/:scenario:
 *   get:
 *     summary: Get Available
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/templates/available/:scenario', receiptControllers.getAvailableTemplates);

/**
 * @swagger
 * /api/receipts/templates/random/:scenario:
 *   get:
 *     summary: Get Random
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/templates/random/:scenario', receiptControllers.getRandomTemplate);

// Enhanced PDF generation

/**
 * @swagger
 * /api/receipts/:id/pdf/:scenario:
 *   get:
 *     summary: Get Pdf
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id/pdf/:scenario', receiptControllers.generateReceiptPDF);

// Store-specific receipt routes
const receiptStoreController = require('../controllers/receiptStoreController');
router.get('/store/:storeId', authenticateToken, receiptStoreController.getReceiptsByStore);

module.exports = router; 
