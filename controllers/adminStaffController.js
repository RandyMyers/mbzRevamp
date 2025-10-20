const User = require('../models/users');
const Invitation = require('../models/invitation');
const Role = require('../models/role');
const bcrypt = require('bcryptjs');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Staff
 *     description: Manage staff users
 */

/**
 * @swagger
 * /api/admin/staff/users:
 *   get:
 *     summary: List staff users
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.listStaff = async (req, res, next) => {
  try {
    const { status, department } = req.query;
    
    // Build query to filter only staff members
    const q = {
      role: { $in: ['staff', 'super-admin'] } // Include both staff and super-admin users
    };
    
    if (status) q.status = status;
    if (department) q.department = department;
    
    // Get staff users with proper filtering
    const users = await User.find(q)
      .select('-password -twoFactorCode -twoFactorCodeExpires -emailVerificationCode -emailVerificationCodeExpires')
      .sort({ createdAt: -1 })
      .populate('organization', 'name organizationCode')
      .populate('roleId', 'name permissions');
    
    // Add user type information
    const usersWithType = users.map(user => ({
      ...user.toObject(),
      userType: user.role === 'super-admin' ? 'super-admin' : 'staff'
    }));
    
    res.status(200).json({ 
      success: true, 
      users: usersWithType,
      total: usersWithType.length,
      message: 'Staff users retrieved successfully'
    });
  } catch (err) { 
    console.error('❌ [ADMIN STAFF] List staff error:', err);
    next(err); 
  }
};

/**
 * @swagger
 * /api/admin/staff/users/{id}/status:
 *   post:
 *     summary: Update staff user status (activate/deactivate)
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200: { description: Updated }
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) throw new BadRequestError('invalid status');
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!user) throw new NotFoundError('user not found');
    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/staff/users/{id}/set-password:
 *   post:
 *     summary: Set a new password for a staff user
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Password updated }
 */
exports.setPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) throw new BadRequestError('newPassword must be at least 6 chars');
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('user not found');
    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();
    await user.save();
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/staff/users/{id}/twofactor:
 *   post:
 *     summary: Enable/disable two-factor for a user
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enabled]
 *             properties:
 *               enabled: { type: boolean }
 *     responses:
 *       200: { description: Updated }
 */
exports.toggleTwoFactor = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') throw new BadRequestError('enabled must be boolean');
    const user = await User.findByIdAndUpdate(req.params.id, { twoFactorEnabled: enabled }, { new: true }).select('-password');
    if (!user) throw new NotFoundError('user not found');
    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/staff/users:
 *   post:
 *     summary: Create a new staff member
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, fullName, email, password, role]
 *             properties:
 *               username: { type: string }
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [staff, super-admin] }
 *               department: { type: string }
 *               position: { type: string }
 *     responses:
 *       201: { description: Staff member created }
 */
exports.createStaff = async (req, res, next) => {
  try {
    const { username, fullName, email, password, role, department, position } = req.body;

    // Validate required fields
    if (!username || !fullName || !email || !password || !role) {
      throw new BadRequestError('Username, fullName, email, password, and role are required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });
    
    if (existingUser) {
      throw new BadRequestError('User with this email or username already exists');
    }

    // Validate role
    if (!['staff', 'super-admin'].includes(role)) {
      throw new BadRequestError('Role must be either "staff" or "super-admin"');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new staff member
    const newStaff = new User({
      username,
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      status: 'active',
      department,
      position,
      isEmailVerified: true, // Staff emails are pre-verified
      passwordChangedAt: new Date()
    });

    await newStaff.save();

    // Remove sensitive data from response
    const staffData = newStaff.toObject();
    delete staffData.password;
    delete staffData.twoFactorCode;
    delete staffData.twoFactorCodeExpires;
    delete staffData.emailVerificationCode;
    delete staffData.emailVerificationCodeExpires;

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      user: staffData
    });

  } catch (err) {
    console.error('❌ [ADMIN STAFF] Create staff error:', err);
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/staff/users/{id}:
 *   get:
 *     summary: Get staff member details
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Staff member details }
 */
exports.getStaff = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -twoFactorCode -twoFactorCodeExpires -emailVerificationCode -emailVerificationCodeExpires')
      .populate('organization', 'name organizationCode')
      .populate('roleId', 'name permissions');

    if (!user) {
      throw new NotFoundError('Staff member not found');
    }

    // Check if user is staff or super-admin
    if (!['staff', 'super-admin'].includes(user.role)) {
      throw new BadRequestError('User is not a staff member');
    }

    const userData = {
      ...user.toObject(),
      userType: user.role === 'super-admin' ? 'super-admin' : 'staff'
    };

    res.status(200).json({
      success: true,
      user: userData
    });

  } catch (err) {
    console.error('❌ [ADMIN STAFF] Get staff error:', err);
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/staff/users/{id}:
 *   patch:
 *     summary: Update staff member
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *               department: { type: string }
 *               position: { type: string }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200: { description: Staff member updated }
 */
exports.updateStaff = async (req, res, next) => {
  try {
    const { fullName, email, department, position, status } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new NotFoundError('Staff member not found');
    }

    // Check if user is staff or super-admin
    if (!['staff', 'super-admin'].includes(user.role)) {
      throw new BadRequestError('User is not a staff member');
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      if (existingUser) {
        throw new BadRequestError('Email already exists');
      }
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (email) user.email = email.toLowerCase();
    if (department) user.department = department;
    if (position) user.position = position;
    if (status && ['active', 'inactive'].includes(status)) user.status = status;

    await user.save();

    // Remove sensitive data from response
    const userData = user.toObject();
    delete userData.password;
    delete userData.twoFactorCode;
    delete userData.twoFactorCodeExpires;
    delete userData.emailVerificationCode;
    delete userData.emailVerificationCodeExpires;

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      user: userData
    });

  } catch (err) {
    console.error('❌ [ADMIN STAFF] Update staff error:', err);
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/staff/users/{id}:
 *   delete:
 *     summary: Delete staff member (soft delete)
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Staff member deleted }
 */
exports.deleteStaff = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new NotFoundError('Staff member not found');
    }

    // Check if user is staff or super-admin
    if (!['staff', 'super-admin'].includes(user.role)) {
      throw new BadRequestError('User is not a staff member');
    }

    // Soft delete - mark as inactive instead of removing
    user.status = 'inactive';
    user.deletedAt = new Date();
    user.deletedBy = req.userId; // ID of the admin who deleted the user
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully'
    });

  } catch (err) {
    console.error('❌ [ADMIN STAFF] Delete staff error:', err);
    next(err);
  }
};

















