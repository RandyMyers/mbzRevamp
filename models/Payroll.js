const mongoose = require('mongoose');

const payrollItemSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  gross: { type: Number, required: true },
  pension: { type: Number, default: 0 },
  nhf: { type: Number, default: 0 },
  cra: { type: Number, default: 0 },
  taxableIncome: { type: Number, required: true },
  paye: { type: Number, required: true },
  netPay: { type: Number, required: true },
});

const payrollSchema = new mongoose.Schema({
  month: { type: Number, min: 1, max: 12, required: true },
  year: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  items: [payrollItemSchema],
  totals: {
    gross: { type: Number, default: 0 },
    pension: { type: Number, default: 0 },
    nhf: { type: Number, default: 0 },
    cra: { type: Number, default: 0 },
    taxableIncome: { type: Number, default: 0 },
    paye: { type: Number, default: 0 },
    netPay: { type: Number, default: 0 },
  },
}, { timestamps: true });

payrollSchema.index({ year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);







