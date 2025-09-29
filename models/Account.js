const mongoose = require('mongoose');  

const ACCOUNT_TYPES = ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses']; 

const accountSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		code: { type: String, required: true, trim: true, unique: true },
		type: { type: String, enum: ACCOUNT_TYPES, required: true },
		parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
		isCore: { type: Boolean, default: false },
		isActive: { type: Boolean, default: true },
		metadata: { type: Object, default: {} },
	},
	{ timestamps: true }
);

accountSchema.index({ type: 1, code: 1 });

const Account = mongoose.model('Account', accountSchema);

module.exports = { Account, ACCOUNT_TYPES };

















