const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Invoice Templates
 *     description: invoice templates operations
 */

const templateControllers = require('../controllers/invoiceTemplateControllers');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware only for create operations
router.use((req, res, next) => {
  console.log('🔍 Route path:', req.path);
  console.log('🔍 Route method:', req.method);
  
  // Skip authentication for GET operations and system defaults
  if (req.method === 'GET' || 
      req.path.includes('/system-defaults/') || 
      req.path.includes('/defaults/')) {
    console.log('✅ Skipping authentication for GET or system default route');
    return next();
  }
  
  console.log('🔒 Applying authentication for protected route');
  // Apply authentication for create, update, delete operations
  return authenticateToken(req, res, next);
});

// ==================== INVOICE TEMPLATE ROUTES ====================

// CREATE invoice template

/**
 * @swagger
 * /api/invoice/templates/invoice/create:
 *   post:
 *     summary: Create Create
 *     tags: [Invoice Templates]
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
router.post('/invoice/create', templateControllers.createInvoiceTemplate);

// GET all invoice templates

/**
 * @swagger
 * /api/invoice/templates/invoice/list:
 *   get:
 *     summary: Get List
 *     tags: [Invoice Templates]
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
router.get('/invoice/list', templateControllers.getInvoiceTemplates);

// GET single invoice template by ID

/**
 * @swagger
 * /api/invoice/templates/invoice/:id:
 *   get:
 *     summary: Get Invoice
 *     tags: [Invoice Templates]
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
router.get('/invoice/:id', templateControllers.getInvoiceTemplateById);

// UPDATE invoice template

/**
 * @swagger
 * /api/invoice/templates/invoice/:id:
 *   put:
 *     summary: Update Invoice
 *     tags: [Invoice Templates]
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
router.put('/invoice/:id', templateControllers.updateInvoiceTemplate);

// DELETE invoice template

/**
 * @swagger
 * /api/invoice/templates/invoice/:id:
 *   delete:
 *     summary: Delete Invoice
 *     tags: [Invoice Templates]
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
router.delete('/invoice/:id', templateControllers.deleteInvoiceTemplate);

// SET default invoice template

/**
 * @swagger
 * /api/invoice/templates/invoice/:id/set-default:
 *   put:
 *     summary: Update Set-default
 *     tags: [Invoice Templates]
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
router.put('/invoice/:id/set-default', templateControllers.setDefaultInvoiceTemplate);

// ==================== RECEIPT TEMPLATE ROUTES ====================

// CREATE receipt template

/**
 * @swagger
 * /api/invoice/templates/receipt/create:
 *   post:
 *     summary: Create Create
 *     tags: [Invoice Templates]
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
router.post('/receipt/create', templateControllers.createReceiptTemplate);

// GET all receipt templates

/**
 * @swagger
 * /api/invoice/templates/receipt/list:
 *   get:
 *     summary: Get List
 *     tags: [Invoice Templates]
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
router.get('/receipt/list', templateControllers.getReceiptTemplates);

// GET single receipt template by ID

/**
 * @swagger
 * /api/invoice/templates/receipt/:id:
 *   get:
 *     summary: Get Receipt
 *     tags: [Invoice Templates]
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
router.get('/receipt/:id', templateControllers.getReceiptTemplateById);

// UPDATE receipt template

/**
 * @swagger
 * /api/invoice/templates/receipt/:id:
 *   put:
 *     summary: Update Receipt
 *     tags: [Invoice Templates]
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
router.put('/receipt/:id', templateControllers.updateReceiptTemplate);

// DELETE receipt template

/**
 * @swagger
 * /api/invoice/templates/receipt/:id:
 *   delete:
 *     summary: Delete Receipt
 *     tags: [Invoice Templates]
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
router.delete('/receipt/:id', templateControllers.deleteReceiptTemplate);

// SET default receipt template

/**
 * @swagger
 * /api/invoice/templates/receipt/:id/set-default:
 *   put:
 *     summary: Update Set-default
 *     tags: [Invoice Templates]
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
router.put('/receipt/:id/set-default', templateControllers.setDefaultReceiptTemplate);

// ==================== SYSTEM DEFAULT TEMPLATE ROUTES ====================

// GET system default invoice templates

/**
 * @swagger
 * /api/invoice/templates/system-defaults/invoice:
 *   get:
 *     summary: Get Invoice
 *     tags: [Invoice Templates]
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
router.get('/system-defaults/invoice', templateControllers.getSystemDefaultInvoiceTemplates);

// GET system default receipt templates

/**
 * @swagger
 * /api/invoice/templates/system-defaults/receipt:
 *   get:
 *     summary: Get Receipt
 *     tags: [Invoice Templates]
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
router.get('/system-defaults/receipt', templateControllers.getSystemDefaultReceiptTemplates);

// ==================== DEFAULT TEMPLATE ROUTES ====================

// GET all default invoice templates (organization + system defaults)

/**
 * @swagger
 * /api/invoice/templates/defaults/invoice:
 *   get:
 *     summary: Get Invoice
 *     tags: [Invoice Templates]
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
router.get('/defaults/invoice', templateControllers.getAllDefaultInvoiceTemplates);

// GET all default receipt templates (organization + system defaults)

/**
 * @swagger
 * /api/invoice/templates/defaults/receipt:
 *   get:
 *     summary: Get Receipt
 *     tags: [Invoice Templates]
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
router.get('/defaults/receipt', templateControllers.getAllDefaultReceiptTemplates);

module.exports = router;
