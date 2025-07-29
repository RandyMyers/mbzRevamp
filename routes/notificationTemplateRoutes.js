const express = require('express');
const router = express.Router();
const notificationTemplateController = require('../controllers/notificationTemplateControllers');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// CREATE notification template
router.post('/', notificationTemplateController.createNotificationTemplate);

// GET all notification templates with pagination and filtering
router.get('/', notificationTemplateController.getAllNotificationTemplates);

// GET active notification templates
router.get('/active', notificationTemplateController.getActiveNotificationTemplates);

// GET notification template by ID
router.get('/:templateId', notificationTemplateController.getNotificationTemplateById);

// UPDATE notification template
router.patch('/:templateId', notificationTemplateController.updateNotificationTemplate);

// DELETE notification template
router.delete('/:templateId', notificationTemplateController.deleteNotificationTemplate);

// DUPLICATE notification template
router.post('/:templateId/duplicate', notificationTemplateController.duplicateNotificationTemplate);

// GET notification templates by organization
router.get('/organization/:organizationId', notificationTemplateController.getNotificationTemplatesByOrganization);

module.exports = router;