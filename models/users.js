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
      enum: ['active', 'inactive'],
      default: 'active',
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
      enum: ['UTC', 'EST', 'PST', 'GMT', 'CET'],
      default: 'UTC'
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