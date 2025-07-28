// models/exchangeRate.js
const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() {
      return !this.isGlobal; // Only required if not global
    },
    index: true
  },
  baseCurrency: {
    type: String,
    required: true,
    trim: true,
    uppercase: true, // Ensure currency codes are uppercase (e.g., USD, EUR)
  },
  targetCurrency: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  rate: {
    type: Number,
    required: true,
    min: 0, // Ensure the rate is non-negative
  },
  isCustom: {
    type: Boolean,
    default: false, // User-defined vs system rates
  },
  isGlobal: {
    type: Boolean,
    default: false, // Global/system-wide rates vs organization-specific
  },
  source: {
    type: String,
    enum: ['system', 'user', 'api', 'api_cached', 'fallback'],
    default: 'system'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // API cache management fields
  lastApiUpdate: {
    type: Date,
    default: null
  },
  cacheExpiry: {
    type: Date,
    default: null
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  
  // API metadata storage
  apiResponse: {
    timeLastUpdate: Date,
    timeNextUpdate: Date,
    baseCode: String,
    targetCode: String
  },
  apiVersion: {
    type: String,
    default: 'v6'
  },
  
  // Existing timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient queries
exchangeRateSchema.index({ organizationId: 1, baseCurrency: 1, targetCurrency: 1 }, { unique: true });

// New indexes for API integration
exchangeRateSchema.index({ isGlobal: 1, baseCurrency: 1, targetCurrency: 1 });
exchangeRateSchema.index({ cacheExpiry: 1, isExpired: 1 });
exchangeRateSchema.index({ source: 1, lastApiUpdate: 1 });
exchangeRateSchema.index({ isActive: 1, source: 1 });

// Pre-save middleware to update timestamps and check expiry
exchangeRateSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  
  // Check if rate is expired
  if (this.cacheExpiry && new Date() > this.cacheExpiry) {
    this.isExpired = true;
  }
  
  next();
});

// Static method to find valid rates
exchangeRateSchema.statics.findValidRate = function(organizationId, baseCurrency, targetCurrency) {
  return this.findOne({
    $or: [
      { organizationId: organizationId, isGlobal: false },
      { isGlobal: true }
    ],
    baseCurrency: baseCurrency,
    targetCurrency: targetCurrency,
    isActive: true,
    $or: [
      { isExpired: false },
      { isExpired: { $exists: false } }
    ]
  }).sort({ isGlobal: 1, lastApiUpdate: -1 }); // Prefer organization-specific over global
};

// Static method to find expired rates
exchangeRateSchema.statics.findExpiredRates = function() {
  return this.find({
    cacheExpiry: { $lt: new Date() },
    isExpired: false,
    source: { $in: ['api', 'api_cached'] }
  });
};

// Instance method to check if rate needs refresh
exchangeRateSchema.methods.needsRefresh = function() {
  if (!this.cacheExpiry) return false;
  return new Date() > this.cacheExpiry;
};

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);