const notificationGenerationService = require('./notificationGenerationService');
const User = require('../models/users');
const Organization = require('../models/organization');
const Sender = require('../models/sender');
const { createAuditLog } = require('../helpers/auditLogHelper');

/**
 * Call Notification Service
 * 
 * Handles all notification-related operations for call scheduling
 */
class CallNotificationService {
  constructor() {
    this.notificationService = notificationGenerationService;
  }

  /**
   * Send call invitation emails to participants
   * @param {Object} call - Call object from database
   * @param {Array} participants - Array of participant user IDs
   * @param {string} senderId - Sender ID for email invitations
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of notification sending
   */
  async sendCallInvitations(call, participants, senderId, options = {}) {
    try {
      console.log(`📧 Sending call invitations for call: ${call.title}`);

      // Get sender information
      const sender = await Sender.findById(senderId);
      if (!sender) {
        throw new Error('Sender not found');
      }

      // Get organizer and organization information
      const organizer = await User.findById(call.userId);
      const organization = await Organization.findById(call.organizationId);

      if (!organizer || !organization) {
        throw new Error('Organizer or organization not found');
      }

      // Prepare call data for template variables
      const callData = {
        callTitle: call.title,
        callDate: new Date(call.startTime).toLocaleDateString(),
        callTime: new Date(call.startTime).toLocaleTimeString(),
        callDescription: call.description || 'No description provided',
        meetingLink: call.meetingLink || 'TBD',
        companyName: organization.name,
        organizerName: organizer.fullName
      };

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      // Send invitation to each participant
      for (const participantId of participants) {
        try {
          const participant = await User.findById(participantId);
          if (!participant || !participant.email) {
            results.failed++;
            results.errors.push(`Participant ${participantId} not found or has no email`);
            continue;
          }

          // Send notification using the template system
          const notificationResult = await this.notificationService.generateByTriggerEvent(
            'call_invitation',
            {
              ...callData,
              participantName: participant.fullName
            },
            {
              recipientEmail: participant.email,
              recipientName: participant.fullName,
              senderId: senderId,
              priority: 'high',
              ...options
            }
          );

          if (notificationResult.success) {
            results.success++;
            console.log(`✅ Call invitation sent to ${participant.email}`);
          } else {
            results.failed++;
            results.errors.push(`Failed to send to ${participant.email}: ${notificationResult.message}`);
          }

        } catch (error) {
          results.failed++;
          results.errors.push(`Error sending to participant ${participantId}: ${error.message}`);
          console.error(`❌ Error sending invitation to participant ${participantId}:`, error);
        }
      }

      // Audit log
      await createAuditLog({
        action: 'Call Invitations Sent',
        user: call.userId,
        resource: 'call_scheduler',
        resourceId: call._id,
        details: {
          callTitle: call.title,
          participantsCount: participants.length,
          successCount: results.success,
          failedCount: results.failed,
          senderId: senderId
        },
        organization: call.organizationId,
        severity: 'info'
      });

      return {
        success: results.failed === 0,
        message: `Call invitations sent: ${results.success} successful, ${results.failed} failed`,
        data: results
      };

    } catch (error) {
      console.error('❌ Call invitation error:', error);
      throw error;
    }
  }

  /**
   * Send call scheduled notification to organizer
   * @param {Object} call - Call object from database
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of notification sending
   */
  async sendCallScheduledNotification(call, options = {}) {
    try {
      console.log(`📧 Sending call scheduled notification for: ${call.title}`);

      const organizer = await User.findById(call.userId);
      const organization = await Organization.findById(call.organizationId);

      if (!organizer || !organization) {
        throw new Error('Organizer or organization not found');
      }

      const callData = {
        callTitle: call.title,
        callDate: new Date(call.startTime).toLocaleDateString(),
        callTime: new Date(call.startTime).toLocaleTimeString(),
        callDescription: call.description || 'No description provided',
        meetingLink: call.meetingLink || 'TBD',
        companyName: organization.name,
        organizerName: organizer.fullName
      };

      const result = await this.notificationService.generateByTriggerEvent(
        'call_scheduled',
        callData,
        {
          recipientEmail: organizer.email,
          recipientName: organizer.fullName,
          priority: 'high',
          ...options
        }
      );

      // Audit log
      await createAuditLog({
        action: 'Call Scheduled Notification Sent',
        user: call.userId,
        resource: 'call_scheduler',
        resourceId: call._id,
        details: {
          callTitle: call.title,
          organizerEmail: organizer.email
        },
        organization: call.organizationId,
        severity: 'info'
      });

      return result;

    } catch (error) {
      console.error('❌ Call scheduled notification error:', error);
      throw error;
    }
  }

  /**
   * Send call reminder notifications (15 minutes before)
   * @param {Object} call - Call object from database
   * @param {Array} participants - Array of participant user IDs
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of notification sending
   */
  async sendCallReminder(call, participants, options = {}) {
    try {
      console.log(`📧 Sending call reminder for: ${call.title}`);

      const callData = {
        callTitle: call.title,
        meetingLink: call.meetingLink || 'TBD'
      };

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      // Send reminder to each participant
      for (const participantId of participants) {
        try {
          const participant = await User.findById(participantId);
          if (!participant || !participant.email) {
            results.failed++;
            results.errors.push(`Participant ${participantId} not found or has no email`);
            continue;
          }

          const notificationResult = await this.notificationService.generateByTriggerEvent(
            'call_reminder',
            {
              ...callData,
              participantName: participant.fullName
            },
            {
              recipientEmail: participant.email,
              recipientName: participant.fullName,
              priority: 'medium',
              ...options
            }
          );

          if (notificationResult.success) {
            results.success++;
            console.log(`✅ Call reminder sent to ${participant.email}`);
          } else {
            results.failed++;
            results.errors.push(`Failed to send reminder to ${participant.email}: ${notificationResult.message}`);
          }

        } catch (error) {
          results.failed++;
          results.errors.push(`Error sending reminder to participant ${participantId}: ${error.message}`);
          console.error(`❌ Error sending reminder to participant ${participantId}:`, error);
        }
      }

      return {
        success: results.failed === 0,
        message: `Call reminders sent: ${results.success} successful, ${results.failed} failed`,
        data: results
      };

    } catch (error) {
      console.error('❌ Call reminder error:', error);
      throw error;
    }
  }

  /**
   * Send call cancelled notification to participants
   * @param {Object} call - Call object from database
   * @param {Array} participants - Array of participant user IDs
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of notification sending
   */
  async sendCallCancelledNotification(call, participants, options = {}) {
    try {
      console.log(`📧 Sending call cancelled notification for: ${call.title}`);

      const organizer = await User.findById(call.userId);
      const organization = await Organization.findById(call.organizationId);

      if (!organizer || !organization) {
        throw new Error('Organizer or organization not found');
      }

      const callData = {
        callTitle: call.title,
        callDate: new Date(call.startTime).toLocaleDateString(),
        callTime: new Date(call.startTime).toLocaleTimeString(),
        organizerName: organizer.fullName,
        companyName: organization.name
      };

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      // Send cancellation notification to each participant
      for (const participantId of participants) {
        try {
          const participant = await User.findById(participantId);
          if (!participant || !participant.email) {
            results.failed++;
            results.errors.push(`Participant ${participantId} not found or has no email`);
            continue;
          }

          const notificationResult = await this.notificationService.generateByTriggerEvent(
            'call_cancelled',
            callData,
            {
              recipientEmail: participant.email,
              recipientName: participant.fullName,
              priority: 'medium',
              ...options
            }
          );

          if (notificationResult.success) {
            results.success++;
            console.log(`✅ Call cancellation notification sent to ${participant.email}`);
          } else {
            results.failed++;
            results.errors.push(`Failed to send cancellation to ${participant.email}: ${notificationResult.message}`);
          }

        } catch (error) {
          results.failed++;
          results.errors.push(`Error sending cancellation to participant ${participantId}: ${error.message}`);
          console.error(`❌ Error sending cancellation to participant ${participantId}:`, error);
        }
      }

      // Audit log
      await createAuditLog({
        action: 'Call Cancelled Notification Sent',
        user: call.userId,
        resource: 'call_scheduler',
        resourceId: call._id,
        details: {
          callTitle: call.title,
          participantsCount: participants.length,
          successCount: results.success,
          failedCount: results.failed
        },
        organization: call.organizationId,
        severity: 'info'
      });

      return {
        success: results.failed === 0,
        message: `Call cancellation notifications sent: ${results.success} successful, ${results.failed} failed`,
        data: results
      };

    } catch (error) {
      console.error('❌ Call cancelled notification error:', error);
      throw error;
    }
  }
}

module.exports = new CallNotificationService();
