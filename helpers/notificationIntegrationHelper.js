const notificationGenerationService = require('../services/notificationGenerationService');

/**
 * Notification Integration Helper
 * 
 * This helper provides safe, non-blocking notification integration
 * for existing controllers. It's designed to never crash the main
 * controller functionality even if notifications fail.
 */

class NotificationIntegrationHelper {
  constructor() {
    this.isEnabled = true;
    this.logErrors = true;
  }

  /**
   * Safely send notification without blocking main controller
   * @param {string} templateName - Template name to use
   * @param {Object} variables - Variables for template
   * @param {Object} options - Additional options
   * @returns {Promise<void>} - Always resolves, never rejects
   */
  async sendNotificationSafely(templateName, variables = {}, options = {}) {
    try {
      if (!this.isEnabled) {
        return;
      }

      // Run notification in background without blocking
      setImmediate(async () => {
        try {
          const result = await notificationGenerationService.generateFromTemplate(
            templateName, 
            variables, 
            options
          );
          
          if (result.success) {
            console.log(`✅ Notification sent successfully: ${templateName}`);
          } else {
            console.warn(`⚠️ Notification failed: ${templateName} - ${result.message}`);
          }
        } catch (error) {
          if (this.logErrors) {
            console.error(`❌ Background notification error for ${templateName}:`, error.message);
          }
        }
      });

    } catch (error) {
      if (this.logErrors) {
        console.error(`❌ Notification integration error for ${templateName}:`, error.message);
      }
    }
  }

  /**
   * Send notification by trigger event safely
   * @param {string} triggerEvent - Event that triggers notification
   * @param {Object} variables - Variables for template
   * @param {Object} options - Additional options
   * @returns {Promise<void>} - Always resolves, never rejects
   */
  async sendNotificationByEventSafely(triggerEvent, variables = {}, options = {}) {
    try {
      if (!this.isEnabled) {
        return;
      }

      // Run notification in background without blocking
      setImmediate(async () => {
        try {
          const result = await notificationGenerationService.generateByTriggerEvent(
            triggerEvent, 
            variables, 
            options
          );
          
          if (result.success) {
            console.log(`✅ Event notification sent successfully: ${triggerEvent}`);
          } else {
            console.warn(`⚠️ Event notification failed: ${triggerEvent} - ${result.message}`);
          }
        } catch (error) {
          if (this.logErrors) {
            console.error(`❌ Background event notification error for ${triggerEvent}:`, error.message);
          }
        }
      });

    } catch (error) {
      if (this.logErrors) {
        console.error(`❌ Event notification integration error for ${triggerEvent}:`, error.message);
      }
    }
  }

  /**
   * Send multiple notifications safely
   * @param {Array} notifications - Array of notification objects
   * @returns {Promise<void>} - Always resolves, never rejects
   */
  async sendMultipleNotificationsSafely(notifications = []) {
    try {
      if (!this.isEnabled || !Array.isArray(notifications)) {
        return;
      }

      // Process each notification in background
      notifications.forEach((notification, index) => {
        setImmediate(async () => {
          try {
            const { templateName, triggerEvent, variables, options } = notification;
            
            let result;
            if (templateName) {
              result = await notificationGenerationService.generateFromTemplate(
                templateName, 
                variables, 
                options
              );
            } else if (triggerEvent) {
              result = await notificationGenerationService.generateByTriggerEvent(
                triggerEvent, 
                variables, 
                options
              );
            }

            if (result && result.success) {
              console.log(`✅ Batch notification ${index + 1} sent successfully`);
            } else {
              console.warn(`⚠️ Batch notification ${index + 1} failed`);
            }
          } catch (error) {
            if (this.logErrors) {
              console.error(`❌ Batch notification ${index + 1} error:`, error.message);
            }
          }
        });
      });

    } catch (error) {
      if (this.logErrors) {
        console.error(`❌ Multiple notifications integration error:`, error.message);
      }
    }
  }

  /**
   * Enable/disable notification integration
   * @param {boolean} enabled - Whether to enable notifications
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🔔 Notification integration ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable/disable error logging
   * @param {boolean} enabled - Whether to log errors
   */
  setErrorLogging(enabled) {
    this.logErrors = enabled;
    console.log(`📝 Notification error logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get integration status
   * @returns {Object} Integration status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      errorLogging: this.logErrors,
      serviceStatus: notificationGenerationService.getStatus()
    };
  }
}

// Create singleton instance
const notificationIntegrationHelper = new NotificationIntegrationHelper();

// Export both the class and instance
module.exports = {
  NotificationIntegrationHelper,
  notificationIntegrationHelper
};
