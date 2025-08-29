const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, unique: true },
		description: { type: String, default: '' },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

departmentSchema.index({ isActive: 1, name: 1 });

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;

















