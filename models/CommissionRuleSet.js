const mongoose = require('mongoose');

const commissionTierSchema = new mongoose.Schema({
	// Percentage for the first period (e.g., first month)
	firstPeriodPercent: { type: Number, min: 0, max: 100, default: 0 },
	// Percentage for the subsequent periods (array length depends on interval)
	followingPeriodsPercents: { type: [Number], default: [] },
});

const commissionRuleSetSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		description: { type: String, default: '' },
		currency: { type: String, default: 'NGN' },
		// Simple flat rule for monthly subscriptions
		monthlyPercent: { type: Number, min: 0, max: 100, default: 10 },
		// Quarterly rule: e.g., 12% first month, 2% next 2 months
		quarterly: {
			type: commissionTierSchema,
			default: () => ({ firstPeriodPercent: 12, followingPeriodsPercents: [2, 2] }),
		},
		// Yearly rule: e.g., 15% first month, 5% next 11 months
		yearly: {
			type: commissionTierSchema,
			default: () => ({ firstPeriodPercent: 15, followingPeriodsPercents: Array(11).fill(5) }),
		},
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

commissionRuleSetSchema.index({ isActive: 1, name: 1 });

const CommissionRuleSet = mongoose.model('CommissionRuleSet', commissionRuleSetSchema);

module.exports = CommissionRuleSet;












