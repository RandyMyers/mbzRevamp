const Training = require('../models/Training');
const TrainingEnrollment = require('../models/TrainingEnrollment');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Training
 *     description: Manage staff trainings and enrollments
 */

// Trainings
/**
 * @swagger
 * /api/admin/hr/trainings:
 *   get:
 *     summary: List trainings
 *     tags: [Admin Training]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
exports.listTrainings = async (req, res, next) => {
  try {
    const items = await Training.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, trainings: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/trainings:
 *   post:
 *     summary: Create a training
 *     tags: [Admin Training]
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
 *               status: { type: string }
 *     responses:
 *       201: { description: Created }
 */
exports.createTraining = async (req, res, next) => {
  try {
    if (!req.body.name) throw new BadRequestError('name required');
    const doc = await Training.create({ ...req.body, createdBy: req.user?._id });
    res.status(201).json({ success: true, training: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/trainings/{id}:
 *   patch:
 *     summary: Update training
 *     tags: [Admin Training]
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
exports.updateTraining = async (req, res, next) => {
  try {
    const doc = await Training.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) throw new NotFoundError('training not found');
    res.status(200).json({ success: true, training: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/trainings/{id}:
 *   delete:
 *     summary: Delete training
 *     tags: [Admin Training]
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
exports.deleteTraining = async (req, res, next) => {
  try {
    await Training.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

// Materials (simple append)
/**
 * @swagger
 * /api/admin/hr/trainings/{id}/materials:
 *   post:
 *     summary: Add training material
 *     tags: [Admin Training]
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
 *             required: [title, type, url]
 *             properties:
 *               title: { type: string }
 *               type: { type: string }
 *               url: { type: string }
 *     responses:
 *       200: { description: Added }
 */
exports.addTrainingMaterial = async (req, res, next) => {
  try {
    const { title, type, url } = req.body;
    if (!title || !type || !url) throw new BadRequestError('title, type, url required');
    const doc = await Training.findById(req.params.id);
    if (!doc) throw new NotFoundError('training not found');
    doc.materials.push({ title, type, url });
    await doc.save();
    res.status(200).json({ success: true, training: doc });
  } catch (err) { next(err); }
};

// Enrollments
/**
 * @swagger
 * /api/admin/hr/trainings/{id}/enroll:
 *   post:
 *     summary: Enroll an employee into training
 *     tags: [Admin Training]
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
 *             required: [employee]
 *             properties:
 *               employee: { type: string }
 *     responses:
 *       200: { description: Enrolled }
 */
exports.enrollTraining = async (req, res, next) => {
  try {
    const { employee } = req.body;
    if (!employee) throw new BadRequestError('employee required');
    const saved = await TrainingEnrollment.create({ employee, training: req.params.id });
    res.status(200).json({ success: true, enrollment: saved });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/trainings/{id}/complete:
 *   post:
 *     summary: Mark an enrollment as completed
 *     tags: [Admin Training]
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
 *             required: [employee]
 *             properties:
 *               employee: { type: string }
 *               certificateUrl: { type: string }
 *     responses:
 *       200: { description: Completed }
 */
exports.completeTraining = async (req, res, next) => {
  try {
    const { employee, certificateUrl } = req.body;
    if (!employee) throw new BadRequestError('employee required');
    const doc = await TrainingEnrollment.findOneAndUpdate(
      { employee, training: req.params.id },
      { status: 'completed', certificateUrl: certificateUrl || '' },
      { new: true }
    );
    if (!doc) throw new NotFoundError('enrollment not found');
    res.status(200).json({ success: true, enrollment: doc });
  } catch (err) { next(err); }
};









