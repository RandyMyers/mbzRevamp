const mongoose = require('mongoose');

const weeklyReportSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    weekStartDate: {
      type: Date,
      required: true
    },
    weekEndDate: {
      type: Date,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    weekNumber: {
      type: Number,
      required: true
    },
    accomplishments: [{
      task: {
        type: String,
        required: true
      },
      description: String,
      status: {
        type: String,
        enum: ['Completed', 'In Progress', 'Pending'],
        default: 'Completed'
      },
      hoursSpent: {
        type: Number,
        default: 0
      }
    }],
    challenges: [{
      challenge: {
        type: String,
        required: true
      },
      description: String,
      resolution: String,
      status: {
        type: String,
        enum: ['Resolved', 'In Progress', 'Escalated'],
        default: 'In Progress'
      }
    }],
    goalsForNextWeek: [{
      goal: {
        type: String,
        required: true
      },
      priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
      }
    }],
    additionalNotes: {
      type: String
    },
    totalHoursWorked: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Reviewed', 'Approved'],
      default: 'Draft'
    },
    submittedDate: {
      type: Date
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedDate: {
      type: Date
    },
    managerFeedback: {
      type: String
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      comment: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    attachments: [{
      name: String,
      url: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  { timestamps: true }
);

weeklyReportSchema.index({ employee: 1, year: 1, weekNumber: 1 }, { unique: true });
weeklyReportSchema.index({ weekStartDate: -1 });

module.exports = mongoose.model('WeeklyReport', weeklyReportSchema);