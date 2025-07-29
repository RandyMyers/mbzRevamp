const User = require('../models/users');
const { createAuditLog } = require('../helpers/auditLogHelper');

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