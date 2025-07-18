const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Store Schema
const StoreSchema = new Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization', // Reference to the Organization model
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  name: {
    type: String,
    required: true, // Ensure the store has a name
    trim: true,
  },
  websiteLogo: {
    type: String, // URL for the website logo
    required: false, // Make it optional initially
    default: null,
  },
  platformType: {
    type: String,
    enum: ['woocommerce', 'shopify', 'magento', 'bigcommerce', 'custom'], // Allowed values
    default: 'woocommerce', // Default to WooCommerce for now
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  description: {
    type: String,
   
  },
  apiKey: {
    type: String,
    required: true,
  },
  secretKey: {
    type: String,
    required: true,
  },
  lastSyncDate: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Webhook configuration
  webhookSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    baseUrl: {
      type: String,
      default: null
    },
    secret: {
      type: String,
      default: null
    },
    identifier: {
      type: String,
      default: null
    },
    topics: [{
      type: String,
      enum: [
        'order.created',
        'order.updated',
        'order.deleted',
        'customer.created',
        'customer.updated',
        'customer.deleted',
        'product.created',
        'product.updated',
        'product.deleted'
      ]
    }],
    retryAttempts: {
      type: Number,
      default: 3
    },
    retryDelay: {
      type: Number,
      default: 5000 // 5 seconds
    }
  },
  // Sync settings
  syncSettings: {
    autoSync: {
      type: Boolean,
      default: false
    },
    syncInterval: {
      type: Number,
      default: 3600000 // 1 hour in milliseconds
    },
    lastAutoSync: {
      type: Date,
      default: null
    },
    syncOrders: {
      type: Boolean,
      default: true
    },
    syncCustomers: {
      type: Boolean,
      default: true
    },
    syncProducts: {
      type: Boolean,
      default: true
    }
  }

},{ timestamps: true });

// Indexes
StoreSchema.index({ organizationId: 1 });
StoreSchema.index({ userId: 1 });
StoreSchema.index({ platformType: 1 });
StoreSchema.index({ isActive: 1 });
StoreSchema.index({ 'webhookSettings.enabled': 1 });

// Methods
StoreSchema.methods.enableWebhooks = async function(baseUrl, secret) {
  this.webhookSettings.enabled = true;
  this.webhookSettings.baseUrl = baseUrl;
  this.webhookSettings.secret = secret;
  this.webhookSettings.identifier = this._id.toString();
  return this.save();
};

StoreSchema.methods.disableWebhooks = async function() {
  this.webhookSettings.enabled = false;
  return this.save();
};

StoreSchema.methods.addWebhookTopic = async function(topic) {
  if (!this.webhookSettings.topics.includes(topic)) {
    this.webhookSettings.topics.push(topic);
  }
  return this.save();
};

StoreSchema.methods.removeWebhookTopic = async function(topic) {
  this.webhookSettings.topics = this.webhookSettings.topics.filter(t => t !== topic);
  return this.save();
};

StoreSchema.methods.updateLastSync = async function() {
  this.lastSyncDate = new Date();
  if (this.syncSettings.autoSync) {
    this.syncSettings.lastAutoSync = new Date();
  }
  return this.save();
};

// Create Store Model
const Store = mongoose.model('Store', StoreSchema);
module.exports = Store;
