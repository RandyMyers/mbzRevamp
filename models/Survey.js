// NOTE: This file previously had a duplicate Survey model definition added.
// We keep the original schema below and remove the duplicate to avoid OverwriteModelError.
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SurveySchema = new Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Survey Settings
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  estimatedTime: {
    type: String,
    trim: true
  },

  // Timing and Availability
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },

  // Target Audience
  targetUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetRoles: [{
    type: String,
    trim: true
  }],

  // Questions
  questions: [{
    id: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'rating', 'multiple-choice', 'single-choice', 'boolean'],
      required: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    required: {
      type: Boolean,
      default: false
    },
    options: [{
      value: String,
      label: String
    }],
    minRating: {
      type: Number,
      default: 1
    },
    maxRating: {
      type: Number,
      default: 5
    },
    order: {
      type: Number,
      required: true
    }
  }],

  // Response Tracking
  totalResponses: {
    type: Number,
    default: 0
  },
  completedResponses: {
    type: Number,
    default: 0
  },
  averageCompletionTime: {
    type: Number, // in minutes
    default: 0
  },

  // Settings
  allowAnonymous: {
    type: Boolean,
    default: false
  },
  allowMultipleResponses: {
    type: Boolean,
    default: false
  },
  showProgress: {
    type: Boolean,
    default: true
  },
  showResults: {
    type: Boolean,
    default: false
  },

  // Tags and Categories
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true
  },

  // Audit Information
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
SurveySchema.index({ organizationId: 1, createdAt: -1 });
SurveySchema.index({ status: 1 });
SurveySchema.index({ startDate: 1, endDate: 1 });
SurveySchema.index({ createdBy: 1, createdAt: -1 });

// Pre-save middleware to update timestamps
SurveySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate completion rate
SurveySchema.methods.getCompletionRate = function() {
  if (this.totalResponses === 0) return 0;
  return (this.completedResponses / this.totalResponses) * 100;
};

// Check if survey is active
SurveySchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         (!this.startDate || now >= this.startDate) && 
         (!this.endDate || now <= this.endDate);
};

module.exports = mongoose.model('Survey', SurveySchema); 