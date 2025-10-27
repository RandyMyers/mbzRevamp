const mongoose = require('mongoose');

const salaryRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    requestType: {
      type: String,
      required: true,
      enum: ['Adjustment', 'Advance']
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    currentSalary: {
      type: Number,
      required: true
    },
    requestedAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    justification: {
      type: String,
      required: true
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Processed'],
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
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedDate: {
      type: Date
    },
    processedDate: {
      type: Date
    },
    rejectionReason: {
      type: String
    },
    // For salary advance requests
    repaymentPlan: {
      installments: {
        type: Number,
        default: 1
      },
      monthlyAmount: {
        type: Number
      },
      startDate: {
        type: Date
      },
      endDate: {
        type: Date
      }
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

salaryRequestSchema.index({ employee: 1, requestType: 1, status: 1 });
salaryRequestSchema.index({ requestDate: -1 });

module.exports = mongoose.model('SalaryRequest', salaryRequestSchema);