const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Invoices
 *     description: invoices operations
 */

const invoiceControllers = require('../controllers/invoiceControllers');
const { protect } = require('../middleware/authMiddleware');



// ==================== INVOICE ROUTES ====================

// CREATE new invoice

/**
 * @swagger
 * /api/invoices/create:
 *   post:
 *     summary: Create Create
 *     tags: [Invoices]
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
router.post('/create', protect, invoiceControllers.createInvoice);

// GET all invoices with filters

/**
 * @swagger
 * /api/invoices/list:
 *   get:
 *     summary: Get List
 *     tags: [Invoices]
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
router.get('/list', protect, invoiceControllers.getInvoices);

// GET single invoice by ID

/**
 * @swagger
 * /api/invoices/:id:
 *   get:
 *     summary: Get Item
 *     tags: [Invoices]
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
router.get('/:id', protect, invoiceControllers.getInvoiceById);

// UPDATE invoice

/**
 * @swagger
 * /api/invoices/:id:
 *   put:
 *     summary: Update Item
 *     tags: [Invoices]
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
router.put('/:id', protect, invoiceControllers.updateInvoice);

// DELETE invoice (soft delete)

/**
 * @swagger
 * /api/invoices/:id:
 *   delete:
 *     summary: Delete Item
 *     tags: [Invoices]
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
router.delete('/:id', protect, invoiceControllers.deleteInvoice);

// DOWNLOAD invoice as PDF

/**
 * @swagger
 * /api/invoices/:id/download:
 *   get:
 *     summary: Get Download
 *     tags: [Invoices]
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
router.get('/:id/download', protect, invoiceControllers.downloadInvoice);

// EMAIL invoice

/**
 * @swagger
 * /api/invoices/:id/email:
 *   post:
 *     summary: Create Email
 *     tags: [Invoices]
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
router.post('/:id/email', protect, invoiceControllers.emailInvoice);

// BULK generate invoices from orders

/**
 * @swagger
 * /api/invoices/bulk-generate:
 *   post:
 *     summary: Create Bulk-generate
 *     tags: [Invoices]
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
router.post('/bulk-generate', protect, invoiceControllers.bulkGenerateInvoices);

// Store-specific invoice routes
router.get('/store/:storeId', protect, invoiceControllers.getInvoicesByStore);

// Generate invoice from order
router.post('/generate-from-order', protect, invoiceControllers.generateOrderInvoice);

module.exports = router; 
