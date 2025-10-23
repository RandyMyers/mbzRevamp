const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvoiceSchema = new Schema({
  // Basic Information
  invoiceNumber: {
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

  // Invoice Details
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

  // Dates
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },

  // Status and Type
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  type: {
    type: String,
    enum: ['subscription', 'one_time', 'recurring'],
    default: 'one_time'
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

  // Notes and Terms
  notes: {
    type: String,
    trim: true
  },
  terms: {
    type: String,
    trim: true
  },

  // Template Information
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'InvoiceTemplate'
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
InvoiceSchema.index({ organizationId: 1, createdAt: -1 });
InvoiceSchema.index({ customerId: 1, createdAt: -1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ dueDate: 1 });

// Pre-save middleware to update timestamps
InvoiceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate invoice number
InvoiceSchema.statics.generateInvoiceNumber = async function(organizationId) {
  const year = new Date().getFullYear();
  
  // Use findOne with sort to get the latest invoice number
  const latestInvoice = await this.findOne(
    { 
      organizationId,
      invoiceNumber: { $regex: `^INV-${year}-` }
    },
    { invoiceNumber: 1 }
  ).sort({ invoiceNumber: -1 });

  let nextNumber = 1;
  if (latestInvoice) {
    const match = latestInvoice.invoiceNumber.match(new RegExp(`^INV-${year}-(\\d+)$`));
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `INV-${year}-${String(nextNumber).padStart(4, '0')}`;
};

// Calculate totals
InvoiceSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  return this;
};

module.exports = mongoose.model('Invoice', InvoiceSchema); 