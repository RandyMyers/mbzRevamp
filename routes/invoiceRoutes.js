const express = require('express');
const router = express.Router();
const invoiceControllers = require('../controllers/invoiceControllers');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ==================== INVOICE ROUTES ====================

// CREATE new invoice
router.post('/create', invoiceControllers.createInvoice);

// GET all invoices with filters
router.get('/list', invoiceControllers.getInvoices);

// GET single invoice by ID
router.get('/:id', invoiceControllers.getInvoiceById);

// UPDATE invoice
router.put('/:id', invoiceControllers.updateInvoice);

// DELETE invoice (soft delete)
router.delete('/:id', invoiceControllers.deleteInvoice);

// DOWNLOAD invoice as PDF
router.get('/:id/download', invoiceControllers.downloadInvoice);

// EMAIL invoice
router.post('/:id/email', invoiceControllers.emailInvoice);

// BULK generate invoices from orders
router.post('/bulk-generate', invoiceControllers.bulkGenerateInvoices);

module.exports = router; 