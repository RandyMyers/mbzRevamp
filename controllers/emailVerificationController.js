/**
 * Email Verification Controller
 * 
 * Handles email verification endpoints for user registration
 */

const EmailVerificationService = require('../services/emailVerificationService');
const User = require('../models/users');
const { createAuditLog } = require('../helpers/auditLogHelper');

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email with 6-digit code (for new user registration)
 *     description: |
 *       Verify user's email address using the 6-digit code sent during registration.
 *       
 *       **Use this when:** User just registered and needs to verify their email
 *       **Code type:** 6-digit numeric code (e.g., "123456")
 *       **Code source:** Sent automatically after /api/auth/register
 *       **Expiration:** 15 minutes
 *       
 *       **⚠️ Different from:** Password reset (use /api/auth/reset-password for forgot password)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - verificationCode
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "user@example.com"
 *               verificationCode:
 *                 type: string
 *                 pattern: "^\\d{6}$"
 *                 description: 6-digit verification code
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Email verified successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: ObjectId
 *                     email:
 *                       type: string
 *                       format: email
 *                     emailVerified:
 *                       type: boolean
 *                       example: true
 *                     status:
 *                       type: string
 *                       example: "active"
 *       400:
 *         description: Invalid verification code or email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired verification code"
 *       500:
 *         description: Server error
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    
    // Validate required fields
    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }
    
    // Validate verification code format (6 digits)
    if (!/^\d{6}$/.test(verificationCode)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code must be exactly 6 digits'
      });
    }
    
    // Verify the code
    const result = await EmailVerificationService.verifyCode(email, verificationCode, req);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user: result.user
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
};

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend email verification code (6-digit code for registration)
 *     description: |
 *       Resend a new 6-digit verification code to the user's email address.
 *       
 *       **Use this when:** User didn't receive or lost their 6-digit verification code
 *       **Code type:** 6-digit numeric code (e.g., "123456")
 *       **For:** New user email verification only
 *       
 *       **⚠️ Different from:** Password reset resend (use /api/auth/forgot-password instead)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Verification code sent successfully"
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   description: When the verification code expires
 *       400:
 *         description: Email already verified or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Email is already verified"
 *       500:
 *         description: Server error
 */
exports.resendVerificationCode = async (req, res) => {
  try {
    console.log('🔄 [EMAIL VERIFICATION CONTROLLER] Resend verification code request received');
    console.log('🔄 [EMAIL VERIFICATION CONTROLLER] Request body:', req.body);
    
    const { email } = req.body;
    
    // Validate required fields
    if (!email) {
      console.log('❌ [EMAIL VERIFICATION CONTROLLER] Email is missing from request body');
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    console.log('🔄 [EMAIL VERIFICATION CONTROLLER] Calling EmailVerificationService.resendVerificationCode...');
    // Resend verification code
    const result = await EmailVerificationService.resendVerificationCode(email, req);
    console.log('🔄 [EMAIL VERIFICATION CONTROLLER] Service result:', result);
    
    if (!result.success) {
      console.log('❌ [EMAIL VERIFICATION CONTROLLER] Service returned failure:', result.message);
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    console.log('✅ [EMAIL VERIFICATION CONTROLLER] Resend successful, sending response');
    res.status(200).json({
      success: true,
      message: result.message,
      expiresAt: result.expiresAt
    });
    
  } catch (error) {
    console.error('❌ [EMAIL VERIFICATION CONTROLLER] Resend verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending verification code'
    });
  }
};

/**
 * @swagger
 * /api/auth/check-verification-status:
 *   get:
 *     summary: Check email verification status
 *     description: Check if a user's email is verified
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User's email address
 *         example: "user@example.com"
 *     responses:
 *       200:
 *         description: Verification status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 emailVerified:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: "active"
 *       400:
 *         description: Email not provided
 *       404:
 *         description: User not found
 */
exports.checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.query;
    
    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      emailVerified: user.emailVerified,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt
    });
    
  } catch (error) {
    console.error('Check verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking verification status'
    });
  }
};

/**
 * @swagger
 * /api/auth/cleanup-verification-codes:
 *   post:
 *     summary: Clean up expired verification codes (Admin only)
 *     description: Manually trigger cleanup of expired verification codes
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cleanup completed successfully"
 *                 cleanedCount:
 *                   type: number
 *                   example: 15
 *       401:
 *         description: Unauthorized - Admin access required
 */
exports.cleanupVerificationCodes = async (req, res) => {
  try {
    // Check if user is admin or super-admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
      return res.status(401).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    // Perform cleanup
    const result = await EmailVerificationService.cleanupExpiredCodes();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Cleanup failed',
        error: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Cleanup completed successfully',
      cleanedCount: result.cleanedCount
    });
    
  } catch (error) {
    console.error('Cleanup verification codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during cleanup'
    });
  }
};
