/**
 * @swagger
 * tags:
 *   - name: Roles
 *     description: Role management
 *
 * /api/roles:
 *   post:
 *     tags: [Roles]
 *     summary: Create a new role
 *     description: Creates a new role for the organization. Role names must be unique within each organization.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name (must be unique within organization)
 *                 example: "Manager"
 *                 minLength: 1
 *                 maxLength: 50
 *               description:
 *                 type: string
 *                 description: Role description
 *                 example: "Manages team members and projects"
 *                 maxLength: 200
 *               permissions:
 *                 type: object
 *                 description: Role permissions object
 *                 example: {
 *                   "user_management": true,
 *                   "project_access": true,
 *                   "reports_view": false
 *                 }
 *               Note: organizationId and userId are automatically retrieved from the authenticated user
 *     responses:
 *       201:
 *         description: Role created successfully
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
 *                   example: "Role created successfully"
 *                 role:
 *                   type: object
 *                   properties:
 *                     _id: { type: string, format: ObjectId }
 *                     name: { type: string }
 *                     description: { type: string }
 *                     permissions: { type: object }
 *                     organization: { type: string, format: ObjectId }
 *                     userId: { type: string, format: ObjectId }
 *                     createdAt: { type: string, format: date-time }
 *                     updatedAt: { type: string, format: date-time }
 *       400:
 *         description: Validation error or role already exists
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
 *                   example: "Role name already exists in this organization"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   get:
 *     tags: [Roles]
 *     summary: Get all roles
 *     responses:
 *       200: { description: Roles list }
 *       500: { description: Server error }
 *
 * /api/roles/{roleId}:
 *   get:
 *     tags: [Roles]
 *     summary: Get a role by ID
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Role }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *   patch:
 *     tags: [Roles]
 *     summary: Update a role
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               permissions: { type: array, items: { type: string } }
 *               organizationId: { type: string }
 *               userId: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *   delete:
 *     tags: [Roles]
 *     summary: Delete a role
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
const Role = require('../models/role');
const { createAuditLog } = require('../helpers/auditLogHelper');

// Create a new role
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    // ✅ VALIDATE REQUIRED FIELDS
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role name is required' 
      });
    }
    
    // ✅ GET USER ID FROM AUTHENTICATED USER
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID not found. Please ensure you are properly authenticated.' 
      });
    }
    
    // ✅ GET ORGANIZATION ID FROM AUTHENTICATED USER
    let organizationId = req.user?.organization || req.user?.organizationId;
    
    // If organization is not directly available, fetch user from database
    if (!organizationId) {
      console.log('🔍 Organization ID not found in req.user, fetching from database...');
      const User = require('../models/users');
      const user = await User.findById(userId).select('organization organizationId');
      organizationId = user?.organization || user?.organizationId;
    }
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User organization not found. Please ensure you are properly authenticated and belong to an organization.' 
      });
    }
    
    // ✅ CHECK IF ROLE NAME ALREADY EXISTS IN THIS ORGANIZATION (case-insensitive)
    const existingRole = await Role.findOne({
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      organization: organizationId
    });

    if (existingRole) {
      console.log(`⚠️ Role name conflict: Tried to create "${name}", found existing "${existingRole.name}" (ID: ${existingRole._id}) in org ${organizationId}`);
      return res.status(400).json({
        success: false,
        message: `Role "${existingRole.name}" already exists in this organization`
      });
    }

    // Debug: Log all existing roles in this organization
    const allRoles = await Role.find({ organization: organizationId }).select('name');
    console.log(`📋 Creating role "${name}" - Existing roles in org:`, allRoles.map(r => r.name));
    
    // ✅ CREATE NEW ROLE
    const role = new Role({ 
      name, 
      description, 
      permissions: permissions || {}, 
      organization: organizationId,
      userId: userId
    });
    
    await role.save();
    
    // ✅ AUDIT LOG
    try {
      await createAuditLog({
        action: 'Role Created',
        user: userId,
        resource: 'role',
        resourceId: role._id,
        details: {
          roleName: name,
          organizationId: organizationId,
          permissions: permissions
        },
        organization: organizationId
      });
    } catch (auditError) {
      console.error('Failed to create audit log for role creation:', auditError);
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Role created successfully',
      role 
    });
    
  } catch (error) {
    console.error('❌ Role creation error:', error);
    
    // ✅ HANDLE SPECIFIC MONGOOSE ERRORS
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role name already exists in this organization' 
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all roles for the authenticated user's organization
exports.getRoles = async (req, res) => {
  try {
    // ✅ GET USER ID FROM AUTHENTICATED USER
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID not found. Please ensure you are properly authenticated.' 
      });
    }
    
    // ✅ GET ORGANIZATION ID FROM AUTHENTICATED USER
    let organizationId = req.user?.organization || req.user?.organizationId;
    
    // If organization is not directly available, fetch user from database
    if (!organizationId) {
      console.log('🔍 Organization ID not found in req.user, fetching from database...');
      const User = require('../models/users');
      const user = await User.findById(userId).select('organization organizationId');
      organizationId = user?.organization || user?.organizationId;
    }
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User organization not found. Please ensure you are properly authenticated and belong to an organization.' 
      });
    }
    
    // ✅ GET ROLES FOR THE USER'S ORGANIZATION ONLY
    const roles = await Role.find({ organization: organizationId }).sort({ name: 1 });
    res.status(200).json({ success: true, roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch roles' });
  }
};

// Get a role by ID
exports.getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;
    const role = await Role.findById(roleId);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.status(200).json({ success: true, role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch role' });
  }
};

// Update a role
exports.updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description, permissions, organizationId, userId } = req.body;
    const role = await Role.findByIdAndUpdate(
      roleId,
      { name, description, permissions, organization: organizationId, userId: userId, updatedAt: Date.now() },
      { new: true }
    );
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

    // Audit logging
    await createAuditLog({
      action: 'Role Updated',
      user: req.user?._id || req.user?.userId,
      resource: 'role',
      resourceId: role._id,
      details: { name: role.name, description: role.description, permissions: role.permissions },
      organization: req.user?.organization || role.organization,
      severity: 'info',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({ success: true, role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
};

// Delete a role
exports.deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const role = await Role.findByIdAndDelete(roleId);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

    // Audit logging
    await createAuditLog({
      action: 'Role Deleted',
      user: req.user?._id || req.user?.userId,
      resource: 'role',
      resourceId: role._id,
      details: { name: role.name, permissions: role.permissions },
      organization: req.user?.organization || role.organization,
      severity: 'info',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({ success: true, message: 'Role deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete role' });
  }
}; 