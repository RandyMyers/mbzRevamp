const Project = require('../models/Project');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Projects
 *     description: Manage projects
 */

/**
 * @swagger
 * /api/admin/projects:
 *   get:
 *     summary: List projects
 *     tags: [Admin Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.listProjects = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.organizationId) q.organizationId = req.query.organizationId;
    if (req.query.status) q.status = req.query.status;
    const items = await Project.find(q).populate('owner members', 'fullName email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, projects: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/projects:
 *   post:
 *     summary: Create a project
 *     tags: [Admin Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, owner]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *               owner: { type: string }
 *               members: { type: array, items: { type: string } }
 *               organizationId: { type: string }
 *     responses:
 *       201: { description: Created }
 */
exports.createProject = async (req, res, next) => {
  try {
    const { name, owner } = req.body;
    if (!name || !owner) throw new BadRequestError('name and owner required');
    const doc = await Project.create(req.body);
    res.status(201).json({ success: true, project: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/projects/{id}:
 *   patch:
 *     summary: Update a project
 *     tags: [Admin Projects]
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
exports.updateProject = async (req, res, next) => {
  try {
    const doc = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) throw new NotFoundError('project not found');
    res.status(200).json({ success: true, project: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Admin Projects]
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
exports.deleteProject = async (req, res, next) => {
  try {
    const doc = await Project.findByIdAndDelete(req.params.id);
    if (!doc) throw new NotFoundError('project not found');
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};












