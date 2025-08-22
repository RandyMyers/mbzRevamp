const mongoose = require('mongoose');

const bankTransactionSchema = new mongoose.Schema(
	{
		bankAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
		date: { type: Date, default: Date.now },
		amount: { type: Number, required: true },
		type: { type: String, enum: ['credit', 'debit'], required: true },
		description: { type: String, default: '' },
		currency: { type: String, default: 'NGN' },
		reference: { type: String, default: '' },
		source: { type: String, enum: ['manual', 'import', 'api'], default: 'manual' },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	},
	{ timestamps: true }
);

bankTransactionSchema.index({ bankAccount: 1, date: -1 });

const BankTransaction = mongoose.model('BankTransaction', bankTransactionSchema);

module.exports = BankTransaction;









