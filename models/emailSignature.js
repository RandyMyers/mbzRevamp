const mongoose = require('mongoose');

const emailSignatureSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  signatureType: {
    type: String,
    enum: ['personal', 'department', 'company', 'role_based'],
    default: 'personal'
  },
  department: {
    type: String
  },
  role: {
    type: String
  },
  variables: [{
    name: String,
    value: String,
    type: {
      type: String,
      enum: ['text', 'image', 'link', 'social']
    }
  }],
  htmlContent: {
    type: String
  },
  plainTextContent: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUsed: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
emailSignatureSchema.index({ organizationId: 1, userId: 1 });
emailSignatureSchema.index({ isDefault: 1, organizationId: 1 });
emailSignatureSchema.index({ isActive: 1, organizationId: 1 });
emailSignatureSchema.index({ signatureType: 1, organizationId: 1 });

module.exports = mongoose.model('EmailSignature', emailSignatureSchema);