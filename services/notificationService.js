const dotenv = require('dotenv');
dotenv.config();

const Notification = require('../models/notification');
const NotificationTemplate = require('../models/notificationTemplates');
const User = require('../models/users');
const { createAuditLog } = require('../helpers/auditLogHelper');
const SendGridService = require('./sendGridService');

// Send email notification using SendGrid
const sendEmailNotification = async (notification, user) => {
  try {
    console.log(`📧 Sending email notification to ${user.email}: ${notification.subject}`);

    // Send email via SendGrid
    const result = await SendGridService.sendEmail({
      to: user.email,
      subject: notification.subject,
      html: notification.body,
      text: notification.body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      userId: user._id,
      organizationId: notification.organization
    });

    if (result.success) {
      // Update notification status
      notification.status = 'sent';
      notification.deliveryStatus = 'success';
      notification.sentAt = new Date();
      notification.deliveryAttemptCount += 1;
      await notification.save();

      console.log(`✅ Email notification sent to ${user.email}: ${notification.subject}`);
      return { success: true, messageId: result.messageId };
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    console.error(`❌ Failed to send email notification to ${user.email}:`, error.message);

    // Update notification status
    notification.status = 'failed';
    notification.deliveryStatus = 'failure';
    notification.errorMessage = error.message;
    notification.deliveryAttemptCount += 1;
    await notification.save();

    return { success: false, error: error.message };
  }
};

// Create and send notification
exports.createAndSendNotification = async (notificationData) => {
  try {
    const {
      userId,
      templateId,
      subject,
      body,
      type = 'system',
      organization,
      variables = {}
    } = notificationData;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check user notification preferences
    const settings = user.notificationSettings;
    if (!settings) {
      console.log(`⚠️ No notification settings found for user ${userId}`);
      return { success: false, error: 'No notification settings' };
    }

    // Check if user has enabled notifications for this type (email channel only)
    const category = getNotificationCategory(type);
    if (
      type === 'email' &&
      category &&
      settings.email?.enabled &&
      !settings.email?.categories?.[category]
    ) {
      console.log(`⚠️ Email notifications disabled for category ${category} for user ${userId}`);
      return { success: false, error: 'Email notifications disabled for this category' };
    }

    // Create notification record
    const notification = new Notification({
      user: userId,
      template: templateId || undefined,
      subject,
      body,
      type,
      status: 'pending',
      organization,
      deliveryStatus: 'failure',
      deliveryAttemptCount: 0
    });

    await notification.save();

    // Send notification based on type
    let result = { success: false, error: 'Unknown notification type' };

    if (type === 'email') {
      result = await sendEmailNotification(notification, user);
    } else if (type === 'system') {
      // For system notifications, just mark as sent (they appear in-app)
      notification.status = 'sent';
      notification.deliveryStatus = 'success';
      notification.sentAt = new Date();
      await notification.save();
      result = { success: true };
    }

    // ✅ AUDIT LOG: Notification Sent
    await createAuditLog({
      action: 'Notification Sent',
      user: null, // System action
      resource: 'notification',
      resourceId: notification._id,
      details: {
        recipient: userId,
        type,
        subject,
        success: result.success,
        error: result.error,
        organization
      },
      organization,
      severity: 'info'
    });

    return result;
  } catch (error) {
    console.error('Create and Send Notification Error:', error);
    return { success: false, error: error.message };
  }
};

// Create notification from template
exports.createNotificationFromTemplate = async (templateId, userId, variables = {}) => {
  try {
    const template = await NotificationTemplate.findById(templateId);
    if (!template) {
      throw new Error('Notification template not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Replace variables in subject and body
    let subject = template.subject;
    let body = template.body;

    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, variables[key]);
      body = body.replace(regex, variables[key]);
    });

    // Create notification data
    const notificationData = {
      userId,
      templateId,
      subject,
      body,
      type: template.type,
      organization: user.organization,
      variables
    };

    return await exports.createAndSendNotification(notificationData);
  } catch (error) {
    console.error('Create Notification From Template Error:', error);
    return { success: false, error: error.message };
  }
};

// Send bulk notifications
exports.sendBulkNotifications = async (notificationData, userIds) => {
  try {
    const results = [];
    
    for (const userId of userIds) {
      const result = await exports.createAndSendNotification({
        ...notificationData,
        userId
      });
      results.push({ userId, ...result });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`📧 Bulk notification sent: ${successCount} success, ${failureCount} failed`);

    return {
      success: true,
      total: results.length,
      successCount,
      failureCount,
      results
    };
  } catch (error) {
    console.error('Send Bulk Notifications Error:', error);
    return { success: false, error: error.message };
  }
};

// Get notification category from type
const getNotificationCategory = (type) => {
  const categoryMap = {
    'order_created': 'orders',
    'order_updated': 'orders',
    'order_cancelled': 'orders',
    'inventory_low': 'inventory',
    'inventory_out': 'inventory',
    'customer_registered': 'customers',
    'customer_updated': 'customers',
    'security_login': 'security',
    'security_password': 'security',
    'system_maintenance': 'system',
    'system_update': 'system'
  };

  return categoryMap[type] || 'system';
};

// Process pending notifications (for cron jobs)
exports.processPendingNotifications = async () => {
  try {
    const pendingNotifications = await Notification.find({
      status: 'pending',
      type: 'email',
      deliveryAttemptCount: { $lt: 3 } // Max 3 attempts
    }).populate('user');

    console.log(`🔄 Processing ${pendingNotifications.length} pending notifications`);

    for (const notification of pendingNotifications) {
      if (notification.user) {
        await sendEmailNotification(notification, notification.user);
      }
    }

    return {
      success: true,
      processed: pendingNotifications.length
    };
  } catch (error) {
    console.error('Process Pending Notifications Error:', error);
    return { success: false, error: error.message };
  }
};

// Get notification statistics
exports.getNotificationStats = async (organization = null) => {
  try {
    const filter = {};
    if (organization) filter.organization = organization;

    const stats = await Notification.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          sent: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          },
          read: {
            $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          email: {
            $sum: { $cond: [{ $eq: ['$type', 'email'] }, 1, 0] }
          },
          system: {
            $sum: { $cond: [{ $eq: ['$type', 'system'] }, 1, 0] }
          }
        }
      }
    ]);

    return stats[0] || {
      total: 0,
      pending: 0,
      sent: 0,
      read: 0,
      failed: 0,
      email: 0,
      system: 0
    };
  } catch (error) {
    console.error('Get Notification Stats Error:', error);
    throw error;
  }
};

// Clean up old notifications (for maintenance)
exports.cleanupOldNotifications = async (daysOld = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['read', 'failed'] }
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);

    return {
      success: true,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    console.error('Cleanup Old Notifications Error:', error);
    return { success: false, error: error.message };
  }
};