/**
 * Email Verification Service
 * 
 * Handles email verification with 6-digit codes for user registration
 */

const EmailVerification = require('../models/EmailVerification');
const User = require('../models/users');
const { sendSystemEmail } = require('./emailService');
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
      const subject = 'Verify Your Email Address - MBZ Technology Platform';
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Email Verification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f8f9fa; }
            .code-container { background-color: white; padding: 30px; text-align: center; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .verification-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Email Verification</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${user.fullName || 'User'}!</h2>
              
              <p>Thank you for registering with MBZ Technology Platform. To complete your registration and activate your account, please verify your email address using the code below:</p>
              
              <div class="code-container">
                <p><strong>Your verification code is:</strong></p>
                <div class="verification-code">${verificationCode}</div>
                <p><em>This code will expire in 15 minutes</em></p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <ul>
                  <li>Never share this verification code with anyone</li>
                  <li>MBZ Technology will never ask for your verification code via phone or email</li>
                  <li>If you didn't request this verification, please ignore this email</li>
                </ul>
              </div>
              
              <p>Once verified, you'll have full access to your dashboard and can start managing your business operations.</p>
              
              <p>If you have any questions or need assistance, please contact our support team.</p>
              
              <p>Best regards,<br>
              <strong>MBZ Technology Team</strong></p>
            </div>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} MBZ Technology. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const textContent = `
        Email Verification - MBZ Technology Platform
        
        Hello ${user.fullName || 'User'}!
        
        Thank you for registering with MBZ Technology Platform. To complete your registration, please use the following verification code:
        
        Verification Code: ${verificationCode}
        
        This code will expire in 15 minutes.
        
        Important Security Notice:
        - Never share this verification code with anyone
        - MBZ Technology will never ask for your verification code via phone or email
        - If you didn't request this verification, please ignore this email
        
        Once verified, you'll have full access to your dashboard.
        
        Best regards,
        MBZ Technology Team
        
        ---
        This is an automated message. Please do not reply to this email.
        © ${new Date().getFullYear()} MBZ Technology. All rights reserved.
      `;
      
      const emailResult = await sendSystemEmail(user.email, subject, htmlContent);
      
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
