const express = require("express");
const router = express.Router();
const authController = require("../controllers/authControllers");
const emailVerificationController = require("../controllers/emailVerificationController");
const { protect } = require("../middleware/authMiddleware");

// ========================================
// GENERAL USER ENDPOINTS (for storehubomale)
// ========================================

// Register user (creates organization and user)
router.post('/register', authController.registerUser);

// Login user (for organization users)
router.post("/login", authController.loginUser);

// ========================================
// SUPER ADMIN ENDPOINTS (separate system)
// ========================================

// Register Super Admin
router.post('/super-admin/register', authController.registerSuperAdmin);

// Login Super Admin
router.post('/super-admin/login', authController.loginSuperAdmin);

// ========================================
// AFFILIATE ENDPOINTS
// ========================================

// Register Affiliate
router.post('/affiliate/register', authController.registerAffiliate);

// Login Affiliate
router.post('/affiliate/login', authController.loginAffiliate);

// ========================================
// PASSWORD CHANGE ENDPOINTS
// ========================================

// Change password for a regular user (with organizationId)
router.post('/change/password', authController.changePassword);

// Change password for a super admin
router.post('/super-admin/change/password', authController.changePasswordSuperAdmin);

// ========================================
// PASSWORD RESET ENDPOINTS
// ========================================

// Request password reset
router.post('/forgot-password', authController.forgotPassword);

// Reset password with token
router.post('/reset-password', authController.resetPassword);

// Verify reset token validity
router.get('/verify-reset-token/:token', authController.verifyResetToken);

// ========================================
// EMAIL VERIFICATION ENDPOINTS
// ========================================

// Verify email with 6-digit code
router.post('/verify-email', emailVerificationController.verifyEmail);

// Resend verification code
router.post('/resend-verification', emailVerificationController.resendVerificationCode);

// Check verification status
router.get('/check-verification-status', emailVerificationController.checkVerificationStatus);

// Cleanup expired verification codes (Admin only)
router.post('/cleanup-verification-codes', protect, emailVerificationController.cleanupVerificationCodes);

module.exports = router;
