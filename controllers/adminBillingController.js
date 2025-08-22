const Subscription = require('../models/subscriptions');
const SubscriptionPlan = require('../models/subscriptionPlans');
const Organization = require('../models/organization');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Billing
 *     description: Trials and plan management
 */

// Helper to compute trial end (+14 days)
function computeTrialEnd(start) {
  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  return end;
}

/**
 * @swagger
 * /api/admin/billing/trial/start:
 *   post:
 *     summary: Start a 14-day trial for an organization
 *     tags: [Admin Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationId, planId]
 *             properties:
 *               organizationId: { type: string }
 *               planId: { type: string }
 *               billingInterval: { type: string, enum: [monthly, yearly], default: monthly }
 *     responses:
 *       201: { description: Trial started }
 */
exports.startTrial = async (req, res, next) => {
  try {
    const { organizationId, planId, billingInterval = 'monthly' } = req.body;
    if (!organizationId || !planId) throw new BadRequestError('organizationId and planId required');
    const org = await Organization.findById(organizationId);
    if (!org) throw new NotFoundError('organization not found');
    if (org.hasUsedTrial) throw new ConflictError('trial already used for this organization');
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) throw new NotFoundError('plan not found');
    const now = new Date();
    const subscription = await Subscription.create({
      user: req.user._id,
      plan: plan._id,
      billingInterval,
      isTrial: true,
      trialStart: now,
      trialEnd: computeTrialEnd(now),
      status: 'active',
      isActive: true,
    });
    org.subscriptions.push(subscription._id);
    org.hasUsedTrial = true;
    await org.save();
    res.status(201).json({ success: true, subscription });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/billing/trial/status:
 *   get:
 *     summary: Get trial status for an organization
 *     tags: [Admin Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Trial status }
 */
exports.getTrialStatus = async (req, res, next) => {
  try {
    const { organizationId } = req.query;
    if (!organizationId) throw new BadRequestError('organizationId required');
    const org = await Organization.findById(organizationId).populate('subscriptions');
    if (!org) throw new NotFoundError('organization not found');
    const trialSub = (org.subscriptions || []).find(s => s.isTrial);
    if (!trialSub) return res.status(200).json({ success: true, trial: null, hasUsedTrial: org.hasUsedTrial });
    const now = new Date();
    const remainingDays = Math.max(0, Math.ceil((new Date(trialSub.trialEnd) - now) / (1000 * 60 * 60 * 24)));
    res.status(200).json({ success: true, trial: {
      subscriptionId: trialSub._id,
      start: trialSub.trialStart,
      end: trialSub.trialEnd,
      remainingDays,
      converted: trialSub.trialConverted
    }, hasUsedTrial: org.hasUsedTrial });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/billing/trial/convert:
 *   post:
 *     summary: Convert a trial to paid
 *     tags: [Admin Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subscriptionId]
 *             properties:
 *               subscriptionId: { type: string }
 *     responses:
 *       200: { description: Converted }
 */
exports.convertTrial = async (req, res, next) => {
  try {
    const { subscriptionId } = req.body;
    const sub = await Subscription.findById(subscriptionId);
    if (!sub || !sub.isTrial) throw new NotFoundError('trial subscription not found');
    sub.isTrial = false;
    sub.trialConverted = true;
    await sub.save();
    res.status(200).json({ success: true, subscription: sub });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/billing/plans:
 *   get:
 *     summary: List plans (admin)
 *     tags: [Admin Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 *   post:
 *     summary: Create plan (admin)
 *     tags: [Admin Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       201: { description: Created }
 */
exports.listPlans = async (req, res, next) => {
  try {
    const items = await SubscriptionPlan.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, plans: items });
  } catch (err) { next(err); }
};

exports.createPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ success: true, plan });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/billing/plans/{id}:
 *   patch:
 *     summary: Update plan (admin)
 *     tags: [Admin Billing]
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
 *   delete:
 *     summary: Delete plan (admin)
 *     tags: [Admin Billing]
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
exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) throw new NotFoundError('plan not found');
    res.status(200).json({ success: true, plan });
  } catch (err) { next(err); }
};

exports.deletePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) throw new NotFoundError('plan not found');
    res.status(204).send();
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/billing/subscriptions/pending:
 *   get:
 *     summary: List pending subscriptions (awaiting approval/payment)
 *     tags: [Admin Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
exports.listPendingSubscriptions = async (req, res, next) => {
  try {
    const items = await Subscription.find({ $or: [{ status: 'pending' }, { paymentStatus: 'Pending' }] })
      .populate('user', 'fullName email organization')
      .populate('plan');
    res.status(200).json({ success: true, subscriptions: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/billing/subscriptions/{id}/approve:
 *   post:
 *     summary: Approve a pending subscription (bank transfer)
 *     tags: [Admin Billing]
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
 *               startNow: { type: boolean, default: true }
 *     responses:
 *       200: { description: Approved }
 */
exports.approveSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const startNow = req.body?.startNow !== false;
    const sub = await Subscription.findById(id).populate('plan');
    if (!sub) throw new NotFoundError('subscription not found');
    sub.paymentStatus = 'Paid';
    sub.status = 'active';
    if (startNow) {
      const now = new Date();
      sub.startDate = now;
      const end = new Date(now);
      if (sub.billingInterval === 'monthly') end.setMonth(end.getMonth() + 1);
      if (sub.billingInterval === 'yearly') end.setFullYear(end.getFullYear() + 1);
      sub.endDate = end;
      sub.renewalDate = end;
    }
    await sub.save();
    res.status(200).json({ success: true, subscription: sub });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/billing/subscriptions/{id}/reject:
 *   post:
 *     summary: Reject a pending subscription
 *     tags: [Admin Billing]
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
 *       200: { description: Rejected }
 */
exports.rejectSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const sub = await Subscription.findById(id);
    if (!sub) throw new NotFoundError('subscription not found');
    sub.paymentStatus = 'Failed';
    sub.status = 'pending';
    await sub.save();
    res.status(200).json({ success: true, subscription: sub, reason: reason || null });
  } catch (err) { next(err); }
};


