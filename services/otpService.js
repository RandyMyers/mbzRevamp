const dotenv = require('dotenv');
dotenv.config();

const UserOTP = require('../models/userOTP');
const User = require('../models/users');
const Organization = require('../models/organization');
const { sendLoginOTPEmail } = require('./emailService');
const { createAuditLog } = require('../helpers/auditLogHelper');

/**
 * OTP Service
 * 
 * Handles One-Time Password generation, validation, and management
 */
class OTPService {
  
  /**
   * Enable OTP for a user
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID
   * @param {Object} req - Request object for audit logging
   * @returns {Promise<Object>} Result of OTP enabling
   */
  static async enableOTP(userId, organizationId, req) {
    try {
      console.log(`🔐 [OTP SERVICE] Enabling OTP for user: ${userId}`);

      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Check if OTP is already enabled
      let userOTP = await UserOTP.getUserOTPSettings(userId);
      if (userOTP && userOTP.isOTPEnabled) {
        return {
          success: false,
          error: 'OTP is already enabled for this user'
        };
      }

      // Create or update OTP settings
      if (!userOTP) {
        userOTP = new UserOTP({
          userId,
          organizationId,
          email: user.email,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || 'Unknown'
        });
      }

      // Enable OTP
      await userOTP.enableOTP();

      // Update user model
      user.otpEnabled = true;
      user.otpEnabledAt = new Date();
      await user.save();

      // ✅ AUDIT LOG: OTP Enabled
      await createAuditLog({
        action: 'OTP Enabled',
        user: userId,
        resource: 'user_otp',
        resourceId: userOTP._id,
        details: {
          email: user.email,
          organizationId,
          enabledAt: new Date()
        },
        organization: organizationId,
        severity: 'info'
      });

      console.log(`✅ [OTP SERVICE] OTP enabled successfully for user: ${user.email}`);

      return {
        success: true,
        message: 'OTP has been enabled successfully',
        data: {
          otpEnabled: true,
          enabledAt: userOTP.otpEnabledAt
        }
      };

    } catch (error) {
      console.error('❌ [OTP SERVICE] Error enabling OTP:', error);
      
      // ✅ AUDIT LOG: OTP Enable Failed
      try {
        await createAuditLog({
          action: 'OTP Enable Failed',
          user: userId,
          resource: 'user_otp',
          resourceId: null,
          details: {
            error: error.message,
            organizationId
          },
          organization: organizationId,
          severity: 'error'
        });
      } catch (auditError) {
        console.error('Failed to create audit log for OTP enable failure:', auditError);
      }

      return {
        success: false,
        error: 'Failed to enable OTP'
      };
    }
  }

  /**
   * Disable OTP for a user
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID
   * @param {Object} req - Request object for audit logging
   * @returns {Promise<Object>} Result of OTP disabling
   */
  static async disableOTP(userId, organizationId, req) {
    try {
      console.log(`🔐 [OTP SERVICE] Disabling OTP for user: ${userId}`);

      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Get OTP settings
      const userOTP = await UserOTP.getUserOTPSettings(userId);
      if (!userOTP || !userOTP.isOTPEnabled) {
        return {
          success: false,
          error: 'OTP is not enabled for this user'
        };
      }

      // Disable OTP
      await userOTP.disableOTP();

      // Update user model
      user.otpEnabled = false;
      await user.save();

      // ✅ AUDIT LOG: OTP Disabled
      await createAuditLog({
        action: 'OTP Disabled',
        user: userId,
        resource: 'user_otp',
        resourceId: userOTP._id,
        details: {
          email: user.email,
          organizationId,
          disabledAt: new Date()
        },
        organization: organizationId,
        severity: 'info'
      });

      console.log(`✅ [OTP SERVICE] OTP disabled successfully for user: ${user.email}`);

      return {
        success: true,
        message: 'OTP has been disabled successfully',
        data: {
          otpEnabled: false,
          disabledAt: userOTP.otpDisabledAt
        }
      };

    } catch (error) {
      console.error('❌ [OTP SERVICE] Error disabling OTP:', error);
      
      // ✅ AUDIT LOG: OTP Disable Failed
      try {
        await createAuditLog({
          action: 'OTP Disable Failed',
          user: userId,
          resource: 'user_otp',
          resourceId: null,
          details: {
            error: error.message,
            organizationId
          },
          organization: organizationId,
          severity: 'error'
        });
      } catch (auditError) {
        console.error('Failed to create audit log for OTP disable failure:', auditError);
      }

      return {
        success: false,
        error: 'Failed to disable OTP'
      };
    }
  }

  /**
   * Generate and send OTP code for login
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID
   * @param {Object} req - Request object for audit logging
   * @returns {Promise<Object>} Result of OTP generation
   */
  static async generateLoginOTP(userId, organizationId, req) {
    try {
      console.log(`🔐 [OTP SERVICE] Generating login OTP for user: ${userId}`);

      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Get OTP settings
      let userOTP = await UserOTP.getUserOTPSettings(userId);
      if (!userOTP || !userOTP.isOTPEnabled) {
        return {
          success: false,
          error: 'OTP is not enabled for this user'
        };
      }

      // Check if user can request new OTP
      const canRequest = userOTP.canRequestOTP();
      if (!canRequest.canRequest) {
        return {
          success: false,
          error: canRequest.reason
        };
      }

      // Generate new OTP code
      const code = userOTP.generateOTPCode();
      await userOTP.save();

      // Get organization details
      const organization = await Organization.findById(organizationId);

      // Send OTP email
      const emailResult = await sendLoginOTPEmail(user, code, organization);

      if (!emailResult.success) {
        console.error('❌ [OTP SERVICE] Failed to send OTP email:', emailResult.error);
        return {
          success: false,
          error: 'Failed to send OTP email'
        };
      }

      // ✅ AUDIT LOG: Login OTP Generated
      await createAuditLog({
        action: 'Login OTP Generated',
        user: userId,
        resource: 'user_otp',
        resourceId: userOTP._id,
        details: {
          email: user.email,
          organizationId,
          codeExpiresAt: userOTP.codeExpiresAt,
          dailyCount: userOTP.dailyOTPCount
        },
        organization: organizationId,
        severity: 'info'
      });

      console.log(`✅ [OTP SERVICE] Login OTP generated and sent successfully to: ${user.email}`);

      return {
        success: true,
        message: 'OTP code has been sent to your email',
        data: {
          expiresAt: userOTP.codeExpiresAt,
          dailyCount: userOTP.dailyOTPCount
        }
      };

    } catch (error) {
      console.error('❌ [OTP SERVICE] Error generating login OTP:', error);
      
      // ✅ AUDIT LOG: Login OTP Generation Failed
      try {
        await createAuditLog({
          action: 'Login OTP Generation Failed',
          user: userId,
          resource: 'user_otp',
          resourceId: null,
          details: {
            error: error.message,
            organizationId
          },
          organization: organizationId,
          severity: 'error'
        });
      } catch (auditError) {
        console.error('Failed to create audit log for OTP generation failure:', auditError);
      }

      return {
        success: false,
        error: 'Failed to generate OTP code'
      };
    }
  }

  /**
   * Validate OTP code for login
   * @param {string} userId - User ID
   * @param {string} code - OTP code
   * @param {string} organizationId - Organization ID
   * @param {Object} req - Request object for audit logging
   * @returns {Promise<Object>} Result of OTP validation
   */
  static async validateLoginOTP(userId, code, organizationId, req) {
    try {
      console.log(`🔐 [OTP SERVICE] Validating login OTP for user: ${userId}`);

      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Find valid OTP
      const userOTP = await UserOTP.findValidOTP(userId, code);
      if (!userOTP) {
        // Increment failed attempts
        const otpSettings = await UserOTP.getUserOTPSettings(userId);
        if (otpSettings) {
          await otpSettings.incrementAttempts();
        }

        // ✅ AUDIT LOG: Invalid OTP Attempt
        await createAuditLog({
          action: 'Invalid OTP Attempt',
          user: userId,
          resource: 'user_otp',
          resourceId: otpSettings?._id,
          details: {
            email: user.email,
            organizationId,
            code,
            attempts: (otpSettings?.attempts || 0) + 1
          },
          organization: organizationId,
          severity: 'warning'
        });

        return {
          success: false,
          error: 'Invalid or expired OTP code'
        };
      }

      // Mark OTP as used
      await userOTP.markOTPUsed();

      // ✅ AUDIT LOG: OTP Validated Successfully
      await createAuditLog({
        action: 'OTP Validated Successfully',
        user: userId,
        resource: 'user_otp',
        resourceId: userOTP._id,
        details: {
          email: user.email,
          organizationId,
          validatedAt: new Date()
        },
        organization: organizationId,
        severity: 'info'
      });

      console.log(`✅ [OTP SERVICE] OTP validated successfully for user: ${user.email}`);

      return {
        success: true,
        message: 'OTP validated successfully',
        data: {
          userId,
          email: user.email
        }
      };

    } catch (error) {
      console.error('❌ [OTP SERVICE] Error validating OTP:', error);
      
      // ✅ AUDIT LOG: OTP Validation Failed
      try {
        await createAuditLog({
          action: 'OTP Validation Failed',
          user: userId,
          resource: 'user_otp',
          resourceId: null,
          details: {
            error: error.message,
            organizationId
          },
          organization: organizationId,
          severity: 'error'
        });
      } catch (auditError) {
        console.error('Failed to create audit log for OTP validation failure:', auditError);
      }

      return {
        success: false,
        error: 'Failed to validate OTP code'
      };
    }
  }

  /**
   * Get user OTP settings
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User OTP settings
   */
  static async getUserOTPSettings(userId) {
    try {
      const userOTP = await UserOTP.getUserOTPSettings(userId);
      if (!userOTP) {
        return {
          success: true,
          data: {
            otpEnabled: false,
            otpEnabledAt: null
          }
        };
      }

      return {
        success: true,
        data: {
          otpEnabled: userOTP.isOTPEnabled,
          otpEnabledAt: userOTP.otpEnabledAt,
          otpDisabledAt: userOTP.otpDisabledAt,
          dailyOTPCount: userOTP.dailyOTPCount,
          lastOTPSentAt: userOTP.lastOTPSentAt
        }
      };

    } catch (error) {
      console.error('❌ [OTP SERVICE] Error getting user OTP settings:', error);
      return {
        success: false,
        error: 'Failed to get OTP settings'
      };
    }
  }

  /**
   * Check if user has OTP enabled
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether OTP is enabled
   */
  static async isOTPEnabled(userId) {
    try {
      const userOTP = await UserOTP.getUserOTPSettings(userId);
      return userOTP ? userOTP.isOTPEnabled : false;
    } catch (error) {
      console.error('❌ [OTP SERVICE] Error checking OTP status:', error);
      return false;
    }
  }
}

module.exports = OTPService;
