const LeaveCategory = require('../models/LeaveCategory');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveRequest = require('../models/LeaveRequest');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Leave
 *     description: Leave categories, balances, and requests
 */

// Categories
/**
 * @swagger
 * /api/admin/hr/leave/categories:
 *   get:
 *     summary: List leave categories
 *     tags: [Admin Leave]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
exports.listLeaveCategories = async (req, res, next) => {
  try {
    const items = await LeaveCategory.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, categories: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/leave/categories:
 *   post:
 *     summary: Create leave category
 *     tags: [Admin Leave]
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
 *               color: { type: string }
 *               accrualRate: { type: string }
 *               carryOverPolicy: { type: string }
 *               carryOverDays: { type: number }
 *     responses:
 *       201: { description: Created }
 */
exports.createLeaveCategory = async (req, res, next) => {
  try {
    if (!req.body.name) throw new BadRequestError('name required');
    const cat = await LeaveCategory.create(req.body);
    res.status(201).json({ success: true, category: cat });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/leave/categories/{id}:
 *   patch:
 *     summary: Update leave category
 *     tags: [Admin Leave]
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
exports.updateLeaveCategory = async (req, res, next) => {
  try {
    const cat = await LeaveCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) throw new NotFoundError('category not found');
    res.status(200).json({ success: true, category: cat });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/leave/categories/{id}:
 *   delete:
 *     summary: Delete leave category
 *     tags: [Admin Leave]
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
exports.deleteLeaveCategory = async (req, res, next) => {
  try {
    await LeaveCategory.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

// Balances
/**
 * @swagger
 * /api/admin/hr/leave/balances:
 *   get:
 *     summary: List leave balances
 *     tags: [Admin Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employee
 *         schema: { type: string }
 *       - in: query
 *         name: year
 *         schema: { type: number }
 *     responses:
 *       200: { description: OK }
 */
exports.listLeaveBalances = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.employee) q.employee = req.query.employee;
    if (req.query.year) q.year = Number(req.query.year);
    const items = await LeaveBalance.find(q).populate('employee category').sort({ year: -1 });
    res.status(200).json({ success: true, balances: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/leave/balances:
 *   post:
 *     summary: Create or update leave balance
 *     tags: [Admin Leave]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee, category, year, totalDays]
 *             properties:
 *               employee: { type: string }
 *               category: { type: string }
 *               year: { type: number }
 *               totalDays: { type: number }
 *               usedDays: { type: number }
 *     responses:
 *       200: { description: Saved }
 */
exports.upsertLeaveBalance = async (req, res, next) => {
  try {
    const { employee, category, year, totalDays, usedDays } = req.body;
    if (!employee || !category || typeof year !== 'number' || typeof totalDays !== 'number') {
      throw new BadRequestError('employee, category, year, totalDays required');
    }
    const q = { employee, category, year };
    const update = { totalDays, usedDays: usedDays || 0 };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    const saved = await LeaveBalance.findOneAndUpdate(q, update, opts);
    res.status(200).json({ success: true, balance: saved });
  } catch (err) { next(err); }
};

// Requests
/**
 * @swagger
 * /api/admin/hr/leave/requests:
 *   get:
 *     summary: List leave requests
 *     tags: [Admin Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.listLeaveRequests = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    const items = await LeaveRequest.find(q).populate('employee category reviewedBy').sort({ createdAt: -1 });
    res.status(200).json({ success: true, requests: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/leave/requests/{id}/approve:
 *   post:
 *     summary: Approve a leave request
 *     tags: [Admin Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment: { type: string }
 *     responses:
 *       200: { description: Approved }
 */
exports.approveLeaveRequest = async (req, res, next) => {
  try {
    const reqDoc = await LeaveRequest.findById(req.params.id);
    if (!reqDoc) throw new NotFoundError('request not found');
    reqDoc.status = 'approved';
    reqDoc.reviewComment = req.body?.comment || '';
    reqDoc.reviewedBy = req.user?._id;
    await reqDoc.save();

    // Auto-adjust leave balance for the employee and category, current year
    try {
      const year = new Date(reqDoc.startDate).getFullYear();
      const days = Math.max(1, Math.ceil((new Date(reqDoc.endDate) - new Date(reqDoc.startDate)) / (1000 * 60 * 60 * 24)) + 1);
      const balance = await LeaveBalance.findOne({ employee: reqDoc.employee, category: reqDoc.category, year });
      if (balance) {
        balance.usedDays = Math.min((balance.usedDays || 0) + days, balance.totalDays);
        await balance.save();
      }
    } catch (adjErr) {
      console.warn('⚠️  Failed to auto-adjust leave balance:', adjErr.message);
    }
    res.status(200).json({ success: true, request: reqDoc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/leave/requests/{id}/reject:
 *   post:
 *     summary: Reject a leave request
 *     tags: [Admin Leave]
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
 *             required: [comment]
 *             properties:
 *               comment: { type: string }
 *     responses:
 *       200: { description: Rejected }
 */
exports.rejectLeaveRequest = async (req, res, next) => {
  try {
    const reqDoc = await LeaveRequest.findById(req.params.id);
    if (!reqDoc) throw new NotFoundError('request not found');
    if (!req.body?.comment) throw new BadRequestError('comment is required');
    reqDoc.status = 'rejected';
    reqDoc.reviewComment = req.body.comment;
    reqDoc.reviewedBy = req.user?._id;
    await reqDoc.save();
    res.status(200).json({ success: true, request: reqDoc });
  } catch (err) { next(err); }
};


