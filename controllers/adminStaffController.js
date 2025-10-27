const User = require('../models/users');
const Employee = require('../models/Employee');
const StaffRole = require('../models/StaffRole');
const bcrypt = require('bcryptjs');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { getRolePermissions, validatePermissions } = require('../services/staffPermissionService');

/**
 * @swagger
 * tags:
 *   - name: Admin Staff
 *     description: Nexusfinal2 staff account management
 */

/**
 * @swagger
 * /api/admin/staff:
 *   get:
 *     summary: List all nexusfinal2 staff accounts
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by staff status
 *       - in: query
 *         name: staffRole
 *         schema:
 *           type: string
 *           enum: [super-admin, hr-manager, hr-assistant, accountant, developer, support]
 *         description: Filter by staff role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: List of staff accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StaffAccount'
 */
exports.listStaffAccounts = async (req, res, next) => {
  try {
    const { status, staffRole, search } = req.query;
    
    // Build query for nexusfinal2 staff accounts only
    let query = {
      isStaffAccount: true
    };

    // Apply filters
    if (status) {
      query.status = status;
    }
    
    if (staffRole) {
      query.staffRole = staffRole;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const staffAccounts = await User.find(query)
      .select('-password -twoFactorSecret -backupCodes')
      .populate('employeeId', 'fullName employeeId department roleTitle avatar')
      .populate('staffRole', 'name description permissions level')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: staffAccounts.length,
      data: staffAccounts
    });
  } catch (err) {
    console.error('Error listing staff accounts:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve staff accounts',
      message: `Failed to fetch staff accounts: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff:
 *   post:
 *     summary: Create staff account for employee
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - staffRole
 *               - permissions
 *             properties:
 *               employeeId:
 *                 type: string
 *                 description: Employee ID to link to
 *               staffRole:
 *                 type: string
 *                 enum: [super-admin, hr-manager, hr-assistant, accountant, developer, support]
 *               permissions:
 *                 type: object
 *                 description: Module permissions
 *               generatePassword:
 *                 type: boolean
 *                 default: true
 *               customPassword:
 *                 type: string
 *                 description: Custom password (if not generating)
 *     responses:
 *       201:
 *         description: Staff account created successfully
 */
exports.createStaffAccount = async (req, res, next) => {
  try {
    const { employeeId, staffRole, permissions, generatePassword = true, customPassword } = req.body;

    // Validate required fields
    if (!employeeId || !staffRole) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Employee ID and staff role are required'
      });
    }

    // Find the staff role
    const staffRoleDoc = await StaffRole.findById(staffRole);
    if (!staffRoleDoc) {
      return res.status(404).json({
        success: false,
        error: 'Staff role not found',
        message: `Staff role with ID ${staffRole} not found`
      });
    }

    // Get permissions from role if not provided
    let finalPermissions = permissions;
    if (!permissions) {
      finalPermissions = staffRoleDoc.permissions;
    } else {
      // Validate provided permissions
      if (!validatePermissions(permissions)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid permissions',
          message: 'Permissions structure is invalid'
        });
      }
    }

    // Find the employee
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: `Employee with ID ${employeeId} not found`
      });
    }

    // Check if staff account already exists for this employee
    const existingStaffAccount = await User.findOne({ 
      employeeId: employee.employeeId,
      isStaffAccount: true 
    });
    
    if (existingStaffAccount) {
      return res.status(400).json({
        success: false,
        error: 'Staff account already exists',
        message: `Staff account already exists for employee ${employee.employeeId}`
      });
    }

    // Check if email is already in use
    const existingEmail = await User.findOne({ email: employee.email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email already in use',
        message: `Email ${employee.email} is already in use`
      });
    }

    // Generate or use custom password
    let password;
    if (generatePassword) {
      // Generate secure random password
      password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    } else {
      if (!customPassword) {
        return res.status(400).json({
          success: false,
          error: 'Password required',
          message: 'Custom password is required when not generating password'
        });
      }
      password = customPassword;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create staff account
    const staffAccount = await User.create({
      fullName: employee.fullName,
      email: employee.email,
      password: hashedPassword,
      role: 'staff',
      isStaffAccount: true,
      employeeId: employee.employeeId,
      staffRole: staffRole,
      permissions: finalPermissions,
      status: 'active',
      organization: null, // Staff accounts don't belong to organizations
      emailVerified: true, // Auto-verify staff accounts
      emailVerifiedAt: new Date()
    });

    // Remove sensitive data from response
    const staffAccountResponse = staffAccount.toObject();
    delete staffAccountResponse.password;
    delete staffAccountResponse.twoFactorSecret;
    delete staffAccountResponse.backupCodes;

    res.status(201).json({
      success: true,
      data: staffAccountResponse,
      message: 'Staff account created successfully',
      generatedPassword: generatePassword ? password : undefined
    });
  } catch (err) {
    console.error('Error creating staff account:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create staff account',
      message: `Failed to create staff account: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff/{id}:
 *   get:
 *     summary: Get staff account by ID
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff account details
 */
exports.getStaffAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const staffAccount = await User.findOne({
      _id: id,
      isStaffAccount: true
    })
    .select('-password -twoFactorSecret -backupCodes')
    .populate('employeeId', 'fullName employeeId department roleTitle avatar');

    if (!staffAccount) {
      return res.status(404).json({
        success: false,
        error: 'Staff account not found',
        message: 'Staff account not found'
      });
    }

    res.status(200).json({
      success: true,
      data: staffAccount
    });
  } catch (err) {
    console.error('Error getting staff account:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve staff account',
      message: `Failed to fetch staff account: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff/{id}:
 *   put:
 *     summary: Update staff account
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staffRole:
 *                 type: string
 *                 enum: [super-admin, hr-manager, hr-assistant, accountant, developer, support]
 *               permissions:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *     responses:
 *       200:
 *         description: Staff account updated successfully
 */
exports.updateStaffAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staffRole, permissions, status } = req.body;

    const staffAccount = await User.findOne({
      _id: id,
      isStaffAccount: true
    });

    if (!staffAccount) {
      return res.status(404).json({
        success: false,
        error: 'Staff account not found',
        message: 'Staff account not found'
      });
    }

    // Update fields
    if (staffRole) staffAccount.staffRole = staffRole;
    if (permissions) staffAccount.permissions = permissions;
    if (status) staffAccount.status = status;

    await staffAccount.save();

    // Remove sensitive data from response
    const staffAccountResponse = staffAccount.toObject();
    delete staffAccountResponse.password;
    delete staffAccountResponse.twoFactorSecret;
    delete staffAccountResponse.backupCodes;

    res.status(200).json({
      success: true,
      data: staffAccountResponse,
      message: 'Staff account updated successfully'
    });
  } catch (err) {
    console.error('Error updating staff account:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update staff account',
      message: `Failed to update staff account: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff/{id}/suspend:
 *   post:
 *     summary: Suspend staff account
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for suspension
 *               duration:
 *                 type: number
 *                 description: Suspension duration in hours
 *     responses:
 *       200:
 *         description: Staff account suspended successfully
 */
exports.suspendStaffAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, duration = 24 } = req.body;

    const staffAccount = await User.findOne({
      _id: id,
      isStaffAccount: true
    });

    if (!staffAccount) {
      return res.status(404).json({
        success: false,
        error: 'Staff account not found',
        message: 'Staff account not found'
      });
    }

    // Set suspension
    staffAccount.status = 'suspended';
    staffAccount.lockedUntil = new Date(Date.now() + duration * 60 * 60 * 1000); // Convert hours to milliseconds

    await staffAccount.save();

    res.status(200).json({
      success: true,
      data: {
        id: staffAccount._id,
        status: staffAccount.status,
        lockedUntil: staffAccount.lockedUntil,
        reason: reason
      },
      message: 'Staff account suspended successfully'
    });
  } catch (err) {
    console.error('Error suspending staff account:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend staff account',
      message: `Failed to suspend staff account: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff/{id}/activate:
 *   post:
 *     summary: Activate staff account
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff account activated successfully
 */
exports.activateStaffAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const staffAccount = await User.findOne({
      _id: id,
      isStaffAccount: true
    });

    if (!staffAccount) {
      return res.status(404).json({
        success: false,
        error: 'Staff account not found',
        message: 'Staff account not found'
      });
    }

    // Activate account
    staffAccount.status = 'active';
    staffAccount.lockedUntil = null;
    staffAccount.loginAttempts = 0;

    await staffAccount.save();

    res.status(200).json({
      success: true,
      data: {
        id: staffAccount._id,
        status: staffAccount.status
      },
      message: 'Staff account activated successfully'
    });
  } catch (err) {
    console.error('Error activating staff account:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to activate staff account',
      message: `Failed to activate staff account: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff/{id}/reset-password:
 *   post:
 *     summary: Reset staff password
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               generatePassword:
 *                 type: boolean
 *                 default: true
 *               newPassword:
 *                 type: string
 *                 description: New password (if not generating)
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
exports.resetStaffPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { generatePassword = true, newPassword } = req.body;

    const staffAccount = await User.findOne({
      _id: id,
      isStaffAccount: true
    });

    if (!staffAccount) {
      return res.status(404).json({
        success: false,
        error: 'Staff account not found',
        message: 'Staff account not found'
      });
    }

    // Generate or use provided password
    let password;
    if (generatePassword) {
      password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    } else {
      if (!newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Password required',
          message: 'New password is required when not generating password'
        });
      }
      password = newPassword;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password
    staffAccount.password = hashedPassword;
    staffAccount.passwordChangedAt = new Date();
    staffAccount.lastPasswordReset = new Date();
    staffAccount.loginAttempts = 0;
    staffAccount.lockedUntil = null;

    await staffAccount.save();

    res.status(200).json({
      success: true,
      data: {
        id: staffAccount._id,
        email: staffAccount.email
      },
      message: 'Password reset successfully',
      newPassword: generatePassword ? password : undefined
    });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      message: `Failed to reset password: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff/{id}/permissions:
 *   put:
 *     summary: Update staff permissions
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: object
 *                 description: Module permissions
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 */
exports.manageStaffPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!permissions) {
      return res.status(400).json({
        success: false,
        error: 'Permissions required',
        message: 'Permissions object is required'
      });
    }

    const staffAccount = await User.findOne({
      _id: id,
      isStaffAccount: true
    });

    if (!staffAccount) {
      return res.status(404).json({
        success: false,
        error: 'Staff account not found',
        message: 'Staff account not found'
      });
    }

    // Update permissions
    staffAccount.permissions = permissions;
    await staffAccount.save();

    res.status(200).json({
      success: true,
      data: {
        id: staffAccount._id,
        permissions: staffAccount.permissions
      },
      message: 'Permissions updated successfully'
    });
  } catch (err) {
    console.error('Error updating permissions:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update permissions',
      message: `Failed to update permissions: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff/{id}/link-employee:
 *   post:
 *     summary: Link staff account to employee
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: string
 *                 description: Employee ID to link
 *     responses:
 *       200:
 *         description: Employee linked successfully
 */
exports.linkToEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID required',
        message: 'Employee ID is required'
      });
    }

    // Find the employee
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: `Employee with ID ${employeeId} not found`
      });
    }

    // Check if employee is already linked to another staff account
    const existingLink = await User.findOne({
      employeeId: employee.employeeId,
      isStaffAccount: true,
      _id: { $ne: id }
    });

    if (existingLink) {
      return res.status(400).json({
        success: false,
        error: 'Employee already linked',
        message: `Employee ${employee.employeeId} is already linked to another staff account`
      });
    }

    const staffAccount = await User.findOne({
      _id: id,
      isStaffAccount: true
    });

    if (!staffAccount) {
      return res.status(404).json({
        success: false,
        error: 'Staff account not found',
        message: 'Staff account not found'
      });
    }

    // Link employee
    staffAccount.employeeId = employee.employeeId;
    await staffAccount.save();

    res.status(200).json({
      success: true,
      data: {
        id: staffAccount._id,
        employeeId: staffAccount.employeeId,
        employeeName: employee.fullName
      },
      message: 'Employee linked successfully'
    });
  } catch (err) {
    console.error('Error linking employee:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to link employee',
      message: `Failed to link employee: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff/{id}/unlink-employee:
 *   delete:
 *     summary: Unlink staff account from employee
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee unlinked successfully
 */
exports.unlinkFromEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const staffAccount = await User.findOne({
      _id: id,
      isStaffAccount: true
    });

    if (!staffAccount) {
      return res.status(404).json({
        success: false,
        error: 'Staff account not found',
        message: 'Staff account not found'
      });
    }

    // Unlink employee
    const previousEmployeeId = staffAccount.employeeId;
    staffAccount.employeeId = null;
    await staffAccount.save();

    res.status(200).json({
      success: true,
      data: {
        id: staffAccount._id,
        previousEmployeeId: previousEmployeeId
      },
      message: 'Employee unlinked successfully'
    });
  } catch (err) {
    console.error('Error unlinking employee:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to unlink employee',
      message: `Failed to unlink employee: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff/{id}/activity:
 *   get:
 *     summary: Get staff activity logs
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff activity logs
 */
exports.getStaffActivity = async (req, res, next) => {
  try {
    const { id } = req.params;

    const staffAccount = await User.findOne({
      _id: id,
      isStaffAccount: true
    }).select('-password -twoFactorSecret -backupCodes');

    if (!staffAccount) {
      return res.status(404).json({
        success: false,
        error: 'Staff account not found',
        message: 'Staff account not found'
      });
    }

    // Get activity data
    const activityData = {
      id: staffAccount._id,
      fullName: staffAccount.fullName,
      email: staffAccount.email,
      lastLogin: staffAccount.lastLogin,
      lastPasswordReset: staffAccount.lastPasswordReset,
      loginAttempts: staffAccount.loginAttempts,
      lockedUntil: staffAccount.lockedUntil,
      status: staffAccount.status,
      createdAt: staffAccount.createdAt,
      updatedAt: staffAccount.updatedAt
    };

    res.status(200).json({
      success: true,
      data: activityData
    });
  } catch (err) {
    console.error('Error getting staff activity:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve staff activity',
      message: `Failed to fetch staff activity: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff/analytics/overview:
 *   get:
 *     summary: Get staff analytics overview
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff analytics overview
 */
exports.getStaffAnalytics = async (req, res, next) => {
  try {
    // Get staff statistics
    const totalStaff = await User.countDocuments({ isStaffAccount: true });
    const activeStaff = await User.countDocuments({ isStaffAccount: true, status: 'active' });
    const inactiveStaff = await User.countDocuments({ isStaffAccount: true, status: 'inactive' });
    const suspendedStaff = await User.countDocuments({ isStaffAccount: true, status: 'suspended' });

    // Get role distribution
    const roleDistribution = await User.aggregate([
      { $match: { isStaffAccount: true } },
      { $group: { _id: '$staffRole', count: { $sum: 1 } } }
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentLogins = await User.countDocuments({
      isStaffAccount: true,
      lastLogin: { $gte: sevenDaysAgo }
    });

    const analytics = {
      overview: {
        totalStaff,
        activeStaff,
        inactiveStaff,
        suspendedStaff
      },
      roleDistribution,
      recentActivity: {
        recentLogins,
        period: '7 days'
      }
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (err) {
    console.error('Error getting staff analytics:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve staff analytics',
      message: `Failed to fetch staff analytics: ${err.message}`
    });
  }
};
