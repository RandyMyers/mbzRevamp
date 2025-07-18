const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  wooCommerceId: {
    type: Number,
    required: true,
    unique: true
  },
  webhookIdentifier: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true,
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
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'disabled'],
    default: 'active'
  },
  deliveryUrl: {
    type: String,
    required: true
  },
  secret: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    enum: ['order', 'customer', 'product']
  },
  event: {
    type: String,
    enum: ['created', 'updated', 'deleted']
  },
  hooks: [{
    type: String
  }],
  failureCount: {
    type: Number,
    default: 0
  },
  lastDelivery: {
    type: Date
  },
  lastFailure: {
    type: Date
  },
  lastFailureReason: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
webhookSchema.index({ storeId: 1, topic: 1 });
webhookSchema.index({ organizationId: 1 });
webhookSchema.index({ status: 1 });
webhookSchema.index({ wooCommerceId: 1 });
webhookSchema.index({ webhookIdentifier: 1 }); // Index for dynamic URL routing

// Methods
webhookSchema.methods.incrementFailureCount = async function() {
  this.failureCount += 1;
  this.lastFailure = new Date();
  
  // Disable webhook after 5 consecutive failures
  if (this.failureCount >= 5) {
    this.status = 'disabled';
  }
  
  return this.save();
};

webhookSchema.methods.resetFailureCount = async function() {
  this.failureCount = 0;
  this.lastFailure = null;
  this.lastFailureReason = null;
  return this.save();
};

webhookSchema.methods.updateLastDelivery = async function() {
  this.lastDelivery = new Date();
  return this.save();
};

const Webhook = mongoose.model('Webhook', webhookSchema);

module.exports = Webhook; 