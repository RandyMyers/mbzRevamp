const mongoose = require('mongoose');

const salaryRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  requestType: {
    type: String,
    required: true,
    enum: ['adjustment', 'advance', 'bonus', 'overtime', 'other']
  },
  currentSalary: {
    type: Number,
    required: true
  },
  requestedAmount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  submittedDate: {
    type: Date,
    default: Date.now
  },
  approvedDate: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
  approvedAmount: {
    type: Number
  },
  effectiveDate: {
    type: Date
  },
  notes: {
    type: String
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }],
  // For advance requests
  repaymentPlan: {
    type: String,
    enum: ['lump_sum', 'monthly', 'quarterly', 'custom']
  },
  repaymentPeriod: {
    type: Number // in months
  },
  monthlyDeduction: {
    type: Number
  }
}, {
  timestamps: true
});

// Indexes
salaryRequestSchema.index({ employeeId: 1, organizationId: 1 });
salaryRequestSchema.index({ status: 1, organizationId: 1 });
salaryRequestSchema.index({ submittedDate: -1 });
salaryRequestSchema.index({ requestType: 1 });

module.exports = mongoose.model('SalaryRequest', salaryRequestSchema);



