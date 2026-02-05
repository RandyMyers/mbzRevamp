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

// Get subscriptions for the current user's organization
exports.getSubscriptions = async (req, res) => {
  try {
    // Get organization from authenticated user
    const organizationId = req.user?.organizationId || req.user?.organization;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        error: 'User organization not found'
      });
    }

    // ✅ Return subscriptions for the user's ORGANIZATION (not individual user)
    // This ensures all users in the organization share the same subscription
    const subscriptions = await Subscription.find({ organization: organizationId })
      .populate('user plan payment');

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

/**
 * @swagger
 * /api/subscriptions/create:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Create subscription with payment record
 *     description: Creates a new subscription and linked payment record when user selects a plan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId, billingCycle, amount, currency]
 *             properties:
 *               planId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Subscription plan ID
 *                 example: "507f1f77bcf86cd799439011"
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, quarterly, yearly]
 *                 description: Billing cycle
 *                 example: "monthly"
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *                 example: 10.00
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, GBP, NGN, BTC, USDT]
 *                 description: Payment currency
 *                 example: "USD"
 *               paymentMethod:
 *                 type: string
 *                 enum: [flutterwave, paystack, squad, bank]
 *                 description: Selected payment method
 *                 example: "flutterwave"
 *     responses:
 *       201:
 *         description: Subscription and payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Subscription created successfully"
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Validation error
 *         content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: false
 *                   message:
 *                     type: string
 *                     example: "Validation error"
 *       500:
 *         description: Server error
 */
exports.createSubscriptionWithPayment = async (req, res) => {
  try {
    const userId = req.user?._id;
    const organizationId = req.user?.organization;
    const { planId, billingCycle, amount, currency, paymentMethod } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    if (!planId || !billingCycle || !amount || !currency) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: planId, billingCycle, amount, currency' 
      });
    }

    // Verify plan exists
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subscription plan not found' 
      });
    }

    // Check if user already has an active subscription
    const existingActiveSubscription = await Subscription.findOne({
      user: userId,
      status: 'active'
    });

    // Also check for pending subscriptions for the same plan (from previous failed attempts)
    const existingPendingSubscription = await Subscription.findOne({
      user: userId,
      plan: planId,
      status: 'pending'
    }).populate('payment');

    // If there's a pending subscription for this exact plan, reuse it
    if (existingPendingSubscription && existingPendingSubscription.payment) {
      console.log(`Reusing existing pending subscription ${existingPendingSubscription._id} for plan ${planId}`);
      return res.status(200).json({
        success: true,
        message: 'Using existing pending subscription',
        subscription: existingPendingSubscription,
        payment: existingPendingSubscription.payment
      });
    }

    let isUpgrade = false;
    let previousPlanId = null;

    if (existingActiveSubscription) {
      // Check if trying to subscribe to the same plan that's already active
      if (existingActiveSubscription.plan.toString() === planId) {
        // User is adding a payment method for their existing subscription
        // Create a payment record for the existing subscription (for card capture)
        console.log(`User adding payment method for existing subscription ${existingActiveSubscription._id}`);

        const { v4: uuidv4 } = require('uuid');
        const paymentReference = uuidv4();

        const payment = new Payment({
          user: userId,
          subscription: existingActiveSubscription._id,
          plan: planId,
          gateway: paymentMethod || 'unknown',
          amount: amount,
          currency: currency,
          status: 'pending',
          reference: paymentReference
        });

        await payment.save();

        // Log the event
        await logEvent({
          action: 'add_payment_method',
          user: userId,
          resource: 'Payment',
          resourceId: payment._id,
          details: {
            subscriptionId: existingActiveSubscription._id,
            planId: planId,
            amount: amount,
            currency: currency,
            paymentMethod: paymentMethod
          },
          organization: organizationId
        });

        return res.status(201).json({
          success: true,
          message: 'Payment created for existing subscription',
          subscription: {
            _id: existingActiveSubscription._id,
            status: existingActiveSubscription.status,
            billingInterval: existingActiveSubscription.billingInterval,
            startDate: existingActiveSubscription.startDate,
            endDate: existingActiveSubscription.endDate,
            plan: plan
          },
          payment: {
            _id: payment._id,
            reference: payment.reference,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            gateway: payment.gateway
          }
        });
      }

      // This is an upgrade or downgrade - need to compare plan prices
      const currentPlan = await SubscriptionPlan.findById(existingActiveSubscription.plan);
      const newPlan = plan; // Already fetched above

      if (!currentPlan) {
        return res.status(400).json({
          success: false,
          message: 'Current plan not found'
        });
      }

      // Determine if this is a downgrade (new plan costs less)
      const isDowngrade = newPlan.price < currentPlan.price;

      if (isDowngrade) {
        // ========== DOWNGRADE FLOW ==========
        // Schedule the downgrade for end of current billing period - NO immediate payment

        // Check if already has a scheduled downgrade
        if (existingActiveSubscription.scheduledDowngrade) {
          const existingDowngradePlan = await SubscriptionPlan.findById(existingActiveSubscription.scheduledDowngrade);
          return res.status(400).json({
            success: false,
            message: `You already have a scheduled downgrade to ${existingDowngradePlan?.name || 'another plan'}. Please cancel it first.`
          });
        }

        // Schedule the downgrade
        existingActiveSubscription.scheduledDowngrade = planId;
        existingActiveSubscription.scheduledDowngradeDate = existingActiveSubscription.endDate;
        await existingActiveSubscription.save();

        // Log the event
        await logEvent({
          action: 'schedule_downgrade',
          user: userId,
          resource: 'Subscription',
          resourceId: existingActiveSubscription._id,
          details: {
            currentPlan: currentPlan.name,
            newPlan: newPlan.name,
            effectiveDate: existingActiveSubscription.endDate,
            currentPrice: currentPlan.price,
            newPrice: newPlan.price
          },
          organization: organizationId
        });

        // Format the effective date for display
        const effectiveDate = new Date(existingActiveSubscription.endDate);
        const formattedDate = effectiveDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        return res.status(200).json({
          success: true,
          isScheduledDowngrade: true,
          message: `Your plan will be downgraded to ${newPlan.name} on ${formattedDate}`,
          effectiveDate: existingActiveSubscription.endDate,
          currentPlan: {
            name: currentPlan.name,
            price: currentPlan.price
          },
          newPlan: {
            name: newPlan.name,
            price: newPlan.price
          },
          subscription: {
            _id: existingActiveSubscription._id,
            status: existingActiveSubscription.status,
            endDate: existingActiveSubscription.endDate,
            scheduledDowngrade: planId,
            scheduledDowngradeDate: existingActiveSubscription.endDate
          }
        });
      }

      // ========== UPGRADE FLOW ==========
      // This is an upgrade - proceed with immediate payment flow
      isUpgrade = true;
      previousPlanId = existingActiveSubscription.plan;

      // Mark existing subscription as upgraded (will be finalized when payment succeeds)
      existingActiveSubscription.upgradeStatus = 'pending_upgrade';
      existingActiveSubscription.upgradeToPlan = planId;
      await existingActiveSubscription.save();
    }

    // Clean up old pending subscriptions for this plan (from very old failed attempts)
    await Subscription.deleteMany({
      user: userId,
      plan: planId,
      status: 'pending',
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 24 hours
    });

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    
    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingCycle === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create subscription with pending status
    const subscriptionData = {
      user: userId,
      plan: planId,
      billingInterval: billingCycle,
      currency: currency,
      startDate: startDate,
      endDate: endDate,
      status: 'pending', // Will be updated to 'active' when payment is successful
      isActive: false,
      paymentMethod: paymentMethod || 'unknown'
    };

    // Add upgrade info if this is a plan change
    if (isUpgrade && existingActiveSubscription) {
      subscriptionData.isUpgrade = true;
      subscriptionData.previousSubscription = existingActiveSubscription._id;
      subscriptionData.previousPlan = previousPlanId;
    }

    const subscription = new Subscription(subscriptionData);

    await subscription.save();

    // Create payment record with pending status
    const { v4: uuidv4 } = require('uuid');
    const paymentReference = uuidv4();
    
    const payment = new Payment({
      user: userId,
      subscription: subscription._id,
      plan: planId,
      gateway: paymentMethod || 'unknown',
      amount: amount,
      currency: currency,
      status: 'pending',
      reference: paymentReference
    });

    await payment.save();

    // Update subscription with payment reference
    subscription.payment = payment._id;
    await subscription.save();

    // Log the event
    await logEvent({
      action: 'create_subscription_with_payment',
      user: userId,
      resource: 'Subscription',
      resourceId: subscription._id,
      details: { 
        planId: planId,
        billingCycle: billingCycle,
        amount: amount,
        currency: currency,
        paymentMethod: paymentMethod,
        paymentId: payment._id
      },
      organization: organizationId
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription: {
        _id: subscription._id,
        status: subscription.status,
        billingInterval: subscription.billingInterval,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        plan: plan
      },
      payment: {
        _id: payment._id,
        reference: payment.reference,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        gateway: payment.gateway
      }
    });

  } catch (err) {
    console.error('Error creating subscription with payment:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

/**
 * @swagger
 * /api/subscriptions/trial:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Create a 14-day free trial subscription
 *     description: Creates a trial subscription for onboarding users. No payment required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId, billingCycle]
 *             properties:
 *               planId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Subscription plan ID
 *                 example: "507f1f77bcf86cd799439011"
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, quarterly, yearly]
 *                 description: Billing cycle (for after trial ends)
 *                 example: "monthly"
 *     responses:
 *       201:
 *         description: Trial subscription created successfully
 *       400:
 *         description: Validation error or user already has active subscription
 *       500:
 *         description: Server error
 */
exports.createTrialSubscription = async (req, res) => {
  try {
    const userId = req.user?._id;
    const organizationId = req.user?.organization;
    const { planId, billingCycle } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!planId || !billingCycle) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: planId, billingCycle'
      });
    }

    // Verify plan exists
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Check if user already has an active subscription or trial
    const existingSubscription = await Subscription.findOne({
      user: userId,
      $or: [
        { status: 'active' },
        { isTrial: true, trialEnd: { $gte: new Date() } }
      ]
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription or trial'
      });
    }

    // Calculate trial dates (14 days)
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    // Calculate what the end date would be after trial converts
    const postTrialEndDate = new Date(trialEnd);
    if (billingCycle === 'monthly') {
      postTrialEndDate.setMonth(postTrialEndDate.getMonth() + 1);
    } else if (billingCycle === 'quarterly') {
      postTrialEndDate.setMonth(postTrialEndDate.getMonth() + 3);
    } else if (billingCycle === 'yearly') {
      postTrialEndDate.setFullYear(postTrialEndDate.getFullYear() + 1);
    }

    // Create trial subscription
    const subscription = new Subscription({
      user: userId,
      plan: planId,
      billingInterval: billingCycle,
      currency: 'USD',
      startDate: trialStart,
      endDate: postTrialEndDate,
      isTrial: true,
      trialStart: trialStart,
      trialEnd: trialEnd,
      trialConverted: false,
      status: 'active',
      isActive: true,
      paymentStatus: 'Pending',
      paymentMethod: 'trial'
    });

    await subscription.save();

    // Log the event
    await logEvent({
      action: 'start_trial',
      user: userId,
      resource: 'Subscription',
      resourceId: subscription._id,
      details: {
        planId: planId,
        planName: plan.name,
        billingCycle: billingCycle,
        trialStart: trialStart,
        trialEnd: trialEnd
      },
      organization: organizationId
    });

    res.status(201).json({
      success: true,
      message: '14-day free trial activated successfully',
      subscription: {
        _id: subscription._id,
        status: subscription.status,
        isTrial: subscription.isTrial,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        billingInterval: subscription.billingInterval,
        plan: plan
      }
    });

  } catch (err) {
    console.error('Error creating trial subscription:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

/**
 * Cancel a scheduled downgrade
 * @route POST /api/subscriptions/cancel-scheduled-downgrade
 */
exports.cancelScheduledDowngrade = async (req, res) => {
  try {
    const userId = req.user?._id;
    const organizationId = req.user?.organization;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find user's active subscription with a scheduled downgrade
    const subscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      scheduledDowngrade: { $ne: null }
    }).populate('scheduledDowngrade');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No scheduled downgrade found'
      });
    }

    const downgradePlanName = subscription.scheduledDowngrade?.name || 'Unknown';

    // Clear the scheduled downgrade
    subscription.scheduledDowngrade = null;
    subscription.scheduledDowngradeDate = null;
    await subscription.save();

    // Log the event
    await logEvent({
      action: 'cancel_scheduled_downgrade',
      user: userId,
      resource: 'Subscription',
      resourceId: subscription._id,
      details: {
        canceledDowngradePlan: downgradePlanName
      },
      organization: organizationId
    });

    res.json({
      success: true,
      message: 'Scheduled downgrade cancelled successfully',
      subscription: {
        _id: subscription._id,
        status: subscription.status
      }
    });

  } catch (err) {
    console.error('Error cancelling scheduled downgrade:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

/**
 * Get scheduled downgrade info for user
 * @route GET /api/subscriptions/scheduled-downgrade
 */
exports.getScheduledDowngrade = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find user's active subscription with scheduled downgrade
    const subscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      scheduledDowngrade: { $ne: null }
    }).populate('plan scheduledDowngrade');

    if (!subscription || !subscription.scheduledDowngrade) {
      return res.json({
        success: true,
        hasScheduledDowngrade: false
      });
    }

    res.json({
      success: true,
      hasScheduledDowngrade: true,
      scheduledDowngrade: {
        currentPlan: {
          _id: subscription.plan._id,
          name: subscription.plan.name,
          price: subscription.plan.price
        },
        newPlan: {
          _id: subscription.scheduledDowngrade._id,
          name: subscription.scheduledDowngrade.name,
          price: subscription.scheduledDowngrade.price
        },
        effectiveDate: subscription.scheduledDowngradeDate,
        subscriptionId: subscription._id
      }
    });

  } catch (err) {
    console.error('Error getting scheduled downgrade:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};