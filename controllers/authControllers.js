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
  console.log('Organization User Registration:', req.body);

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
    const defaultAdminRole = new Role({
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

    await defaultAdminRole.save();
    console.log('✅ Default admin role created for organization:', defaultAdminRole._id);

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
  console.log('Affiliate Registration:', req.body);

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
      userId: user._id,
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
 *     description: Creates a new user account along with their organization. This is the main endpoint for storehubomale users.
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
 *                   example: "User registered successfully"
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
 *     description: Authenticates a user and returns a JWT token. This is the main login endpoint for storehubomale users.
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
 *                 organizationId:
 *                   type: string
 *                   format: ObjectId
 *                   description: Unique organization ID
 *                 organization:
 *                   type: string
 *                   description: Organization name
 *                   example: "Test Company"
 *                 organizationCode:
 *                   type: string
 *                   description: Organization code
 *                   example: "testcompany1234567"
 *                 profilePicture:
 *                   type: string
 *                   description: URL to user's profile picture
 *                   nullable: true
 *                 status:
 *                   type: string
 *                   description: User account status
 *                   example: "active"
 *                 onboarding:
 *                   type: object
 *                   description: Onboarding status information
 *                   properties:
 *                     status:
 *                       type: string
 *                       description: Onboarding status
 *                       example: "in_progress"
 *                     currentStep:
 *                       type: number
 *                       description: Current onboarding step (1-4)
 *                       example: 2
 *                     isComplete:
 *                       type: boolean
 *                       description: Whether onboarding is complete
 *                       example: false
 *                     redirectTo:
 *                       type: string
 *                       description: URL to redirect user to
 *                       example: "/onboarding?step=2"
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
  console.log('Register user called with data:', req.body);
  
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

    // Find or create the admin role
    let adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      adminRole = new Role({
        name: 'admin',
        description: 'Organization administrator',
        permissions: {}
      });
      await adminRole.save();
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
      status: 'active'
    });

    // Save the user
    await newUser.save();

    // Email sending temporarily disabled
    // try {
    //   await sendSystemEmail(
    //     email,
    //     'Welcome to MBZ Technology Platform - Account Created',
    //     `
    //       <h2>Welcome to MBZ Technology Platform!</h2>
    //       <p>Hello ${firstName} ${lastName},</p>
    //       <p>Your account has been successfully created for ${companyName}.</p>
    //       <p><strong>Email:</strong> ${email}</p>
    //       <p><strong>Organization Code:</strong> ${newOrganization.organizationCode}</p>
    //       <p>You can now log in to your dashboard and start managing your business.</p>
    //       <p>Best regards,<br>MBZ Technology Team</p>
    //     `
    //   );
    // } catch (emailError) {
    //   console.error('Failed to send welcome email:', emailError);
    //   // Don't fail registration if email fails
    // }

    const token = jwt.sign(
      { userId: newUser._id, role: adminRole.name }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    console.log('User registered successfully:', newUser._id);

    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
      userId: newUser._id,
      username: newUser.fullName,
      email: newUser.email,
      role: adminRole.name,
      organization: newOrganization.name,
      organizationId: newOrganization._id,
      organizationCode: newOrganization.organizationCode,
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
// PASSWORD RESET FUNCTIONS
// ========================================

const crypto = require('crypto');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendPasswordResetEmail, sendPasswordResetSuccessEmail } = require('../services/emailService');

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset email to user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - organizationId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "user@example.com"
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "60f7b3b3b3b3b3b3b3b3b3b3"
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
 *                   example: "Password reset email sent successfully"
 *       400:
 *         description: Invalid request or user not found
 *       500:
 *         description: Server error
 */
exports.forgotPassword = async (req, res) => {
  const { email, organizationId } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';

  try {
    // Validate required fields
    if (!email || !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Email and organizationId are required'
      });
    }

    // Find user by email and organizationId
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      organization: organizationId,
      status: 'active'
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset email has been sent'
      });
    }

    // Check for existing valid tokens and invalidate them
    await PasswordResetToken.updateMany(
      { 
        userId: user._id, 
        used: false,
        expiresAt: { $gt: new Date() }
      },
      { used: true, usedAt: new Date() }
    );

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set token expiration (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create password reset token
    const passwordResetToken = new PasswordResetToken({
      token,
      userId: user._id,
      organizationId: user.organization,
      email: user.email,
      expiresAt,
      ipAddress,
      userAgent
    });

    await passwordResetToken.save();

    // Get organization details
    const organization = await Organization.findById(user.organization);

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(user, passwordResetToken, organization);

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }

    // ✅ AUDIT LOG: Password Reset Request
    await createAuditLog({
      action: 'Password Reset Requested',
      user: user._id,
      resource: 'password_reset',
      resourceId: passwordResetToken._id,
      details: {
        email: user.email,
        organizationId: user.organization,
        tokenId: passwordResetToken._id,
        ipAddress,
        userAgent
      },
      organization: user.organization,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    
    // ✅ AUDIT LOG: Password Reset Error
    await createAuditLog({
      action: 'Password Reset Request Failed',
      user: null,
      resource: 'password_reset',
      resourceId: null,
      details: {
        email,
        organizationId,
        error: error.message,
        ipAddress,
        userAgent
      },
      organization: organizationId,
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
 *     summary: Reset password with token
 *     description: Reset user password using valid reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *                 example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
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
 *         description: Invalid token or password mismatch
 *       404:
 *         description: Token not found or expired
 *       500:
 *         description: Server error
 */
exports.resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';

  try {
    // Validate required fields
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, newPassword, and confirmPassword are required'
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

    // Find valid token
    const resetToken = await PasswordResetToken.findValidToken(token);
    
    if (!resetToken) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Find user
    const user = await User.findById(resetToken.userId);
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

    // Mark token as used
    await resetToken.markAsUsed();

    // Get organization details
    const organization = await Organization.findById(user.organization);

    // Send password reset success email
    await sendPasswordResetSuccessEmail(user, organization);

    // ✅ AUDIT LOG: Password Reset Success
    await createAuditLog({
      action: 'Password Reset Completed',
      user: user._id,
      resource: 'password_reset',
      resourceId: resetToken._id,
      details: {
        email: user.email,
        organizationId: user.organization,
        tokenId: resetToken._id,
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

