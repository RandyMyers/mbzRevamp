const paymentMethodService = require('../services/paymentMethodService');
const Subscription = require('../models/subscriptions');
const Payment = require('../models/payment');
const logEvent = require('../helper/logEvent');
const mongoose = require('mongoose');

/**
 * Validate MongoDB ObjectId
 * @param {String} id - The ID to validate
 * @returns {Boolean} - Whether the ID is valid
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) &&
         new mongoose.Types.ObjectId(id).toString() === id;
};

/**
 * Get all saved payment methods for the authenticated user
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user._id;

    const methods = await paymentMethodService.getUserPaymentMethods(userId);

    // Return sanitized data (don't expose full tokens)
    const sanitizedMethods = methods.map(method => ({
      _id: method._id,
      cardLastFour: method.cardLastFour,
      cardBrand: method.cardBrand,
      cardExpMonth: method.cardExpMonth,
      cardExpYear: method.cardExpYear,
      cardBank: method.cardBank,
      cardGateway: method.cardGateway,
      isDefault: method.isDefault,
      nickname: method.nickname,
      lastUsedAt: method.lastUsedAt,
      createdAt: method.createdAt
    }));

    res.json({
      success: true,
      paymentMethods: sanitizedMethods
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods'
      // Don't expose internal error details to client
    });
  }
};

/**
 * Set a payment method as default
 */
exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Validate ObjectId to prevent NoSQL injection
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method ID'
      });
    }

    const method = await paymentMethodService.setDefaultPaymentMethod(userId, id);

    res.json({
      success: true,
      message: 'Default payment method updated',
      data: {
        _id: method._id,
        cardLastFour: method.cardLastFour,
        cardBrand: method.cardBrand,
        isDefault: method.isDefault
      }
    });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default payment method'
      // Don't expose internal error details to client
    });
  }
};

/**
 * Delete a saved payment method
 */
exports.deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Validate ObjectId to prevent NoSQL injection
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method ID'
      });
    }

    await paymentMethodService.deletePaymentMethod(userId, id);

    res.json({
      success: true,
      message: 'Payment method deleted'
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment method'
      // Don't expose internal error details to client
    });
  }
};

/**
 * Toggle auto-renewal for a subscription
 */
exports.toggleAutoRenew = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { autoRenew } = req.body;

    // Validate ObjectId to prevent NoSQL injection
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID'
      });
    }

    // Validate autoRenew is a boolean
    if (typeof autoRenew !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'autoRenew must be a boolean value'
      });
    }

    // Find the subscription and verify ownership
    const subscription = await Subscription.findOne({
      _id: id,
      user: userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update auto-renewal setting
    subscription.autoRenew = autoRenew === true;
    await subscription.save();

    await logEvent({
      action: autoRenew ? 'auto_renew_enabled' : 'auto_renew_disabled',
      user: userId,
      resource: 'Subscription',
      resourceId: id
    });

    res.json({
      success: true,
      message: `Auto-renewal ${autoRenew ? 'enabled' : 'disabled'}`,
      data: {
        subscriptionId: subscription._id,
        autoRenew: subscription.autoRenew
      }
    });
  } catch (error) {
    console.error('Error toggling auto-renewal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update auto-renewal setting'
      // Don't expose internal error details to client
    });
  }
};

/**
 * Get user's default payment method
 */
exports.getDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;

    const method = await paymentMethodService.getDefaultPaymentMethod(userId);

    if (!method) {
      return res.json({
        success: true,
        paymentMethod: null
      });
    }

    // Return sanitized data (don't expose tokens or sensitive info)
    res.json({
      success: true,
      paymentMethod: {
        _id: method._id,
        cardLastFour: method.cardLastFour,
        cardBrand: method.cardBrand,
        cardExpMonth: method.cardExpMonth,
        cardExpYear: method.cardExpYear,
        cardBank: method.cardBank,
        cardGateway: method.cardGateway,
        isDefault: method.isDefault,
        nickname: method.nickname
      }
    });
  } catch (error) {
    console.error('Error getting default payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get default payment method'
      // Don't expose internal error details to client
    });
  }
};

/**
 * Get user's payment/transaction history
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get payments for this user
    const payments = await Payment.find({ user: userId })
      .populate('plan', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ user: userId });

    // Format for billing history display
    const transactions = payments.map(payment => ({
      id: payment.reference,
      date: new Date(payment.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      description: payment.plan?.name
        ? `${payment.plan.name} Plan Subscription`
        : 'Subscription Payment',
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status === 'success' ? 'Paid' :
              payment.status === 'pending' ? 'Pending' :
              payment.status === 'failed' ? 'Failed' : payment.status,
      gateway: payment.gateway,
      _id: payment._id
    }));

    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history'
    });
  }
};
