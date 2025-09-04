/**
 * @swagger
 * tags:
 *   - name: Subscriptions
 *     description: Manage user subscriptions
 *
 * /api/subscriptions:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Create a subscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get all subscriptions
 *     responses:
 *       200: { description: Subscriptions list }
 *       500: { description: Server error }
 *
 * /api/subscriptions/{id}:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get subscription by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Subscription }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *   put:
 *     tags: [Subscriptions]
 *     summary: Update subscription
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
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *       400: { description: Validation error }
 *   delete:
 *     tags: [Subscriptions]
 *     summary: Delete subscription
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *
 * /api/subscriptions/assign:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Assign or update a subscription for a user and plan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user: { type: string }
 *               plan: { type: string }
 *               billingInterval: { type: string }
 *               currency: { type: string }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *     responses:
 *       200: { description: Assigned }
 *       400: { description: Validation error }
 *
 * /api/subscriptions/{id}/renew:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Renew a subscription
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Renewed }
 *       404: { description: Not found }
 *       400: { description: Validation error }
 *
 * /api/subscriptions/{id}/cancel:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Cancel a subscription
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Canceled }
 *       404: { description: Not found }
 *       400: { description: Validation error }
 */
const Subscription = require('../models/subscriptions');
const Payment = require('../models/payment');
const SubscriptionPlan = require('../models/subscriptionPlans');
const logEvent = require('../helper/logEvent');

// Create a new subscription
exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user?._id;
    const organizationId = req.user?.organization;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const subscription = new Subscription(req.body);
    await subscription.save();
    await logEvent({
      action: 'start_subscription',
      user: userId,
      resource: 'Subscription',
      resourceId: subscription._id,
      details: { plan: subscription.plan, startDate: subscription.startDate },
      organization: organizationId
    });
    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription
    });
  } catch (err) {
    console.error('Error creating subscription:', err);
    res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Get all subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().populate('user plan payment');
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single subscription by ID
exports.getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id).populate('user plan payment');
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
    res.json(subscription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a subscription
exports.updateSubscription = async (req, res) => {
  try {
    const userId = req.user?._id;
    const organizationId = req.user?.organization;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const subscription = await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subscription) return res.status(404).json({ 
      success: false, 
      error: 'Subscription not found' 
    });
    
    await logEvent({
      action: 'update_subscription',
      user: userId,
      resource: 'Subscription',
      resourceId: subscription._id,
      details: { changes: req.body },
      organization: organizationId
    });
    
    res.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription
    });
  } catch (err) {
    console.error('Error updating subscription:', err);
    res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Delete a subscription
exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
    res.json({ message: 'Subscription deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign a plan to a user (create or update subscription)
exports.assignSubscription = async (req, res) => {
  try {
    const { user, plan, billingInterval, currency, startDate, endDate } = req.body;
    let subscription = await Subscription.findOne({ user, plan });
    if (subscription) {
      // Update existing subscription
      subscription.billingInterval = billingInterval;
      subscription.currency = currency;
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.status = 'active';
      await subscription.save();
    } else {
      // Create new subscription
      subscription = new Subscription({ user, plan, billingInterval, currency, startDate, endDate, status: 'active' });
      await subscription.save();
    }
    res.json(subscription);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Renew a subscription
exports.renewSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id);
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
    // Extend endDate by interval (assume monthly/yearly)
    let newEndDate = new Date(subscription.endDate || new Date());
    if (subscription.billingInterval === 'monthly') {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else if (subscription.billingInterval === 'yearly') {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }
    subscription.endDate = newEndDate;
    subscription.status = 'active';
    await subscription.save();
    res.json(subscription);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cancel a subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const organizationId = req.user?.organization;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const subscription = await Subscription.findById(id);
    if (!subscription) return res.status(404).json({ 
      success: false, 
      error: 'Subscription not found' 
    });
    
    subscription.status = 'canceled';
    subscription.isActive = false;
    subscription.canceledAt = new Date();
    await subscription.save();
    
    await logEvent({
      action: 'cancel_subscription',
      user: userId,
      resource: 'Subscription',
      resourceId: subscription._id,
      details: { plan: subscription.plan, cancelDate: new Date() },
      organization: organizationId
    });
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription
    });
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
}; 