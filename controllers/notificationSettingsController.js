const User = require('../models/users');
const { createAuditLog } = require('../helpers/auditLogHelper');

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationSettings:
 *       type: object
 *       properties:
 *         email:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *               description: Whether email notifications are enabled
 *               example: true
 *             categories:
 *               type: object
 *               properties:
 *                 system:
 *                   type: boolean
 *                   description: System notifications
 *                   example: true
 *                 orders:
 *                   type: boolean
 *                   description: Order notifications
 *                   example: true
 *                 inventory:
 *                   type: boolean
 *                   description: Inventory notifications
 *                   example: true
 *                 customers:
 *                   type: boolean
 *                   description: Customer notifications
 *                   example: true
 *                 security:
 *                   type: boolean
 *                   description: Security notifications
 *                   example: true
 *         inApp:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *               description: Whether in-app notifications are enabled
 *               example: true
 *             categories:
 *               type: object
 *               properties:
 *                 system:
 *                   type: boolean
 *                   description: System notifications
 *                   example: true
 *                 orders:
 *                   type: boolean
 *                   description: Order notifications
 *                   example: true
 *                 inventory:
 *                   type: boolean
 *                   description: Inventory notifications
 *                   example: true
 *                 customers:
 *                   type: boolean
 *                   description: Customer notifications
 *                   example: true
 *                 security:
 *                   type: boolean
 *                   description: Security notifications
 *                   example: true
 *         frequency:
 *           type: string
 *           enum: [immediate, daily, weekly]
 *           description: Notification frequency
 *           example: "immediate"
 *         quietHours:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *               description: Whether quiet hours are enabled
 *               example: false
 *             start:
 *               type: string
 *               description: Quiet hours start time (HH:MM)
 *               example: "22:00"
 *             end:
 *               type: string
 *               description: Quiet hours end time (HH:MM)
 *               example: "08:00"
 *             timezone:
 *               type: string
 *               description: Timezone for quiet hours
 *               example: "UTC"
 *     
 *     NotificationSettingsUpdate:
 *       type: object
 *       properties:
 *         email:
 *           type: object
 *           description: Email notification settings
 *         inApp:
 *           type: object
 *           description: In-app notification settings
 *         frequency:
 *           type: string
 *           enum: [immediate, daily, weekly]
 *           description: Notification frequency
 *         quietHours:
 *           type: object
 *           description: Quiet hours settings
 *     
 *     NotificationCategoryUpdate:
 *       type: object
 *       required:
 *         - channel
 *         - category
 *         - enabled
 *       properties:
 *         channel:
 *           type: string
 *           enum: [email, inApp]
 *           description: Notification channel
 *           example: "email"
 *         category:
 *           type: string
 *           enum: [system, orders, inventory, customers, security]
 *           description: Notification category
 *           example: "orders"
 *         enabled:
 *           type: boolean
 *           description: Whether category is enabled
 *           example: true
 *     
 *     NotificationSettingsSummary:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: number
 *           description: Total number of users
 *           example: 150
 *         emailEnabled:
 *           type: number
 *           description: Users with email enabled
 *           example: 120
 *         inAppEnabled:
 *           type: number
 *           description: Users with in-app enabled
 *           example: 140
 *         frequencyDistribution:
 *           type: object
 *           description: Distribution of notification frequencies
 *         categoryStats:
 *           type: object
 *           description: Statistics by notification category
 */

/**
 * @swagger
 * /api/notification-settings/{userId}:
 *   get:
 *     summary: Get user notification settings
 *     tags: [Notification Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID to get notification settings for
 *     responses:
 *       200:
 *         description: Notification settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: ObjectId
 *                       description: User ID
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: User email
 *                     fullName:
 *                       type: string
 *                       description: User full name
 *                     settings:
 *                       $ref: '#/components/schemas/NotificationSettings'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get notification settings"
 */

// GET user notification settings
exports.getUserNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('notificationSettings email fullName');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Default notification settings if not set
    const defaultSettings = {
      email: {
        enabled: true,
        categories: {
          system: true,
          orders: true,
          inventory: true,
          customers: true,
          security: true
        }
      },
      inApp: {
        enabled: true,
        categories: {
          system: true,
          orders: true,
          inventory: true,
          customers: true,
          security: true
        }
      },
      frequency: 'immediate', // immediate, daily, weekly
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      }
    };

    const settings = user.notificationSettings || defaultSettings;

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
        settings
      }
    });
  } catch (error) {
    console.error('Get User Notification Settings Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get notification settings",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/notification-settings/{userId}:
 *   put:
 *     summary: Update user notification settings
 *     tags: [Notification Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID to update notification settings for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationSettingsUpdate'
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
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
 *                   example: "Notification settings updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: ObjectId
 *                       description: User ID
 *                     settings:
 *                       $ref: '#/components/schemas/NotificationSettings'
 *       400:
 *         description: Bad request - Invalid frequency or quiet hours
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid frequency. Must be 'immediate', 'daily', or 'weekly'"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to update notification settings"
 */

// UPDATE user notification settings
exports.updateUserNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      email, 
      inApp, 
      frequency, 
      quietHours 
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Validate frequency
    const validFrequencies = ['immediate', 'daily', 'weekly'];
    if (frequency && !validFrequencies.includes(frequency)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid frequency. Must be 'immediate', 'daily', or 'weekly'" 
      });
    }

    // Validate quiet hours
    if (quietHours) {
      if (quietHours.enabled && (!quietHours.start || !quietHours.end)) {
        return res.status(400).json({ 
          success: false, 
          message: "Start and end times are required when quiet hours are enabled" 
        });
      }
    }

    // Build settings object
    const settings = {
      email: email || user.notificationSettings?.email,
      inApp: inApp || user.notificationSettings?.inApp,
      frequency: frequency || user.notificationSettings?.frequency,
      quietHours: quietHours || user.notificationSettings?.quietHours
    };

    // Update user notification settings
    user.notificationSettings = settings;
    await user.save();

    // ✅ AUDIT LOG: Notification Settings Updated
    await createAuditLog({
      action: 'Notification Settings Updated',
      user: req.user?._id,
      resource: 'user',
      resourceId: user._id,
      details: {
        targetUserId: userId,
        emailEnabled: settings.email?.enabled,
        inAppEnabled: settings.inApp?.enabled,
        frequency: settings.frequency,
        quietHoursEnabled: settings.quietHours?.enabled,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      data: {
        userId: user._id,
        settings
      }
    });
  } catch (error) {
    console.error('Update User Notification Settings Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update notification settings",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/notification-settings/{userId}/category:
 *   put:
 *     summary: Update specific notification category settings
 *     tags: [Notification Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID to update category settings for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationCategoryUpdate'
 *     responses:
 *       200:
 *         description: Notification category updated successfully
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
 *                   example: "Notification category updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: ObjectId
 *                       description: User ID
 *                     channel:
 *                       type: string
 *                       description: Notification channel
 *                       example: "email"
 *                     category:
 *                       type: string
 *                       description: Notification category
 *                       example: "orders"
 *                     enabled:
 *                       type: boolean
 *                       description: Whether category is enabled
 *                       example: true
 *       400:
 *         description: Bad request - Invalid channel or category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid channel. Must be 'email' or 'inApp'"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to update notification category"
 */

// UPDATE specific notification category settings
exports.updateNotificationCategory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      channel, // 'email' or 'inApp'
      category, // 'system', 'orders', 'inventory', 'customers', 'security'
      enabled 
    } = req.body;

    // Validate channel
    const validChannels = ['email', 'inApp'];
    if (!validChannels.includes(channel)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid channel. Must be 'email' or 'inApp'" 
      });
    }

    // Validate category
    const validCategories = ['system', 'orders', 'inventory', 'customers', 'security'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid category" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Initialize settings if not exists
    if (!user.notificationSettings) {
      user.notificationSettings = {
        email: { enabled: true, categories: {} },
        inApp: { enabled: true, categories: {} },
        frequency: 'immediate',
        quietHours: { enabled: false, start: '22:00', end: '08:00', timezone: 'UTC' }
      };
    }

    // Update the specific category setting
    if (!user.notificationSettings[channel]) {
      user.notificationSettings[channel] = { enabled: true, categories: {} };
    }

    if (!user.notificationSettings[channel].categories) {
      user.notificationSettings[channel].categories = {};
    }

    user.notificationSettings[channel].categories[category] = enabled;
    await user.save();

    // ✅ AUDIT LOG: Notification Category Updated
    await createAuditLog({
      action: 'Notification Category Updated',
      user: req.user?._id,
      resource: 'user',
      resourceId: user._id,
      details: {
        targetUserId: userId,
        channel,
        category,
        enabled,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: "Notification category updated successfully",
      data: {
        userId: user._id,
        channel,
        category,
        enabled
      }
    });
  } catch (error) {
    console.error('Update Notification Category Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update notification category",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/notification-settings/{userId}/reset:
 *   post:
 *     summary: Reset user notification settings to defaults
 *     tags: [Notification Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID to reset notification settings for
 *     responses:
 *       200:
 *         description: Notification settings reset successfully
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
 *                   example: "Notification settings reset to defaults"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: ObjectId
 *                       description: User ID
 *                     settings:
 *                       $ref: '#/components/schemas/NotificationSettings'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to reset notification settings"
 */

// RESET user notification settings to defaults
exports.resetUserNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Default notification settings
    const defaultSettings = {
      email: {
        enabled: true,
        categories: {
          system: true,
          orders: true,
          inventory: true,
          customers: true,
          security: true
        }
      },
      inApp: {
        enabled: true,
        categories: {
          system: true,
          orders: true,
          inventory: true,
          customers: true,
          security: true
        }
      },
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      }
    };

    user.notificationSettings = defaultSettings;
    await user.save();

    // ✅ AUDIT LOG: Notification Settings Reset
    await createAuditLog({
      action: 'Notification Settings Reset',
      user: req.user?._id,
      resource: 'user',
      resourceId: user._id,
      details: {
        targetUserId: userId,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: "Notification settings reset to defaults",
      data: {
        userId: user._id,
        settings: defaultSettings
      }
    });
  } catch (error) {
    console.error('Reset User Notification Settings Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to reset notification settings",
      error: error.message 
    });
  }
};

// GET notification settings for multiple users
exports.getUsersNotificationSettings = async (req, res) => {
  try {
    const { organization } = req.query;
    const { page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = {};
    if (organization) filter.organization = organization;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users with notification settings
    const users = await User.find(filter)
      .select('fullName email notificationSettings organization')
      .populate('organization', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ fullName: 1 });

    // Get total count
    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Users Notification Settings Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get users notification settings",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/notification-settings/summary:
 *   get:
 *     summary: Get notification settings summary for organization
 *     tags: [Notification Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organization
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Notification settings summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NotificationSettingsSummary'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get notification settings summary"
 */

// GET notification settings summary for organization
exports.getNotificationSettingsSummary = async (req, res) => {
  try {
    const { organization } = req.query;

    // Build filter
    const filter = {};
    if (organization) filter.organization = organization;

    // Get all users in organization
    const users = await User.find(filter)
      .select('notificationSettings');

    // Calculate summary statistics
    const summary = {
      totalUsers: users.length,
      emailEnabled: 0,
      inAppEnabled: 0,
      categoryStats: {
        system: { email: 0, inApp: 0 },
        orders: { email: 0, inApp: 0 },
        inventory: { email: 0, inApp: 0 },
        customers: { email: 0, inApp: 0 },
        security: { email: 0, inApp: 0 }
      },
      frequencyStats: {
        immediate: 0,
        daily: 0,
        weekly: 0
      },
      quietHoursEnabled: 0
    };

    users.forEach(user => {
      const settings = user.notificationSettings;
      if (!settings) return;

      // Count enabled channels
      if (settings.email?.enabled) summary.emailEnabled++;
      if (settings.inApp?.enabled) summary.inAppEnabled++;

      // Count category preferences
      const categories = ['system', 'orders', 'inventory', 'customers', 'security'];
      categories.forEach(category => {
        if (settings.email?.categories?.[category]) {
          summary.categoryStats[category].email++;
        }
        if (settings.inApp?.categories?.[category]) {
          summary.categoryStats[category].inApp++;
        }
      });

      // Count frequency preferences
      if (settings.frequency) {
        summary.frequencyStats[settings.frequency]++;
      }

      // Count quiet hours
      if (settings.quietHours?.enabled) {
        summary.quietHoursEnabled++;
      }
    });

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get Notification Settings Summary Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get notification settings summary",
      error: error.message 
    });
  }
};