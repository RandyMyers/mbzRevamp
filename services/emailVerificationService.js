/**
 * Email Verification Service
 * 
 * Handles email verification with 6-digit codes for user registration
 */

const EmailVerification = require('../models/EmailVerification');
const User = require('../models/users');
const { sendSystemEmail } = require('./emailService');
const SendGridService = require('./sendGridService');
const { createAuditLog } = require('../helpers/auditLogHelper');

class EmailVerificationService {
  
  /**
   * Generate and send verification code
   * @param {Object} user - User object
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} Result object
   */
  static async sendVerificationCode(user, req) {
    try {
      console.log(`📧 [EMAIL VERIFICATION] Starting verification process for user: ${user.email}`);
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent') || 'Unknown';
      
      // Invalidate any existing unverified codes for this email
      const invalidationResult = await EmailVerification.updateMany(
        {
          email: user.email,
          isVerified: false
        },
        {
          $set: { invalidatedAt: new Date() }
        }
      );
      
      // Generate new 6-digit verification code
      const verificationCode = EmailVerification.generateVerificationCode();
      
      // Create new verification record
      const emailVerification = new EmailVerification({
        userId: user._id,
        email: user.email,
        verificationCode,
        ipAddress,
        userAgent,
        organizationId: user.organization || null
      });
      
      await emailVerification.save();
      console.log(`📧 [EMAIL VERIFICATION] Verification record saved, now sending email to: ${user.email}`);
      
      // Send verification email
      const emailResult = await this.sendVerificationEmail(user, verificationCode);
      
      if (!emailResult.success) {
        console.error('🔐 [EMAIL VERIFICATION] Email sending failed:', emailResult.error);
        throw new Error(`Failed to send verification email: ${emailResult.error}`);
      }
      
      // Create audit log
      await createAuditLog({
        action: 'Email Verification Code Sent',
        user: user._id,
        resource: 'email_verification',
        resourceId: emailVerification._id,
        details: {
          email: user.email,
          verificationId: emailVerification._id,
          ipAddress,
          userAgent
        },
        organization: user.organization || null,
        severity: 'info',
        ip: ipAddress,
        userAgent: userAgent
      });
      
      return {
        success: true,
        message: 'Verification code sent successfully',
        verificationId: emailVerification._id,
        expiresAt: emailVerification.expiresAt
      };
      
    } catch (error) {
      console.error('Error sending verification code:', error);
      
      // Create audit log for error
      await createAuditLog({
        action: 'Email Verification Code Send Failed',
        user: user._id,
        resource: 'email_verification',
        resourceId: null,
        details: {
          email: user.email,
          error: error.message,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        organization: user.organization || null,
        severity: 'error',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Verify the 6-digit code
   * @param {string} email - User email
   * @param {string} code - 6-digit verification code
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} Result object
   */
  static async verifyCode(email, code, req) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent') || 'Unknown';
      
      // Find valid verification code
      const emailVerification = await EmailVerification.findValidCode(email, code);
      
      if (!emailVerification) {
        return {
          success: false,
          message: 'Invalid or expired verification code'
        };
      }
      
      // Verify the code
      const verificationResult = emailVerification.verifyCode(code);
      
      if (!verificationResult.success) {
        await emailVerification.save(); // Save updated attempts
        return verificationResult;
      }
      
      // Save the verified status
      await emailVerification.save();
      
      // Update user's email verification status
      const user = await User.findById(emailVerification.userId);
      if (user) {
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        user.status = 'active'; // Activate user account
        await user.save();
      }
      
      // Create audit log
      await createAuditLog({
        action: 'Email Verified Successfully',
        user: user._id,
        resource: 'email_verification',
        resourceId: emailVerification._id,
        details: {
          email: user.email,
          verificationId: emailVerification._id,
          ipAddress,
          userAgent
        },
        organization: user.organization || null,
        severity: 'info',
        ip: ipAddress,
        userAgent: userAgent
      });
      
      return {
        success: true,
        message: 'Email verified successfully',
        user: {
          id: user._id,
          email: user.email,
          emailVerified: user.emailVerified,
          status: user.status
        }
      };
      
    } catch (error) {
      console.error('Error verifying code:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Resend verification code
   * @param {string} email - User email
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} Result object
   */
  static async resendVerificationCode(email, req) {
    try {
      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        // Always return success to prevent email enumeration
        return {
          success: true,
          message: 'If an account with that email exists, a verification code has been sent'
        };
      }
      
      // Check if email is already verified
      if (user.emailVerified) {
        return {
          success: true,
          message: 'Email is already verified. You can log in to your account.'
        };
      }
      
      // Send new verification code
      const result = await this.sendVerificationCode(user, req);
      
      return result;
      
    } catch (error) {
      console.error('❌ [EMAIL VERIFICATION] Error resending verification code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Send verification email with 6-digit code
   * @param {Object} user - User object
   * @param {string} verificationCode - 6-digit code
   * @returns {Promise<Object>} Email sending result
   */
  static async sendVerificationEmail(user, verificationCode) {
    try {
      // Use SendGrid service which uses the standard MBZ email template
      const emailResult = await SendGridService.sendVerificationEmail(user, verificationCode);
      
      if (emailResult.success) {
        console.log(`✅ Email verification code sent to ${user.email} - Message ID: ${emailResult.messageId}`);
        return {
          success: true,
          messageId: emailResult.messageId
        };
      } else {
        return {
          success: false,
          error: emailResult.error
        };
      }
      
    } catch (error) {
      console.error('❌ [EMAIL VERIFICATION EMAIL] Error sending verification email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Clean up expired verification codes
   * @returns {Promise<Object>} Cleanup result
   */
  static async cleanupExpiredCodes() {
    try {
      const result = await EmailVerification.invalidateExpiredCodes();
      console.log(`Cleaned up ${result.modifiedCount} expired verification codes`);
      return {
        success: true,
        cleanedCount: result.modifiedCount
      };
    } catch (error) {
      console.error('Error cleaning up expired codes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = EmailVerificationService;
