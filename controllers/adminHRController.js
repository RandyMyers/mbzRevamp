const Department = require('../models/Department');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const HRFileUploadService = require('../services/hrFileUploadService');

/**
 * @swagger
 * tags:
 *   - name: Admin HR
 *     description: Departments, Employees, Attendance
 */

// Departments
/**
 * @swagger
 * /api/admin/hr/departments:
 *   get:
 *     summary: List departments
 *     tags: [Admin HR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
exports.listDepartments = async (req, res, next) => {
  try {
    const items = await Department.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, departments: items });
  } catch (err) {
    console.error('Error listing departments:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve departments',
      message: `Failed to fetch departments: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/hr/departments:
 *   post:
 *     summary: Create department
 *     tags: [Admin HR]
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
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201: { description: Created }
 */
exports.createDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field',
        message: 'Department name is required'
      });
    }
    
    // Check if department with this name already exists
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return res.status(409).json({ 
        success: false, 
        error: 'Department already exists',
        message: 'A department with this name already exists'
      });
    }
    
    const dep = await Department.create({ name, description });
    res.status(201).json({ success: true, department: dep });
  } catch (err) {
    console.error('Error creating department:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    if (err.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        error: 'Duplicate entry',
        message: 'A department with this name already exists'
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create department',
      message: `Failed to create department: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/hr/departments/{id}:
 *   patch:
 *     summary: Update department
 *     tags: [Admin HR]
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
 *           schema: { type: object }
 *     responses:
 *       200: { description: Updated }
 */
exports.updateDepartment = async (req, res, next) => {
  try {
    const dep = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dep) throw new NotFoundError('department not found');
    res.status(200).json({ success: true, department: dep });
  } catch (err) {
    console.error('Error updating department:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid department ID format',
        message: 'The department ID provided is not in the correct format'
      });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation Error',
        message: err.message 
      });
    }
    if (err.name === 'NotFoundError') {
      return res.status(404).json({ 
        success: false, 
        error: 'Department not found',
        message: err.message 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update department',
      message: `Failed to update department: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/hr/departments/{id}:
 *   delete:
 *     summary: Delete department
 *     tags: [Admin HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
exports.deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ 
        success: false, 
        error: 'Department not found',
        message: 'The department you are trying to delete does not exist'
      });
    }
    res.status(200).json({ success: true, message: 'Department deleted successfully' });
  } catch (err) {
    console.error('Error deleting department:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid department ID format',
        message: 'The department ID provided is not in the correct format'
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete department',
      message: `Failed to delete department: ${err.message}`
    });
  }
};

// Employees
exports.listEmployees = async (req, res, next) => {
  try {
    const items = await Employee.find({}).populate('department').sort({ createdAt: -1 });
    res.status(200).json({ success: true, employees: items });
  } catch (err) {
    console.error('Error listing employees:', err);
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
      error: 'Failed to retrieve employees',
      message: `Failed to fetch employees: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/hr/employees:
 *   post:
 *     summary: Create employee
 *     tags: [Admin HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email]
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string }
 *               department: { type: string }
 *               roleTitle: { type: string }
 *               status: { type: string }
 *               taxState: { 
 *                 type: string,
 *                 description: 'Tax state/province for staff members (any country)',
 *                 example: 'California'
 *               }
 *               salary: { type: number }
 *               bankDetails: { 
 *                 type: object,
 *                 properties: {
 *                   bankName: { type: string },
 *                   accountNumber: { type: string },
 *                   accountName: { type: string }
 *                 }
 *               }
 *               emergencyContacts: {
 *                 type: array,
 *                 items: {
 *                   type: object,
 *                   properties: {
 *                     name: { type: string },
 *                     phone: { type: string },
 *                     relationship: { type: string }
 *                   }
 *                 }
 *               }
 *     responses:
 *       201: { description: Created }
 */
exports.createEmployee = async (req, res, next) => {
  try {
    const { fullName, email, firstName, lastName, phone, jobTitle, department, gender, maritalStatus } = req.body;
    if (!fullName || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields',
        message: 'Full name and email are required to create an employee'
      });
    }
    
    // Check if employee with this email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(409).json({ 
        success: false, 
        error: 'Employee already exists',
        message: 'An employee with this email address already exists'
      });
    }
    
    // Generate the next employee ID
    const employeeId = await Employee.generateEmployeeId();
    
    // Handle avatar upload if provided
    let avatarUrl = null;
    if (req.files && req.files.avatar) {
      try {
        const uploadResult = await HRFileUploadService.uploadEmployeeAvatar(req.files.avatar, employeeId);
        avatarUrl = uploadResult.url;
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          error: 'Avatar upload failed',
          message: uploadError.message
        });
      }
    }
    
    // Create employee with auto-generated ID and avatar
    const employeeData = {
      fullName,
      email,
      firstName: firstName || fullName.split(' ')[0],
      lastName: lastName || fullName.split(' ').slice(1).join(' '),
      phone,
      jobTitle,
      department,
      gender,
      maritalStatus,
      avatar: avatarUrl,
      employeeId: employeeId
    };
    
    const emp = await Employee.create(employeeData);
    res.status(201).json({ success: true, employee: emp });
  } catch (err) {
    console.error('Error creating employee:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    if (err.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        error: 'Duplicate entry',
        message: 'An employee with this information already exists'
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create employee',
      message: `Failed to create employee: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/hr/employees/{id}:
 *   patch:
 *     summary: Update employee
 *     tags: [Admin HR]
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
 *           schema: { type: object }
 *     responses:
 *       200: { description: Updated }
 */
exports.updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid employee ID',
        message: 'The employee ID provided is not in the correct format'
      });
    }
    
    // Get current employee to check if avatar exists
    const currentEmployee = await Employee.findById(id);
    if (!currentEmployee) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found',
        message: 'No employee found with the provided ID'
      });
    }
    
    // Handle avatar upload if provided
    let updateData = { ...req.body };
    if (req.files && req.files.avatar) {
      try {
        const uploadResult = await HRFileUploadService.uploadEmployeeAvatar(req.files.avatar, currentEmployee.employeeId);
        updateData.avatar = uploadResult.url;
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          error: 'Avatar upload failed',
          message: uploadError.message
        });
      }
    }
    
    const emp = await Employee.findByIdAndUpdate(id, updateData, { new: true });
    
    res.status(200).json({ success: true, employee: emp });
  } catch (err) {
    console.error('Error updating employee:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid data format',
        message: 'One or more fields contain invalid data'
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update employee',
      message: `Failed to update employee: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/hr/employees/{id}:
 *   delete:
 *     summary: Delete employee
 *     tags: [Admin HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
exports.deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid employee ID',
        message: 'The employee ID provided is not in the correct format'
      });
    }
    
    const emp = await Employee.findByIdAndDelete(id);
    if (!emp) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found',
        message: 'No employee found with the provided ID'
      });
    }
    
    res.status(200).json({ success: true, message: 'Employee deleted successfully' });
  } catch (err) {
    console.error('Error deleting employee:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid employee ID',
        message: 'The employee ID provided is not in the correct format'
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete employee',
      message: `Failed to delete employee: ${err.message}`
    });
  }
};

// Attendance
/**
 * @swagger
 * /api/admin/hr/attendance:
 *   get:
 *     summary: List attendance records
 *     tags: [Admin HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employee
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: OK }
 */
exports.listAttendance = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.employee) q.employee = req.query.employee;
    if (req.query.startDate || req.query.endDate) {
      q.date = {};
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ 
            success: false, 
            error: 'Invalid date format',
            message: 'Start date must be in a valid date format (YYYY-MM-DD)'
          });
        }
        q.date.$gte = startDate;
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ 
            success: false, 
            error: 'Invalid date format',
            message: 'End date must be in a valid date format (YYYY-MM-DD)'
          });
        }
        q.date.$lte = endDate;
      }
    }
    const items = await Attendance.find(q).populate('employee').sort({ date: -1 });
    res.status(200).json({ success: true, attendance: items });
  } catch (err) {
    console.error('Error listing attendance:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid employee ID',
        message: 'The employee ID provided is not in the correct format'
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve attendance records',
      message: `Failed to fetch attendance: ${err.message}`
    });
  }
};

















