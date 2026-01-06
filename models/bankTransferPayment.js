const mongoose = require('mongoose');

/**
 * BankTransferPayment Model
 * Stores pending bank transfer payments that require manual verification
 */
const bankTransferPaymentSchema = new mongoose.Schema({
  // User making the payment
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Plan being purchased
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },

  // Payment details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  billingInterval: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },

  // Customer reference (short_id) used in bank transfer narration
  customerReference: {
    type: String,
    required: true,
    index: true
  },

  // Receipt upload
  receiptUrl: {
    type: String,
    required: true
  },
  receiptPublicId: {
    type: String, // For cloudinary or other storage deletion
    default: null
  },

  // Bank transfer details (for verification)
  bankName: {
    type: String,
    default: null
  },
  transferDate: {
    type: Date,
    default: null
  },
  senderName: {
    type: String,
    default: null
  },
  senderAccountNumber: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },

  // Admin review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },

  // Created subscription (after approval)
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
bankTransferPaymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for efficient queries
bankTransferPaymentSchema.index({ status: 1, createdAt: -1 });
bankTransferPaymentSchema.index({ user: 1, status: 1 });

const BankTransferPayment = mongoose.model('BankTransferPayment', bankTransferPaymentSchema);

module.exports = BankTransferPayment;
