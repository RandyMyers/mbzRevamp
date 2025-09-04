const express = require('express');
const router = express.Router();
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
router.post('/invoice/create', templateControllers.createInvoiceTemplate);

// GET all invoice templates
router.get('/invoice/list', templateControllers.getInvoiceTemplates);

// GET single invoice template by ID
router.get('/invoice/:id', templateControllers.getInvoiceTemplateById);

// UPDATE invoice template
router.put('/invoice/:id', templateControllers.updateInvoiceTemplate);

// DELETE invoice template
router.delete('/invoice/:id', templateControllers.deleteInvoiceTemplate);

// SET default invoice template
router.put('/invoice/:id/set-default', templateControllers.setDefaultInvoiceTemplate);

// ==================== RECEIPT TEMPLATE ROUTES ====================

// CREATE receipt template
router.post('/receipt/create', templateControllers.createReceiptTemplate);

// GET all receipt templates
router.get('/receipt/list', templateControllers.getReceiptTemplates);

// GET single receipt template by ID
router.get('/receipt/:id', templateControllers.getReceiptTemplateById);

// UPDATE receipt template
router.put('/receipt/:id', templateControllers.updateReceiptTemplate);

// DELETE receipt template
router.delete('/receipt/:id', templateControllers.deleteReceiptTemplate);

// SET default receipt template
router.put('/receipt/:id/set-default', templateControllers.setDefaultReceiptTemplate);

// ==================== SYSTEM DEFAULT TEMPLATE ROUTES ====================

// GET system default invoice templates
router.get('/system-defaults/invoice', templateControllers.getSystemDefaultInvoiceTemplates);

// GET system default receipt templates
router.get('/system-defaults/receipt', templateControllers.getSystemDefaultReceiptTemplates);

// ==================== DEFAULT TEMPLATE ROUTES ====================

// GET all default invoice templates (organization + system defaults)
router.get('/defaults/invoice', templateControllers.getAllDefaultInvoiceTemplates);

// GET all default receipt templates (organization + system defaults)
router.get('/defaults/receipt', templateControllers.getAllDefaultReceiptTemplates);

module.exports = router;