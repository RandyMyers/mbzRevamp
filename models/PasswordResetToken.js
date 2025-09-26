const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  },
  used: {
    type: Boolean,
    default: false,
    index: true
  },
  usedAt: {
    type: Date,
    default: null
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
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

// Pre-save middleware to update updatedAt
passwordResetTokenSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find valid token
passwordResetTokenSchema.statics.findValidToken = function(token) {
  return this.findOne({
    token: token,
    used: false,
    expiresAt: { $gt: new Date() }
  });
};

// Instance method to mark token as used
passwordResetTokenSchema.methods.markAsUsed = function() {
  this.used = true;
  this.usedAt = new Date();
  return this.save();
};

// Instance method to check if token is expired
passwordResetTokenSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Instance method to check if token is valid (not used and not expired)
passwordResetTokenSchema.methods.isValid = function() {
  return !this.used && !this.isExpired();
};

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

