const Department = require('../models/Department');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { BadRequestError, NotFoundError } = require('../utils/errors');

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
  } catch (err) { next(err); }
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
    if (!name) throw new BadRequestError('name is required');
    const dep = await Department.create({ name, description });
    res.status(201).json({ success: true, department: dep });
  } catch (err) { next(err); }
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
  } catch (err) { next(err); }
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
    await Department.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

// Employees
/**
 * @swagger
 * /api/admin/hr/employees:
 *   get:
 *     summary: List employees
 *     tags: [Admin HR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
exports.listEmployees = async (req, res, next) => {
  try {
    const items = await Employee.find({}).populate('department').sort({ createdAt: -1 });
    res.status(200).json({ success: true, employees: items });
  } catch (err) { next(err); }
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
 *     responses:
 *       201: { description: Created }
 */
exports.createEmployee = async (req, res, next) => {
  try {
    const { fullName, email } = req.body;
    if (!fullName || !email) throw new BadRequestError('fullName and email required');
    const emp = await Employee.create(req.body);
    res.status(201).json({ success: true, employee: emp });
  } catch (err) { next(err); }
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
    const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!emp) throw new NotFoundError('employee not found');
    res.status(200).json({ success: true, employee: emp });
  } catch (err) { next(err); }
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
    await Employee.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
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
      if (req.query.startDate) q.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) q.date.$lte = new Date(req.query.endDate);
    }
    const items = await Attendance.find(q).populate('employee').sort({ date: -1 });
    res.status(200).json({ success: true, attendance: items });
  } catch (err) { next(err); }
};

















