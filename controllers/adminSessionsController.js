const Session = require('../models/Session');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Sessions
 *     description: Manage active user sessions
 */

/**
 * @swagger
 * /api/admin/sessions:
 *   get:
 *     summary: List sessions (optionally by user)
 *     tags: [Admin Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.listSessions = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.userId) q.user = req.query.userId;
    const items = await Session.find(q).sort({ createdAt: -1 });
    res.status(200).json({ success: true, sessions: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/sessions/{id}/revoke:
 *   post:
 *     summary: Revoke a session
 *     tags: [Admin Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Revoked }
 */
exports.revokeSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) throw new NotFoundError('session not found');
    session.revokedAt = new Date();
    session.revokedBy = req.user?._id || null;
    await session.save();
    res.status(200).json({ success: true, session });
  } catch (err) { next(err); }
};









