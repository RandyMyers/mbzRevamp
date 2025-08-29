const EmployeeRequest = require('../models/EmployeeRequest');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Employee Requests
 *     description: Manage employee requests (expense, equipment, advance, adjustment, profile updates)
 */

/**
 * @swagger
 * /api/admin/hr/requests:
 *   get:
 *     summary: List employee requests
 *     tags: [Admin Employee Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.listRequests = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.type) q.type = req.query.type;
    if (req.query.status) q.status = req.query.status;
    const items = await EmployeeRequest.find(q).populate('employee reviewedBy comments.user').sort({ createdAt: -1 });
    res.status(200).json({ success: true, requests: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/requests/{id}:
 *   get:
 *     summary: Get a specific employee request
 *     tags: [Admin Employee Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.getRequest = async (req, res, next) => {
  try {
    const doc = await EmployeeRequest.findById(req.params.id).populate('employee reviewedBy comments.user');
    if (!doc) throw new NotFoundError('request not found');
    res.status(200).json({ success: true, request: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/requests/{id}/approve:
 *   post:
 *     summary: Approve an employee request
 *     tags: [Admin Employee Requests]
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
exports.approveRequest = async (req, res, next) => {
  try {
    const doc = await EmployeeRequest.findById(req.params.id);
    if (!doc) throw new NotFoundError('request not found');
    doc.status = 'approved';
    if (req.body?.comment) {
      doc.comments.push({ user: req.user?._id, text: req.body.comment });
    }
    doc.reviewedBy = req.user?._id;
    await doc.save();
    res.status(200).json({ success: true, request: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/requests/{id}/reject:
 *   post:
 *     summary: Reject an employee request
 *     tags: [Admin Employee Requests]
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
exports.rejectRequest = async (req, res, next) => {
  try {
    if (!req.body?.comment) throw new BadRequestError('comment is required');
    const doc = await EmployeeRequest.findById(req.params.id);
    if (!doc) throw new NotFoundError('request not found');
    doc.status = 'rejected';
    doc.comments.push({ user: req.user?._id, text: req.body.comment });
    doc.reviewedBy = req.user?._id;
    await doc.save();
    res.status(200).json({ success: true, request: doc });
  } catch (err) { next(err); }
};

















