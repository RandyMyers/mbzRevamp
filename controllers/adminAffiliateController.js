const CommissionRuleSet = require('../models/CommissionRuleSet');
const AffiliateProgram = require('../models/AffiliateProgram');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const AffiliateSettings = require('../models/AffiliateSettings');

/**
 * @swagger
 * tags:
 *   - name: Admin Affiliate
 *     description: Super Admin endpoints for managing affiliate programs and rules
 */

/**
 * @swagger
 * /api/admin/affiliate/commission-rules:
 *   get:
 *     summary: List commission rule sets
 *     tags: [Admin Affiliate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of rule sets
 *       401:
 *         description: Unauthorized
 */
exports.listCommissionRules = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    const rules = await CommissionRuleSet.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, rules });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/affiliate/commission-rules:
 *   post:
 *     summary: Create a commission rule set
 *     tags: [Admin Affiliate]
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
 *               currency: { type: string }
 *               monthlyPercent: { type: number }
 *               quarterly: { type: object }
 *               yearly: { type: object }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 */
exports.createCommissionRule = async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload.name) throw new BadRequestError('name is required');
    const rule = await CommissionRuleSet.create(payload);
    res.status(201).json({ success: true, rule });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/affiliate/commission-rules/{id}:
 *   get:
 *     summary: Get a commission rule set
 *     tags: [Admin Affiliate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
exports.getCommissionRule = async (req, res, next) => {
  try {
    const rule = await CommissionRuleSet.findById(req.params.id);
    if (!rule) throw new NotFoundError('Commission rule not found');
    res.status(200).json({ success: true, rule });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/affiliate/commission-rules/{id}:
 *   patch:
 *     summary: Update a commission rule set
 *     tags: [Admin Affiliate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 */
exports.updateCommissionRule = async (req, res, next) => {
  try {
    const rule = await CommissionRuleSet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!rule) throw new NotFoundError('Commission rule not found');
    res.status(200).json({ success: true, rule });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/affiliate/commission-rules/{id}:
 *   delete:
 *     summary: Delete a commission rule set
 *     tags: [Admin Affiliate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 */
exports.deleteCommissionRule = async (req, res, next) => {
  try {
    const rule = await CommissionRuleSet.findByIdAndDelete(req.params.id);
    if (!rule) throw new NotFoundError('Commission rule not found');
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/affiliate/programs:
 *   get:
 *     summary: List affiliate programs
 *     tags: [Admin Affiliate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
exports.listPrograms = async (req, res, next) => {
  try {
    const programs = await AffiliateProgram.find({}).populate('commissionRuleSet');
    res.status(200).json({ success: true, programs });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/affiliate/programs:
 *   post:
 *     summary: Create an affiliate program
 *     tags: [Admin Affiliate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code, commissionRuleSet]
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               audience: { type: string, enum: [internal, public] }
 *               cookieDays: { type: number }
 *               commissionRuleSet: { type: string }
 *               minPayout: { type: number }
 *               payoutWindow: { type: string }
 *               allowedPayoutMethods: { type: array, items: { type: string } }
 *               terms: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 */
exports.createProgram = async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload.name || !payload.code || !payload.commissionRuleSet) {
      throw new BadRequestError('name, code, and commissionRuleSet are required');
    }
    const program = await AffiliateProgram.create({ ...payload, createdBy: req.user?._id });
    res.status(201).json({ success: true, program });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/affiliate/programs/{id}:
 *   get:
 *     summary: Get an affiliate program
 *     tags: [Admin Affiliate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
exports.getProgram = async (req, res, next) => {
  try {
    const program = await AffiliateProgram.findById(req.params.id).populate('commissionRuleSet');
    if (!program) throw new NotFoundError('Program not found');
    res.status(200).json({ success: true, program });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/affiliate/programs/{id}:
 *   patch:
 *     summary: Update an affiliate program
 *     tags: [Admin Affiliate]
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
 *       404: { description: Not found }
 */
exports.updateProgram = async (req, res, next) => {
  try {
    const program = await AffiliateProgram.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!program) throw new NotFoundError('Program not found');
    res.status(200).json({ success: true, program });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/affiliate/programs/{id}:
 *   delete:
 *     summary: Delete an affiliate program
 *     tags: [Admin Affiliate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 */
exports.deleteProgram = async (req, res, next) => {
  try {
    const program = await AffiliateProgram.findByIdAndDelete(req.params.id);
    if (!program) throw new NotFoundError('Program not found');
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/affiliate/settings:
 *   get:
 *     summary: Get global affiliate settings
 *     tags: [Admin Affiliate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
exports.getAffiliateSettings = async (req, res, next) => {
  try {
    const settings = await AffiliateSettings.findOne({}).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, settings });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/affiliate/settings:
 *   put:
 *     summary: Upsert global affiliate settings
 *     tags: [Admin Affiliate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cookieDaysDefault: { type: number }
 *               minPayoutNGN: { type: number }
 *               minPayoutUSD: { type: number }
 *               payoutWindow: { type: string }
 *               allowSelfReferral: { type: boolean }
 *               allowedPayoutMethods: { type: array, items: { type: string } }
 *               terms: { type: string }
 *     responses:
 *       200: { description: Saved }
 */
exports.upsertAffiliateSettings = async (req, res, next) => {
  try {
    const payload = { ...req.body, updatedBy: req.user?._id };
    const current = await AffiliateSettings.findOne({});
    let saved;
    if (current) {
      saved = await AffiliateSettings.findByIdAndUpdate(current._id, payload, { new: true });
    } else {
      saved = await AffiliateSettings.create(payload);
    }
    res.status(200).json({ success: true, settings: saved });
  } catch (err) {
    next(err);
  }
};




