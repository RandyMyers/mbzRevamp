const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		bankName: { type: String, required: true, trim: true },
		currency: { type: String, default: 'NGN' },
		accountNumber: { type: String, required: true, trim: true, unique: true },
		accountType: { type: String, enum: ['current', 'savings', 'other'], default: 'current' },
		isActive: { type: Boolean, default: true },
		metadata: { type: Object, default: {} },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	},
	{ timestamps: true }
);

bankAccountSchema.index({ isActive: 1, bankName: 1, currency: 1 });

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

module.exports = BankAccount;









