const Department = require('../models/Department');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const PerformanceReview = require('../models/PerformanceReview');
const Payroll = require('../models/Payroll');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const HRFileUploadService = require('../services/hrFileUploadService');
const csv = require('csv-writer');
const path = require('path');

/**
 * @swagger
 * tags:
 *   - name: Admin HR
 *     description: Departments, Employees, Attendance
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Employee ID
 *         employeeId:
 *           type: string
 *           description: Employee ID (e.g., Mb001Z)
 *         firstName:
 *           type: string
 *           description: Employee first name
 *         lastName:
 *           type: string
 *           description: Employee last name
 *         fullName:
 *           type: string
 *           description: Employee full name
 *         email:
 *           type: string
 *           format: email
 *           description: Employee email address
 *         phone:
 *           type: string
 *           description: Employee phone number
 *         department:
 *           type: object
 *           description: Department information
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *         jobTitle:
 *           type: string
 *           description: Employee job title
 *         startDate:
 *           type: string
 *           format: date
 *           description: Employment start date
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended, terminated]
 *           description: Employee status
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *           description: Employee gender
 *         maritalStatus:
 *           type: string
 *           enum: [Single, Married, Divorced, Widowed]
 *           description: Marital status
 *         avatar:
 *           type: string
 *           description: Employee avatar URL
 *         emergencyContact:
 *           type: object
 *           description: Emergency contact information
 *           properties:
 *             name:
 *               type: string
 *             relationship:
 *               type: string
 *             phone:
 *               type: string
 *             address:
 *               type: string
 *         bankDetails:
 *           type: object
 *           description: Bank details
 *           properties:
 *             bankName:
 *               type: string
 *             accountName:
 *               type: string
 *             accountNumber:
 *               type: string
 *             accountType:
 *               type: string
 *             taxId:
 *               type: string
 *             taxState:
 *               type: string
 *             pensionNumber:
 *               type: string
 *         country:
 *           type: string
 *           description: Employee country
 *         employmentType:
 *           type: string
 *           enum: [Permanent, Contract, Intern, Part-time, Temporary]
 *           description: Employment type
 *         salary:
 *           type: number
 *           description: Employee salary
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     Department:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Department ID
 *         name:
 *           type: string
 *           description: Department name
 *         description:
 *           type: string
 *           description: Department description
 *         isActive:
 *           type: boolean
 *           description: Whether department is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
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
/**
 * @swagger
 * /api/admin/hr/employees:
 *   get:
 *     summary: List all employees
 *     description: Get a list of all employees with filtering and pagination options
 *     tags: [Admin HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of employees per page
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended, terminated]
 *         description: Filter by employee status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or employee ID
 *     responses:
 *       200:
 *         description: List of employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Total number of employees
 *                 employees:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */
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
 *     summary: Create new employee
 *     description: Create a new employee with all required information including personal details, emergency contact, and bank details
 *     tags: [Admin HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, department, jobTitle]
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Employee first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: Employee last name
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Employee email address
 *                 example: "john.doe@company.com"
 *               phone:
 *                 type: string
 *                 description: Employee phone number
 *                 example: "+1234567890"
 *               jobTitle:
 *                 type: string
 *                 description: Employee job title
 *                 example: "Software Developer"
 *               department:
 *                 type: string
 *                 description: Department ID
 *                 example: "507f1f77bcf86cd799439011"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Employment start date
 *                 example: "2024-01-15"
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *                 description: Employee gender
 *                 example: "Male"
 *               maritalStatus:
 *                 type: string
 *                 enum: [Single, Married, Divorced, Widowed]
 *                 description: Marital status
 *                 example: "Single"
 *               country:
 *                 type: string
 *                 description: Employee country
 *                 example: "United States"
 *               employmentType:
 *                 type: string
 *                 enum: [Permanent, Contract, Intern, Part-time, Temporary]
 *                 description: Employment type
 *                 example: "Permanent"
 *               salary:
 *                 type: number
 *                 description: Employee salary
 *                 example: 75000
 *               emergencyContact:
 *                 type: object
 *                 description: Emergency contact information
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Jane Doe"
 *                   relationship:
 *                     type: string
 *                     example: "Spouse"
 *                   phone:
 *                     type: string
 *                     example: "+1234567891"
 *                   address:
 *                     type: string
 *                     example: "123 Main St, City, State 12345"
 *               bankDetails:
 *                 type: object
 *                 description: Bank details
 *                 properties:
 *                   bankName:
 *                     type: string
 *                     example: "Chase Bank"
 *                   accountName:
 *                     type: string
 *                     example: "John Doe"
 *                   accountNumber:
 *                     type: string
 *                     example: "1234567890"
 *                   accountType:
 *                     type: string
 *                     example: "Checking"
 *                   taxId:
 *                     type: string
 *                     example: "123-45-6789"
 *                   taxState:
 *                     type: string
 *                     example: "CA"
 *                   pensionNumber:
 *                     type: string
 *                     example: "PEN123456"
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Employee avatar image file
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *                 message:
 *                   type: string
 *                   example: "Employee created successfully"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       409:
 *         description: Conflict - employee already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
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

/**
 * @swagger
 * /api/admin/hr/dashboard:
 *   get:
 *     summary: Get HR dashboard overview
 *     description: Retrieve comprehensive HR dashboard statistics and recent activities
 *     tags: [Admin HR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalEmployees:
 *                           type: number
 *                           example: 47
 *                         onLeave:
 *                           type: number
 *                           example: 3
 *                         pendingRequests:
 *                           type: number
 *                           example: 8
 *                         newHires:
 *                           type: number
 *                           example: 2
 *                         payrollStatus:
 *                           type: string
 *                           example: "In Progress"
 *                         performanceReviews:
 *                           type: number
 *                           example: 5
 *                         averageAttendance:
 *                           type: number
 *                           example: 95
 *                     activities:
 *                       type: object
 *                       properties:
 *                         leaveRequests:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               statusColor:
 *                                 type: string
 *                         upcomingReviews:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               statusColor:
 *                                 type: string
 *                         recentHires:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               statusColor:
 *                                 type: string
 *                 message:
 *                   type: string
 *                   example: "Dashboard data retrieved successfully"
 */
exports.getDashboardOverview = async (req, res, next) => {
  try {
    // Get current date and calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get basic statistics
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    const onLeave = await LeaveRequest.countDocuments({ 
      status: 'approved',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    const pendingRequests = await LeaveRequest.countDocuments({ status: 'pending' });
    const newHires = await Employee.countDocuments({ 
      startDate: { $gte: thirtyDaysAgo }
    });

    // Get payroll status (latest payroll record)
    const latestPayroll = await Payroll.findOne().sort({ createdAt: -1 });
    const payrollStatus = latestPayroll ? 'In Progress' : 'Not Started';

    // Get performance reviews due this month
    const performanceReviews = await PerformanceReview.countDocuments({
      scheduledAt: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1)
      }
    });

    // Calculate average attendance for last 30 days
    const attendanceRecords = await Attendance.find({
      date: { $gte: thirtyDaysAgo },
      checkInAt: { $exists: true }
    });
    
    const totalWorkDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(record => 
      record.status === 'present' || record.status === 'remote'
    ).length;
    const averageAttendance = totalWorkDays > 0 ? Math.round((presentDays / totalWorkDays) * 100) : 0;

    // Get recent activities
    const recentLeaveRequests = await LeaveRequest.find({ status: 'pending' })
      .populate('employee', 'fullName')
      .sort({ createdAt: -1 })
      .limit(3);

    const upcomingReviews = await PerformanceReview.find({
      scheduledAt: { $gte: now }
    })
      .populate('employee', 'fullName')
      .sort({ scheduledAt: 1 })
      .limit(3);

    const recentHires = await Employee.find({ 
      startDate: { $gte: thirtyDaysAgo }
    })
      .populate('department', 'name')
      .sort({ startDate: -1 })
      .limit(2);

    // Format activities
    const leaveRequests = recentLeaveRequests.map(request => ({
      name: request.employee.fullName,
      description: `${request.leaveType}: ${request.startDate.toLocaleDateString()}-${request.endDate.toLocaleDateString()}`,
      status: request.status,
      statusColor: request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                   request.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }));

    const upcomingReviewsList = upcomingReviews.map(review => ({
      name: review.employee.fullName,
      description: `${review.title}, ${review.scheduledAt.toLocaleDateString()}`,
      status: 'Scheduled',
      statusColor: 'bg-blue-100 text-blue-800'
    }));

    const recentHiresList = recentHires.map(hire => ({
      name: hire.fullName,
      description: `${hire.jobTitle}, started ${hire.startDate.toLocaleDateString()}`,
      status: 'Onboarding',
      statusColor: 'bg-purple-100 text-purple-800'
    }));

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalEmployees,
          onLeave,
          pendingRequests,
          newHires,
          payrollStatus,
          performanceReviews,
          averageAttendance
        },
        activities: {
          leaveRequests,
          upcomingReviews: upcomingReviewsList,
          recentHires: recentHiresList
        }
      },
      message: 'Dashboard data retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving dashboard data:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard data',
      message: `Failed to retrieve dashboard data: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/hr/attendance/calendar:
 *   get:
 *     summary: Get attendance calendar data
 *     description: Retrieve attendance data for calendar view by month
 *     tags: [Admin HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year for calendar data
 *         example: 2024
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Month for calendar data (1-12)
 *         example: 5
 *     responses:
 *       200:
 *         description: Calendar data retrieved successfully
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
 *                     year:
 *                       type: integer
 *                       example: 2024
 *                     month:
 *                       type: integer
 *                       example: 5
 *                     days:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           present:
 *                             type: number
 *                           absent:
 *                             type: number
 *                           late:
 *                             type: number
 *                           onLeave:
 *                             type: number
 *                           remote:
 *                             type: number
 *                           halfDay:
 *                             type: number
 *                 message:
 *                   type: string
 *                   example: "Calendar data retrieved successfully"
 */
exports.getAttendanceCalendar = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    
    // Create date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month
    
    // Get all attendance records for the month
    const attendanceRecords = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('employee', 'fullName department');

    // Group by date and count statuses
    const dailyStats = {};
    attendanceRecords.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = {
          present: 0,
          absent: 0,
          late: 0,
          onLeave: 0,
          remote: 0,
          halfDay: 0
        };
      }
      
      switch (record.status) {
        case 'present':
          dailyStats[dateStr].present++;
          break;
        case 'absent':
          dailyStats[dateStr].absent++;
          break;
        case 'late':
          dailyStats[dateStr].late++;
          break;
        case 'remote':
          dailyStats[dateStr].remote++;
          break;
        case 'half-day':
          dailyStats[dateStr].halfDay++;
          break;
      }
    });

    // Convert to array format
    const days = [];
    for (let day = 1; day <= endDate.getDate(); day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        ...(dailyStats[dateStr] || {
          present: 0,
          absent: 0,
          late: 0,
          onLeave: 0,
          remote: 0,
          halfDay: 0
        })
      });
    }

    res.status(200).json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        days
      },
      message: 'Calendar data retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving calendar data:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve calendar data',
      message: `Failed to retrieve calendar data: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/hr/attendance/export-csv:
 *   get:
 *     summary: Export attendance data to CSV
 *     description: Export attendance records to CSV format with filtering options
 *     tags: [Admin HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for export (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for export (YYYY-MM-DD)
 *         example: "2024-01-31"
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Department filter
 *         example: "engineering"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [present, absent, late, remote, half-day]
 *         description: Status filter
 *     responses:
 *       200:
 *         description: CSV file generated successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Bad request - invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */
exports.exportAttendanceCSV = async (req, res, next) => {
  try {
    const { startDate, endDate, department, status } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Start date and end date are required'
      });
    }

    // Build query
    let query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (status) {
      query.status = status;
    }

    // Get attendance records with employee and department info
    let attendanceRecords = await Attendance.find(query)
      .populate('employee', 'fullName employeeId')
      .populate('employee.department', 'name')
      .sort({ date: -1 });

    // Filter by department if specified
    if (department && department !== 'all') {
      attendanceRecords = attendanceRecords.filter(record => 
        record.employee.department && 
        record.employee.department.name.toLowerCase() === department.toLowerCase()
      );
    }

    if (attendanceRecords.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data found',
        message: 'No attendance records found for the specified criteria'
      });
    }

    // Prepare CSV data
    const csvData = attendanceRecords.map(record => ({
      'Employee ID': record.employee.employeeId || '',
      'Employee Name': record.employee.fullName || '',
      'Department': record.employee.department?.name || '',
      'Date': record.date.toISOString().split('T')[0],
      'Status': record.status || '',
      'Check In': record.checkInAt ? record.checkInAt.toLocaleTimeString() : '',
      'Check Out': record.checkOutAt ? record.checkOutAt.toLocaleTimeString() : '',
      'Work Hours': record.workHours || 0,
      'Break Duration (min)': record.breakDuration || 0,
      'Work Location': record.workLocation || 'Office',
      'Location': record.location || '',
      'Notes': record.notes || ''
    }));

    // Create CSV content
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Set response headers for file download
    const filename = `attendance_report_${startDate}_to_${endDate}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Error exporting attendance CSV:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to export attendance data',
      message: `Failed to export attendance data: ${err.message}`
    });
  }
};













