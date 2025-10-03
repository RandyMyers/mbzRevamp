const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema(
  {
    templateName: {
      type: String,
      required: true,
      unique: true, // Ensure template names are unique globally
      trim: true,
    },
    subject: {
      type: String,
      required: true, // Subject for the notification (simple text with variables)
    },
    body: {
      type: String,
      required: true, // Body of the notification (simple text with variables, NO HTML)
    },
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'system'], // Different notification types
      required: true,
      default: 'system'
    },
    triggerEvent: {
      type: String,
      enum: [
        'user_registration', 'user_login', 'password_reset', 'account_suspended', 'invitation_sent', 'invitation_accepted',
        'order_created', 'order_status_updated', 'order_cancelled', 'order_shipped', 'order_delivered', 'refund_processed',
        'subscription_payment_success', 'subscription_payment_failed', 'subscription_expiring', 'subscription_expired', 'subscription_cancelled', 'subscription_renewed',
        'email_campaign_sent', 'email_campaign_failed', 'newsletter_sent', 'promotional_offer_sent', 'abandoned_cart_reminder', 'campaign_analytics_ready',
        'customer_registered', 'customer_updated', 'customer_sync_success', 'customer_sync_failed',
        'product_created', 'low_stock_alert', 'out_of_stock', 'inventory_sync',
        'system_maintenance', 'system_error', 'woocommerce_sync_success', 'woocommerce_sync_failed',
        'subscriptionEnd', 'reminder', 'invoiceCreated', 'accountUpdate', 'custom',
        'call_scheduled', 'call_reminder', 'call_cancelled', 'call_invitation',
        'task_created', 'task_assigned', 'task_status_updated', 'task_due_soon', 'task_overdue', 'subtask_completed', 'task_comment_added', 'task_attachment_uploaded'
      ],
      required: true,
      default: 'custom'
    },
    variables: {
      type: Map,
      of: String, // To handle dynamic placeholders like user name, subscription date, etc.
      default: {} // Empty map by default
    },
    isActive: {
      type: Boolean,
      default: true, // Whether the template is active and should be used
    },
    isSystemDefault: {
      type: Boolean,
      default: false, // Whether this is a system-wide default template
    },
    isDefault: {
      type: Boolean,
      default: false, // Whether this is the default template for a specific trigger event
    },
    templateCategory: {
      type: String,
      enum: [
        'authentication', 'user_management', 'order_management', 'subscription_billing', 
        'marketing_campaigns', 'customer_management', 'inventory_management', 'system_maintenance',
        'communication', 'task_management'
      ],
      required: true,
      default: 'system_maintenance'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    tags: [{
      type: String,
      trim: true
    }],
    version: {
      type: Number,
      default: 1
    },
    lastUsedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model who created the template
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Update the updatedAt field before saving
notificationTemplateSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for performance
notificationTemplateSchema.index({ templateName: 1 }, { unique: true });
notificationTemplateSchema.index({ isActive: 1 });
notificationTemplateSchema.index({ isSystemDefault: 1 });
notificationTemplateSchema.index({ isDefault: 1 });
notificationTemplateSchema.index({ templateCategory: 1 });
notificationTemplateSchema.index({ triggerEvent: 1 });
notificationTemplateSchema.index({ priority: 1 });
notificationTemplateSchema.index({ createdBy: 1 });
notificationTemplateSchema.index({ lastUsedAt: -1 });
notificationTemplateSchema.index({ createdAt: -1 });

// Method to mark template as used
notificationTemplateSchema.methods.markAsUsed = function() {
  this.lastUsedAt = new Date();
  this.version += 1;
  return this.save();
};

// Static method to get system default templates
notificationTemplateSchema.statics.getSystemDefaults = function() {
  return this.find({ isSystemDefault: true, isActive: true }).sort({ templateCategory: 1, templateName: 1 });
};

// Static method to get templates by category
notificationTemplateSchema.statics.getByCategory = function(category) {
  return this.find({ templateCategory: category, isActive: true }).sort({ priority: -1, templateName: 1 });
};

// Static method to get templates by trigger event
notificationTemplateSchema.statics.getByTriggerEvent = function(triggerEvent) {
  return this.find({ triggerEvent: triggerEvent, isActive: true }).sort({ isDefault: -1, priority: -1 });
};

const NotificationTemplate = mongoose.model('NotificationTemplate', notificationTemplateSchema);

module.exports = NotificationTemplate;
