const NotificationTemplate = require('../models/notificationTemplates');
const { createAndSendNotification } = require('./notificationService');
const { sendNotificationEmail } = require('./emailService');

/**
 * Notification Generation Service
 * 
 * This service handles the generation and sending of notifications using templates.
 * It's designed to be safely integrated into existing controllers without breaking them.
 */

class NotificationGenerationService {
  constructor() {
    this.isEnabled = true; // Can be disabled for maintenance
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Generate and send notification from template
   * @param {string} templateName - Name of the template to use
   * @param {Object} variables - Variables to replace in template
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of notification sending
   */
  async generateFromTemplate(templateName, variables = {}, options = {}) {
    try {
      if (!this.isEnabled) {
        console.log('🔕 Notification generation is disabled');
        return { success: false, message: 'Notification generation is disabled' };
      }

      // Find the template
      const template = await NotificationTemplate.findOne({ 
        templateName, 
        isActive: true 
      });

      if (!template) {
        console.warn(`⚠️ Template not found: ${templateName}`);
        return { success: false, message: 'Template not found' };
      }

      // Replace variables in subject and body
      const processedSubject = this.replaceVariables(template.subject, variables);
      const processedBody = this.replaceVariables(template.body, variables);

      // Mark template as used
      await template.markAsUsed();

      // Send notification based on type
      const result = await this.sendNotification({
        template,
        subject: processedSubject,
        body: processedBody,
        variables,
        ...options
      });

      return {
        success: true,
        templateName,
        message: 'Notification sent successfully',
        result
      };

    } catch (error) {
      console.error('❌ Notification generation error:', error);
      return {
        success: false,
        message: 'Failed to generate notification',
        error: error.message
      };
    }
  }

  /**
   * Generate notification by trigger event
   * @param {string} triggerEvent - Event that triggers the notification
   * @param {Object} variables - Variables to replace in template
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of notification sending
   */
  async generateByTriggerEvent(triggerEvent, variables = {}, options = {}) {
    try {
      if (!this.isEnabled) {
        return { success: false, message: 'Notification generation is disabled' };
      }

      // Find the default template for this trigger event
      const template = await NotificationTemplate.findOne({ 
        triggerEvent, 
        isDefault: true,
        isActive: true 
      });

      if (!template) {
        console.warn(`⚠️ No default template found for trigger event: ${triggerEvent}`);
        return { success: false, message: 'No default template found for this event' };
      }

      return await this.generateFromTemplate(template.templateName, variables, options);

    } catch (error) {
      console.error('❌ Trigger event notification error:', error);
      return {
        success: false,
        message: 'Failed to generate notification by trigger event',
        error: error.message
      };
    }
  }

  /**
   * Send notification based on template type
   * @param {Object} params - Notification parameters
   * @returns {Promise<Object>} Result of sending
   */
  async sendNotification({ template, subject, body, variables, recipientEmail, recipientName, priority = 'medium' }) {
    try {
      const notificationData = {
        subject,
        body,
        type: template.type,
        priority,
        variables,
        templateId: template._id,
        templateName: template.templateName
      };

      // Add recipient information if provided
      if (recipientEmail) {
        notificationData.recipientEmail = recipientEmail;
      }
      if (recipientName) {
        notificationData.recipientName = recipientName;
      }

      // Send based on template type
      switch (template.type) {
        case 'email':
          return await this.sendEmailNotification(notificationData);
        
        case 'system':
          return await this.sendSystemNotification(notificationData);
        
        case 'sms':
          return await this.sendSMSNotification(notificationData);
        
        case 'push':
          return await this.sendPushNotification(notificationData);
        
        default:
          return await this.sendSystemNotification(notificationData);
      }

    } catch (error) {
      console.error('❌ Send notification error:', error);
      throw error;
    }
  }

  /**
   * Send email notification
   * @param {Object} notificationData - Email notification data
   * @returns {Promise<Object>} Result of email sending
   */
  async sendEmailNotification(notificationData) {
    try {
      const { subject, body, recipientEmail, recipientName } = notificationData;
      
      if (!recipientEmail) {
        throw new Error('Recipient email is required for email notifications');
      }

      const emailResult = await sendNotificationEmail(
        { email: recipientEmail, name: recipientName },
        subject,
        body, // HTML content
        body  // Text content
      );

      return {
        success: true,
        type: 'email',
        message: 'Email sent successfully',
        result: emailResult
      };

    } catch (error) {
      console.error('❌ Email notification error:', error);
      throw error;
    }
  }

  /**
   * Send system notification (log to console/database)
   * @param {Object} notificationData - System notification data
   * @returns {Promise<Object>} Result of system notification
   */
  async sendSystemNotification(notificationData) {
    try {
      const { subject, body, templateName } = notificationData;
      
      // Log to console
      console.log(`🔔 SYSTEM NOTIFICATION [${templateName}]:`);
      console.log(`📧 Subject: ${subject}`);
      console.log(`📝 Body: ${body}`);
      console.log('---');

      // You can also save to database here if needed
      // await createAndSendNotification(notificationData);

      return {
        success: true,
        type: 'system',
        message: 'System notification logged successfully'
      };

    } catch (error) {
      console.error('❌ System notification error:', error);
      throw error;
    }
  }

  /**
   * Send SMS notification (placeholder for future implementation)
   * @param {Object} notificationData - SMS notification data
   * @returns {Promise<Object>} Result of SMS sending
   */
  async sendSMSNotification(notificationData) {
    try {
      // Placeholder for SMS implementation
      console.log('📱 SMS notification would be sent here:', notificationData.subject);
      
      return {
        success: true,
        type: 'sms',
        message: 'SMS notification placeholder (not implemented)'
      };

    } catch (error) {
      console.error('❌ SMS notification error:', error);
      throw error;
    }
  }

  /**
   * Send push notification (placeholder for future implementation)
   * @param {Object} notificationData - Push notification data
   * @returns {Promise<Object>} Result of push sending
   */
  async sendPushNotification(notificationData) {
    try {
      // Placeholder for push notification implementation
      console.log('🔔 Push notification would be sent here:', notificationData.subject);
      
      return {
        success: true,
        type: 'push',
        message: 'Push notification placeholder (not implemented)'
      };

    } catch (error) {
      console.error('❌ Push notification error:', error);
      throw error;
    }
  }

  /**
   * Replace variables in template text
   * @param {string} text - Text with variables to replace
   * @param {Object} variables - Variables to replace with
   * @returns {string} Text with variables replaced
   */
  replaceVariables(text, variables) {
    if (!text || !variables) return text;

    let result = text;
    
    // Replace {{variableName}} with actual values
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = variables[key] || '';
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    // Replace common system variables
    const systemVariables = {
      currentTime: new Date().toLocaleString(),
      currentDate: new Date().toLocaleDateString(),
      currentYear: new Date().getFullYear(),
      companyName: 'StoreHubOmale' // Default company name
    };

    Object.keys(systemVariables).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = systemVariables[key];
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
  }

  /**
   * Enable/disable notification generation
   * @param {boolean} enabled - Whether to enable notifications
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🔔 Notification generation ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get service status
   * @returns {Object} Service status information
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay
    };
  }
}

// Create singleton instance
const notificationGenerationService = new NotificationGenerationService();

module.exports = notificationGenerationService;
