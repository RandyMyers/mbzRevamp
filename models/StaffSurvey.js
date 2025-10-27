const mongoose = require('mongoose');

const surveyQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['multiple-choice', 'rating', 'text', 'yes-no']
  },
  options: [String],
  required: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true
  }
});

const surveyResponseSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  answer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const staffSurveySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['Employee Satisfaction', 'Training Feedback', 'Performance Review', 'Culture Assessment', 'Exit Interview', 'General']
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Completed', 'Archived'],
      default: 'Draft'
    },
    targetEmployees: {
      type: String,
      enum: ['All', 'Selected', 'Department'],
      default: 'All'
    },
    targetDepartments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    }],
    selectedEmployees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    estimatedTime: {
      type: String,
      default: '5-10 minutes'
    },
    questions: [surveyQuestionSchema],
    responses: [surveyResponseSchema],
    totalResponses: {
      type: Number,
      default: 0
    },
    totalTargets: {
      type: Number,
      default: 0
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    allowMultipleSubmissions: {
      type: Boolean,
      default: false
    },
    settings: {
      showProgress: {
        type: Boolean,
        default: true
      },
      allowSaveDraft: {
        type: Boolean,
        default: true
      },
      requireAllQuestions: {
        type: Boolean,
        default: true
      }
    }
  },
  { timestamps: true }
);

staffSurveySchema.index({ status: 1, endDate: 1 });
staffSurveySchema.index({ createdBy: 1, createdAt: -1 });
staffSurveySchema.index({ 'responses.employee': 1 });

module.exports = mongoose.model('StaffSurvey', staffSurveySchema);


