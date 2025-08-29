const Document = require('../models/Document');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Documents
 *     description: Manage HR documents
 */

/**
 * @swagger
 * /api/admin/hr/documents:
 *   get:
 *     summary: List documents
 *     tags: [Admin Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.listDocuments = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    const items = await Document.find(q).sort({ createdAt: -1 });
    res.status(200).json({ success: true, documents: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/documents:
 *   post:
 *     summary: Upload or register a document
 *     tags: [Admin Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, fileUrl]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               fileUrl: { type: string }
 *               fileType: { type: string }
 *               fileSizeBytes: { type: number }
 *               tags: { type: array, items: { type: string } }
 *               visibility: { type: string }
 *               assignedTo: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Created }
 */
exports.createDocument = async (req, res, next) => {
  try {
    const { title, fileUrl } = req.body;
    if (!title || !fileUrl) throw new BadRequestError('title and fileUrl required');
    const payload = { ...req.body, uploadedBy: req.user && req.user._id ? req.user._id : undefined };
    const doc = await Document.create(payload);
    res.status(201).json({ success: true, document: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/documents/{id}:
 *   patch:
 *     summary: Update a document
 *     tags: [Admin Documents]
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
exports.updateDocument = async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) throw new NotFoundError('document not found');
    res.status(200).json({ success: true, document: doc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Admin Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) throw new NotFoundError('document not found');
    res.status(204).send();
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/documents/{id}/assign:
 *   post:
 *     summary: Assign a document to employees
 *     tags: [Admin Documents]
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
 *             required: [assignedTo]
 *             properties:
 *               assignedTo: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Assigned }
 */
exports.assignDocument = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    if (!Array.isArray(assignedTo)) throw new BadRequestError('assignedTo must be an array');
    const doc = await Document.findById(req.params.id);
    if (!doc) throw new NotFoundError('document not found');
    doc.assignedTo = assignedTo;
    await doc.save();
    res.status(200).json({ success: true, document: doc });
  } catch (err) { next(err); }
};

















