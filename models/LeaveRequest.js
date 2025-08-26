const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
	{
		employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
		category: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveCategory', required: true },
		startDate: { type: Date, required: true },
		endDate: { type: Date, required: true },
		reason: { type: String, default: '' },
		status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
		reviewComment: { type: String, default: '' },
		reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	},
	{ timestamps: true }
);

leaveRequestSchema.index({ employee: 1, startDate: -1 });

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

module.exports = LeaveRequest;












