const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
	account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
	debit: { type: Number, default: 0 },
	credit: { type: Number, default: 0 },
	description: { type: String, default: '' },
});

const journalEntrySchema = new mongoose.Schema(
	{
		date: { type: Date, default: Date.now },
		currency: { type: String, default: 'NGN' },
		status: { type: String, enum: ['draft', 'posted', 'auto'], default: 'draft' },
		source: { type: String, default: 'manual' },
		description: { type: String, default: '' },
		lines: { type: [lineItemSchema], validate: v => v.length >= 2 },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	},
	{ timestamps: true }
);

journalEntrySchema.methods.validateBalance = function () {
	const totals = this.lines.reduce(
		(acc, l) => ({ debit: acc.debit + (l.debit || 0), credit: acc.credit + (l.credit || 0) }),
		{ debit: 0, credit: 0 }
	);
	return Math.abs(totals.debit - totals.credit) < 0.00001;
};

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);

module.exports = JournalEntry;

















