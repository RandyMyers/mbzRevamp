const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Shipping Labels
 *     description: shipping labels operations
 */

const shippingLabelController = require('../controllers/shippingLabelController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Generate shipping label for an order
router.post('/generate/:orderId', shippingLabelController.generateShippingLabel);

// Get shipping label by order ID
router.get('/order/:orderId', shippingLabelController.getShippingLabelByOrder);

// Get all shipping labels for organization
router.get('/organization/:organizationId', shippingLabelController.getShippingLabelsByOrganization);

// Bulk generate shipping labels
router.post('/bulk-generate/:organizationId', shippingLabelController.bulkGenerateShippingLabels);

// Generate PDF for shipping label
router.get('/:labelId/pdf', shippingLabelController.generateShippingLabelPDF);

// Update shipping label status
router.patch('/:labelId/status', shippingLabelController.updateShippingLabelStatus);

// Delete shipping label
router.delete('/:labelId', shippingLabelController.deleteShippingLabel);

// Get shipping label by ID (must be last to avoid conflicts with specific routes)
router.get('/:labelId', shippingLabelController.getShippingLabelById);

module.exports = router; 
