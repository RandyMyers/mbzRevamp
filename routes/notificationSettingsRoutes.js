const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Notification Settings
 *     description: notification settings operations
 */

const notificationSettingsController = require('../controllers/notificationSettingsController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// GET user notification settings

/**
 * @swagger
 * /api/notification-settings/user/:userId:
 *   get:
 *     summary: Get User
 *     tags: [Notification Settings]
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
router.get('/user/:userId', notificationSettingsController.getUserNotificationSettings);

// UPDATE user notification settings

/**
 * @swagger
 * /api/notification-settings/user/:userId:
 *   patch:
 *     summary: Update User
 *     tags: [Notification Settings]
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
router.patch('/user/:userId', notificationSettingsController.updateUserNotificationSettings);

// UPDATE specific notification category settings

/**
 * @swagger
 * /api/notification-settings/user/:userId/category:
 *   patch:
 *     summary: Update Category
 *     tags: [Notification Settings]
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
router.patch('/user/:userId/category', notificationSettingsController.updateNotificationCategory);

// RESET user notification settings to defaults

/**
 * @swagger
 * /api/notification-settings/user/:userId/reset:
 *   post:
 *     summary: Create Reset
 *     tags: [Notification Settings]
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
router.post('/user/:userId/reset', notificationSettingsController.resetUserNotificationSettings);

// GET notification settings for multiple users

/**
 * @swagger
 * /api/notification-settings/users:
 *   get:
 *     summary: Get Users
 *     tags: [Notification Settings]
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
router.get('/users', notificationSettingsController.getUsersNotificationSettings);

// GET notification settings summary for organization

/**
 * @swagger
 * /api/notification-settings/summary:
 *   get:
 *     summary: Get Summary
 *     tags: [Notification Settings]
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
router.get('/summary', notificationSettingsController.getNotificationSettingsSummary);

module.exports = router;
