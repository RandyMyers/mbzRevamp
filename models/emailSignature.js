const mongoose = require('mongoose');

const emailSignatureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Signature name is required'],
    trim: true,
    maxlength: [100, 'Signature name cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Signature content is required'],
    // HTML content for rich signatures
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  isActive: {
    type: Boolean,
    default: true
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

// Ensure only one default signature per user
emailSignatureSchema.index({ user: 1, isDefault: 1 }, { 
  unique: true, 
  partialFilterExpression: { isDefault: true } 
});

// Index for organization-based queries
emailSignatureSchema.index({ organization: 1, user: 1 });

// Index for active signatures
emailSignatureSchema.index({ user: 1, organization: 1, isActive: 1 });

// Pre-save middleware to update the updatedAt field
emailSignatureSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-update middleware to update the updatedAt field
emailSignatureSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('EmailSignature', emailSignatureSchema);
