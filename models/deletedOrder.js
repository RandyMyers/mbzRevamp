const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * DeletedOrder Schema
 * Tracks orders that were intentionally deleted from the dashboard
 * This prevents them from being re-created during WooCommerce sync
 */
const DeletedOrderSchema = new Schema({
  // WooCommerce order ID that was deleted
  wooCommerceId: {
    type: Number,
    required: true
  },
  // Store the order belonged to
  storeId: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  // Organization context
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  // User who deleted the order
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Order details for reference (optional)
  orderNumber: String,
  orderTotal: String,
  orderStatus: String,
  customerEmail: String,
  // Whether it was also deleted from WooCommerce
  deletedFromWooCommerce: {
    type: Boolean,
    default: false
  },
  // Timestamp
  deletedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index for efficient lookup during sync
DeletedOrderSchema.index({ wooCommerceId: 1, storeId: 1 }, { unique: true });
DeletedOrderSchema.index({ storeId: 1 });
DeletedOrderSchema.index({ organizationId: 1 });

module.exports = mongoose.model('DeletedOrder', DeletedOrderSchema);
