const mongoose = require('mongoose');

const expenseReimbursementSchema = new mongoose.Schema({
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
  expenseType: {
    type: String,
    required: true,
    enum: ['travel', 'meals', 'accommodation', 'transport', 'office_supplies', 'training', 'client_entertainment', 'other']
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'NGN'
  },
  expenseDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid', 'cancelled'],
    default: 'pending'
  },
  submittedDate: {
    type: Date,
    default: Date.now
  },
  approvedDate: {
    type: Date
  },
  paidDate: {
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
  notes: {
    type: String
  },
  receipts: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    description: String
  }],
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'check', 'other']
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    accountName: String
  }
}, {
  timestamps: true
});

// Indexes
expenseReimbursementSchema.index({ employeeId: 1, organizationId: 1 });
expenseReimbursementSchema.index({ status: 1, organizationId: 1 });
expenseReimbursementSchema.index({ submittedDate: -1 });
expenseReimbursementSchema.index({ expenseDate: -1 });

module.exports = mongoose.model('ExpenseReimbursement', expenseReimbursementSchema);

