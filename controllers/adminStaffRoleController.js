const StaffRole = require('../models/StaffRole');  
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { createDefaultPermissions, validatePermissions } = require('../services/staffPermissionService');

/**
 * @swagger
 * tags:
 *   - name: Admin Staff Roles
 *     description: Staff role management for nexusfinal2
 */

/**
 * @swagger
 * /api/admin/staff-roles:
 *   get:
 *     summary: List all staff roles
 *     tags: [Admin Staff Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roleType
 *         schema:
 *           type: string
 *           enum: [system, custom]
 *         description: Filter by role type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of staff roles
 */
exports.listStaffRoles = async (req, res, next) => {
  try {
    const { roleType, isActive } = req.query;
    
    let query = {};
    
    if (roleType) {
      query.roleType = roleType;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const staffRoles = await StaffRole.find(query)
      .populate('createdBy', 'fullName email')
      .sort({ level: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: staffRoles.length,
      data: staffRoles
    });
  } catch (err) {
    console.error('Error listing staff roles:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve staff roles',
      message: `Failed to fetch staff roles: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff-roles:
 *   post:
 *     summary: Create new staff role
 *     tags: [Admin Staff Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name
 *               description:
 *                 type: string
 *                 description: Role description
 *               permissions:
 *                 type: object
 *                 description: Module permissions
 *               level:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Role hierarchy level
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Staff role created successfully
 */
exports.createStaffRole = async (req, res, next) => {
  try {
    const { name, description, permissions, level, isActive = true } = req.body;

    // Validate required fields
    if (!name || !description || !permissions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, description, and permissions are required'
      });
    }

    // Validate permissions structure
    if (!validatePermissions(permissions)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid permissions',
        message: 'Permissions structure is invalid'
      });
    }

    // Check if role name already exists
    const existingRole = await StaffRole.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        error: 'Role name already exists',
        message: `Role with name '${name}' already exists`
      });
    }

    // Create staff role
    const staffRole = await StaffRole.create({
      name,
      description,
      permissions,
      level: level || 5,
      isActive,
      createdBy: req.user.id,
      roleType: 'custom'
    });

    res.status(201).json({
      success: true,
      data: staffRole,
      message: 'Staff role created successfully'
    });
  } catch (err) {
    console.error('Error creating staff role:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create staff role',
      message: `Failed to create staff role: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff-roles/{id}:
 *   get:
 *     summary: Get staff role by ID
 *     tags: [Admin Staff Roles]
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
 *         description: Staff role details
 */
exports.getStaffRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const staffRole = await StaffRole.findById(id)
      .populate('createdBy', 'fullName email');

    if (!staffRole) {
      return res.status(404).json({
        success: false,
        error: 'Staff role not found',
        message: 'Staff role not found'
      });
    }

    res.status(200).json({
      success: true,
      data: staffRole
    });
  } catch (err) {
    console.error('Error getting staff role:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve staff role',
      message: `Failed to fetch staff role: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff-roles/{id}:
 *   put:
 *     summary: Update staff role
 *     tags: [Admin Staff Roles]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: object
 *               level:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Staff role updated successfully
 */
exports.updateStaffRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, level, isActive } = req.body;

    const staffRole = await StaffRole.findById(id);

    if (!staffRole) {
      return res.status(404).json({
        success: false,
        error: 'Staff role not found',
        message: 'Staff role not found'
      });
    }

    // Check if trying to update system role
    if (staffRole.roleType === 'system') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify system role',
        message: 'System roles cannot be modified'
      });
    }

    // Check if name already exists (if changing name)
    if (name && name !== staffRole.name) {
      const existingRole = await StaffRole.findOne({ name, _id: { $ne: id } });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          error: 'Role name already exists',
          message: `Role with name '${name}' already exists`
        });
      }
    }

    // Validate permissions if provided
    if (permissions && !validatePermissions(permissions)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid permissions',
        message: 'Permissions structure is invalid'
      });
    }

    // Update fields
    if (name) staffRole.name = name;
    if (description) staffRole.description = description;
    if (permissions) staffRole.permissions = permissions;
    if (level !== undefined) staffRole.level = level;
    if (isActive !== undefined) staffRole.isActive = isActive;

    await staffRole.save();

    res.status(200).json({
      success: true,
      data: staffRole,
      message: 'Staff role updated successfully'
    });
  } catch (err) {
    console.error('Error updating staff role:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update staff role',
      message: `Failed to update staff role: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff-roles/{id}:
 *   delete:
 *     summary: Delete staff role
 *     tags: [Admin Staff Roles]
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
 *         description: Staff role deleted successfully
 */
exports.deleteStaffRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const staffRole = await StaffRole.findById(id);

    if (!staffRole) {
      return res.status(404).json({
        success: false,
        error: 'Staff role not found',
        message: 'Staff role not found'
      });
    }

    // Check if trying to delete system role
    if (staffRole.roleType === 'system') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete system role',
        message: 'System roles cannot be deleted'
      });
    }

    // Check if role is in use
    const User = require('../models/users');
    const usersWithRole = await User.countDocuments({ staffRole: id });
    
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        error: 'Role in use',
        message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role`
      });
    }

    await StaffRole.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Staff role deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting staff role:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete staff role',
      message: `Failed to delete staff role: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/staff-roles/{id}/permissions:
 *   put:
 *     summary: Update staff role permissions
 *     tags: [Admin Staff Roles]
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
exports.updateStaffRolePermissions = async (req, res, next) => {
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

    // Validate permissions structure
    if (!validatePermissions(permissions)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid permissions',
        message: 'Permissions structure is invalid'
      });
    }

    const staffRole = await StaffRole.findById(id);

    if (!staffRole) {
      return res.status(404).json({
        success: false,
        error: 'Staff role not found',
        message: 'Staff role not found'
      });
    }

    // Check if trying to update system role
    if (staffRole.roleType === 'system') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify system role',
        message: 'System roles cannot be modified'
      });
    }

    // Update permissions
    staffRole.permissions = permissions;
    await staffRole.save();

    res.status(200).json({
      success: true,
      data: {
        id: staffRole._id,
        name: staffRole.name,
        permissions: staffRole.permissions
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
 * /api/admin/staff-roles/templates/default:
 *   get:
 *     summary: Get default permission templates
 *     tags: [Admin Staff Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default permission templates
 */
exports.getDefaultPermissionTemplates = async (req, res, next) => {
  try {
    const defaultPermissions = createDefaultPermissions();
    
    res.status(200).json({
      success: true,
      data: {
        defaultPermissions,
        modules: Object.keys(defaultPermissions)
      }
    });
  } catch (err) {
    console.error('Error getting default templates:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve default templates',
      message: `Failed to fetch default templates: ${err.message}`
    });
  }
};
