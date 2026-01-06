const dotenv = require('dotenv');
dotenv.config();

const notificationGenerationService = require('./notificationGenerationService');
const { createAndSendNotification, sendDirectEmail } = require('./notificationService');
const SendGridService = require('./sendGridService'); // Uses Resend under the hood
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
   * Send in-app notifications to call participants (no email required)
   * This is used when email service is not available
   * @param {Object} call - Call object from database
   * @param {Array} participants - Array of participant user IDs
   * @returns {Promise<Object>} Result of notification sending
   */
  async sendInAppCallNotifications(call, participants) {
    try {
      console.log(`🔔 Sending in-app call notifications for: ${call.title}`);

      const organizer = await User.findById(call.userId);
      const organization = await Organization.findById(call.organizationId);

      if (!organizer || !organization) {
        throw new Error('Organizer or organization not found');
      }

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      // Format date and time for display
      const callDate = new Date(call.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const callTime = new Date(call.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Send in-app notification to each participant
      for (const participantId of participants) {
        try {
          const participant = await User.findById(participantId);
          if (!participant) {
            results.failed++;
            results.errors.push(`Participant ${participantId} not found`);
            continue;
          }

          // Create in-app notification
          const notificationResult = await createAndSendNotification({
            userId: participantId,
            subject: `You're invited to: ${call.title}`,
            body: `<p><strong>${organizer.fullName}</strong> has invited you to a call.</p>
              <p><strong>Title:</strong> ${call.title}</p>
              <p><strong>Date:</strong> ${callDate}</p>
              <p><strong>Time:</strong> ${callTime}</p>
              ${call.description ? `<p><strong>Description:</strong> ${call.description}</p>` : ''}
              ${call.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${call.meetingLink}">${call.meetingLink}</a></p>` : ''}`,
            type: 'system',
            category: 'calls',
            organization: call.organizationId
          });

          if (notificationResult.success) {
            results.success++;
            console.log(`✅ In-app notification sent to ${participant.fullName}`);
          } else {
            results.failed++;
            results.errors.push(`Failed to notify ${participant.fullName}: ${notificationResult.error}`);
          }

        } catch (error) {
          results.failed++;
          results.errors.push(`Error notifying participant ${participantId}: ${error.message}`);
          console.error(`❌ Error sending in-app notification to participant ${participantId}:`, error);
        }
      }

      // Audit log
      await createAuditLog({
        action: 'Call In-App Notifications Sent',
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
        message: `In-app notifications sent: ${results.success} successful, ${results.failed} failed`,
        data: results
      };

    } catch (error) {
      console.error('❌ In-app call notification error:', error);
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
   * Send call invitation emails to external participants (non-organization members)
   * @param {Object} call - Call object from database
   * @param {Array} externalParticipants - Array of external participant objects with name and email
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of notification sending
   */
  async sendExternalCallInvitations(call, externalParticipants, options = {}) {
    try {
      console.log(`📧 Sending external call invitations for call: ${call.title}`);

      // Get organizer and organization information
      const organizer = await User.findById(call.userId);
      const organization = await Organization.findById(call.organizationId);

      if (!organizer || !organization) {
        throw new Error('Organizer or organization not found');
      }

      // Format date and time nicely
      const callDate = new Date(call.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const callTime = new Date(call.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      // Send invitation to each external participant
      for (const participant of externalParticipants) {
        try {
          if (!participant.email || !participant.name) {
            results.failed++;
            results.errors.push(`External participant missing name or email: ${JSON.stringify(participant)}`);
            continue;
          }

          // Generate email HTML using template
          const emailHtml = SendGridService.generateEmailTemplate({
            title: `You're Invited: ${call.title}`,
            heading: `📅 Meeting Invitation`,
            content: `
              <h2>Hello ${participant.name}!</h2>
              <p>You have been invited to join a call by <strong>${organizer.fullName}</strong> from <strong>${organization.name}</strong>.</p>

              <div class="info-box">
                <h3>📋 Call Details:</h3>
                <ul>
                  <li><strong>Title:</strong> ${call.title}</li>
                  <li><strong>Date:</strong> ${callDate}</li>
                  <li><strong>Time:</strong> ${callTime}</li>
                  ${call.description ? `<li><strong>Description:</strong> ${call.description}</li>` : ''}
                </ul>
              </div>

              <p><strong>Join the call using this link:</strong></p>
              <div style="text-align: center;">
                <a href="${call.meetingLink}" class="button">Join Meeting</a>
              </div>

              <p style="color: #6c757d; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <div class="link-box">${call.meetingLink}</div>

              <div class="divider"></div>

              <p>We look forward to speaking with you!</p>
              <p style="margin-top: 20px;">Best regards,<br>
              <strong>${organization.name} Team</strong></p>
            `,
            footer: `
              <p>This invitation was sent by ${organizer.fullName} from ${organization.name}.</p>
              <p>© ${new Date().getFullYear()} ${organization.name}. All rights reserved.</p>
            `
          });

          // Send direct email to external participant
          const emailResult = await sendDirectEmail({
            to: participant.email,
            subject: `You're Invited: ${call.title} - ${organization.name}`,
            html: emailHtml,
            organizationId: call.organizationId
          });

          if (emailResult.success) {
            results.success++;
            console.log(`✅ External call invitation sent to ${participant.email}`);
          } else {
            results.failed++;
            results.errors.push(`Failed to send to ${participant.email}: ${emailResult.error}`);
          }

        } catch (error) {
          results.failed++;
          results.errors.push(`Error sending to external participant ${participant.email}: ${error.message}`);
          console.error(`❌ Error sending invitation to external participant ${participant.email}:`, error);
        }
      }

      // Audit log
      await createAuditLog({
        action: 'External Call Invitations Sent',
        user: call.userId,
        resource: 'call_scheduler',
        resourceId: call._id,
        details: {
          callTitle: call.title,
          externalParticipantsCount: externalParticipants.length,
          successCount: results.success,
          failedCount: results.failed
        },
        organization: call.organizationId,
        severity: 'info'
      });

      return {
        success: results.failed === 0,
        message: `External call invitations sent: ${results.success} successful, ${results.failed} failed`,
        data: results
      };

    } catch (error) {
      console.error('❌ External call invitation error:', error);
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
