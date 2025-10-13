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

/**
 * @swagger
 * /api/notification-templates/system/defaults:
 *   get:
 *     summary: Get Defaults
 *     tags: [Notification Templates]
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
router.get('/system/defaults', notificationTemplateController.getSystemDefaultTemplates);

// Apply authentication middleware to all other routes
router.use(protect);

// CREATE notification template

/**
 * @swagger
 * /api/notification-templates/:
 *   post:
 *     summary: Create Item
 *     tags: [Notification Templates]
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
router.post('/', notificationTemplateController.createNotificationTemplate);

// GET all notification templates with pagination and filtering

/**
 * @swagger
 * /api/notification-templates/:
 *   get:
 *     summary: Get Item
 *     tags: [Notification Templates]
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
router.get('/', notificationTemplateController.getAllNotificationTemplates);

// GET active notification templates

/**
 * @swagger
 * /api/notification-templates/active:
 *   get:
 *     summary: Get Active
 *     tags: [Notification Templates]
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
router.get('/active', notificationTemplateController.getActiveNotificationTemplates);

// GET templates by category

/**
 * @swagger
 * /api/notification-templates/category/:category:
 *   get:
 *     summary: Get Category
 *     tags: [Notification Templates]
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
router.get('/category/:category', notificationTemplateController.getTemplatesByCategory);

// GET templates by trigger event

/**
 * @swagger
 * /api/notification-templates/event/:event:
 *   get:
 *     summary: Get Event
 *     tags: [Notification Templates]
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
router.get('/event/:event', notificationTemplateController.getTemplatesByTriggerEvent);

// GET template usage statistics

/**
 * @swagger
 * /api/notification-templates/stats/usage:
 *   get:
 *     summary: Get Usage
 *     tags: [Notification Templates]
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
router.get('/stats/usage', notificationTemplateController.getTemplateUsageStats);

// BULK CREATE templates

/**
 * @swagger
 * /api/notification-templates/bulk:
 *   post:
 *     summary: Create Bulk
 *     tags: [Notification Templates]
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
router.post('/bulk', notificationTemplateController.bulkCreateTemplates);

// GET notification template by ID

/**
 * @swagger
 * /api/notification-templates/:templateId:
 *   get:
 *     summary: Get Item
 *     tags: [Notification Templates]
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
router.get('/:templateId', notificationTemplateController.getNotificationTemplateById);

// UPDATE notification template

/**
 * @swagger
 * /api/notification-templates/:templateId:
 *   patch:
 *     summary: Update Item
 *     tags: [Notification Templates]
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
router.patch('/:templateId', notificationTemplateController.updateNotificationTemplate);

// DELETE notification template

/**
 * @swagger
 * /api/notification-templates/:templateId:
 *   delete:
 *     summary: Delete Item
 *     tags: [Notification Templates]
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
router.delete('/:templateId', notificationTemplateController.deleteNotificationTemplate);

// DUPLICATE notification template

/**
 * @swagger
 * /api/notification-templates/:templateId/duplicate:
 *   post:
 *     summary: Create Duplicate
 *     tags: [Notification Templates]
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
router.post('/:templateId/duplicate', notificationTemplateController.duplicateNotificationTemplate);

// SET default template for trigger event

/**
 * @swagger
 * /api/notification-templates/:templateId/set-default:
 *   patch:
 *     summary: Update Set-default
 *     tags: [Notification Templates]
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
router.patch('/:templateId/set-default', notificationTemplateController.setDefaultTemplate);

// GET notification templates by organization

/**
 * @swagger
 * /api/notification-templates/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Notification Templates]
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
router.get('/organization/:organizationId', notificationTemplateController.getNotificationTemplatesByOrganization);

module.exports = router;
