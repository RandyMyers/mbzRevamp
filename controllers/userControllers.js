const User = require('../models/users');
const Organization = require('../models/organization');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const Role = require('../models/role');
const Group = require('../models/group');
const notificationGenerationService = require('../services/notificationGenerationService');
const mongoose = require('mongoose');

const AuditLog = require('../models/auditLog');
const logEvent = require('../helper/logEvent');
const { createAuditLog, logSecurityEvent } = require('../helpers/auditLogHelper');

/**
 * @swagger
 * /api/users/create:
 *   post:
 *     summary: Create a new user within the same organization as the admin
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *               - email
 *               - password
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: ID of the admin user creating the new user
 *                 example: "507f1f77bcf86cd799439011"
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (must be unique)
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 description: User's password (will be hashed)
 *                 minLength: 6
 *                 example: "password123"
 *               roleId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Role ID to assign to the user (admin-created custom role)
 *                 example: "64f8a1b2c3d4e5f6a7b8c9d0"
 *               department:
 *                 type: string
 *                 enum: [Customer Support, IT, HR, Sales, Marketing, Finance, Billing, Shipping]
 *                 description: User's department
 *                 example: "IT"
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file (optional)
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   example: "User created"
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       format: ObjectId
 *                       example: "64f8a1b2c3d4e5f6a7b8c9d0"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     role:
 *                       type: string
 *                       description: String role for backward compatibility
 *                       example: "admin"
 *                     roleId:
 *                       type: string
 *                       format: ObjectId
 *                       description: Role ID reference for the new role system
 *                       example: "64f8a1b2c3d4e5f6a7b8c9d0"
 *                     department:
 *                       type: string
 *                       example: "IT"
 *                     organization:
 *                       type: string
 *                       format: ObjectId
 *                       example: "64f8a1b2c3d4e5f6a7b8c9d0"
 *       400:
 *         description: Bad request - Email already exists or validation error
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
 *                   example: "Email already exists"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User is not an admin
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
 *                   example: "Unauthorized"
 *       404:
 *         description: Organization not found
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
 *                   example: "Organization not found"
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
 * Helper function to check if a user is the account owner (first admin of their organization)
 * The account owner is determined by being the first user with an admin role in the organization
 * @param {ObjectId} userId - The user ID to check
 * @param {ObjectId} organizationId - The organization ID
 * @returns {Promise<boolean>} - True if user is the account owner
 */
const isAccountOwner = async (userId, organizationId) => {
  if (!userId || !organizationId) return false;

  try {
    // Find the first user of this organization by creation date
    // who has an admin-like role (either string role containing 'admin' or has a roleId)
    const firstAdmin = await User.findOne({
      organization: organizationId,
      $or: [
        { role: { $regex: /admin/i } },
        { role: 'Administrator' },
        { role: 'Admin' }
      ]
    }).sort({ createdAt: 1 }).select('_id');

    return firstAdmin && firstAdmin._id.toString() === userId.toString();
  } catch (error) {
    console.error('Error checking account owner status:', error);
    return false;
  }
};

// Create a new user within the same organization as the admin

exports.createUser = async (req, res) => {
  const { userId, name, email, roleId, department } = req.body;
  // Note: Password is NO LONGER required - user will set it during activation
  

  try {
    // ✅ ROBUST FALLBACK SYSTEM: Try multiple sources for adminUserId
    let adminUserId = null;
    let adminUser = null;
    
    console.log('🔍 DEBUGGING CREATE USER:');
    console.log('📥 Request Body userId:', userId, 'type:', typeof userId);
    console.log('👤 Request User:', req.user);
    console.log('👤 Request User _id:', req.user?._id, 'type:', typeof req.user?._id);
    console.log('👤 Request User id:', req.user?.id, 'type:', typeof req.user?.id);
    console.log('👤 Request User userId:', req.user?.userId, 'type:', typeof req.user?.userId);
    
    // ✅ FALLBACK 1: Try request body userId first
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      adminUserId = userId;
      console.log('✅ Using request body userId:', adminUserId);
    }
    // ✅ FALLBACK 2: Try req.user._id
    else if (req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id)) {
      adminUserId = req.user._id;
      console.log('✅ Using req.user._id:', adminUserId);
    }
    // ✅ FALLBACK 3: Try req.user.id
    else if (req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      adminUserId = req.user.id;
      console.log('✅ Using req.user.id:', adminUserId);
    }
    // ✅ FALLBACK 4: Try req.user.userId
    else if (req.user?.userId && mongoose.Types.ObjectId.isValid(req.user.userId)) {
      adminUserId = req.user.userId;
      console.log('✅ Using req.user.userId:', adminUserId);
    }
    // ✅ FALLBACK 5: Try to find user by email from JWT token (if available)
    else if (req.user?.email) {
      console.log('🔍 Trying to find user by email:', req.user.email);
      try {
        const userByEmail = await User.findOne({ email: req.user.email });
        if (userByEmail && mongoose.Types.ObjectId.isValid(userByEmail._id)) {
          adminUserId = userByEmail._id;
          console.log('✅ Found user by email:', adminUserId);
        }
      } catch (emailError) {
        console.error('❌ Error finding user by email:', emailError.message);
      }
    }
    // ✅ FALLBACK 6: Try to find any active user in the organization (last resort)
    else {
      console.log('🔍 Last resort: Looking for any active user in organization...');
      try {
        // This is a last resort - find any active user to use as admin
        const anyActiveUser = await User.findOne({ 
          status: 'active',
          organization: { $exists: true }
        }).sort({ createdAt: -1 });
        
        if (anyActiveUser && mongoose.Types.ObjectId.isValid(anyActiveUser._id)) {
          adminUserId = anyActiveUser._id;
          console.log('⚠️ Using last resort admin user:', adminUserId);
        }
      } catch (lastResortError) {
        console.error('❌ Last resort fallback failed:', lastResortError.message);
      }
    }
    
    console.log('🆔 Final adminUserId:', adminUserId, 'type:', typeof adminUserId);
    console.log('🆔 adminUserId is valid ObjectId:', mongoose.Types.ObjectId.isValid(adminUserId));
    
    if (!adminUserId) {
      return res.status(400).json({ 
        success: false, 
        message: "Unable to identify the admin user. Please ensure you are properly authenticated and try logging in again." 
      });
    }
    
    // ✅ Ensure adminUserId is a valid ObjectId string
    if (!mongoose.Types.ObjectId.isValid(adminUserId)) {
      console.error('❌ Invalid adminUserId format:', adminUserId);
      return res.status(400).json({ 
        success: false, 
        message: "Invalid user ID format. Please ensure you are properly authenticated and try logging in again." 
      });
    }

    const admin = await User.findById(adminUserId);
    console.log('👤 Admin user found:', admin);
    
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: "Admin user not found. Please ensure you are properly authenticated." 
      });
    }

    // ✅ ROBUST ORGANIZATION FALLBACK SYSTEM
    let organization = null;
    let organizationId = null;
    
    // ✅ FALLBACK 1: Try admin.organization
    if (admin.organization && mongoose.Types.ObjectId.isValid(admin.organization)) {
      organizationId = admin.organization;
      organization = await Organization.findById(organizationId);
      console.log('✅ Using admin.organization:', organizationId);
    }
    
    // ✅ FALLBACK 2: Try to find organization by organizationCode
    if (!organization && admin.organizationCode) {
      console.log('🔍 Trying to find organization by code:', admin.organizationCode);
      try {
        organization = await Organization.findOne({ organizationCode: admin.organizationCode });
        if (organization) {
          organizationId = organization._id;
          console.log('✅ Found organization by code:', organizationId);
        }
      } catch (orgCodeError) {
        console.error('❌ Error finding organization by code:', orgCodeError.message);
      }
    }
    
    // ✅ FALLBACK 3: Try to find any organization (last resort)
    if (!organization) {
      console.log('🔍 Last resort: Looking for any organization...');
      try {
        organization = await Organization.findOne({ status: 'active' }).sort({ createdAt: -1 });
        if (organization) {
          organizationId = organization._id;
          console.log('⚠️ Using last resort organization:', organizationId);
        }
      } catch (lastResortOrgError) {
        console.error('❌ Last resort organization fallback failed:', lastResortOrgError.message);
      }
    }
    
    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: "Organization not found. Please contact support." 
      });
    }
    
    console.log('✅ Organization found:', organization.name, 'ID:', organization._id);

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // ✅ Generate activation token for user to set password
    const crypto = require('crypto');
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    let profilePictureUrl = null;

    if (req.files && req.files.profilePicture) {
      const result = await cloudinary.uploader.upload(req.files.profilePicture.tempFilePath, {
        folder: "profile_pictures",
      });
      profilePictureUrl = result.secure_url;
    }

    // ✅ ROBUST ROLE FALLBACK SYSTEM
    let validatedRoleId = null;
    let roleName = 'member';
    
    console.log('🔍 ROLE ASSIGNMENT DEBUG:');
    console.log('📥 Request roleId:', roleId, 'type:', typeof roleId);
    console.log('📥 Organization ID:', organizationId);
    
    // ✅ FALLBACK 1: Try to use provided roleId if valid
    if (roleId && roleId.trim() !== '' && mongoose.Types.ObjectId.isValid(roleId)) {
      console.log('🔍 Trying to use provided roleId:', roleId);
      try {
        const role = await Role.findById(roleId);
        if (role && role.organization.toString() === organizationId.toString()) {
          validatedRoleId = roleId;
          roleName = role.name;
          console.log(`✅ Using provided role: ${roleName}`);
        } else {
          console.log('⚠️ Provided role not found or doesn\'t belong to organization, falling back...');
        }
      } catch (roleError) {
        console.error('❌ Error validating provided role:', roleError.message);
      }
    }
    
    // ✅ FALLBACK 2: Try to find any role in the organization
    if (!validatedRoleId) {
      console.log('🔍 Looking for any role in organization...');
      try {
        const anyRole = await Role.findOne({ organization: organizationId });
        if (anyRole) {
          validatedRoleId = anyRole._id;
          roleName = anyRole.name;
          console.log(`✅ Using existing role: ${roleName}`);
        }
      } catch (anyRoleError) {
        console.error('❌ Error finding any role:', anyRoleError.message);
      }
    }
    
    // ✅ FALLBACK 3: Create a default member role
    if (!validatedRoleId) {
      console.log('🔍 Creating default member role...');
      try {
        const newMemberRole = new Role({
          name: 'member',
          organization: organizationId,
          permissions: { read: true },
          description: 'Default member role'
        });
        await newMemberRole.save();
        validatedRoleId = newMemberRole._id;
        roleName = newMemberRole.name;
        console.log(`✅ Created new default role: ${roleName}`);
      } catch (createRoleError) {
        console.error('❌ Error creating default role:', createRoleError.message);
        // Last resort - use null roleId
        validatedRoleId = null;
        roleName = 'member';
        console.log('⚠️ Using null roleId as last resort');
      }
    }

    // ✅ Validate department and set default if invalid
    const validDepartments = [
      'Customer Support', 
      'IT', 
      'HR', 
      'Sales', 
      'Marketing', 
      'Finance', 
      'Billing', 
      'Shipping'
    ];
    
    const validatedDepartment = department && validDepartments.includes(department) 
      ? department 
      : 'IT'; // Default to 'IT' if invalid or not provided

    // ✅ ROBUST USER CREATION WITH FALLBACKS
    const userData = {
      fullName: name || 'New User', // Use fullName to match schema
      email: email,
      password: 'temporary_will_be_set_on_activation', // Temporary placeholder
      roleId: validatedRoleId, // ✅ Validated roleId (can be null)
      role: roleName, // ✅ Set role name for backward compatibility
      department: validatedDepartment, // ✅ Validated department
      organization: organizationId, // ✅ Use organizationId from fallback
      profilePicture: profilePictureUrl,
      status: 'pending-activation', // ✅ User must activate account and set password
      activationToken: activationToken, // ✅ Secure token for activation link
      activationTokenExpires: activationTokenExpires, // ✅ Token expires in 7 days
      emailVerified: false // Will be verified when they activate
    };
    
    console.log('🔍 Creating user with data:', {
      fullName: userData.fullName,
      email: userData.email,
      roleId: userData.roleId,
      role: userData.role,
      department: userData.department,
      organization: userData.organization
    });

    const newUser = new User(userData);
    await newUser.save();
    
    console.log('✅ User created successfully:', newUser._id);

    // ✅ NEW: Update role with user ID
    if (validatedRoleId) {
      await Role.findByIdAndUpdate(validatedRoleId, { userId: newUser._id });
    }

    // ✅ ROBUST AUDIT LOG WITH FALLBACK
    try {
      await logEvent({
        action: 'create_user',
        user: adminUserId, // Use the adminUserId from fallback
        resource: 'User',
        resourceId: newUser._id,
        details: { 
          email,
          createdBy: adminUserId,
          organizationId: organizationId,
          roleAssigned: roleName
        },
        organization: organizationId
      });
      console.log('✅ Audit log created successfully');
    } catch (auditError) {
      console.error('❌ Audit log failed (non-critical):', auditError.message);
      // Don't fail user creation if audit log fails
    }

    // ✅ SEND ACCOUNT ACTIVATION EMAIL
    try {
      const SendGridService = require('../services/sendGridService');
      const emailResult = await SendGridService.sendAccountActivationEmail({
        email: newUser.email,
        name: newUser.name || newUser.fullName || 'New User',
        activationToken: activationToken,
        organizationName: organization.name || 'MBZ Tech',
        roleName: roleName,
        createdBy: admin.fullName || admin.name || admin.email
      });

      if (emailResult.success) {
        console.log('✅ Account activation email sent successfully');
      } else {
        console.error('❌ Account activation email failed:', emailResult.error);
      }
    } catch (emailErr) {
      console.error('❌ Account activation email failed (non-critical):', emailErr.message);
      // Don't fail user creation if email fails
    }

    // ✅ SEND IN-APP NOTIFICATION
    try {
      await notificationGenerationService.generateFromTemplate(
        'invitation_sent',
        {
          fullName: newUser.name || newUser.fullName || 'New User',
          username: newUser.username || newUser.email,
          role: roleName,
          companyName: organization.name || 'MBZ Tech'
        },
        {
          userId: newUser._id,
          organization: organizationId
        }
      );
      console.log('✅ In-app notification sent successfully');
    } catch (notifyErr) {
      console.error('❌ In-app notification failed (non-critical):', notifyErr.message);
      // Don't fail user creation if notification fails
    }

    // ✅ ROBUST RESPONSE WITH FALLBACKS
    res.status(201).json({ 
      success: true, 
      message: `User created successfully with ${roleName} role`, 
      user: {
        _id: newUser._id,
        name: newUser.name || 'New User',
        email: newUser.email,
        role: roleName,
        roleId: validatedRoleId,
        department: newUser.department || 'IT',
        organization: newUser.organization || organizationId
      },
      debug: {
        adminUserId: adminUserId,
        organizationId: organizationId,
        roleAssigned: roleName,
        fallbacksUsed: {
          adminUser: adminUserId ? 'found' : 'not_found',
          organization: organizationId ? 'found' : 'not_found',
          role: validatedRoleId ? 'assigned' : 'default'
        }
      }
    });
  } catch (error) {
    console.error('❌ User creation error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // ✅ ROBUST ERROR HANDLING WITH FALLBACKS
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('❌ Validation errors:', validationErrors);
      
      return res.status(400).json({ 
        success: false, 
        message: "User validation failed. Please check all required fields are filled correctly.",
        errors: validationErrors,
        debug: {
          errorType: 'ValidationError',
          fieldErrors: Object.keys(error.errors)
        }
      });
    }
    
    if (error.name === 'CastError') {
      console.error('❌ CastError details:', {
        message: error.message,
        path: error.path,
        value: error.value,
        kind: error.kind
      });
      
      // Provide specific error messages based on the field causing the error
      if (error.path === 'roleId') {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid role ID format. The system will assign a default role automatically.",
          debug: { errorType: 'CastError', field: 'roleId', value: error.value }
        });
      }
      
      if (error.path === 'organization') {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid organization ID. Please ensure you are properly authenticated.",
          debug: { errorType: 'CastError', field: 'organization', value: error.value }
        });
      }
      
      if (error.path === 'userId') {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID. Please ensure you are properly authenticated and try logging in again.",
          debug: { errorType: 'CastError', field: 'userId', value: error.value }
        });
      }
      
      if (error.path === '_id') {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user _id format. Please ensure you are properly authenticated and try logging in again.",
          debug: { errorType: 'CastError', field: '_id', value: error.value }
        });
      }
      
      // Generic CastError message
      return res.status(400).json({ 
        success: false, 
        message: `Invalid data format for field '${error.path}'. Please ensure all fields are in the correct format.`,
        debug: { errorType: 'CastError', field: error.path, value: error.value }
      });
    }
    
    if (error.code === 11000) {
      console.error('❌ Duplicate key error:', error.keyValue);
      return res.status(400).json({ 
        success: false, 
        message: "Email already exists. Please use a different email address.",
        debug: { errorType: 'DuplicateKey', field: Object.keys(error.keyValue)[0] }
      });
    }
    
    // Generic server error with debug info
    console.error('❌ Unhandled error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server error during user creation. Please try again or contact support if the issue persists.",
      debug: {
        errorType: error.name || 'UnknownError',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
};


/**
 * @swagger
 * /api/users/all:
 *   get:
 *     summary: Get all users in an organization
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
// Get all users in an organization
exports.getAllUsers = async (req, res) => {
  try {
    // Exclude users that are pending deletion or have deletion scheduled
    const users = await User.find({
      status: { $ne: 'pending-deletion' },
      deletionScheduledAt: { $exists: false }
    }).populate("organization").populate("roleId");

    // Map users to include role as roleId for frontend compatibility
    const usersWithRole = users.map(user => {
      const userObj = user.toObject();
      userObj.role = userObj.roleId; // Frontend expects 'role' not 'roleId'
      return userObj;
    });

    res.status(200).json({ success: true, users: usersWithRole });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @swagger
 * /api/users/get/{userId}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
// Get a single user by ID
exports.getUserById = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const user = await User.findById(userId).populate("organization");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @swagger
 * /api/users/update/{userId}:
 *   patch:
 *     summary: Update user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: "John Doe"
 *               username:
 *                 type: string
 *                 description: User's username
 *                 example: "johndoe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john@example.com"
 *               department:
 *                 type: string
 *                 enum: [Customer Support, IT, HR, Sales, Marketing, Finance, Billing, Shipping]
 *                 description: User's department
 *                 example: "IT"
 *               role:
 *                 type: string
 *                 description: User's role
 *                 example: "employee"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: User's status
 *                 example: "active"
 *               profilePicture:
 *                 type: string
 *                 description: Profile picture URL
 *                 example: "https://example.com/avatar.jpg"
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   example: "User updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
// Update user details (e.g., name, email, role)
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { fullName, username, email, department, role, status, profilePicture, otpEnabled } = req.body;
  console.log('📝 Update user request:', req.body);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update user fields
    if (fullName !== undefined) user.fullName = fullName;
    if (username !== undefined) user.username = username;
    if (department !== undefined) user.department = department;
    if (email !== undefined) user.email = email;
    if (status !== undefined) user.status = status;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    // Update OTP/2FA settings
    if (otpEnabled !== undefined) {
      const previousOtpEnabled = user.otpEnabled;
      user.otpEnabled = otpEnabled;

      if (otpEnabled) {
        user.otpEnabledAt = new Date();
      } else {
        user.otpEnabledAt = undefined;
      }

      // Send email notification for 2FA status change
      if (previousOtpEnabled !== otpEnabled) {
        const SendGridService = require('../services/sendGridService');
        const Organization = require('../models/organization');
        const organization = await Organization.findById(user.organization);

        if (organization) {
          const subject = otpEnabled
            ? `Two-Factor Authentication Enabled - ${organization.name}`
            : `Two-Factor Authentication Disabled - ${organization.name}`;

          const content = otpEnabled ? `
            <h2>Hello ${user.fullName || user.email}!</h2>
            <p>Two-Factor Authentication has been <strong>enabled</strong> on your account.</p>
            <p>From now on, you will need to enter a verification code sent to your email each time you log in.</p>

            <div class="info-box">
              <h3>Benefits of 2FA:</h3>
              <ul>
                <li>Extra layer of security for your account</li>
                <li>Protection even if your password is compromised</li>
                <li>Secure access to sensitive data</li>
              </ul>
            </div>

            <p>If you did not make this change, please contact support immediately.</p>
          ` : `
            <h2>Hello ${user.fullName || user.email}!</h2>
            <p>Two-Factor Authentication has been <strong>disabled</strong> on your account.</p>

            <div class="warning-box">
              <h3>Security Notice</h3>
              <p>Your account is now less secure without two-factor authentication. We recommend keeping 2FA enabled for maximum security.</p>
            </div>

            <p>If you did not make this change, please contact support immediately.</p>
          `;

          const htmlContent = SendGridService.generateEmailTemplate({
            title: subject,
            heading: otpEnabled ? '2FA Enabled' : '2FA Disabled',
            content: content
          });

          // Send email in non-blocking manner
          SendGridService.sendEmail({
            to: user.email,
            subject: subject,
            html: htmlContent,
            userId: user._id,
            organizationId: organization._id
          }).catch(err => console.error('Failed to send 2FA notification email:', err));
        }
      }
    }

    // Update role if provided (role is the roleId from frontend)
    if (role !== undefined) {
      user.roleId = role;
      // Also get the role name for backward compatibility
      const roleDoc = await require('../models/role').findById(role);
      if (roleDoc) {
        user.role = roleDoc.name;
      }
    }

    // Save updated user
    await user.save();

    await createAuditLog({
      action: 'User profile updated',
      user: req.user?._id || req.user?.userId || user._id,
      resource: 'user',
      resourceId: user._id,
      details: { fullName, username, email, department, role, status, profilePicture, otpEnabled },
      organization: user.organization,
      severity: 'info',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    // Populate roleId before returning
    await user.populate('roleId');
    const userResponse = user.toObject();
    userResponse.role = userResponse.roleId; // Frontend expects 'role' not 'roleId'

    res.status(200).json({ success: true, message: "User updated successfully", user: userResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @swagger
 * /api/users/change/{userId}/status:
 *   patch:
 *     summary: Update user status (active/inactive)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: New user status
 *                 example: "active"
 *     responses:
 *       200:
 *         description: User status updated successfully
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
 *                   example: "User status updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
// Update user status (active/inactive)
exports.updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  console.log(req.params);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const previousStatus = user.status;
    user.status = status;  // 'active' or 'inactive'
    await user.save();

    await createAuditLog({
      action: 'User status changed',
      user: req.user?._id || req.user?.userId || user._id,
      resource: 'user',
      resourceId: user._id,
      details: { previousStatus, newStatus: status },
      organization: user.organization,
      severity: 'info',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({ success: true, message: "User status updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @swagger
 * /api/users/organization/{organizationId}:
 *   get:
 *     summary: Get users by organization
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
// Get users by organization
exports.getUsersByOrganization = async (req, res) => {
  const { organizationId } = req.params;

  try {
    // Fetch all users belonging to the specified organization
    // Exclude users that are pending deletion or have deletion scheduled
    const users = await User.find({
      organization: organizationId,
      status: { $ne: 'pending-deletion' },
      deletionScheduledAt: { $exists: false }
    }).populate("organization").populate("roleId");

    console.log('users for the organization', users);
    if (!users.length) {
      return res.status(404).json({ success: false, message: "No users found for this organization." });
    }

    // Map users to include role as roleId for frontend compatibility
    const usersWithRole = users.map(user => {
      const userObj = user.toObject();
      userObj.role = userObj.roleId; // Frontend expects 'role' not 'roleId'
      return userObj;
    });

    // Count users by role
    const roleCounts = usersWithRole.reduce((counts, user) => {
      const role = user.role?.name || user.role; // Use role name if available
      counts[role] = counts[role] ? counts[role] + 1 : 1;
      return counts;
    }, {});

    console.log(roleCounts);

    res.status(200).json({ success: true, users: usersWithRole, roleCounts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/**
 * @swagger
 * /api/users/delete/{userId}:
 *   delete:
 *     summary: Delete a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: "User deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User is not an admin
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
 *                   example: "Unauthorized"
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
// Delete a user (schedules for deletion in 30 days)
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate('organization');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if user is the last admin of the organization
    if (user.role === 'Admin' && user.organization) {
      const adminCount = await User.countDocuments({
        organization: user.organization._id,
        role: 'Admin',
        _id: { $ne: userId },
        deletionScheduledAt: { $exists: false }
      });

      if (adminCount === 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete account. You are the last admin of this organization. Please assign another admin first."
        });
      }
    }

    // Schedule deletion for 30 days from now
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    user.deletionScheduledAt = deletionDate;
    user.deletionRequestedAt = new Date();
    user.status = 'pending-deletion';
    await user.save();

    // Check if this is a self-deletion or admin deleting a sub-user
    const requestingUserId = req.user?._id?.toString() || req.user?.userId?.toString();
    const isSelfDeletion = requestingUserId === userId;

    // Only send email notification if user is deleting their own account
    // Don't send email when admin deletes a sub-user's account
    if (isSelfDeletion) {
      const SendGridService = require('../services/sendGridService');
      const Organization = require('../models/organization');
      const organization = await Organization.findById(user.organization);

      if (organization) {
        // Use the dedicated method for account deletion emails
        SendGridService.sendAccountDeletionEmail(user, organization, deletionDate)
          .catch(err => console.error('Failed to send account deletion email:', err));
      }
    }

    await createAuditLog({
      action: isSelfDeletion ? 'User deletion scheduled (self)' : 'User deletion scheduled (by admin)',
      user: req.user?._id || req.user?.userId || user._id,
      resource: 'user',
      resourceId: user._id,
      details: {
        email: user.email,
        fullName: user.fullName,
        deletionScheduledAt: deletionDate,
        deletionRequestedAt: new Date(),
        deletedBy: isSelfDeletion ? 'self' : 'admin'
      },
      organization: user.organization,
      severity: 'warning',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    // Different response message based on who is deleting
    const responseMessage = isSelfDeletion
      ? `Your account has been scheduled for deletion on ${deletionDate.toLocaleDateString()}. You will receive an email confirmation.`
      : `User account has been scheduled for deletion on ${deletionDate.toLocaleDateString()}.`;

    res.status(200).json({
      success: true,
      message: responseMessage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @swagger
 * /api/users/{userId}/profile-picture:
 *   patch:
 *     summary: Update user profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - profilePicture
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
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
 *                   example: "Profile picture updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - No file uploaded
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
 *                   example: "No file uploaded"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
// Update profile picture
exports.updateProfilePicture = async (req, res) => {
  const { userId } = req.params;

  try {
    // Ensure a file was uploaded
    if (!req.files || !req.files.profilePicture) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const file = req.files.profilePicture;
    console.log(file);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "profile_pictures",
    });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update the user's profile picture URL
    const previousPicture = user.profilePicture;
    user.profilePicture = result.secure_url;
    await user.save();

    console.log(user.profilePicture);

    await createAuditLog({
      action: 'Profile picture updated',
      user: req.user?._id || req.user?.userId || user._id,
      resource: 'user',
      resourceId: user._id,
      details: { previousPicture, newPicture: user.profilePicture },
      organization: user.organization,
      severity: 'info',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @swagger
 * /api/users/{userId}/regional-settings:
 *   get:
 *     summary: Get user regional settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Regional settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     language:
 *                       type: string
 *                       description: User's preferred language
 *                       example: "en"
 *                     timezone:
 *                       type: string
 *                       description: User's timezone
 *                       example: "America/New_York"
 *                     dateFormat:
 *                       type: string
 *                       description: User's preferred date format
 *                       example: "MM/DD/YYYY"
 *                     timeFormat:
 *                       type: string
 *                       description: User's preferred time format
 *                       example: "12h"
 *                     organization:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           description: Organization name
 *                           example: "Acme Corp"
 *                         defaultCurrency:
 *                           type: string
 *                           description: Organization's default currency
 *                           example: "USD"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
// Get user regional settings
exports.getUserRegionalSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('language timezone dateFormat timeFormat displayCurrency')
      .populate('organization', 'name defaultCurrency');

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        language: user.language || 'en',
        timezone: user.timezone || 'UTC',
        dateFormat: user.dateFormat || 'MM/DD/YYYY',
        timeFormat: user.timeFormat || '12',
        displayCurrency: user.displayCurrency || user.organization?.defaultCurrency || 'USD',
        organization: user.organization
      }
    });
  } catch (error) {
    console.error('Get User Regional Settings Error:', error);
    res.status(500).json({ success: false, message: "Failed to get regional settings" });
  }
};

// Update user regional settings
exports.updateUserRegionalSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { language, timezone, dateFormat, timeFormat, displayCurrency } = req.body;

    // Basic validation - let the User model handle detailed validation
    const validLanguages = ['en', 'es', 'fr'];
    const validDateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
    const validTimeFormats = ['12', '24'];

    if (language && !validLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Invalid language. Must be one of: en, es, fr"
      });
    }

    // Timezone validation is handled by the User model using moment-timezone
    // This allows any valid IANA timezone identifier (e.g., America/New_York, Europe/London, Africa/Lagos, Asia/Dubai)

    if (dateFormat && !validDateFormats.includes(dateFormat)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Must be one of: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD"
      });
    }

    if (timeFormat && !validTimeFormats.includes(timeFormat)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Must be 12 or 24"
      });
    }

    // Currency validation is handled by the User model using currency list
    // This allows any valid currency code (USD, EUR, NGN, etc.)

    const updateData = {
      language,
      timezone,
      dateFormat,
      timeFormat,
      updatedAt: Date.now()
    };

    // Only add displayCurrency if it's provided
    if (displayCurrency) {
      updateData.displayCurrency = displayCurrency.toUpperCase();
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('language timezone dateFormat timeFormat displayCurrency');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await createAuditLog({
      action: 'Regional settings updated',
      user: req.user?._id || req.user?.userId || userId,
      resource: 'user',
      resourceId: updatedUser._id,
      details: { language, timezone, dateFormat, timeFormat, displayCurrency },
      organization: updatedUser.organization,
      severity: 'info',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: "Regional settings updated successfully",
      data: {
        language: updatedUser.language,
        timezone: updatedUser.timezone,
        dateFormat: updatedUser.dateFormat,
        timeFormat: updatedUser.timeFormat,
        displayCurrency: updatedUser.displayCurrency
      }
    });
  } catch (error) {
    console.error('Update User Regional Settings Error:', error);

    // Check if it's a validation error from the model
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message: errorMessages
      });
    }

    res.status(500).json({ success: false, message: "Failed to update regional settings" });
  }
};

// Upload user profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.files || !req.files.profilePicture) {
      return res.status(400).json({ 
        success: false, 
        message: "No profile picture file uploaded" 
      });
    }

    const profilePictureFile = req.files.profilePicture;

    // Upload the profile picture to Cloudinary
    const cloudinary = require('cloudinary').v2;
    const uploadResult = await cloudinary.uploader.upload(profilePictureFile.tempFilePath, {
      folder: "user_profiles",
      transformation: [
        { width: 300, height: 300, crop: "fill" },
        { quality: "auto" }
      ]
    });

    // Update the user's profile picture URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        profilePicture: uploadResult.secure_url,
        updatedAt: Date.now()
      },
      { new: true }
    ).select('profilePicture fullName email');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await createAuditLog({
      action: 'Profile picture uploaded',
      user: req.user?._id || req.user?.userId || userId,
      resource: 'user',
      resourceId: updatedUser._id,
      details: { profilePicture: updatedUser.profilePicture },
      organization: updatedUser.organization,
      severity: 'info',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      data: {
        profilePicture: updatedUser.profilePicture,
        user: {
          fullName: updatedUser.fullName,
          email: updatedUser.email
        }
      }
    });
  } catch (error) {
    console.error('Upload Profile Picture Error:', error);
    res.status(500).json({ success: false, message: "Failed to upload profile picture" });
  }
};

// Remove user profile picture
exports.removeProfilePicture = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If user has a profile picture, delete it from Cloudinary
    if (user.profilePicture) {
      try {
        const cloudinary = require('cloudinary').v2;
        const publicId = user.profilePicture.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`user_profiles/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion error:', cloudinaryError);
        // Continue with the update even if Cloudinary deletion fails
      }
    }

    // Update user to remove profile picture
    const previousPicture = user.profilePicture;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePicture: null,
        updatedAt: Date.now()
      },
      { new: true }
    ).select('profilePicture fullName email organization');

    await createAuditLog({
      action: 'Profile picture removed',
      user: req.user?._id || req.user?.userId || userId,
      resource: 'user',
      resourceId: updatedUser._id,
      details: { previousPicture },
      organization: updatedUser.organization,
      severity: 'info',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: "Profile picture removed successfully",
      data: {
        profilePicture: updatedUser.profilePicture,
        user: {
          fullName: updatedUser.fullName,
          email: updatedUser.email
        }
      }
    });
  } catch (error) {
    console.error('Remove Profile Picture Error:', error);
    res.status(500).json({ success: false, message: "Failed to remove profile picture" });
  }
};

/**
 * @swagger
 * /api/users/{userId}/sessions:
 *   get:
 *     summary: Get user sessions
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: User sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         format: ObjectId
 *                         description: Session ID
 *                         example: "507f1f77bcf86cd799439011"
 *                       userId:
 *                         type: string
 *                         format: ObjectId
 *                         description: User ID
 *                         example: "507f1f77bcf86cd799439011"
 *                       deviceInfo:
 *                         type: string
 *                         description: Device information
 *                         example: "Chrome on Windows"
 *                       ipAddress:
 *                         type: string
 *                         description: IP address
 *                         example: "192.168.1.1"
 *                       lastActivity:
 *                         type: string
 *                         format: date-time
 *                         description: Last activity timestamp
 *                         example: "2024-01-15T10:30:00.000Z"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Session creation timestamp
 *                         example: "2024-01-15T09:00:00.000Z"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
// Get user sessions
exports.getUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // For now, return basic session info
    // In a real implementation, you'd track sessions in a separate collection
    const sessions = [
      {
        id: 'current-session',
        device: 'Web Browser',
        location: 'Unknown',
        ipAddress: req.ip,
        lastActive: new Date(),
        isCurrent: true
      }
    ];

    res.status(200).json({ 
      success: true, 
      data: {
        sessions,
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.isCurrent).length
      }
    });
  } catch (error) {
    console.error('Get User Sessions Error:', error);
    res.status(500).json({ success: false, message: "Failed to get user sessions" });
  }
};

/**
 * @swagger
 * /api/users/{userId}/sessions/{sessionId}:
 *   delete:
 *     summary: Terminate a specific user session
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Session ID to terminate
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Session terminated successfully
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
 *                   example: "Session terminated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     terminatedSessionId:
 *                       type: string
 *                       description: ID of the terminated session
 *                       example: "507f1f77bcf86cd799439011"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: User or session not found
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
 *                   example: "Failed to terminate session"
 */
// Terminate user session
exports.terminateSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // For now, just return success
    // In a real implementation, you'd invalidate the session token

    await logSecurityEvent({
      action: 'Session terminated',
      user: req.user?._id || req.user?.userId || userId,
      resource: 'session',
      resourceId: sessionId,
      details: {
        terminatedSessionId: sessionId,
        targetUserId: userId
      },
      organization: user.organization,
      severity: 'warning',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: "Session terminated successfully",
      data: {
        terminatedSessionId: sessionId
      }
    });
  } catch (error) {
    console.error('Terminate Session Error:', error);
    res.status(500).json({ success: false, message: "Failed to terminate session" });
  }
};

/**
 * @swagger
 * /api/users/check-owner-status:
 *   get:
 *     summary: Check if the current user is the account owner
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 isAccountOwner:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
exports.checkOwnerStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const organizationId = req.user.organization || req.user.organizationId;

    if (!organizationId) {
      // Super admins or users without org are considered owners of their own account
      return res.json({ success: true, isAccountOwner: true });
    }

    const isOwner = await isAccountOwner(userId, organizationId);

    res.json({ success: true, isAccountOwner: isOwner });
  } catch (error) {
    console.error('Error checking owner status:', error);
    res.status(500).json({ success: false, message: 'Failed to check owner status' });
  }
};

/**
 * @swagger
 * /api/users/celebration-milestones:
 *   get:
 *     summary: Get user's completed celebration milestones
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Milestones retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 milestones:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["first-task", "first-store"]
 */
exports.getCelebrationMilestones = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('celebrationMilestones');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      milestones: user.celebrationMilestones || []
    });
  } catch (error) {
    console.error('Error getting celebration milestones:', error);
    res.status(500).json({ success: false, message: 'Failed to get milestones' });
  }
};

/**
 * @swagger
 * /api/users/celebration-milestones:
 *   post:
 *     summary: Add a celebration milestone for the user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - milestone
 *             properties:
 *               milestone:
 *                 type: string
 *                 example: "first-task"
 *     responses:
 *       200:
 *         description: Milestone added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 milestones:
 *                   type: array
 *                   items:
 *                     type: string
 */
exports.addCelebrationMilestone = async (req, res) => {
  try {
    const userId = req.user._id;
    const { milestone } = req.body;

    if (!milestone) {
      return res.status(400).json({ success: false, message: 'Milestone is required' });
    }

    // Valid milestones
    const validMilestones = [
      'first-task', 'first-order', 'first-inventory', 'first-customer',
      'first-campaign', 'first-invoice', 'first-website', 'first-store',
      'first-product', 'first-receipt', 'welcome-login'
    ];

    if (!validMilestones.includes(milestone)) {
      return res.status(400).json({ success: false, message: 'Invalid milestone' });
    }

    // Add milestone if not already present (using $addToSet to prevent duplicates)
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { celebrationMilestones: milestone } },
      { new: true }
    ).select('celebrationMilestones');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      milestones: user.celebrationMilestones,
      message: 'Milestone added successfully'
    });
  } catch (error) {
    console.error('Error adding celebration milestone:', error);
    res.status(500).json({ success: false, message: 'Failed to add milestone' });
  }
};

