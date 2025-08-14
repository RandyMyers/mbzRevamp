const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/users");
const Organization = require("../models/organization");
const Role = require("../models/role");
const { createAuditLog, logSecurityEvent } = require("../helpers/auditLogHelper");

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
 * /api/auth/login/super-admin:
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

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user and link to organization
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role: 'admin', // Organization admin role
      organization: newOrganization._id,
      organizationCode: newOrganization.organizationCode,
      status: 'active'
    });

    // Save the user
    await newUser.save();

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

/**
 * @swagger
 * /api/auth/login/organization:
 *   post:
 *     summary: Login as Organization User
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
 *                 description: User's email address
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 description: User's password
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
 *                 role:
 *                   type: string
 *                   example: "admin"
 *                 organizationId:
 *                   type: string
 *                   format: ObjectId
 *                 organization:
 *                   type: string
 *                   example: "My Business"
 *                 organizationCode:
 *                   type: string
 *                   example: "MBZ001"
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
 *                   example: "User not found"
 *       500:
 *         description: Server error
 */
// Login Organization User
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
    await logSecurityEvent(
      'User Login',
      user._id,
      {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        organizationName: organization.name,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        loginMethod: 'email'
      },
      organization._id,
      'info'
    );

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
      status: user.status
    });
  } catch (error) {
    console.error('Organization user login error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========================================
// AFFILIATE REGISTRATION & LOGIN
// ========================================

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
// LEGACY SUPPORT (for backward compatibility)
// ========================================

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

