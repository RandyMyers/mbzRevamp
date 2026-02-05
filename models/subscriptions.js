const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // User who created/owns the subscription
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true, // ✅ Organization this subscription belongs to
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true,
  },
  // Trial fields
  isTrial: {
    type: Boolean,
    default: false,
  },
  trialStart: {
    type: Date,
  },
  trialEnd: {
    type: Date,
  },
  trialConverted: {
    type: Boolean,
    default: false,
  },
  billingInterval: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true,
    default: 'monthly',
  },
  currency: {
    type: String,
    enum: ['USD', 'NGN', 'EUR', 'GBP'],
    required: true,
    default: 'USD',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  renewalDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Failed'],
    default: 'Pending',
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'canceled', 'expired', 'pending_renewal', 'downgraded'],
    default: 'active',
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  canceledAt: {
    type: Date,
  },
  // Renewal reminder tracking
  renewalReminders: {
    sevenDaysSent: { type: Boolean, default: false },
    threeDaysSent: { type: Boolean, default: false },
    oneDaySent: { type: Boolean, default: false },
    expiredSent: { type: Boolean, default: false },
  },
  autoRenew: {
    type: Boolean,
    default: true,  // Default ON (opt-out) - users can disable
  },

  // ========== Auto-Renewal Tracking ==========
  renewalAttempts: {
    type: Number,
    default: 0,
  },
  lastRenewalAttempt: {
    type: Date,
  },
  renewalFailureReason: {
    type: String,
  },
  // Reference to saved payment method for auto-renewal
  savedPaymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod',
  },

  // Upgrade tracking fields
  isUpgrade: {
    type: Boolean,
    default: false,
  },
  previousSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
  },
  previousPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
  },
  upgradeStatus: {
    type: String,
    enum: ['none', 'pending_upgrade', 'upgraded'],
    default: 'none',
  },
  upgradeToPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
  },

  // ========== Scheduled Downgrade Tracking ==========
  // When user requests a downgrade, it's scheduled for end of current billing period
  scheduledDowngrade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    default: null,
  },
  scheduledDowngradeDate: {
    type: Date,
    default: null,
  },

  paymentMethod: {
    type: String,
    default: 'unknown',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

subscriptionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
