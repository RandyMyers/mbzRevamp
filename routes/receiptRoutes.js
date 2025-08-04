const express = require('express');
const router = express.Router();
const receiptControllers = require('../controllers/receiptControllers');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ==================== RECEIPT ROUTES ====================

// CREATE new receipt
router.post('/create', receiptControllers.createReceipt);

// GET all receipts with filters
router.get('/list', receiptControllers.getReceipts);

// GET single receipt by ID
router.get('/:id', receiptControllers.getReceiptById);

// UPDATE receipt
router.put('/:id', receiptControllers.updateReceipt);

// DELETE receipt (soft delete)
router.delete('/:id', receiptControllers.deleteReceipt);

// DOWNLOAD receipt as PDF
router.get('/:id/download', receiptControllers.downloadReceipt);

// EMAIL receipt
router.post('/:id/email', receiptControllers.emailReceipt);

// PROCESS refund
router.post('/:id/refund', receiptControllers.processRefund);

// BULK generate receipts from orders
router.post('/bulk-generate', receiptControllers.bulkGenerateReceipts);

module.exports = router; 