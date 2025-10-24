const Employee = require('../models/Employee');
const Department = require('../models/Department');
const User = require('../models/users');
const bcrypt = require('bcryptjs');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Staff
 *     description: Manage super admin employees (staff who can access the super admin system)
 */

/**
 * @swagger
 * /api/admin/staff/users:
 *   get:
 *     summary: 👥 GET ALL SUPER ADMIN EMPLOYEES (STAFF)
 *     description: |
 *       **SUPER ADMIN ONLY: This endpoint retrieves all super admin employees (staff) who can access the super admin system.**
 *       
 *       **Important Notes:**
 *       - These are NOT organization users
 *       - These are staff members who manage the super admin system
 *       - Returns employees with populated department information
 *       - Sorted by creation date (newest first)
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, suspended, terminated] }
 *         description: Filter by employee status
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *         description: Filter by department ID
 *     responses:
 *       200: 
 *         description: ✅ Successfully retrieved all super admin employees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 employees:
 *                   type: array
 *                   description: "List of all super admin employees with department info"
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id: { type: string, example: "507f1f77bcf86cd799439011" }
 *                       fullName: { type: string, example: "John Doe" }
 *                       email: { type: string, example: "john.doe@company.com" }
 *                       employeeId: { type: string, example: "Mb001Z" }
 *                       department: { type: object, description: "Populated department information" }
 *                       status: { type: string, enum: ["active", "suspended", "terminated"], example: "active" }
 *                       roleTitle: { type: string, example: "Senior Developer" }
 *       400:
 *         description: ❌ Bad Request - Invalid query parameters
 *       500:
 *         description: ❌ Internal Server Error
 */
exports.listStaff = async (req, res, next) => {
  try {
    const { status, department } = req.query;
    const q = {};
    if (status) q.status = status;
    if (department) q.department = department;
    
    const employees = await Employee.find(q)
      .populate('department', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, employees });
  } catch (err) {
    console.error('Error listing staff employees:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid query parameters',
        message: 'The query parameters provided are not in the correct format'
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve staff employees',
      message: 'An error occurred while fetching staff employee data. Please try again.'
    });
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
    if (!['active', 'suspended', 'terminated'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status',
        message: 'Status must be one of: active, suspended, terminated'
      });
    }
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    ).populate('department', 'name');
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found',
        message: 'The employee you are trying to update does not exist'
      });
    }
    
    res.status(200).json({ success: true, employee });
  } catch (err) {
    console.error('Error updating employee status:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid employee ID format',
        message: 'The employee ID provided is not in the correct format'
      });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation Error',
        message: err.message 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update employee status',
      message: 'An error occurred while updating the employee status. Please try again.'
    });
  }
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
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid password',
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Find the employee first
    const employee = await Employee.findById(req.params.id).populate('user');
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found',
        message: 'The employee you are trying to update does not exist'
      });
    }
    
    if (!employee.user) {
      return res.status(400).json({ 
        success: false, 
        error: 'No user account',
        message: 'This employee does not have an associated user account'
      });
    }
    
    // Update the password on the associated user account
    employee.user.password = await bcrypt.hash(newPassword, 12);
    employee.user.passwordChangedAt = new Date();
    await employee.user.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Password updated successfully for employee'
    });
  } catch (err) {
    console.error('Error setting employee password:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid employee ID format',
        message: 'The employee ID provided is not in the correct format'
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update password',
      message: 'An error occurred while updating the password. Please try again.'
    });
  }
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
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid parameter',
        message: 'enabled must be a boolean value (true or false)'
      });
    }
    
    // Find the employee first
    const employee = await Employee.findById(req.params.id).populate('user');
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found',
        message: 'The employee you are trying to update does not exist'
      });
    }
    
    if (!employee.user) {
      return res.status(400).json({ 
        success: false, 
        error: 'No user account',
        message: 'This employee does not have an associated user account'
      });
    }
    
    // Update the two-factor setting on the associated user account
    employee.user.twoFactorEnabled = enabled;
    await employee.user.save();
    
    res.status(200).json({ 
      success: true, 
      message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
      employee: {
        _id: employee._id,
        fullName: employee.fullName,
        email: employee.email,
        twoFactorEnabled: enabled
      }
    });
  } catch (err) {
    console.error('Error toggling two-factor authentication:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid employee ID format',
        message: 'The employee ID provided is not in the correct format'
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update two-factor authentication',
      message: 'An error occurred while updating two-factor authentication. Please try again.'
    });
  }
};

















