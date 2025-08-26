const Affiliate = require('../models/Affiliate');
const Payout = require('../models/Payout');
const Commission = require('../models/Commission');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Affiliate Mgmt
 *     description: Approvals and payouts for affiliates
 */

/**
 * @swagger
 * /api/admin/affiliate/affiliates:
 *   get:
 *     summary: List affiliates (admin)
 *     tags: [Admin Affiliate Mgmt]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, active, suspended, terminated] }
 *     responses:
 *       200: { description: OK }
 */
exports.listAffiliates = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    const items = await Affiliate.find(q).populate('userId', 'fullName email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, affiliates: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/affiliate/affiliates/{id}/approve:
 *   post:
 *     summary: Approve affiliate
 *     tags: [Admin Affiliate Mgmt]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Approved }
 */
exports.approveAffiliate = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) throw new NotFoundError('affiliate not found');
    affiliate.status = 'active';
    await affiliate.save();
    res.status(200).json({ success: true, affiliate });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/affiliate/affiliates/{id}/reject:
 *   post:
 *     summary: Reject affiliate
 *     tags: [Admin Affiliate Mgmt]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Rejected }
 */
exports.rejectAffiliate = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) throw new NotFoundError('affiliate not found');
    affiliate.status = 'terminated';
    await affiliate.save();
    res.status(200).json({ success: true, affiliate });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/affiliate/payouts/pending:
 *   get:
 *     summary: List pending payout requests
 *     tags: [Admin Affiliate Mgmt]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
exports.listPendingPayouts = async (req, res, next) => {
  try {
    const items = await Payout.find({ status: 'pending' }).populate('affiliateId').sort({ createdAt: -1 });
    res.status(200).json({ success: true, payouts: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/affiliate/payouts/{id}/process:
 *   post:
 *     summary: Move payout to processing and lock commissions
 *     tags: [Admin Affiliate Mgmt]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Processing }
 */
exports.processPayout = async (req, res, next) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout) throw new NotFoundError('payout not found');
    await payout.process();
    res.status(200).json({ success: true, payout });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/affiliate/payouts/{id}/complete:
 *   post:
 *     summary: Mark payout as completed
 *     tags: [Admin Affiliate Mgmt]
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
 *             properties:
 *               transactionId: { type: string }
 *     responses:
 *       200: { description: Completed }
 */
exports.completePayout = async (req, res, next) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout) throw new NotFoundError('payout not found');
    const { transactionId } = req.body || {};
    await payout.complete(transactionId || undefined);
    res.status(200).json({ success: true, payout });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/affiliate/payouts/{id}/fail:
 *   post:
 *     summary: Mark payout as failed
 *     tags: [Admin Affiliate Mgmt]
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
 *               reason: { type: string }
 *     responses:
 *       200: { description: Failed }
 */
exports.failPayout = async (req, res, next) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout) throw new NotFoundError('payout not found');
    await payout.fail(req.body?.reason || '');
    res.status(200).json({ success: true, payout });
  } catch (err) { next(err); }
};












