const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: notifications operations
 */

const notificationController = require('../controllers/notificationControllers');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// CREATE notification
router.post('/', notificationController.createNotification);

// GET all notifications with pagination and filtering
router.get('/', notificationController.getAllNotifications);

// GET notification statistics
router.get('/stats', notificationController.getNotificationStats);

// GET notification by ID
router.get('/:notificationId', notificationController.getNotificationById);

// UPDATE notification
router.patch('/:notificationId', notificationController.updateNotification);

// DELETE notification
router.delete('/:notificationId', notificationController.deleteNotification);

// MARK notification as read
router.patch('/:notificationId/read', notificationController.markAsRead);

// GET notifications by user
router.get('/user/:userId', notificationController.getNotificationsByUser);

// MARK all notifications as read for a user
router.patch('/user/:userId/read-all', notificationController.markAllAsRead);

module.exports = router;
