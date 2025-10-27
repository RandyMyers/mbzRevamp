const express = require('express');
const router = express.Router();
const documentManagement = require('../controllers/documentManagementController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication and authorization middleware
router.use(protect, restrictTo('super-admin', 'hr-manager', 'hr-assistant'));

// Document management routes
router.get('/', documentManagement.listDocuments);
router.post('/upload', documentManagement.uploadDocument);
router.get('/templates', documentManagement.getDocumentTemplates);
router.get('/analytics', documentManagement.getDocumentAnalytics);

// Individual document operations
router.get('/:id', documentManagement.getDocumentById);
router.put('/:id', documentManagement.updateDocument);
router.delete('/:id', documentManagement.deleteDocument);

// Document permissions
router.post('/:id/permissions', documentManagement.setDocumentPermissions);

module.exports = router;


