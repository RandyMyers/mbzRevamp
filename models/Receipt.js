const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReceiptSchema = new Schema({
  // Basic Information
  receiptNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: function() {
      return this.scenario === 'woocommerce_order';
    }
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  storeId: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required: function() {
      return this.scenario === 'woocommerce_order';
    }
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Receipt Details
  customerName: {
    type: String,
    required: function() {
      return this.scenario === 'woocommerce_order';
    },
    trim: true
  },
  customerEmail: {
    type: String,
    required: function() {
      return this.scenario === 'woocommerce_order';
    },
    trim: true,
    lowercase: true
  },
  customerAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },

  // Subscription-specific fields
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription',
    required: function() {
      return this.scenario === 'subscription_payment';
    }
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: function() {
      return this.scenario === 'subscription_payment';
    }
  },

  // Financial Information
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },

  // Payment Information
  paymentMethod: {
    type: String,
    required: true,
    trim: true
  },
  paymentMethodDetails: {
    type: Object,
    default: {}
  },
  transactionId: {
    type: String,
    trim: true
  },
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  // Items/Line Items
  items: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    taxRate: {
      type: Number,
      default: 0
    }
  }],

  // Receipt scenario
  scenario: {
    type: String,
    enum: ['woocommerce_order', 'subscription_payment'],
    required: true
  },

  // Status and Type
  status: {
    type: String,
    enum: ['completed', 'refunded', 'pending', 'failed'],
    default: 'completed'
  },
  type: {
    type: String,
    enum: ['purchase', 'subscription', 'refund', 'credit'],
    default: 'purchase'
  },

  // Description
  description: {
    type: String,
    trim: true
  },

  // Template Information
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'ReceiptTemplate'
  },
  templateData: {
    type: Object,
    default: {}
  },

  // Company Information Override (for generation-time customization)
  companyInfo: {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    logo: {
      type: String,
      trim: true
    },
    logoPosition: {
      type: String,
      enum: ['top-left', 'top-right', 'top-center'],
      default: 'top-left'
    }
  },

  // Template preferences
  templatePreferences: {
    defaultOrderTemplate: {
      type: Schema.Types.ObjectId,
      ref: 'ReceiptTemplate'
    },
    defaultSubscriptionTemplate: {
      type: Schema.Types.ObjectId,
      ref: 'ReceiptTemplate'
    },
    autoGenerateOrderReceipts: {
      type: Boolean,
      default: true
    },
    autoGenerateSubscriptionReceipts: {
      type: Boolean,
      default: true
    }
  },

  // Email and Communication
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentDate: {
    type: Date
  },
  emailRecipients: [{
    email: String,
    sentAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    }
  }],

  // Refund Information
  refundAmount: {
    type: Number,
    default: 0
  },
  refundDate: {
    type: Date
  },
  refundReason: {
    type: String,
    trim: true
  },

  // Audit Information
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
ReceiptSchema.index({ organizationId: 1, createdAt: -1 });
ReceiptSchema.index({ customerId: 1, createdAt: -1 });
ReceiptSchema.index({ subscriptionId: 1, createdAt: -1 });
ReceiptSchema.index({ paymentId: 1, createdAt: -1 });
ReceiptSchema.index({ scenario: 1 });
ReceiptSchema.index({ status: 1 });
ReceiptSchema.index({ receiptNumber: 1 }, { unique: true });
ReceiptSchema.index({ transactionDate: 1 });
ReceiptSchema.index({ transactionId: 1 });

// Pre-save middleware to update timestamps
ReceiptSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate receipt number
ReceiptSchema.statics.generateReceiptNumber = async function(organizationId) {
  const count = await this.countDocuments({ organizationId });
  const year = new Date().getFullYear();
  return `REC-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Calculate totals
ReceiptSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  return this;
};

module.exports = mongoose.model('Receipt', ReceiptSchema); 