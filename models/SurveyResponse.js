const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SurveyResponseSchema = new Schema({
  // Survey Reference
  surveyId: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },

  // User Information
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },

  // Response Status
  status: {
    type: String,
    enum: ['started', 'in-progress', 'completed', 'abandoned'],
    default: 'started'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Response Data
  responses: [{
    questionId: {
      type: Number,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      enum: ['text', 'rating', 'multiple-choice', 'single-choice', 'boolean'],
      required: true
    },
    response: {
      type: Schema.Types.Mixed, // Can be string, number, array, or boolean
      required: true
    },
    answeredAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Timing Information
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },

  // Device and Browser Information
  userAgent: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  browser: {
    type: String,
    trim: true
  },
  device: {
    type: String,
    trim: true
  },

  // Metadata
  sessionId: {
    type: String,
    trim: true
  },
  referrer: {
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
SurveyResponseSchema.index({ surveyId: 1, createdAt: -1 });
SurveyResponseSchema.index({ userId: 1, surveyId: 1 });
SurveyResponseSchema.index({ organizationId: 1, createdAt: -1 });
SurveyResponseSchema.index({ status: 1 });
SurveyResponseSchema.index({ sessionId: 1 });

// Pre-save middleware to update timestamps
SurveyResponseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate progress
SurveyResponseSchema.methods.calculateProgress = function(survey) {
  if (!survey || !survey.questions || survey.questions.length === 0) {
    return 0;
  }
  const answeredQuestions = this.responses.length;
  const totalQuestions = survey.questions.length;
  return Math.round((answeredQuestions / totalQuestions) * 100);
};

// Check if response is complete
SurveyResponseSchema.methods.isComplete = function(survey) {
  if (!survey || !survey.questions) return false;
  
  const requiredQuestions = survey.questions.filter(q => q.required);
  const answeredRequiredQuestions = this.responses.filter(r => 
    requiredQuestions.some(q => q.id === r.questionId)
  );
  
  return answeredRequiredQuestions.length === requiredQuestions.length;
};

// Get response for a specific question
SurveyResponseSchema.methods.getResponseForQuestion = function(questionId) {
  return this.responses.find(r => r.questionId === questionId);
};

module.exports = mongoose.model('SurveyResponse', SurveyResponseSchema); 