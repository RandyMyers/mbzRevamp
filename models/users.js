const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const currencyList = require('../utils/currencyList');

const UserSchema = new Schema({
    username: {
        type: String,
        trim: true,
      },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: false,
      description: 'Role ID for the new role system (maintains backward compatibility with string role field)'
    },
    groups: [{
      type: Schema.Types.ObjectId,
      ref: 'Group',
    }],
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    // OTP (One-Time Password) Settings
    otpEnabled: {
      type: Boolean,
      default: false,
    },
    otpEnabledAt: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
    invitations: [{
      type: Schema.Types.ObjectId,
      ref: 'Invitation',
    }],
    department: {
      type: String,
      enum: [
        'Customer Support', 
        'IT', 
        'HR', 
        'Sales', 
        'Marketing', 
        'Finance', 
        'Billing', 
        'Shipping'
      ],
        
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending-verification'],
      default: 'pending-verification',
    },
    
    // Email verification status
    emailVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    
    emailVerifiedAt: {
      type: Date,
      default: null
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: function () {
        return this.role !== 'super-admin';
      },
    },
   
    organizationCode: {
        type: String,
      },
    displayCurrency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          // Use comprehensive currency validation
          return currencyList.isValidCurrencyCode(v);
        },
        message: 'Currency code must be a valid supported currency (e.g., USD, EUR, NGN). Please select from the supported currencies list.'
      }
    },
    profilePicture: {
      type: String,
      default: null,
    },
    // Regional settings
    language: {
      type: String,
      enum: ['en', 'es', 'fr'],
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC',
      validate: {
        validator: function(v) {
          // Allow any valid IANA timezone identifier
          const moment = require('moment-timezone');
          return moment.tz.names().includes(v);
        },
        message: 'Invalid timezone identifier. Please use a valid IANA timezone (e.g., America/New_York, Europe/London, Africa/Johannesburg)'
      }
    },
    dateFormat: {
      type: String,
      enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
      default: 'MM/DD/YYYY'
    },
    timeFormat: {
      type: String,
      enum: ['12', '24'],
      default: '12'
    },
    // Notification settings
    notificationSettings: {
      type: Object,
      default: {
        email: {
          enabled: true,
          categories: {
            system: true,
            orders: true,
            inventory: true,
            customers: true,
            security: true
          }
        },
        inApp: {
          enabled: true,
          categories: {
            system: true,
            orders: true,
            inventory: true,
            customers: true,
            security: true
          }
        },
        frequency: 'immediate', // immediate, daily, weekly
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
          timezone: 'UTC'
        }
      }
    },
    // Onboarding fields
    onboardingStatus: {
      isOnboardingComplete: { 
        type: Boolean, 
        default: false 
      },
      onboardingCompletedAt: { 
        type: Date 
      },
      lastOnboardingStep: { 
        type: Number, 
        default: 1,
        min: 1,
        max: 4
      },
      onboardingPreferences: {
        skipTutorials: { 
          type: Boolean, 
          default: false 
        },
        showTips: { 
          type: Boolean, 
          default: true 
        },
        skipOnboarding: {
          type: Boolean,
          default: false
        }
      }
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  });
  

UserSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if password was changed after a given timestamp
UserSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

module.exports = mongoose.model('User', UserSchema);