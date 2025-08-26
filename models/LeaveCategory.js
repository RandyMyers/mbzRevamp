const mongoose = require('mongoose');

const leaveCategorySchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, unique: true },
		color: { type: String, default: '#cccccc' },
		accrualRate: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'fixed'], default: 'yearly' },
		carryOverPolicy: { type: String, enum: ['none', 'limited', 'unlimited'], default: 'none' },
		carryOverDays: { type: Number, default: 0 },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

leaveCategorySchema.index({ isActive: 1, name: 1 });

const LeaveCategory = mongoose.model('LeaveCategory', leaveCategorySchema);

module.exports = LeaveCategory;












