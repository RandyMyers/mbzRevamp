const mongoose = require('mongoose');

const passwordResetCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    length: 6
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Static method to find valid code
passwordResetCodeSchema.statics.findValidCode = async function(code, email) {
  return await this.findOne({
    code,
    email: email.toLowerCase().trim(),
    used: false,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 3 }
  }).populate('userId');
};

// Instance method to mark as used
passwordResetCodeSchema.methods.markAsUsed = function() {
  this.used = true;
  this.usedAt = new Date();
  return this.save();
};

// Instance method to increment attempts
passwordResetCodeSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

module.exports = mongoose.model('PasswordResetCode', passwordResetCodeSchema);






