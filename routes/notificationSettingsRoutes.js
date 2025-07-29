const express = require('express');
const router = express.Router();
const notificationSettingsController = require('../controllers/notificationSettingsController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// GET user notification settings
router.get('/user/:userId', notificationSettingsController.getUserNotificationSettings);

// UPDATE user notification settings
router.patch('/user/:userId', notificationSettingsController.updateUserNotificationSettings);

// UPDATE specific notification category settings
router.patch('/user/:userId/category', notificationSettingsController.updateNotificationCategory);

// RESET user notification settings to defaults
router.post('/user/:userId/reset', notificationSettingsController.resetUserNotificationSettings);

// GET notification settings for multiple users
router.get('/users', notificationSettingsController.getUsersNotificationSettings);

// GET notification settings summary for organization
router.get('/summary', notificationSettingsController.getNotificationSettingsSummary);

module.exports = router;