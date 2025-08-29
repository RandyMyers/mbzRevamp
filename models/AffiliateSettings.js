const mongoose = require('mongoose');

const affiliateSettingsSchema = new mongoose.Schema(
	{
		cookieDaysDefault: { type: Number, default: 30 },
		minPayoutNGN: { type: Number, default: 50000 },
		minPayoutUSD: { type: Number, default: 50 },
		payoutWindow: { type: String, default: '25-30' },
		allowSelfReferral: { type: Boolean, default: false },
		allowedPayoutMethods: { type: [String], default: ['bank_transfer', 'paypal'] },
		terms: { type: String, default: '' },
		updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	},
	{ timestamps: true }
);

const AffiliateSettings = mongoose.model('AffiliateSettings', affiliateSettingsSchema);

module.exports = AffiliateSettings;

















