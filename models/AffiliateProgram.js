const mongoose = require('mongoose');

const affiliateProgramSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		code: { type: String, required: true, unique: true, trim: true },
		audience: { type: String, enum: ['internal', 'public'], default: 'internal' },
		cookieDays: { type: Number, default: 30, min: 0 },
		commissionRuleSet: { type: mongoose.Schema.Types.ObjectId, ref: 'CommissionRuleSet', required: true },
		minPayout: { type: Number, default: 50000 },
		payoutWindow: { type: String, default: '25-30' },
		allowedPayoutMethods: { type: [String], default: ['bank_transfer', 'paypal'] },
		terms: { type: String, default: '' },
		isActive: { type: Boolean, default: true },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	},
	{ timestamps: true }
);

affiliateProgramSchema.index({ isActive: 1, code: 1 });

const AffiliateProgram = mongoose.model('AffiliateProgram', affiliateProgramSchema);

module.exports = AffiliateProgram;












