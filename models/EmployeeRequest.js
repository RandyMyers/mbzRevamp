const mongoose = require('mongoose');

const employeeRequestSchema = new mongoose.Schema(
	{
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: { type: String, enum: ['expense', 'equipment', 'advance', 'adjustment', 'profile_update'], required: true },
    title: { type: String, default: '' },
    details: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'in_review'], default: 'pending' },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
	{ timestamps: true }
);

employeeRequestSchema.index({ employee: 1, type: 1, status: 1, createdAt: -1 });

const EmployeeRequest = mongoose.model('EmployeeRequest', employeeRequestSchema);

module.exports = EmployeeRequest;












