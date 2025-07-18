const mongoose = require('mongoose');

const webhookDeliverySchema = new mongoose.Schema({
  webhookId: {
    type: String,
    required: true
  },
  deliveryId: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: true
  },
  event: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending'
  },
  responseCode: {
    type: Number
  },
  responseMessage: {
    type: String
  },
  requestHeaders: {
    type: mongoose.Schema.Types.Mixed
  },
  requestBody: {
    type: mongoose.Schema.Types.Mixed
  },
  responseHeaders: {
    type: mongoose.Schema.Types.Mixed
  },
  responseBody: {
    type: mongoose.Schema.Types.Mixed
  },
  duration: {
    type: Number, // Duration in milliseconds
    default: 0
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  nextRetryAt: {
    type: Date
  },
  errorMessage: {
    type: String
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
webhookDeliverySchema.index({ webhookId: 1, createdAt: -1 });
webhookDeliverySchema.index({ storeId: 1, createdAt: -1 });
webhookDeliverySchema.index({ organizationId: 1, createdAt: -1 });
webhookDeliverySchema.index({ status: 1 });
webhookDeliverySchema.index({ nextRetryAt: 1 });

// Methods
webhookDeliverySchema.methods.markAsSuccess = async function(responseCode, responseMessage, responseHeaders, responseBody, duration) {
  this.status = 'success';
  this.responseCode = responseCode;
  this.responseMessage = responseMessage;
  this.responseHeaders = responseHeaders;
  this.responseBody = responseBody;
  this.duration = duration;
  this.processedAt = new Date();
  return this.save();
};

webhookDeliverySchema.methods.markAsFailed = async function(responseCode, responseMessage, errorMessage, duration) {
  this.status = 'failed';
  this.responseCode = responseCode;
  this.responseMessage = responseMessage;
  this.errorMessage = errorMessage;
  this.duration = duration;
  this.processedAt = new Date();
  
  // Increment retry count
  this.retryCount += 1;
  
  // Schedule next retry if under max retries
  if (this.retryCount < this.maxRetries) {
    const retryDelay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
    this.nextRetryAt = new Date(Date.now() + retryDelay);
    this.status = 'pending';
  }
  
  return this.save();
};

webhookDeliverySchema.methods.scheduleRetry = async function() {
  if (this.retryCount < this.maxRetries) {
    const retryDelay = Math.pow(2, this.retryCount) * 1000;
    this.nextRetryAt = new Date(Date.now() + retryDelay);
    this.status = 'pending';
    return this.save();
  }
  return this;
};

// Static methods
webhookDeliverySchema.statics.getPendingRetries = async function() {
  return this.find({
    status: 'pending',
    nextRetryAt: { $lte: new Date() },
    retryCount: { $lt: 3 }
  }).sort({ nextRetryAt: 1 });
};

webhookDeliverySchema.statics.getDeliveryStats = async function(webhookId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        webhookId: webhookId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' }
      }
    }
  ]);
  
  return stats;
};

const WebhookDelivery = mongoose.model('WebhookDelivery', webhookDeliverySchema);

module.exports = WebhookDelivery; 