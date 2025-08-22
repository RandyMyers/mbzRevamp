const User = require('../models/users');
const Invitation = require('../models/invitation');
const Role = require('../models/role');
const bcrypt = require('bcryptjs');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Staff
 *     description: Manage staff users
 */

/**
 * @swagger
 * /api/admin/staff/users:
 *   get:
 *     summary: List staff users
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.listStaff = async (req, res, next) => {
  try {
    const { status, department } = req.query;
    const q = {};
    if (status) q.status = status;
    if (department) q.department = department;
    // Optional: filter by roles that are staff-like (if needed)
    const users = await User.find(q).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/staff/users/{id}/status:
 *   post:
 *     summary: Update staff user status (activate/deactivate)
 *     tags: [Admin Staff]
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200: { description: Updated }
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) throw new BadRequestError('invalid status');
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!user) throw new NotFoundError('user not found');
    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/staff/users/{id}/set-password:
 *   post:
 *     summary: Set a new password for a staff user
 *     tags: [Admin Staff]
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
 *             required: [newPassword]
 *             properties:
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Password updated }
 */
exports.setPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) throw new BadRequestError('newPassword must be at least 6 chars');
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('user not found');
    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();
    await user.save();
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/staff/users/{id}/twofactor:
 *   post:
 *     summary: Enable/disable two-factor for a user
 *     tags: [Admin Staff]
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
 *             required: [enabled]
 *             properties:
 *               enabled: { type: boolean }
 *     responses:
 *       200: { description: Updated }
 */
exports.toggleTwoFactor = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') throw new BadRequestError('enabled must be boolean');
    const user = await User.findByIdAndUpdate(req.params.id, { twoFactorEnabled: enabled }, { new: true }).select('-password');
    if (!user) throw new NotFoundError('user not found');
    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};









