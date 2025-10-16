const dotenv = require('dotenv');
dotenv.config();

const User = require("../models/users");
const Role = require("../models/role");
const Organization = require("../models/organization");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer"); // Add missing nodemailer import
// Use the correct auditLogHelper import
const { createAuditLog, logSecurityEvent } = require("../helpers/auditLogHelper");
// Import onboarding status check
const { checkOnboardingStatus } = require("./onboardingController");
// Import email verification service
const EmailVerificationService = require("../services/emailVerificationService");

// SMTP Configuration for system emails
const smtpConfig = {
  host: 'mbztechnology.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'hello@mbztechnology.com',
    pass: 'Dontmesswithus@01'
  }
};

// Create transporter for system emails
const systemTransporter = nodemailer.createTransport(smtpConfig);

// Send system email function
const sendSystemEmail = async (to, subject, html) => {
  try {
    const info = await systemTransporter.sendMail({
      from: 'hello@mbztechnology.com',
      to,
      subject,
      html
    });
    console.log('System email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending system email:', error);
    throw error;
  }
};

// ========================================
// AUTHENTICATION API OVERVIEW
// ========================================

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthenticationFlow:
 *       type: object
 *       description: |
 *         # Authentication System Overview
 *         
 *         ## 🔄 Two Different Verification Systems:
 *         
 *         ### 1. Email Verification (Registration) - 6-digit codes
 *         - **Purpose:** Verify email ownership for new users
 *         - **When:** During user registration
 *         - **Code:** 6-digit number (e.g., "123456")
 *         - **Expires:** 15 minutes
 *         - **Endpoints:** 
 *           - `POST /api/auth/verify-email` - Verify 6-digit code
 *           - `POST /api/auth/resend-verification` - Resend 6-digit code
 *         
 *         ### 2. Password Reset (Forgot Password) - 6-digit codes
 *         - **Purpose:** Reset forgotten password for existing users
 *         - **When:** User forgot their password
 *         - **Code:** 6-digit verification code (e.g., "123456")
 *         - **Expires:** 15 minutes
 *         - **Endpoints:**
 *           - `POST /api/auth/forgot-password` - Send reset email with code
 *           - `POST /api/auth/reset-password` - Reset with email and code
 *         
 *         ## 📋 Complete User Flow:
 *         
 *         ### New User Registration:
 *         1. `POST /api/auth/register` → Creates account, sends 6-digit code
 *         2. `POST /api/auth/verify-email` → Verify with 6-digit code
 *         3. `POST /api/auth/login` → Login (now works)
 *         
 *         ### Forgot Password:
 *         1. `POST /api/auth/forgot-password` → Send reset email with 6-digit code
 *         2. `POST /api/auth/reset-password` → Reset password with email and code
 *         3. `POST /api/auth/login` → Login with new password
 *         
 *         ### Change Password (Logged-in Users):
 *         1. `POST /api/auth/change/password` → Change password (requires current password)
 *         
 *         ## ⚠️ Important Notes:
 *         - **6-digit codes** are used for BOTH email verification (registration) AND password reset
 *         - **Registration codes** expire in 15 minutes
 *         - **Password reset codes** expire in 15 minutes
 *         - **OTP codes** (for login) expire in 5 minutes
 *         - All codes are 6-digit format but serve different purposes
 */

// ========================================
// SUPER ADMIN REGISTRATION & LOGIN
// ========================================

/**
 * @swagger
 * /api/auth/super-admin/register:
 *   post:
 *     summary: Register a new Super Admin
 *     tags: [Authentication]
 *     description: Creates a new super admin account for platform management. This endpoint is used to create the initial platform administrator.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username for the super admin
 *                 example: "admin"
 *               fullName:
 *                 type: string
 *                 description: Full name of the super admin
 *                 example: "John Admin"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Super admin email address
 *                 example: "admin@mbztechnology.com"
 *               password:
 *                 type: string
 *                 description: Super admin password (min 8 characters)
 *                 example: "AdminPassword123!"
 *     responses:
 *       201:
 *         description: Super Admin registered successfully
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
 *                   example: "Super Admin registered successfully"
 *                 userId:
 *                   type: string
 *                   format: ObjectId
 *                   description: Unique super admin user ID
 *                 username:
 *                   type: string
 *                   description: Super admin username
 *                   example: "admin"
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: "admin@mbztechnology.com"
 *                 role:
 *                   type: string
 *                   description: User role
 *                   example: "super-admin"
 *       400:
 *         description: User already exists or validation error
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
 *                   example: "User with this email or username already exists"
 *       500:
 *         description: Server error
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
 *                   example: "Server error"
 */
// Register a Super Admin (Platform Owner)
exports.registerSuperAdmin = async (req, res) => {
  const { username, fullName, email, password } = req.body;
  console.log('Super Admin Registration:', req.body);

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or username already exists' 
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new super admin user
    const newSuperAdmin = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
      role: 'super-admin', // Direct role assignment
      status: 'active'
    });

    // Save the user
    await newSuperAdmin.save();

    // ✅ AUDIT LOG: Super Admin Created
    await createAuditLog({
      action: 'Super Admin Created',
      user: newSuperAdmin._id,
      resource: 'user',
      resourceId: newSuperAdmin._id,
      details: {
        username: newSuperAdmin.username,
        email: newSuperAdmin.email,
        role: newSuperAdmin.role,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: null, // Super admin doesn't belong to organization
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Email sending temporarily disabled
    // try {
    //   await sendSystemEmail(
    //     email,
    //     'Welcome to MBZ Technology Platform - Super Admin Account Created',
    //     `
    //       <h2>Welcome to MBZ Technology Platform!</h2>
    //       <p>Hello ${fullName},</p>
    //       <p>Your Super Admin account has been successfully created.</p>
    //       <p><strong>Username:</strong> ${username}</p>
    //       <p><strong>Email:</strong> ${email}</p>
    //       <p>You now have full access to manage the platform and all organizations.</p>
    //       <p>Best regards,<br>MBZ Technology Team</p>
    //     `
    //   );
    // } catch (emailError) {
    //   console.error('Failed to send welcome email:', emailError);
    //   // Don't fail registration if email fails
    // }
    

    res.status(201).json({ 
      success: true, 
      message: 'Super Admin registered successfully',
      userId: newSuperAdmin._id,
      username: newSuperAdmin.username,
      email: newSuperAdmin.email,
      role: newSuperAdmin.role
    });
  } catch (error) {
    console.error('Super Admin registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @swagger
 * /api/auth/super-admin/login:
 *   post:
 *     summary: Login as Super Admin
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Super admin username
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 description: Super admin password
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
 *                   example: "Super Admin login successful"
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 userId:
 *                   type: string
 *                   format: ObjectId
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 userRole:
 *                   type: string
 *                   example: "super-admin"
 *                 profilePicture:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: "active"
 *       400:
 *         description: Invalid credentials or user not found
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
 *                   example: "Invalid credentials"
 *       500:
 *         description: Server error
 */
// Login Super Admin
exports.loginSuperAdmin = async (req, res) => {
  const { username, password } = req.body;
  console.log('Super Admin Login:', req.body);

  try {
    const user = await User.findOne({ 
      username, 
      role: 'super-admin' 
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not found or unauthorized' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // ✅ AUDIT LOG: Failed Login Attempt
      await logSecurityEvent(
        'Failed Login Attempt',
        null,
        {
          attemptedUsername: username,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          reason: 'Invalid credentials'
        },
        null,
        'warning'
      );
      
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // ✅ AUDIT LOG: Successful Login
    await logSecurityEvent(
      'User Login',
      user._id,
      {
        username: user.username,
        role: user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        loginMethod: 'username'
      },
      null,
      'info'
    );

    res.status(200).json({
      success: true,
      message: 'Super Admin login successful',
      token,
      userId: user._id,
      username: user.username,
      email: user.email,
      userRole: user.role,
      profilePicture: user.profilePicture,
      status: user.status
    });
  } catch (error) {
    console.error('Super Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================================
// ORGANIZATION USER REGISTRATION & LOGIN
// ========================================

// Register an Organization User (Business Owner/Manager)
exports.registerOrganizationUser = async (req, res) => {
  const { fullName, businessName, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Check if organization already exists
    const existingOrganization = await Organization.findOne({ name: businessName });
    if (existingOrganization) {
      return res.status(400).json({ 
        success: false, 
        message: 'Organization with this name already exists' 
      });
    }

    // Create a new organization with a unique organization code
    const organizationCode = `${businessName.toLowerCase().replace(/\s+/g, '')}${Math.floor(1000000 + Math.random() * 9000000)}`;
    
    const newOrganization = new Organization({
      name: businessName,
      organizationCode,
      status: 'active'
    });

    // Save the organization
    await newOrganization.save();

    // ✅ PHASE 1: Create default admin role for the organization
    const Role = require('../models/role');
    
    // Check if admin role already exists for this organization (handle duplicate key gracefully)
    let defaultAdminRole = await Role.findOne({ 
      name: 'admin', 
      organization: newOrganization._id 
    });
    
    if (!defaultAdminRole) {
      defaultAdminRole = new Role({
        name: 'admin',
        description: 'Organization Administrator with full privileges',
        permissions: {
          user_management: true,
          organization_settings: true,
          data_access: true,
          system_configuration: true
        },
        organization: newOrganization._id,
        userId: null // Will be set after user creation
      });

      try {
        await defaultAdminRole.save();
      } catch (roleError) {
        // If duplicate key error occurs, try to find existing role
        if (roleError.code === 11000) {
          console.log('⚠️ Admin role already exists, fetching existing role...');
          defaultAdminRole = await Role.findOne({ 
            name: 'admin', 
            organization: newOrganization._id 
          });
          
          if (!defaultAdminRole) {
            // If still not found, there's a global index issue - use fallback
            console.error('❌ Role index issue detected. Creating role with unique name.');
            defaultAdminRole = new Role({
              name: `admin-${Date.now()}`,
              description: 'Organization Administrator with full privileges',
              permissions: {
                user_management: true,
                organization_settings: true,
                data_access: true,
                system_configuration: true
              },
              organization: newOrganization._id,
              userId: null
            });
            await defaultAdminRole.save();
          }
        } else {
          throw roleError;
        }
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user and link to organization
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role: 'admin', // Keep string role for backward compatibility
      roleId: defaultAdminRole._id, // Add new role ID field
      organization: newOrganization._id,
      organizationCode: newOrganization.organizationCode,
      status: 'active'
    });

    // Save the user
    await newUser.save();

    // ✅ Update the role with the user ID
    defaultAdminRole.userId = newUser._id;
    await defaultAdminRole.save();

    // ✅ AUDIT LOG: Organization User Created
    await createAuditLog({
      action: 'Organization User Created',
      user: newUser._id,
      resource: 'user',
      resourceId: newUser._id,
      details: {
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        roleId: newUser.roleId,
        organizationName: newOrganization.name,
        organizationCode: newOrganization.organizationCode,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: newOrganization._id,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Email sending temporarily disabled
    // try {
    //   await sendSystemEmail(
    //     email,
    //     'Welcome to MBZ Technology - Your Business Account is Ready!',
    //     `
    //       <h2>Welcome to MBZ Technology!</h2>
    //       <p>Hello ${fullName},</p>
    //       <p>Your business account has been successfully created.</p>
    //       <p><strong>Business Name:</strong> ${businessName}</p>
    //       <p><strong>Organization Code:</strong> ${organizationCode}</p>
    //       <p><strong>Email:</strong> ${email}</p>
    //       <p>You can now log in to your dashboard and start managing your business operations.</p>
    //       <p>Best regards,<br>MBZ Technology Team</p>
    //     `
    //   );
    // } catch (emailError) {
    //   console.error('Failed to send welcome email:', emailError);
    //   // Don't fail registration if email fails
    // }

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      success: true, 
      message: 'Organization user registered successfully',
      userId: newUser._id,
      username: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      roleId: newUser.roleId,
      token,
      organizationCode: newUser.organizationCode,
      organizationId: newOrganization._id,
      organization: newOrganization.name
    });
  } catch (error) {
    console.error('Organization user registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Login Organization User function (used internally by loginUser)
exports.loginOrganizationUser = async (req, res) => {
  const { email, password } = req.body;
  console.log('Organization User Login:', req.body);

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Check if user belongs to an organization (not super admin)
    if (!user.organization) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid user type" 
      });
    }

    // Find the organization
    const organization = await Organization.findOne({ 
      organizationCode: user.organizationCode 
    });
    if (!organization) {
      return res.status(400).json({ 
        success: false, 
        message: "Organization not found" 
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(400).json({ 
        success: false, 
        message: "Please verify your email address before logging in. Check your email for a verification code.",
        emailVerified: false,
        email: user.email
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // ✅ AUDIT LOG: Failed Login Attempt
      await logSecurityEvent(
        'Failed Login Attempt',
        null,
        {
          attemptedEmail: email,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          reason: 'Invalid credentials'
        },
        organization._id,
        'warning'
      );
      
      return res.status(400).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Check if user has OTP enabled
    if (user.otpEnabled) {
      // If OTP is enabled, don't generate token yet - send OTP code
      const OTPService = require('../services/otpService');
      
      // Generate and send OTP code
      const otpResult = await OTPService.generateLoginOTP(user._id, organization._id, req);
      
      if (!otpResult.success) {
        return res.status(400).json({
          success: false,
          message: otpResult.error
        });
      }

      // Return response indicating OTP is required
      return res.status(200).json({
        success: true,
        message: "Password verified. Please enter the OTP code sent to your email.",
        requiresOTP: true,
        userId: user._id,
        email: user.email,
        expiresAt: otpResult.data.expiresAt
      });
    }

    // If OTP is not enabled, proceed with normal login
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    // ✅ AUDIT LOG: Successful Login
    await createAuditLog({
      action: 'User Login',
      user: user._id,
      resource: 'user',
      resourceId: user._id,
      details: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        organizationName: organization.name,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        loginMethod: 'email'
      },
      organization: organization._id,
      severity: 'info'
    });

    // Check onboarding status
    const onboardingStatus = await checkOnboardingStatus(organization._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      userId: user._id.toString(), // ✅ Convert ObjectId to string
      username: user.fullName,
      email: user.email,
      role: user.role,
      organizationId: organization._id.toString(), // ✅ Convert ObjectId to string
      organization: organization.name,
      organizationCode: user.organizationCode,
      profilePicture: user.profilePicture,
      status: user.status,
      onboarding: {
        status: onboardingStatus.status,
        currentStep: onboardingStatus.currentStep,
        isComplete: onboardingStatus.isComplete,
        redirectTo: onboardingStatus.redirectTo
      }
    });
  } catch (error) {
    console.error('Organization user login error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========================================
// AFFILIATE REGISTRATION & LOGIN
// ========================================

/**
 * @swagger
 * /api/auth/affiliate/register:
 *   post:
 *     summary: Register a new Affiliate User
 *     tags: [Authentication]
 *     description: Creates a new affiliate account for the affiliate program. Affiliates can earn commissions by referring users.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Full name of the affiliate
 *                 example: "Jane Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Affiliate email address
 *                 example: "jane.smith@example.com"
 *               password:
 *                 type: string
 *                 description: Affiliate password (min 8 characters)
 *                 example: "AffiliatePassword123!"
 *               referralCode:
 *                 type: string
 *                 description: Optional referral code from another affiliate
 *                 example: "REF123456"
 *     responses:
 *       201:
 *         description: Affiliate registered successfully
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
 *                   example: "Affiliate registered successfully"
 *                 userId:
 *                   type: string
 *                   format: ObjectId
 *                   description: Unique affiliate user ID
 *                 username:
 *                   type: string
 *                   description: Affiliate full name
 *                   example: "Jane Smith"
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: "jane.smith@example.com"
 *                 role:
 *                   type: string
 *                   description: User role
 *                   example: "affiliate"
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       400:
 *         description: User already exists or validation error
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
 *                   example: "User with this email already exists"
 *       500:
 *         description: Server error
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
 *                   example: "Server error"
 */
// Register an Affiliate User
exports.registerAffiliate = async (req, res) => {
  const { fullName, email, password, referralCode } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new affiliate user
    const newAffiliate = new User({
      fullName,
      email,
      password: hashedPassword,
      role: 'affiliate', // Affiliate role
      status: 'active',
      // Add affiliate-specific fields if needed
      affiliateData: {
        referralCode: referralCode || null,
        joinDate: new Date(),
        status: 'pending' // pending, active, suspended
      }
    });

    // Save the user
    await newAffiliate.save();

    // ✅ AUDIT LOG: Affiliate User Created
    await createAuditLog({
      action: 'Affiliate User Created',
      user: newAffiliate._id,
      resource: 'user',
      resourceId: newAffiliate._id,
      details: {
        fullName: newAffiliate.fullName,
        email: newAffiliate.email,
        role: newAffiliate.role,
        referralCode: newAffiliate.affiliateData?.referralCode,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: null, // Affiliates don't belong to specific organization
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Email sending temporarily disabled
    // try {
    //   await sendSystemEmail(
    //     email,
    //     'Welcome to MBZ Technology - Affiliate Account Created',
    //     `
    //       <h2>Welcome to MBZ Technology Affiliate Program!</h2>
    //       <p>Hello ${fullName},</p>
    //       <p>Your affiliate account has been successfully created.</p>
    //       <p><strong>Email:</strong> ${email}</p>
    //       <p>Your account is currently pending approval. You will receive notification once approved.</p>
    //       <p>Best regards,<br>MBZ Technology Team</p>
    //     `
    //   );
    // } catch (emailError) {
    //   console.error('Failed to send welcome email:', emailError);
    //   // Don't fail registration if email fails
    // }

    const token = jwt.sign(
      { userId: newAffiliate._id, role: newAffiliate.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      success: true, 
      message: 'Affiliate registered successfully',
      userId: newAffiliate._id,
      username: newAffiliate.fullName,
      email: newAffiliate.email,
      role: newAffiliate.role,
      token
    });
  } catch (error) {
    console.error('Affiliate registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @swagger
 * /api/auth/affiliate/login:
 *   post:
 *     summary: Login as an Affiliate User
 *     tags: [Authentication]
 *     description: Authenticates an affiliate user and returns a JWT token. Affiliates can access their dashboard and referral information.
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
 *                 description: Affiliate email address
 *                 example: "jane.smith@example.com"
 *               password:
 *                 type: string
 *                 description: Affiliate password
 *                 example: "AffiliatePassword123!"
 *     responses:
 *       200:
 *         description: Affiliate login successful
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
 *                   example: "Affiliate login successful"
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 userId:
 *                   type: string
 *                   format: ObjectId
 *                   description: Unique affiliate user ID
 *                 username:
 *                   type: string
 *                   description: Affiliate full name
 *                   example: "Jane Smith"
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: "jane.smith@example.com"
 *                 role:
 *                   type: string
 *                   description: User role
 *                   example: "affiliate"
 *                 profilePicture:
 *                   type: string
 *                   description: URL to affiliate's profile picture
 *                   nullable: true
 *                 status:
 *                   type: string
 *                   description: Account status
 *                   example: "active"
 *       400:
 *         description: Invalid credentials or user not found
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
 *                   example: "User not found or not an affiliate"
 *       500:
 *         description: Server error
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
 *                   example: "Server error"
 */
// Login Affiliate User
exports.loginAffiliate = async (req, res) => {
  const { email, password } = req.body;
  console.log('Affiliate Login:', req.body);

  try {
    // Find the user by email
    const user = await User.findOne({ email, role: 'affiliate' });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "User not found or not an affiliate" 
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Affiliate login successful",
      token,
      userId: user._id.toString(), // ✅ Convert ObjectId to string
      username: user.fullName,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      status: user.status
    });
  } catch (error) {
    console.error('Affiliate login error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========================================
// PASSWORD CHANGE FUNCTIONS
// ========================================

// Change password for organization user
exports.changePassword = async (req, res) => {
  const { userId, organizationId, currentPassword, newPassword } = req.body;
  console.log('Change Password Request:', req.body);

  try {
    // Find the organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }

    // Find the user who belongs to this organization
    const user = await User.findOne({ 
      _id: userId, 
      organizationCode: organization.organizationCode 
    });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in this organization' 
      });
    }

    // Compare the current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Incorrect current password' 
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Change password for super admin
exports.changePasswordSuperAdmin = async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  const loggedInUserId = req.userId;

  try {
    // Check if the logged-in user is a super admin
    const loggedInUser = await User.findById(loggedInUserId);
    if (loggedInUser.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
    }

    // Find the user whose password is to be changed
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // If changing own password
    if (loggedInUserId === userId) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ 
          success: false, 
          message: 'Incorrect current password' 
        });
      }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Super Admin password updated successfully' 
    });
  } catch (error) {
    console.error('Super admin change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================================
// GENERAL USER AUTHENTICATION (for storehubomale)
// ========================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user and create organization
 *     tags: [Authentication]
 *     description: |
 *       Creates a new user account along with their organization. This is the main endpoint for storehubomale users.
 *       
 *       **After registration:** User receives 6-digit verification code via email
 *       **Next step:** Use /api/auth/verify-email to verify email with 6-digit code
 *       **User status:** Starts as "pending-verification", becomes "active" after verification
 *       
 *       **⚠️ Different from:** Password reset (use /api/auth/forgot-password for existing users)
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
 *               - companyName
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 description: User's password (min 8 characters)
 *                 example: "TestPassword123!"
 *               companyName:
 *                 type: string
 *                 description: Name of the organization/company
 *                 example: "Test Company"
 *               referralCode:
 *                 type: string
 *                 description: Optional referral code
 *                 example: "REF123"
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
 *                   example: "User registered successfully. Please check your email for verification code."
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 userId:
 *                   type: string
 *                   format: ObjectId
 *                   description: Unique user ID
 *                 username:
 *                   type: string
 *                   description: User's full name
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: "john.doe@example.com"
 *                 role:
 *                   type: string
 *                   description: User's role in the organization
 *                   example: "admin"
 *                 organization:
 *                   type: string
 *                   description: Organization name
 *                   example: "Test Company"
 *                 organizationId:
 *                   type: string
 *                   format: ObjectId
 *                   description: Unique organization ID
 *                 organizationCode:
 *                   type: string
 *                   description: Unique organization code for login
 *                   example: "testcompany1234567"
 *                 emailVerified:
 *                   type: boolean
 *                   description: Whether email is verified
 *                   example: false
 *                 status:
 *                   type: string
 *                   description: User account status
 *                   example: "pending-verification"
 *       400:
 *         description: Validation error or user/organization already exists
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
 *                   example: "User with this email already exists"
 *       500:
 *         description: Server error
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
 *                   example: "Server error: Database connection failed"
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login as an organization user
 *     tags: [Authentication]
 *     description: |
 *       Authenticates a user and returns a JWT token. This is the main login endpoint for storehubomale users.
 *       
 *       **Requirements:** User must have verified their email (emailVerified: true)
 *       **If unverified:** Returns 400 error directing user to verify email first
 *       **Email verification:** Use /api/auth/verify-email with 6-digit code
 *       
 *       **OTP Support:** If user has OTP enabled, login will require two-step authentication:
 *       1. First, validate email/password (this endpoint)
 *       2. Then, validate OTP code sent to email using /api/auth/validate-otp
 *       
 *       **Response Types:**
 *       - **Normal Login:** Returns JWT token immediately (OTP disabled)
 *       - **OTP Required:** Returns `requiresOTP: true` with userId for OTP validation
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
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: "TestPassword123!"
 *     responses:
 *       200:
 *         description: Login successful (normal login) or OTP required
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Normal login response (when OTP is disabled)
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Login successful"
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *                     userId:
 *                       type: string
 *                       format: ObjectId
 *                       description: Unique user ID
 *                     username:
 *                       type: string
 *                       description: User's full name
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "john.doe@example.com"
 *                     role:
 *                       type: string
 *                       description: User's role in the organization
 *                       example: "admin"
 *                     organizationId:
 *                       type: string
 *                       format: ObjectId
 *                       description: Unique organization ID
 *                     organization:
 *                       type: string
 *                       description: Organization name
 *                       example: "Test Company"
 *                     organizationCode:
 *                       type: string
 *                       description: Organization code
 *                       example: "testcompany1234567"
 *                     profilePicture:
 *                       type: string
 *                       description: URL to user's profile picture
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       description: User account status
 *                       example: "active"
 *                     emailVerified:
 *                       type: boolean
 *                       description: Whether email is verified
 *                       example: true
 *                     onboarding:
 *                       type: object
 *                       description: Onboarding status information
 *                       properties:
 *                         status:
 *                           type: string
 *                           description: Onboarding status
 *                           example: "in_progress"
 *                         currentStep:
 *                           type: number
 *                           description: Current onboarding step (1-4)
 *                           example: 2
 *                         isComplete:
 *                           type: boolean
 *                           description: Whether onboarding is complete
 *                           example: false
 *                         redirectTo:
 *                           type: string
 *                           description: URL to redirect user to
 *                           example: "/onboarding?step=2"
 *                 - type: object
 *                   description: OTP required response (when user has OTP enabled)
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Password verified. Please enter the OTP code sent to your email."
 *                     requiresOTP:
 *                       type: boolean
 *                       example: true
 *                     userId:
 *                       type: string
 *                       format: ObjectId
 *                       description: User ID for OTP validation
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: User's email address
 *                       example: "john.doe@example.com"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: OTP code expiration time
 *                       example: "2024-01-15T10:35:00.000Z"
 *       400:
 *         description: Invalid credentials, user not found, or email not verified
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     message:
 *                       type: string
 *                       example: "User not found"
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     message:
 *                       type: string
 *                       example: "Please verify your email address before logging in. Check your email for a verification code."
 *                     emailVerified:
 *                       type: boolean
 *                       example: false
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "user@example.com"
 *       500:
 *         description: Server error
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
 *                   example: "Server error"
 */

/**
 * @swagger
 * /api/auth/change/password:
 *   post:
 *     summary: Change password for organization user
 *     tags: [Authentication]
 *     description: Allows an organization user to change their password. Requires authentication and organization membership.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - organizationId
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: ID of the user changing password
 *                 example: "64f1a2b3c4d5e6f7g8h9i0j3"
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: ID of the user's organization
 *                 example: "64f1a2b3c4d5e6f7g8h9i0j2"
 *               currentPassword:
 *                 type: string
 *                 description: User's current password
 *                 example: "OldPassword123!"
 *               newPassword:
 *                 type: string
 *                 description: New password (min 8 characters)
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: "Password updated successfully"
 *       400:
 *         description: Incorrect current password
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
 *                   example: "Incorrect current password"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User or organization not found
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
 *                   example: "User not found in this organization"
 *       500:
 *         description: Server error
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
 *                   example: "Server error"
 */

/**
 * @swagger
 * /api/auth/super-admin/change/password:
 *   post:
 *     summary: Change password for super admin
 *     tags: [Authentication]
 *     description: Allows a super admin to change their own password or another super admin's password. Requires super admin authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: ID of the super admin user changing password
 *                 example: "64f1a2b3c4d5e6f7g8h9i0j3"
 *               currentPassword:
 *                 type: string
 *                 description: User's current password (required if changing own password)
 *                 example: "OldPassword123!"
 *               newPassword:
 *                 type: string
 *                 description: New password (min 8 characters)
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: "Super Admin password updated successfully"
 *       400:
 *         description: Incorrect current password
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
 *                   example: "Incorrect current password"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a super admin
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
 *                   example: "Unauthorized access"
 *       404:
 *         description: User not found
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
 *                   example: "User not found"
 *       500:
 *         description: Server error
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
 *                   example: "Server error"
 */

// Simple register user function for testing
exports.registerUser = async (req, res) => {
  
  try {
    const { firstName, lastName, email, password, companyName, referralCode } = req.body;
    
    // Basic validation
    if (!firstName || !lastName || !email || !password || !companyName) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be provided' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Check if organization already exists
    const existingOrganization = await Organization.findOne({ name: companyName });
    if (existingOrganization) {
      return res.status(400).json({ 
        success: false, 
        message: 'Organization with this name already exists' 
      });
    }

    // Create a new organization with a unique organization code
    const organizationCode = `${companyName.toLowerCase().replace(/\s+/g, '')}${Math.floor(1000000 + Math.random() * 9000000)}`;
    
    const newOrganization = new Organization({
      name: companyName,
      organizationCode,
      businessType: 'Other' // Default business type
    });

    // Save the organization
    await newOrganization.save();

    // Create the admin role for this organization
    // Check if admin role already exists for this organization (handle duplicate key gracefully)
    let adminRole = await Role.findOne({ 
      name: 'admin', 
      organization: newOrganization._id 
    });
    
    if (!adminRole) {
      adminRole = new Role({
        name: 'admin',
        description: 'Organization administrator',
        permissions: {
          user_management: true,
          organization_settings: true,
          data_access: true,
          system_configuration: true
        },
        organization: newOrganization._id,
        userId: null // Will be set after user creation
      });
      
      try {
        await adminRole.save();
      } catch (roleError) {
        // If duplicate key error occurs, try to find existing role
        if (roleError.code === 11000) {
          console.log('⚠️ Admin role already exists, fetching existing role...');
          adminRole = await Role.findOne({ 
            name: 'admin', 
            organization: newOrganization._id 
          });
          
          if (!adminRole) {
            // If still not found, there's a global index issue - use fallback
            console.error('❌ Role index issue detected. Creating role with unique name.');
            adminRole = new Role({
              name: `admin-${Date.now()}`,
              description: 'Organization administrator',
              permissions: {
                user_management: true,
                organization_settings: true,
                data_access: true,
                system_configuration: true
              },
              organization: newOrganization._id,
              userId: null
            });
            await adminRole.save();
          }
        } else {
          throw roleError;
        }
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with proper role and organization references
    const newUser = new User({
      fullName: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      role: adminRole._id, // Use the ObjectId of the role
      organization: newOrganization._id, // Use the ObjectId of the organization
      organizationCode: newOrganization.organizationCode,
      status: 'pending-verification', // User needs to verify email first
      emailVerified: false
    });

    // Save the user
    await newUser.save();

    // Update the admin role with the user ID
    adminRole.userId = newUser._id;
    await adminRole.save();

    // Send email verification code
    console.log(`📧 [REGISTRATION] Attempting to send verification email to: ${newUser.email}`);
    try {
      const verificationResult = await EmailVerificationService.sendVerificationCode(newUser, req);
      
      if (!verificationResult.success) {
        console.error('❌ [AUTH CONTROLLER] Failed to send verification email:', verificationResult.error);
        console.error('❌ [AUTH CONTROLLER] Email verification details:', verificationResult);
        // Don't fail registration if email fails, but log the issue
      } else {
        console.log('✅ [AUTH CONTROLLER] Email verification process initiated successfully');
      }
    } catch (emailError) {
      console.error('❌ [AUTH CONTROLLER] Email verification error:', emailError);
      console.error('❌ [AUTH CONTROLLER] Email error stack:', emailError.stack);
      // Don't fail registration if email fails
    }

    const token = jwt.sign(
      { userId: newUser._id, role: adminRole.name }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );


    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully. Please check your email for verification code.',
      userId: newUser._id,
      username: newUser.fullName,
      email: newUser.email,
      role: adminRole.name,
      organization: newOrganization.name,
      organizationId: newOrganization._id,
      organizationCode: newOrganization.organizationCode,
      emailVerified: newUser.emailVerified,
      status: newUser.status,
      token
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// Legacy login user function (redirects to organization user login)
exports.loginUser = async (req, res) => {
  console.log('Legacy loginUser called, redirecting to organization login');
  return exports.loginOrganizationUser(req, res);
};

// ========================================
// OTP VALIDATION FUNCTIONS
// ========================================

/**
 * @swagger
 * /api/auth/validate-otp:
 *   post:
 *     summary: Validate OTP code for login
 *     description: Validate the 6-digit OTP code sent to user's email during login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, code]
 *             properties:
 *               userId: { type: string, description: "User ID from login response" }
 *               code: { type: string, description: "6-digit OTP code" }
 *     responses:
 *       200: { description: OTP validated successfully, returns JWT token }
 *       400: { description: Invalid or expired OTP code }
 *       500: { description: Server error }
 */
exports.validateOTP = async (req, res) => {
  const { userId, code } = req.body;

  try {
    // Validate required fields
    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP code are required'
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has OTP enabled
    if (!user.otpEnabled) {
      return res.status(400).json({
        success: false,
        message: 'OTP is not enabled for this user'
      });
    }

    // Find the organization
    const organization = await Organization.findOne({ 
      organizationCode: user.organizationCode 
    });
    if (!organization) {
      return res.status(400).json({ 
        success: false, 
        message: "Organization not found" 
      });
    }

    // Validate OTP code
    const OTPService = require('../services/otpService');
    const otpResult = await OTPService.validateLoginOTP(userId, code, organization._id, req);

    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        message: otpResult.error
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // ✅ AUDIT LOG: Successful Login with OTP
    await createAuditLog({
      action: 'User Login with OTP',
      user: user._id,
      resource: 'user',
      resourceId: user._id,
      details: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        organizationName: organization.name,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        loginMethod: 'email_with_otp'
      },
      organization: organization._id,
      severity: 'info'
    });

    // Check onboarding status
    const onboardingStatus = await checkOnboardingStatus(organization._id);

    res.status(200).json({
      success: true,
      message: "OTP validated successfully. Login completed.",
      token,
      userId: user._id,
      username: user.fullName,
      email: user.email,
      role: user.role,
      organizationId: organization._id,
      organization: organization.name,
      organizationCode: user.organizationCode,
      profilePicture: user.profilePicture,
      status: user.status,
      onboarding: {
        status: onboardingStatus.status,
        currentStep: onboardingStatus.currentStep,
        isComplete: onboardingStatus.isComplete,
        redirectTo: onboardingStatus.redirectTo
      }
    });

  } catch (error) {
    console.error('OTP validation error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ========================================
// OTP MANAGEMENT FUNCTIONS
// ========================================

/**
 * @swagger
 * /api/auth/enable-otp:
 *   post:
 *     summary: Enable OTP for user account
 *     description: Enable OTP (One-Time Password) security feature for user login
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OTP enabled successfully }
 *       400: { description: OTP already enabled or error }
 *       401: { description: Unauthorized }
 *       500: { description: Server error }
 */
exports.enableOTP = async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;

    const OTPService = require('../services/otpService');
    const result = await OTPService.enableOTP(userId, organizationId, req);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Enable OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @swagger
 * /api/auth/disable-otp:
 *   post:
 *     summary: Disable OTP for user account
 *     description: Disable OTP (One-Time Password) security feature for user login
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OTP disabled successfully }
 *       400: { description: OTP not enabled or error }
 *       401: { description: Unauthorized }
 *       500: { description: Server error }
 */
exports.disableOTP = async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;

    const OTPService = require('../services/otpService');
    const result = await OTPService.disableOTP(userId, organizationId, req);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Disable OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @swagger
 * /api/auth/otp-settings:
 *   get:
 *     summary: Get user OTP settings
 *     description: Get current OTP settings and status for the authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OTP settings retrieved successfully }
 *       401: { description: Unauthorized }
 *       500: { description: Server error }
 */
exports.getOTPSettings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const OTPService = require('../services/otpService');
    const result = await OTPService.getUserOTPSettings(userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Get OTP settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ========================================
// PASSWORD RESET FUNCTIONS
// ========================================

const crypto = require('crypto');
const PasswordResetToken = require('../models/PasswordResetToken');
const PasswordResetCode = require('../models/passwordResetCode');
// Using SendGrid instead of SMTP (most hosting providers block SMTP ports)
const SendGridService = require('../services/sendGridService');
// const { sendPasswordResetEmail, sendPasswordResetSuccessEmail, sendPasswordResetCodeEmail } = require('../services/emailService');

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset (for existing users who forgot their password)
 *     description: |
 *       Send password reset email to user who forgot their password.
 *       This is different from email verification during registration.
 *       
 *       **Use this when:** User forgot their password and needs to reset it
 *       **Email contains:** 6-digit verification code (similar to registration)
 *       **Next step:** Use /api/auth/reset-password with email and code
 *       
 *       **⚠️ NOT for:** New user email verification (use /api/auth/verify-email instead)
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
 *         description: Password reset email sent successfully
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
 *                   example: "If an account with that email exists, a password reset email has been sent"
 *       400:
 *         description: Invalid request or email not provided
 *       500:
 *         description: Server error
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';

  // Set explicit CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');

  try {
    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email only (no organizationId required)
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      status: 'active'
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset code has been sent'
      });
    }

    // Check for existing valid codes and invalidate them
    await PasswordResetCode.updateMany(
      { 
        userId: user._id, 
        used: false,
        expiresAt: { $gt: new Date() }
      },
      { used: true, usedAt: new Date() }
    );

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set code expiration (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create password reset code
    const passwordResetCode = new PasswordResetCode({
      code,
      userId: user._id,
      organizationId: user.organization,
      email: user.email,
      expiresAt,
      ipAddress,
      userAgent
    });

    await passwordResetCode.save();

    // Get organization details
    const organization = await Organization.findById(user.organization);

    // Send password reset code email using SendGrid
    const emailResult = await SendGridService.sendPasswordResetCodeEmail(user, code, organization);

    if (!emailResult.success) {
      console.error('Failed to send password reset code email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset code email'
      });
    }

    // ✅ AUDIT LOG: Password Reset Request
    await createAuditLog({
      action: 'Password Reset Code Requested',
      user: user._id,
      resource: 'password_reset_code',
      resourceId: passwordResetCode._id,
      details: {
        email: user.email,
        organizationId: user.organization,
        codeId: passwordResetCode._id,
        ipAddress,
        userAgent
      },
      organization: user.organization,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: 'Password reset code sent successfully'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    
    // ✅ AUDIT LOG: Password Reset Error
    await createAuditLog({
      action: 'Password Reset Code Request Failed',
      user: null,
      resource: 'password_reset_code',
      resourceId: null,
      details: {
        email,
        error: error.message,
        ipAddress,
        userAgent
      },
      organization: null,
      severity: 'error'
    });

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with code (for forgot password)
 *     description: |
 *       Reset user password using valid 6-digit code from forgot password email.
 *       
 *       **Use this when:** User forgot their password and received 6-digit code via email
 *       **Code type:** 6-digit verification code (similar to registration)
 *       **Code source:** Received from /api/auth/forgot-password email
 *       **Expiration:** 15 minutes
 *       
 *       **⚠️ Different from:** Email verification (use /api/auth/verify-email for registration)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *               code:
 *                 type: string
 *                 description: 6-digit password reset code
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (min 8 characters)
 *                 example: "NewPassword123!"
 *               confirmPassword:
 *                 type: string
 *                 description: Confirm new password
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: "Password reset successfully"
 *       400:
 *         description: Invalid code, password mismatch, or missing required fields
 *       404:
 *         description: Code not found or expired
 *       500:
 *         description: Server error
 */
exports.resetPassword = async (req, res) => {
  const { email, code, newPassword, confirmPassword } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';

  try {
    // Validate required fields
    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, code, newPassword, and confirmPassword are required'
      });
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Find valid code
    const resetCode = await PasswordResetCode.findValidCode(code, email);
    
    if (!resetCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }

    // Get user from the resetCode (already populated)
    const user = resetCode.userId;
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    // Mark code as used
    await resetCode.markAsUsed();

    // Get organization details
    const organization = await Organization.findById(user.organization);

    // Send password reset success email using SendGrid
    await SendGridService.sendPasswordResetSuccessEmail(user, organization, req);

    // ✅ AUDIT LOG: Password Reset Success
    await createAuditLog({
      action: 'Password Reset Completed',
      user: user._id,
      resource: 'password_reset_code',
      resourceId: resetCode._id,
      details: {
        email: user.email,
        organizationId: user.organization,
        codeId: resetCode._id,
        ipAddress,
        userAgent,
        resetAt: new Date()
      },
      organization: user.organization,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    
    // ✅ AUDIT LOG: Password Reset Error
    await createAuditLog({
      action: 'Password Reset Failed',
      user: null,
      resource: 'password_reset',
      resourceId: null,
      details: {
        token: token ? 'provided' : 'missing',
        error: error.message,
        ipAddress,
        userAgent
      },
      organization: null,
      severity: 'error'
    });

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @swagger
 * /api/auth/verify-reset-token/{token}:
 *   get:
 *     summary: Verify reset token validity
 *     description: Check if a password reset token is valid and not expired
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     responses:
 *       200:
 *         description: Token verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token is valid"
 *       404:
 *         description: Token not found or expired
 *       500:
 *         description: Server error
 */
exports.verifyResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    if (!token) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Token is required'
      });
    }

    // Find valid token
    const resetToken = await PasswordResetToken.findValidToken(token);
    
    if (!resetToken) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      message: 'Token is valid',
      expiresAt: resetToken.expiresAt
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      valid: false,
      message: 'Server error'
    });
  }
};

/**
 * @swagger
 * /api/auth/verify-token:
 *   post:
 *     summary: Verify if JWT token is valid and not expired
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT token to verify
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 valid:
 *                   type: boolean
 *                   description: Whether the token is valid and not expired
 *                   example: true
 *                 expired:
 *                   type: boolean
 *                   description: Whether the token has expired
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token is valid"
 *                 user:
 *                   type: object
 *                   description: User information if token is valid
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     organizationId:
 *                       type: string
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *       400:
 *         description: Bad request - missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token is required"
 *       401:
 *         description: Unauthorized - invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 expired:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token has expired"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
/**
 * @swagger
 * /api/auth/verify-token:
 *   post:
 *     summary: Verify JWT token validity and expiration
 *     description: Check if a JWT token is valid, not expired, and belongs to an active user. Used by frontend to determine if user needs to login again.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT token to verify
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZjFhMmIzYzRkNWU2ZjdnOGg5aTBqMyIsImVtYWlsIjoidGVzdEB1c2VyLmNvbSIsImlhdCI6MTY5MzQ1NjAwMCwiZXhwIjoxNjk0MDYwODAwfQ.example_signature"
 *     responses:
 *       200:
 *         description: Token is valid and user is authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 expired:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token is valid"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: ObjectId
 *                       example: "64f1a2b3c4d5e6f7g8h9i0j3"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "test@user.com"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *                     organizationId:
 *                       type: string
 *                       format: ObjectId
 *                       example: "67f504af91eae487185de080"
 *                     fullName:
 *                       type: string
 *                       example: "John Doe"
 *                     username:
 *                       type: string
 *                       example: "johndoe"
 *       400:
 *         description: Token is missing from request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token is required"
 *       401:
 *         description: Token is invalid, expired, or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 expired:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token has expired"
 *       500:
 *         description: Server error during token verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error during token verification"
 */
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    // Check if token is provided
    if (!token) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Token is required'
      });
    }

    console.log('🔍 Token verification request received');
    console.log('🔍 Token length:', token.length);
    console.log('🔍 Token starts with:', token.substring(0, 20) + '...');

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token is valid');
    console.log('🔍 Decoded payload:', {
      id: decoded.id,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp
    });

    // Check if token is expired (additional check)
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp < currentTime;
    
    if (isExpired) {
      console.log('❌ Token has expired');
      return res.status(401).json({
        success: false,
        valid: false,
        expired: true,
        message: 'Token has expired'
      });
    }

    // Get user information
    const user = await User.findById(decoded.id).select('_id email role organizationId fullName username');
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'User not found'
      });
    }

    // Check if user changed password after token was issued
    if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
      console.log('❌ User changed password after token was issued');
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Token is no longer valid - password was changed'
      });
    }

    console.log('✅ Token verification successful');
    
    // Return success response with user info
    res.status(200).json({
      success: true,
      valid: true,
      expired: false,
      message: 'Token is valid',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        fullName: user.fullName,
        username: user.username
      }
    });

  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    
    // Handle different types of JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        valid: false,
        expired: true,
        message: 'Token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Token not active'
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      valid: false,
      message: 'Server error during token verification'
    });
  }
};

