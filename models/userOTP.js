const mongoose = require('mongoose');

const userOTPSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
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
  isOTPEnabled: {
    type: Boolean,
    default: false
  },
  otpEnabledAt: {
    type: Date
  },
  otpDisabledAt: {
    type: Date
  },
  // Current active OTP code
  currentCode: {
    type: String,
    length: 6
  },
  codeExpiresAt: {
    type: Date
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  lastOTPSentAt: {
    type: Date
  },
  // Rate limiting - prevent spam
  dailyOTPCount: {
    type: Number,
    default: 0
  },
  lastOTPResetDate: {
    type: Date,
    default: Date.now
  },
  // Backup codes (optional - for future implementation)
  backupCodes: [{
    code: String,
    used: { type: Boolean, default: false },
    usedAt: Date
  }],
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for performance
userOTPSchema.index({ userId: 1 });
userOTPSchema.index({ email: 1 });
userOTPSchema.index({ codeExpiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static method to find valid OTP for user
userOTPSchema.statics.findValidOTP = async function(userId, code) {
  return await this.findOne({
    userId,
    currentCode: code,
    codeExpiresAt: { $gt: new Date() },
    attempts: { $lt: 3 },
    isOTPEnabled: true
  });
};

// Static method to get user OTP settings
userOTPSchema.statics.getUserOTPSettings = async function(userId) {
  return await this.findOne({ userId });
};

// Instance method to generate new OTP code
userOTPSchema.methods.generateOTPCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.currentCode = code;
  this.codeExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  this.attempts = 0;
  this.lastOTPSentAt = new Date();
  
  // Increment daily count
  const today = new Date().toDateString();
  const lastResetDate = new Date(this.lastOTPResetDate).toDateString();
  
  if (today !== lastResetDate) {
    this.dailyOTPCount = 1;
    this.lastOTPResetDate = new Date();
  } else {
    this.dailyOTPCount += 1;
  }
  
  return code;
};

// Instance method to mark OTP as used
userOTPSchema.methods.markOTPUsed = function() {
  this.currentCode = null;
  this.codeExpiresAt = null;
  this.attempts = 0;
  return this.save();
};

// Instance method to increment failed attempts
userOTPSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

// Instance method to enable OTP
userOTPSchema.methods.enableOTP = function() {
  this.isOTPEnabled = true;
  this.otpEnabledAt = new Date();
  this.otpDisabledAt = null;
  return this.save();
};

// Instance method to disable OTP
userOTPSchema.methods.disableOTP = function() {
  this.isOTPEnabled = false;
  this.otpDisabledAt = new Date();
  this.currentCode = null;
  this.codeExpiresAt = null;
  this.attempts = 0;
  return this.save();
};

// Instance method to check if user can request new OTP (rate limiting)
userOTPSchema.methods.canRequestOTP = function() {
  // Check daily limit (max 10 OTPs per day)
  if (this.dailyOTPCount >= 10) {
    return { canRequest: false, reason: 'Daily OTP limit exceeded (10 per day)' };
  }
  
  // Check if there's a valid code already (prevent spam)
  if (this.currentCode && this.codeExpiresAt && this.codeExpiresAt > new Date()) {
    const timeLeft = Math.ceil((this.codeExpiresAt - new Date()) / 1000);
    return { canRequest: false, reason: `Please wait ${timeLeft} seconds before requesting a new code` };
  }
  
  // Check minimum time between requests (30 seconds)
  if (this.lastOTPSentAt) {
    const timeSinceLastSent = Date.now() - this.lastOTPSentAt.getTime();
    if (timeSinceLastSent < 30000) { // 30 seconds
      const timeLeft = Math.ceil((30000 - timeSinceLastSent) / 1000);
      return { canRequest: false, reason: `Please wait ${timeLeft} seconds before requesting a new code` };
    }
  }
  
  return { canRequest: true };
};

module.exports = mongoose.model('UserOTP', userOTPSchema);











