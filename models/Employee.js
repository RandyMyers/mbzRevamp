const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		fullName: { type: String, required: true },
		email: { type: String, required: true },
		department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
		roleTitle: { type: String, default: '' },
		status: { type: String, enum: ['active', 'suspended', 'terminated'], default: 'active' },
		salary: { type: Number, default: 0 },
		bankDetails: {
			bankName: String,
			accountNumber: String,
			accountName: String,
		},
		emergencyContacts: [{ name: String, phone: String, relationship: String }],
		metadata: { type: Object, default: {} },
	},
	{ timestamps: true }
);

employeeSchema.index({ status: 1, email: 1 });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;












