const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvoiceTemplateSchema = new Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Template Design
  templateType: {
    type: String,
    enum: ['professional', 'modern', 'minimal', 'classic', 'custom'],
    default: 'professional'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Company Information
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
    website: {
      type: String,
      trim: true
    },
    logo: {
      type: String,
      trim: true
    }
  },

  // Design Settings
  design: {
    primaryColor: {
      type: String,
      default: '#000000'
    },
    secondaryColor: {
      type: String,
      default: '#666666'
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    fontFamily: {
      type: String,
      default: 'Arial, sans-serif'
    },
    fontSize: {
      type: Number,
      default: 12
    },
    headerFontSize: {
      type: Number,
      default: 18
    },
    footerFontSize: {
      type: Number,
      default: 10
    }
  },

  // Layout Settings
  layout: {
    showLogo: {
      type: Boolean,
      default: true
    },
    logoPosition: {
      type: String,
      enum: ['top-left', 'top-right', 'top-center'],
      default: 'top-left'
    },
    showCompanyInfo: {
      type: Boolean,
      default: true
    },
    showCustomerInfo: {
      type: Boolean,
      default: true
    },
    showItemsTable: {
      type: Boolean,
      default: true
    },
    showTotals: {
      type: Boolean,
      default: true
    },
    showTerms: {
      type: Boolean,
      default: true
    },
    showNotes: {
      type: Boolean,
      default: true
    },
    showFooter: {
      type: Boolean,
      default: true
    }
  },

  // Content Settings
  content: {
    headerText: {
      type: String,
      trim: true
    },
    footerText: {
      type: String,
      trim: true
    },
    defaultTerms: {
      type: String,
      trim: true
    },
    defaultNotes: {
      type: String,
      trim: true
    },
    currencySymbol: {
      type: String,
      default: '$'
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY'
    }
  },

  // Fields Configuration
  fields: {
    showInvoiceNumber: {
      type: Boolean,
      default: true
    },
    showIssueDate: {
      type: Boolean,
      default: true
    },
    showDueDate: {
      type: Boolean,
      default: true
    },
    showCustomerAddress: {
      type: Boolean,
      default: true
    },
    showCustomerEmail: {
      type: Boolean,
      default: true
    },
    showCustomerPhone: {
      type: Boolean,
      default: true
    },
    showItemDescription: {
      type: Boolean,
      default: true
    },
    showItemQuantity: {
      type: Boolean,
      default: true
    },
    showItemUnitPrice: {
      type: Boolean,
      default: true
    },
    showItemTotal: {
      type: Boolean,
      default: true
    },
    showSubtotal: {
      type: Boolean,
      default: true
    },
    showTax: {
      type: Boolean,
      default: true
    },
    showDiscount: {
      type: Boolean,
      default: true
    },
    showTotal: {
      type: Boolean,
      default: true
    }
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
InvoiceTemplateSchema.index({ organizationId: 1, isActive: 1 });
InvoiceTemplateSchema.index({ organizationId: 1, isDefault: 1 });
InvoiceTemplateSchema.index({ userId: 1, createdAt: -1 });

// Pre-save middleware to update timestamps
InvoiceTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure only one default template per organization
InvoiceTemplateSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { organizationId: this.organizationId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('InvoiceTemplate', InvoiceTemplateSchema); 