const Survey = require('../models/Survey');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Surveys
 *     description: Manage staff surveys
 */

/**
 * @swagger
 * /api/admin/hr/surveys:
 *   get:
 *     summary: List surveys
 *     tags: [Admin Surveys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
exports.listSurveys = async (req, res, next) => {
  try {
    const items = await Survey.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, surveys: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/surveys:
 *   post:
 *     summary: Create survey
 *     tags: [Admin Surveys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string }
 *               dueDate: { type: string, format: date-time }
 *               questions: { type: array }
 *               recipients: { type: array }
 *     responses:
 *       201: { description: Created }
 */
exports.createSurvey = async (req, res, next) => {
  try {
    if (!req.body.title) throw new BadRequestError('title required');
    const doc = await Survey.create(req.body);
    res.status(201).json({ success: true, survey: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/surveys/{id}:
 *   patch:
 *     summary: Update a survey
 *     tags: [Admin Surveys]
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
exports.updateSurvey = async (req, res, next) => {
  try {
    const doc = await Survey.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) throw new NotFoundError('survey not found');
    res.status(200).json({ success: true, survey: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/surveys/{id}/publish:
 *   post:
 *     summary: Publish a survey
 *     tags: [Admin Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Published }
 */
exports.publishSurvey = async (req, res, next) => {
  try {
    const doc = await Survey.findById(req.params.id);
    if (!doc) throw new NotFoundError('survey not found');
    doc.status = 'published';
    await doc.save();
    res.status(200).json({ success: true, survey: doc });
  } catch (err) { next(err); }
};









