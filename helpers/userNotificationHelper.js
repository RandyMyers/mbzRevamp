const { notificationIntegrationHelper } = require('./notificationIntegrationHelper');

/**
 * User Notification Helper
 * 
 * This helper provides specific notification functions for user/authentication-related events.
 * It's designed to be safely integrated into auth controllers.
 */

class UserNotificationHelper {
  constructor() {
    this.isEnabled = true;
  }

  /**
   * Send notification when user registers
   * @param {Object} user - User object
   * @param {Object} options - Additional options
   */
  async notifyUserRegistered(user, options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        username: user.username || user.email,
        email: user.email || '',
        companyName: 'StoreHubOmale',
        currentTime: new Date().toLocaleString()
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'user_registration',
        variables,
        {
          recipientEmail: user.email,
          recipientName: variables.fullName,
          priority: 'high',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ User registered notification error:', error.message);
    }
  }

  /**
   * Send notification when user logs in
   * @param {Object} user - User object
   * @param {Object} loginInfo - Login information
   * @param {Object} options - Additional options
   */
  async notifyUserLogin(user, loginInfo = {}, options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        username: user.username || user.email,
        customer_ip_address: loginInfo.ip || 'Unknown',
        currentTime: new Date().toLocaleString(),
        companyName: 'StoreHubOmale'
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'user_login',
        variables,
        {
          priority: 'medium',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ User login notification error:', error.message);
    }
  }

  /**
   * Send notification when password reset is requested
   * @param {Object} user - User object
   * @param {Object} resetInfo - Reset information
   * @param {Object} options - Additional options
   */
  async notifyPasswordReset(user, resetInfo = {}, options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        username: user.username || user.email,
        email: user.email || '',
        currentTime: new Date().toLocaleString(),
        companyName: 'StoreHubOmale'
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'password_reset',
        variables,
        {
          recipientEmail: user.email,
          recipientName: variables.fullName,
          priority: 'high',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ Password reset notification error:', error.message);
    }
  }

  /**
   * Send notification when account is suspended
   * @param {Object} user - User object
   * @param {string} reason - Suspension reason
   * @param {Object} options - Additional options
   */
  async notifyAccountSuspended(user, reason = '', options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        username: user.username || user.email,
        email: user.email || '',
        reason: reason,
        supportEmail: 'support@storehubomale.com',
        companyName: 'StoreHubOmale',
        currentTime: new Date().toLocaleString()
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'account_suspended',
        variables,
        {
          recipientEmail: user.email,
          recipientName: user.fullName || variables.username,
          priority: 'critical',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ Account suspended notification error:', error.message);
    }
  }

  /**
   * Send notification when invitation is sent
   * @param {Object} invitation - Invitation object
   * @param {Object} user - User being invited
   * @param {Object} options - Additional options
   */
  async notifyInvitationSent(invitation, user, options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        email: user.email || invitation.email,
        role: invitation.role || 'User',
        companyName: 'StoreHubOmale',
        currentTime: new Date().toLocaleString()
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'invitation_sent',
        variables,
        {
          recipientEmail: user.email || invitation.email,
          recipientName: user.fullName || user.email,
          priority: 'high',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ Invitation sent notification error:', error.message);
    }
  }

  /**
   * Send notification when invitation is accepted
   * @param {Object} user - User who accepted invitation
   * @param {Object} invitation - Invitation object
   * @param {Object} options - Additional options
   */
  async notifyInvitationAccepted(user, invitation, options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        email: user.email || '',
        role: invitation.role || 'User',
        companyName: 'StoreHubOmale',
        currentTime: new Date().toLocaleString()
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'invitation_accepted',
        variables,
        {
          priority: 'medium',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ Invitation accepted notification error:', error.message);
    }
  }

  /**
   * Enable/disable user notifications
   * @param {boolean} enabled - Whether to enable notifications
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`👤 User notifications ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get user notification status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      integrationStatus: notificationIntegrationHelper.getStatus()
    };
  }
}

// Create singleton instance
const userNotificationHelper = new UserNotificationHelper();

module.exports = {
  UserNotificationHelper,
  userNotificationHelper
};
