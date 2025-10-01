const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmailVerificationSchema = new Schema({
  // User reference
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Email to be verified
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  // 6-digit verification code
  verificationCode: {
    type: String,
    required: true,
    length: 6,
    validate: {
      validator: function(v) {
        return /^\d{6}$/.test(v);
      },
      message: 'Verification code must be exactly 6 digits'
    }
  },
  
  // Code expiration (15 minutes from creation)
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    },
    index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  },
  
  // Verification status
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // When the code was verified
  verifiedAt: {
    type: Date,
    default: null
  },
  
  // Number of attempts to verify
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum 5 attempts before code becomes invalid
  },
  
  // When the code becomes invalid due to too many attempts
  invalidatedAt: {
    type: Date,
    default: null
  },
  
  // Request metadata
  ipAddress: {
    type: String,
    required: true
  },
  
  userAgent: {
    type: String,
    required: true
  },
  
  // Organization context (for multi-tenant support)
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: false // Optional for super-admin registrations
  },
  
  // Audit timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance and cleanup
EmailVerificationSchema.index({ email: 1, isVerified: 1 });
EmailVerificationSchema.index({ userId: 1, isVerified: 1 });
EmailVerificationSchema.index({ verificationCode: 1, expiresAt: 1 });
EmailVerificationSchema.index({ createdAt: -1 });

// Pre-save middleware to update timestamps
EmailVerificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find valid verification code
EmailVerificationSchema.statics.findValidCode = function(email, code) {
  return this.findOne({
    email: email.toLowerCase(),
    verificationCode: code,
    isVerified: false,
    invalidatedAt: null,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 5 }
  });
};

// Static method to invalidate expired codes
EmailVerificationSchema.statics.invalidateExpiredCodes = function() {
  return this.updateMany(
    {
      expiresAt: { $lt: new Date() },
      isVerified: false
    },
    {
      $set: { invalidatedAt: new Date() }
    }
  );
};

// Instance method to verify the code
EmailVerificationSchema.methods.verifyCode = function(inputCode) {
  // Check if code is already verified
  if (this.isVerified) {
    return { success: false, message: 'Code has already been verified' };
  }
  
  // Check if code is expired
  if (this.expiresAt < new Date()) {
    return { success: false, message: 'Verification code has expired' };
  }
  
  // Check if code is invalidated due to too many attempts
  if (this.invalidatedAt || this.attempts >= 5) {
    return { success: false, message: 'Verification code is no longer valid' };
  }
  
  // Increment attempts
  this.attempts += 1;
  
  // Check if code matches
  if (this.verificationCode === inputCode) {
    this.isVerified = true;
    this.verifiedAt = new Date();
    return { success: true, message: 'Email verified successfully' };
  }
  
  // Check if max attempts reached
  if (this.attempts >= 5) {
    this.invalidatedAt = new Date();
    return { success: false, message: 'Too many failed attempts. Please request a new verification code.' };
  }
  
  return { 
    success: false, 
    message: `Invalid verification code. ${5 - this.attempts} attempts remaining.` 
  };
};

// Instance method to generate a new 6-digit code
EmailVerificationSchema.statics.generateVerificationCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = mongoose.model('EmailVerification', EmailVerificationSchema);
