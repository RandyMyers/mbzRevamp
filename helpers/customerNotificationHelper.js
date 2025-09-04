const { notificationIntegrationHelper } = require('./notificationIntegrationHelper');

/**
 * Customer Notification Helper
 * 
 * This helper provides specific notification functions for customer-related events.
 * It's designed to be safely integrated into customer controllers.
 */

class CustomerNotificationHelper {
  constructor() {
    this.isEnabled = true;
  }

  /**
   * Send notification when customer is registered
   * @param {Object} customer - Customer object
   * @param {Object} options - Additional options
   */
  async notifyCustomerRegistered(customer, options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        first_name: customer.first_name || 'Customer',
        last_name: customer.last_name || '',
        email: customer.email || '',
        customerId: customer._id || customer.id,
        currentTime: new Date().toLocaleString(),
        companyName: 'StoreHubOmale'
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'customer_registered',
        variables,
        {
          recipientEmail: customer.email,
          recipientName: `${variables.first_name} ${variables.last_name}`.trim(),
          priority: 'medium',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ Customer registered notification error:', error.message);
    }
  }

  /**
   * Send notification when customer is updated
   * @param {Object} customer - Customer object
   * @param {Object} changes - What was changed
   * @param {Object} options - Additional options
   */
  async notifyCustomerUpdated(customer, changes = {}, options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        first_name: customer.first_name || 'Customer',
        last_name: customer.last_name || '',
        email: customer.email || '',
        changes: Object.keys(changes).join(', '),
        currentTime: new Date().toLocaleString(),
        companyName: 'StoreHubOmale'
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'customer_updated',
        variables,
        {
          recipientEmail: customer.email,
          recipientName: `${variables.first_name} ${variables.last_name}`.trim(),
          priority: 'low',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ Customer updated notification error:', error.message);
    }
  }

  /**
   * Send notification when customer sync is successful
   * @param {Object} customer - Customer object
   * @param {string} syncTarget - What was synced to (e.g., 'WooCommerce')
   * @param {Object} options - Additional options
   */
  async notifyCustomerSyncSuccess(customer, syncTarget = 'WooCommerce', options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        first_name: customer.first_name || 'Customer',
        last_name: customer.last_name || '',
        syncTarget: syncTarget,
        currentTime: new Date().toLocaleString(),
        companyName: 'StoreHubOmale'
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'customer_sync_success',
        variables,
        {
          priority: 'low',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ Customer sync success notification error:', error.message);
    }
  }

  /**
   * Send notification when customer sync fails
   * @param {Object} customer - Customer object
   * @param {string} syncTarget - What was being synced to
   * @param {string} errorMessage - Error message
   * @param {Object} options - Additional options
   */
  async notifyCustomerSyncFailed(customer, syncTarget = 'WooCommerce', errorMessage = 'Unknown error', options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        first_name: customer.first_name || 'Customer',
        last_name: customer.last_name || '',
        syncTarget: syncTarget,
        syncError: errorMessage,
        currentTime: new Date().toLocaleString(),
        companyName: 'StoreHubOmale'
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'customer_sync_failed',
        variables,
        {
          priority: 'high',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ Customer sync failed notification error:', error.message);
    }
  }

  /**
   * Enable/disable customer notifications
   * @param {boolean} enabled - Whether to enable notifications
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`👥 Customer notifications ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get customer notification status
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
const customerNotificationHelper = new CustomerNotificationHelper();

module.exports = {
  CustomerNotificationHelper,
  customerNotificationHelper
};
