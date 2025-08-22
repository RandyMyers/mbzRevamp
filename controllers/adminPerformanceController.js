const PerformanceReview = require('../models/PerformanceReview');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Performance
 *     description: Manage performance reviews
 */

/**
 * @swagger
 * /api/admin/hr/performance-reviews:
 *   get:
 *     summary: List performance reviews
 *     tags: [Admin Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employee
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.listReviews = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.employee) q.employee = req.query.employee;
    const items = await PerformanceReview.find(q).populate('employee reviewer').sort({ scheduledAt: -1 });
    res.status(200).json({ success: true, reviews: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/performance-reviews:
 *   post:
 *     summary: Schedule a performance review
 *     tags: [Admin Performance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee, reviewer, scheduledAt]
 *             properties:
 *               employee: { type: string }
 *               reviewer: { type: string }
 *               title: { type: string }
 *               scheduledAt: { type: string, format: date-time }
 *               locationType: { type: string }
 *               meetingLink: { type: string }
 *     responses:
 *       201: { description: Created }
 */
exports.createReview = async (req, res, next) => {
  try {
    const { employee, reviewer, scheduledAt } = req.body;
    if (!employee || !reviewer || !scheduledAt) throw new BadRequestError('employee, reviewer, scheduledAt required');
    const doc = await PerformanceReview.create(req.body);
    res.status(201).json({ success: true, review: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/performance-reviews/{id}:
 *   patch:
 *     summary: Update a performance review
 *     tags: [Admin Performance]
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
exports.updateReview = async (req, res, next) => {
  try {
    const doc = await PerformanceReview.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) throw new NotFoundError('review not found');
    res.status(200).json({ success: true, review: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/performance-reviews/{id}/acknowledge:
 *   post:
 *     summary: Acknowledge a completed performance review
 *     tags: [Admin Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Acknowledged }
 */
exports.acknowledgeReview = async (req, res, next) => {
  try {
    const doc = await PerformanceReview.findById(req.params.id);
    if (!doc) throw new NotFoundError('review not found');
    doc.acknowledged = true;
    await doc.save();
    res.status(200).json({ success: true, review: doc });
  } catch (err) { next(err); }
};









