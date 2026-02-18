const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    enum: ['free', 'basic', 'standard', 'premium', 'custom'],
  },
  description: {
    type: String,
  },
  features: [
    {
      type: String,
    },
  ],
  price: {
    type: Number,
    default: 0,
  },
  // Regional pricing: per-currency, per-billing-cycle
  pricing: {
    USD: {
      monthly: { type: Number, default: 0 },
      quarterly: { type: Number, default: 0 },
      yearly: { type: Number, default: 0 },
    },
    NGN: {
      monthly: { type: Number, default: 0 },
      quarterly: { type: Number, default: 0 },
      yearly: { type: Number, default: 0 },
    },
  },
  currency: {
    type: String,
    enum: ['USD', 'NGN', 'EUR', 'GBP'],
    default: 'USD',
  },
  billingInterval: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly',
  },
  // Plan limits
  limits: {
    maxStores: { type: Number, default: 1 },
    maxProducts: { type: Number, default: 10 }, // -1 for unlimited
    maxUsers: { type: Number, default: 1 },
    maxFreeWebsites: { type: Number, default: 1 },
    maxIntegrations: { type: Number, default: 1 }, // -1 for unlimited
    allowedIntegrations: { type: [String], default: ['woocommerce'] }, // or 'all'
  },
  // Feature access flags
  featureAccess: {
    dashboard: { type: Boolean, default: true },
    ordersAndCustomers: { type: Boolean, default: true },
    tasks: { type: Boolean, default: false },
    inventory: { type: String, enum: ['full', 'view_only', 'none'], default: 'view_only' },
    marketing: { type: String, enum: ['full', 'limited', 'none'], default: 'none' },
    analytics: { type: String, enum: ['full', 'limited', 'none'], default: 'none' },
    auditLogs: { type: Boolean, default: false },
    callScheduler: { type: Boolean, default: false },
    referralPoints: { type: Boolean, default: true },
    billings: { type: Boolean, default: true },
    settings: { type: Boolean, default: true },
    feedbackAndSurvey: { type: Boolean, default: true },
  },
  // Analytics tabs access
  analyticsAccess: {
    type: [String],
    default: [],
    // Possible values: overview, customer_insights, sales_performance, product_analytics, marketing_effectiveness, customer_lifetime
  },
  // Marketing sections access
  marketingAccess: {
    type: [String],
    default: [],
    // Possible values: overview, campaigns, templates, emails
  },
  // Support channels
  supportChannels: {
    type: [String],
    default: ['email'],
    // Possible values: email, ticket, live_chat, whatsapp
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
  // Display order for UI
  displayOrder: {
    type: Number,
    default: 0,
  },
  // Recommended/popular flag
  isRecommended: {
    type: Boolean,
    default: false,
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

subscriptionPlanSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  // Keep legacy price field in sync with USD monthly pricing
  if (this.pricing?.USD?.monthly !== undefined) {
    this.price = this.pricing.USD.monthly;
  }
  next();
});

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
