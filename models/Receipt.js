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
    required: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  storeId: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Receipt Details
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
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
    type: String,
    trim: true
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