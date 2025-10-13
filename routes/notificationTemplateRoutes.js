const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Notification Templates
 *     description: notification templates operations
 */

const notificationTemplateController = require('../controllers/notificationTemplateControllers');
const { protect } = require('../middleware/authMiddleware');

// GET system default templates (no authenticateToken required)
router.get('/system/defaults', notificationTemplateController.getSystemDefaultTemplates);

// Apply authentication middleware to all other routes
router.use(protect);

// CREATE notification template
router.post('/', notificationTemplateController.createNotificationTemplate);

// GET all notification templates with pagination and filtering
router.get('/', notificationTemplateController.getAllNotificationTemplates);

// GET active notification templates
router.get('/active', notificationTemplateController.getActiveNotificationTemplates);

// GET templates by category
router.get('/category/:category', notificationTemplateController.getTemplatesByCategory);

// GET templates by trigger event
router.get('/event/:event', notificationTemplateController.getTemplatesByTriggerEvent);

// GET template usage statistics
router.get('/stats/usage', notificationTemplateController.getTemplateUsageStats);

// BULK CREATE templates
router.post('/bulk', notificationTemplateController.bulkCreateTemplates);

// GET notification template by ID
router.get('/:templateId', notificationTemplateController.getNotificationTemplateById);

// UPDATE notification template
router.patch('/:templateId', notificationTemplateController.updateNotificationTemplate);

// DELETE notification template
router.delete('/:templateId', notificationTemplateController.deleteNotificationTemplate);

// DUPLICATE notification template
router.post('/:templateId/duplicate', notificationTemplateController.duplicateNotificationTemplate);

// SET default template for trigger event
router.patch('/:templateId/set-default', notificationTemplateController.setDefaultTemplate);

// GET notification templates by organization
router.get('/organization/:organizationId', notificationTemplateController.getNotificationTemplatesByOrganization);

module.exports = router;
