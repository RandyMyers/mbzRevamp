const { notificationIntegrationHelper } = require('./notificationIntegrationHelper');

/**
 * Order Notification Helper
 * 
 * This helper provides specific notification functions for order-related events.
 * It's designed to be safely integrated into order controllers.
 */

class OrderNotificationHelper {
  constructor() {
    this.isEnabled = true;
  }

  /**
   * Send notification when order is created
   * @param {Object} order - Order object
   * @param {Object} options - Additional options
   */
  async notifyOrderCreated(order, options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        orderNumber: order.orderNumber || order._id,
        billing_first_name: order.billing?.first_name || 'Customer',
        billing_last_name: order.billing?.last_name || '',
        currency: order.currency || '$',
        total: order.total || '0.00',
        companyName: 'StoreHubOmale'
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'order_created',
        variables,
        {
          recipientEmail: order.billing?.email,
          recipientName: `${variables.billing_first_name} ${variables.billing_last_name}`.trim(),
          priority: 'high',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ Order created notification error:', error.message);
    }
  }

  /**
   * Send notification when order status is updated
   * @param {Object} order - Order object
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @param {Object} options - Additional options
   */
  async notifyOrderStatusUpdated(order, oldStatus, newStatus, options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        orderNumber: order.orderNumber || order._id,
        status: newStatus,
        oldStatus: oldStatus,
        currentTime: new Date().toLocaleString(),
        companyName: 'StoreHubOmale'
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'order_status_updated',
        variables,
        {
          recipientEmail: order.billing?.email,
          recipientName: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
          priority: 'medium',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ Order status updated notification error:', error.message);
    }
  }

  /**
   * Send notification when order is cancelled
   * @param {Object} order - Order object
   * @param {string} reason - Cancellation reason
   * @param {Object} options - Additional options
   */
  async notifyOrderCancelled(order, reason = '', options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        orderNumber: order.orderNumber || order._id,
        billing_first_name: order.billing?.first_name || 'Customer',
        billing_last_name: order.billing?.last_name || '',
        reason: reason,
        currentTime: new Date().toLocaleString(),
        companyName: 'StoreHubOmale'
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'order_cancelled',
        variables,
        {
          recipientEmail: order.billing?.email,
          recipientName: `${variables.billing_first_name} ${variables.billing_last_name}`.trim(),
          priority: 'high',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ Order cancelled notification error:', error.message);
    }
  }

  /**
   * Send notification when order is shipped
   * @param {Object} order - Order object
   * @param {Object} shippingInfo - Shipping information
   * @param {Object} options - Additional options
   */
  async notifyOrderShipped(order, shippingInfo = {}, options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        orderNumber: order.orderNumber || order._id,
        shipping_first_name: order.shipping?.first_name || order.billing?.first_name || 'Customer',
        shipping_last_name: order.shipping?.last_name || order.billing?.last_name || '',
        trackingNumber: shippingInfo.trackingNumber || 'N/A',
        shippingMethod: shippingInfo.method || 'Standard',
        companyName: 'StoreHubOmale'
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'order_shipped',
        variables,
        {
          recipientEmail: order.billing?.email,
          recipientName: `${variables.shipping_first_name} ${variables.shipping_last_name}`.trim(),
          priority: 'medium',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ Order shipped notification error:', error.message);
    }
  }

  /**
   * Send notification when order is delivered
   * @param {Object} order - Order object
   * @param {Object} deliveryInfo - Delivery information
   * @param {Object} options - Additional options
   */
  async notifyOrderDelivered(order, deliveryInfo = {}, options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        orderNumber: order.orderNumber || order._id,
        shipping_address_1: order.shipping?.address_1 || order.billing?.address_1 || 'Address',
        shipping_city: order.shipping?.city || order.billing?.city || 'City',
        deliveryDate: deliveryInfo.deliveryDate || new Date().toLocaleDateString(),
        companyName: 'StoreHubOmale'
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'order_delivered',
        variables,
        {
          recipientEmail: order.billing?.email,
          recipientName: `${order.shipping?.first_name || order.billing?.first_name || ''} ${order.shipping?.last_name || order.billing?.last_name || ''}`.trim(),
          priority: 'medium',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ Order delivered notification error:', error.message);
    }
  }

  /**
   * Send notification when refund is processed
   * @param {Object} order - Order object
   * @param {Object} refundInfo - Refund information
   * @param {Object} options - Additional options
   */
  async notifyRefundProcessed(order, refundInfo = {}, options = {}) {
    try {
      if (!this.isEnabled) return;

      const variables = {
        orderNumber: order.orderNumber || order._id,
        currency: order.currency || '$',
        total: refundInfo.amount || order.total || '0.00',
        refundReason: refundInfo.reason || 'Refund processed',
        refundDate: refundInfo.date || new Date().toLocaleDateString(),
        companyName: 'StoreHubOmale'
      };

      await notificationIntegrationHelper.sendNotificationByEventSafely(
        'refund_processed',
        variables,
        {
          recipientEmail: order.billing?.email,
          recipientName: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
          priority: 'high',
          ...options
        }
      );

    } catch (error) {
      console.error('❌ Refund processed notification error:', error.message);
    }
  }

  /**
   * Enable/disable order notifications
   * @param {boolean} enabled - Whether to enable notifications
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🛒 Order notifications ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get order notification status
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
const orderNotificationHelper = new OrderNotificationHelper();

module.exports = {
  OrderNotificationHelper,
  orderNotificationHelper
};







