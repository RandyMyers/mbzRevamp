const mongoose = require('mongoose');

const shippingLabelSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
  },
  carrier: {
    type: String,
    required: true,
    enum: ['USPS', 'FedEx', 'UPS', 'DHL'],
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['Priority', 'Express', 'Ground', 'First Class', 'Standard'],
  },
  labelData: {
    fromAddress: {
      name: String,
      company: String,
      address1: String,
      address2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
    },
    toAddress: {
      name: String,
      company: String,
      address1: String,
      address2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
    },
    packageDetails: {
      weight: Number, // in ounces
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
      },
    },
  },
  status: {
    type: String,
    enum: ['created', 'printed', 'shipped', 'delivered', 'cancelled'],
    default: 'created',
  },
  labelUrl: String, // URL to generated label PDF
  trackingUrl: String, // URL to tracking page
  shippingCost: Number,
  estimatedDelivery: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
shippingLabelSchema.index({ orderId: 1 }, { unique: true });
shippingLabelSchema.index({ trackingNumber: 1 }, { unique: true });
shippingLabelSchema.index({ organizationId: 1 });
shippingLabelSchema.index({ storeId: 1 });

module.exports = mongoose.model('ShippingLabel', shippingLabelSchema); 