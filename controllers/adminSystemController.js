const SystemSetting = require('../models/SystemSetting');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const axios = require('axios');

/**
 * @swagger
 * tags:
 *   - name: Admin System
 *     description: Global system settings (feature flags, security policies)
 */

/**
 * @swagger
 * /api/admin/system/settings:
 *   get:
 *     summary: List all system settings
 *     tags: [Admin System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
exports.listSettings = async (req, res, next) => {
  try {
    const items = await SystemSetting.find({}).sort({ key: 1 });
    res.status(200).json({ success: true, settings: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/system/settings:
 *   post:
 *     summary: Upsert a system setting
 *     tags: [Admin System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key, value]
 *             properties:
 *               key: { type: string }
 *               value: { }
 *               description: { type: string }
 *     responses:
 *       200: { description: Saved }
 */
exports.upsertSetting = async (req, res, next) => {
  try {
    const { key, value, description } = req.body;
    if (!key) throw new BadRequestError('key required');
    const saved = await SystemSetting.findOneAndUpdate(
      { key },
      { key, value, description: description || '', updatedBy: req.user?._id || null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, setting: saved });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/tools/domains:
 *   get:
 *     summary: List domains from Namecheap (stub requires configured keys)
 *     tags: [Admin System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Domains list }
 */
exports.listDomains = async (req, res, next) => {
  try {
    const keyDoc = await SystemSetting.findOne({ key: 'namecheap' });
    if (!keyDoc) return res.status(200).json({ success: true, domains: [] });
    res.status(200).json({ success: true, domains: keyDoc.value?.domains || [] });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/tools/ssl:
 *   get:
 *     summary: List SSL certificates (stub)
 *     tags: [Admin System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: SSL list }
 */
exports.listSsl = async (req, res, next) => {
  try {
    const keyDoc = await SystemSetting.findOne({ key: 'namecheap' });
    res.status(200).json({ success: true, ssl: keyDoc?.value?.ssl || [] });
  } catch (err) { next(err); }
};




