const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema(
	{
		employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
		category: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveCategory', required: true },
		year: { type: Number, required: true },
		totalDays: { type: Number, default: 0 },
		usedDays: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

leaveBalanceSchema.index({ employee: 1, category: 1, year: 1 }, { unique: true });

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);

module.exports = LeaveBalance;












