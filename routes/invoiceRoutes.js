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
router.post('/create', protect, invoiceControllers.createInvoice);

// GET all invoices with filters
router.get('/list', protect, invoiceControllers.getInvoices);

// GET single invoice by ID
router.get('/:id', protect, invoiceControllers.getInvoiceById);

// UPDATE invoice
router.put('/:id', protect, invoiceControllers.updateInvoice);

// DELETE invoice (soft delete)
router.delete('/:id', protect, invoiceControllers.deleteInvoice);

// DOWNLOAD invoice as PDF
router.get('/:id/download', protect, invoiceControllers.downloadInvoice);

// EMAIL invoice
router.post('/:id/email', protect, invoiceControllers.emailInvoice);

// BULK generate invoices from orders
router.post('/bulk-generate', protect, invoiceControllers.bulkGenerateInvoices);

module.exports = router; 
