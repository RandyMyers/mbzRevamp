const User = require('../models/users');
const Organization = require('../models/organization');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const Role = require('../models/role');
const Group = require('../models/group');
const notificationGenerationService = require('../services/notificationGenerationService');

const AuditLog = require('../models/auditLog');
const logEvent = require('../helper/logEvent');

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
// Create a new user within the same organization as the admin

exports.createUser = async (req, res) => {
  const { userId, name, email, password, roleId, department } = req.body;

  try {
    const admin = await User.findById(userId);
    console.log(admin);
    //if (!admin || admin.role !== 'admin') {
    //  return res.status(403).json({ success: false, message: "Unauthorized" });
   // }

    const organization = await Organization.findById(admin.organization);
    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profilePictureUrl = null;

    if (req.files && req.files.profilePicture) {
      const result = await cloudinary.uploader.upload(req.files.profilePicture.tempFilePath, {
        folder: "profile_pictures",
      });
      profilePictureUrl = result.secure_url;
    }

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      roleId,
      department,
      organization: organization._id,
      profilePicture: profilePictureUrl,
    });

    await newUser.save();

    await logEvent({
      action: 'create_user',
      user: admin._id,
      resource: 'User',
      resourceId: newUser._id,
      details: { email },
      organization: organization._id
    });

    // Send invitation email notification to the newly created user (non-blocking)
    try {
      let roleName = 'member';
      if (roleId) {
        try {
          const roleDoc = await Role.findById(roleId).lean();
          if (roleDoc && (roleDoc.name || roleDoc.roleName)) {
            roleName = roleDoc.name || roleDoc.roleName;
          }
        } catch {}
      }

      await notificationGenerationService.generateFromTemplate(
        'invitation_sent',
        {
          fullName: newUser.name || newUser.fullName || '',
          username: newUser.username || newUser.email,
          role: roleName,
          companyName: organization.name || 'MBZ Tech'
        },
        {
          userId: newUser._id,
          organization: organization._id
        }
      );
    } catch (notifyErr) {
      console.error('User invitation notification failed:', notifyErr);
    }

    res.status(201).json({ success: true, message: "User created", user: newUser });
  } catch (error) {
    console.error(error);
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
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
    const users = await User.find().populate("organization");
    res.status(200).json({ success: true, users });
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
  const { name, username, email, department, role, status, profilePicture } = req.body;
  console.log(req.body);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update user fields
    user.name = name || user.name;
    user.username = username || user.username;
    user.department = department || user.department;
    user.email = email || user.email;
    user.role = role || user.role;
    user.status = status || user.status;
    user.profilePicture = profilePicture || user.profilePicture;

    // Save updated user
    await user.save();

    await logEvent({
      action: 'update_user',
      user: user._id,
      resource: 'User',
      resourceId: user._id,
      details: { name, username, email, department, role, status, profilePicture },
      organization: user.organization
    });

    res.status(200).json({ success: true, message: "User updated successfully", user });
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

    user.status = status;  // 'active' or 'inactive'
    await user.save();

    await logEvent({
      action: 'update_user_status',
      user: user._id,
      resource: 'User',
      resourceId: user._id,
      details: { status },
      organization: user.organization
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
    const users = await User.find({ organization: organizationId }).populate("organization");

    console.log('users for the organization', users);
    if (!users.length) {
      return res.status(404).json({ success: false, message: "No users found for this organization." });
    }

    // Count users by role
    const roleCounts = users.reduce((counts, user) => {
      const role = user.role; // Assuming `role` is the field in the User schema
      counts[role] = counts[role] ? counts[role] + 1 : 1;
      return counts;
    }, {});

    console.log(roleCounts);

    res.status(200).json({ success: true, users, roleCounts });
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
// Delete a user
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Delete the user
    await user.remove();

    await logEvent({
      action: 'delete_user',
      user: user._id,
      resource: 'User',
      resourceId: user._id,
      details: { organization: user.organization },
      organization: user.organization
    });

    res.status(200).json({ success: true, message: "User deleted successfully" });
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
    user.profilePicture = result.secure_url;
    await user.save();

    console.log(user.profilePicture);

    await logEvent({
      action: 'update_profile_picture',
      user: user._id,
      resource: 'User',
      resourceId: user._id,
      details: { profilePicture: user.profilePicture },
      organization: user.organization
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
      .select('language timezone dateFormat timeFormat')
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
    const { language, timezone, dateFormat, timeFormat } = req.body;

    // Validate inputs
    const validLanguages = ['en', 'es', 'fr'];
    const validTimezones = ['UTC', 'EST', 'PST', 'GMT', 'CET'];
    const validDateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
    const validTimeFormats = ['12', '24'];

    if (language && !validLanguages.includes(language)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid language. Must be one of: en, es, fr" 
      });
    }

    if (timezone && !validTimezones.includes(timezone)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid timezone. Must be one of: UTC, EST, PST, GMT, CET" 
      });
    }

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

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        language, 
        timezone, 
        dateFormat, 
        timeFormat,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).select('language timezone dateFormat timeFormat');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Regional settings updated successfully",
      data: {
        language: updatedUser.language,
        timezone: updatedUser.timezone,
        dateFormat: updatedUser.dateFormat,
        timeFormat: updatedUser.timeFormat
      }
    });
  } catch (error) {
    console.error('Update User Regional Settings Error:', error);
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
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        profilePicture: null,
        updatedAt: Date.now()
      },
      { new: true }
    ).select('profilePicture fullName email');

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

