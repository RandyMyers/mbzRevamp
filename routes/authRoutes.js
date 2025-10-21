const express = require("express");
const router = express.Router();
const authController = require("../controllers/authControllers");
const emailVerificationController = require("../controllers/emailVerificationController");
const { protect } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Authentication and authorization operations
 */

// ========================================
// GENERAL USER ENDPOINTS (for storehubomale)
// ========================================

// Register user (creates organization and user)
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user and organization
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - organizationName
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               organizationName:
 *                 type: string
 *                 example: "My Company"
 *     responses:
 *       201:
 *         description: User and organization created successfully
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
 *                   example: "User registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     organization:
 *                       $ref: '#/components/schemas/Organization'
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/register', authController.registerUser);

// Login user (for organization users)
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
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

// ========================================
// OTP (ONE-TIME PASSWORD) ENDPOINTS
// ========================================

// Validate OTP code during login
router.post('/validate-otp', authController.validateOTP);

// Enable OTP for user account (requires authentication)
router.post('/enable-otp', protect, authController.enableOTP);

// Disable OTP for user account (requires authentication)
router.post('/disable-otp', protect, authController.disableOTP);

// Get user OTP settings (requires authentication)
router.get('/otp-settings', protect, authController.getOTPSettings);

// Verify JWT token validity (no authentication required)
router.post('/verify-token', authController.verifyToken);

module.exports = router;
