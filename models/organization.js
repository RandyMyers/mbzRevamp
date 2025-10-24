const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// models/Organization.js
const OrganizationSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  organizationCode: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  logoUrl:{
    type: String,
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  
  businessType: {
    type: String,
    required: true,
    enum: [
      'Clothing and Apparel',
      'Food and Beverages',
      'Electronics',
      'Health and Beauty',
      'Education',
      'Finance',
      'Technology',
      'Other',
    ], // Add business categories here
    default: 'Other',
  },
  defaultCurrency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[A-Z]{3}$/.test(v);
      },
      message: 'Currency code must be 3 uppercase letters (e.g., USD, EUR, NGN)'
    }
  },
  analyticsCurrency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[A-Z]{3}$/.test(v);
      },
      message: 'Currency code must be 3 uppercase letters (e.g., USD, EUR, NGN)'
    }
  },
  subscriptions: [{ type: Schema.Types.ObjectId, ref: 'Subscription' }], // Link subscriptions
  hasUsedTrial: {
    type: Boolean,
    default: false,
  },
  
  // Invoice template preferences
  invoiceSettings: {
    defaultInvoiceTemplate: {
      type: Schema.Types.ObjectId,
      ref: 'InvoiceTemplate'
    },
    autoGenerateInvoices: {
      type: Boolean,
      default: true
    }
  },

  // Receipt template preferences
  receiptSettings: {
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

  // Organization-specific template customizations
  organizationTemplateSettings: {
    invoiceTemplate: {
      // Store-specific data (from selected store)
      storeInfo: {
        name: { type: String, trim: true },
        website: { type: String, trim: true },
        logo: { type: String, trim: true }
      },
      // Custom email field
      email: { type: String, trim: true, lowercase: true },
      // Custom fields (user input)
      customFields: {
        phone: { type: String, trim: true },
        address: {
          street: { type: String, trim: true },
          city: { type: String, trim: true },
          state: { type: String, trim: true },
          zipCode: { type: String, trim: true },
          country: { type: String, trim: true }
        }
      },
      // Design settings
      design: {
        primaryColor: { type: String, default: '#000000' },
        secondaryColor: { type: String, default: '#666666' },
        backgroundColor: { type: String, default: '#ffffff' }
      },
      // Layout settings
      layout: {
        logoPosition: { type: String, enum: ['top-left', 'top-right', 'top-center'], default: 'top-left' },
        headerStyle: { type: String, default: 'standard' },
        footerStyle: { type: String, default: 'standard' }
      }
    },
    receiptTemplate: {
      // Same structure as invoiceTemplate
      storeInfo: {
        name: { type: String, trim: true },
        website: { type: String, trim: true },
        logo: { type: String, trim: true }
      },
      email: { type: String, trim: true, lowercase: true },
      customFields: {
        phone: { type: String, trim: true },
        address: {
          street: { type: String, trim: true },
          city: { type: String, trim: true },
          state: { type: String, trim: true },
          zipCode: { type: String, trim: true },
          country: { type: String, trim: true }
        }
      },
      design: {
        primaryColor: { type: String, default: '#000000' },
        secondaryColor: { type: String, default: '#666666' },
        backgroundColor: { type: String, default: '#ffffff' }
      },
      layout: {
        logoPosition: { type: String, enum: ['top-left', 'top-right', 'top-center'], default: 'top-left' },
        headerStyle: { type: String, default: 'standard' },
        footerStyle: { type: String, default: 'standard' }
      }
    }
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

OrganizationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Organization', OrganizationSchema);
