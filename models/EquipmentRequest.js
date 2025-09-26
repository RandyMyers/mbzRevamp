const mongoose = require('mongoose');

const equipmentRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  equipmentType: {
    type: String,
    required: true,
    enum: ['laptop', 'desktop', 'monitor', 'keyboard', 'mouse', 'headset', 'phone', 'tablet', 'other']
  },
  equipmentName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  requestedDate: {
    type: Date,
    default: Date.now
  },
  approvedDate: {
    type: Date
  },
  fulfilledDate: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
  notes: {
    type: String
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }]
}, {
  timestamps: true
});

// Indexes
equipmentRequestSchema.index({ employeeId: 1, organizationId: 1 });
equipmentRequestSchema.index({ status: 1, organizationId: 1 });
equipmentRequestSchema.index({ requestedDate: -1 });

module.exports = mongoose.model('EquipmentRequest', equipmentRequestSchema);

