const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Onboarding Schema for organization-level onboarding tracking
const OnboardingSchema = new Schema({
  // Organization Reference
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    unique: true // One onboarding per organization
  },
  
  // Main User (Organization Owner/Admin)
  mainUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Onboarding Status
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'skipped'],
    default: 'not_started'
  },
  
  // Step Tracking
  currentStep: {
    type: Number,
    min: 1,
    max: 4,
    default: 1
  },
  
  completedSteps: [{
    stepNumber: { 
      type: Number, 
      required: true,
      min: 1,
      max: 4
    },
    completedAt: { 
      type: Date, 
      default: Date.now 
    },
    completedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    stepData: {
      type: Schema.Types.Mixed,
      default: {}
    }
  }],
  
  // Step 1: Store Setup
  storeSetup: {
    isCompleted: { 
      type: Boolean, 
      default: false 
    },
    completedAt: { 
      type: Date 
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    storeData: {
      businessName: { type: String, trim: true },
      businessType: { type: String, trim: true },
      domain: { type: String, trim: true },
      logoUrl: { type: String },
      colors: [{ type: String }],
      businessEmail: { type: String, trim: true },
      description: { type: String, trim: true },
      setupMode: { 
        type: String, 
        enum: ['new', 'existing'],
        default: 'new'
      },
      linkedStoreUrl: { type: String },
      platform: { type: String }
    },
    storeId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Store' 
    }
  },
  
  // Step 2: Plan Selection
  planSelection: {
    isCompleted: { 
      type: Boolean, 
      default: false 
    },
    completedAt: { 
      type: Date 
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    selectedPlan: { 
      type: String,
      trim: true
    },
    planId: { 
      type: Schema.Types.ObjectId, 
      ref: 'SubscriptionPlan' 
    },
    subscriptionId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Subscription' 
    },
    trialActivated: { 
      type: Boolean, 
      default: false 
    },
    trialStartDate: { 
      type: Date 
    },
    trialEndDate: { 
      type: Date 
    },
    billingInterval: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    }
  },
  
  // Step 3: Platform Tour
  platformTour: {
    isCompleted: { 
      type: Boolean, 
      default: false 
    },
    completedAt: { 
      type: Date 
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    completedModules: [{ 
      type: String,
      enum: ['stores', 'tasks', 'inventory', 'billing', 'analytics', 'customers', 'marketing', 'settings', 'user-management', 'integrations', 'customer-support', 'audit-logs', 'invoices']
    }],
    dashboardTourCompleted: { 
      type: Boolean, 
      default: false 
    },
    // Individual module tour completion tracking (matches frontend expectation)
    moduleToursCompleted: [{
      moduleId: { 
        type: String, 
        required: true,
        enum: ['stores', 'tasks', 'inventory', 'billing', 'analytics', 'customers', 'marketing', 'settings', 'user-management', 'integrations', 'customer-support', 'audit-logs', 'invoices']
      },
      completedAt: { 
        type: Date, 
        default: Date.now 
      },
      completedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      timeSpent: { 
        type: Number, 
        default: 0 
      }, // in minutes
      tourType: {
        type: String,
        enum: ['interactive', 'video', 'help'],
        default: 'interactive'
      }
    }],
    moduleProgress: [{
      moduleId: { type: String, required: true },
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date },
      timeSpent: { type: Number, default: 0 }, // in minutes
      lastAccessedAt: { type: Date, default: Date.now },
      progressPercentage: { type: Number, min: 0, max: 100, default: 0 }
    }]
  },
  
  // Step 4: Final Setup
  finalSetup: {
    isCompleted: { 
      type: Boolean, 
      default: false 
    },
    completedAt: { 
      type: Date 
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    preferences: {
      notifications: { 
        type: Boolean, 
        default: true 
      },
      emailUpdates: { 
        type: Boolean, 
        default: true 
      },
      dataSharing: { 
        type: Boolean, 
        default: false 
      },
      marketingEmails: {
        type: Boolean,
        default: false
      },
      showTips: {
        type: Boolean,
        default: true
      }
    },
    userProfile: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      phone: { type: String, trim: true },
      timezone: { type: String, default: 'UTC' },
      language: { type: String, default: 'en' }
    }
  },
  
  // Metadata
  startedAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: { 
    type: Date 
  },
  lastActivityAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // Skip Information
  skippedAt: { 
    type: Date 
  },
  skippedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  skipReason: { 
    type: String,
    enum: ['user_choice', 'admin_override', 'technical_issue', 'other']
  },
  skipDetails: {
    type: String,
    trim: true
  },
  
  // Progress Analytics
  timeSpent: { 
    type: Number, 
    default: 0 
  }, // Total time in minutes
  stepTimes: [{
    stepNumber: { 
      type: Number, 
      required: true,
      min: 1,
      max: 4
    },
    timeSpent: { 
      type: Number, 
      default: 0 
    }, // in minutes
    startedAt: { 
      type: Date 
    },
    completedAt: { 
      type: Date 
    }
  }],
  
  // Error Tracking
  errors: [{
    stepNumber: { type: Number, required: true },
    errorType: { type: String, required: true },
    errorMessage: { type: String, required: true },
    occurredAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false }
  }],
  
  // Version tracking for future updates
  version: {
    type: String,
    default: '1.0.0'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for progress percentage
OnboardingSchema.virtual('progressPercentage').get(function() {
  const totalSteps = 4;
  const completedCount = this.completedSteps.length;
  return Math.round((completedCount / totalSteps) * 100);
});

// Virtual for time remaining estimate
OnboardingSchema.virtual('estimatedTimeRemaining').get(function() {
  if (this.completedSteps.length === 0) return 30; // Default 30 minutes
  const avgTimePerStep = this.timeSpent / this.completedSteps.length;
  const remainingSteps = 4 - this.completedSteps.length;
  return Math.round(avgTimePerStep * remainingSteps);
});

// Indexes for performance
OnboardingSchema.index({ organizationId: 1 });
OnboardingSchema.index({ mainUserId: 1 });
OnboardingSchema.index({ status: 1 });
OnboardingSchema.index({ currentStep: 1 });
OnboardingSchema.index({ createdAt: -1 });

// Static method to find onboarding by organization
OnboardingSchema.statics.findByOrganization = function(organizationId) {
  return this.findOne({ organizationId }).populate('mainUserId', 'fullName email');
};

// Static method to get onboarding statistics
OnboardingSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgTimeSpent: { $avg: '$timeSpent' }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      avgTimeSpent: Math.round(stat.avgTimeSpent || 0)
    };
    return acc;
  }, {});
};

// Instance method to complete a step
OnboardingSchema.methods.completeStep = function(stepNumber, userId, stepData = {}) {
  // Add to completed steps if not already completed
  const existingStep = this.completedSteps.find(step => step.stepNumber === stepNumber);
  if (!existingStep) {
    this.completedSteps.push({
      stepNumber,
      completedBy: userId,
      stepData
    });
  }
  
  // Update current step
  this.currentStep = Math.min(stepNumber + 1, 4);
  this.lastActivityAt = new Date();
  
  // Update status
  if (this.currentStep > 4) {
    this.status = 'completed';
    this.completedAt = new Date();
  } else {
    this.status = 'in_progress';
  }
  
  return this.save();
};

// Instance method to skip onboarding
OnboardingSchema.methods.skipOnboarding = function(userId, reason = 'user_choice', details = '') {
  this.status = 'skipped';
  this.skippedAt = new Date();
  this.skippedBy = userId;
  this.skipReason = reason;
  this.skipDetails = details;
  this.lastActivityAt = new Date();
  
  return this.save();
};

// Instance method to reset onboarding
OnboardingSchema.methods.resetOnboarding = function() {
  this.status = 'not_started';
  this.currentStep = 1;
  this.completedSteps = [];
  this.storeSetup = { isCompleted: false };
  this.planSelection = { isCompleted: false };
  this.platformTour = { isCompleted: false };
  this.finalSetup = { isCompleted: false };
  this.startedAt = new Date();
  this.completedAt = undefined;
  this.skippedAt = undefined;
  this.skippedBy = undefined;
  this.skipReason = undefined;
  this.skipDetails = undefined;
  this.timeSpent = 0;
  this.stepTimes = [];
  this.errors = [];
  this.lastActivityAt = new Date();
  
  return this.save();
};

module.exports = mongoose.model('Onboarding', OnboardingSchema);
