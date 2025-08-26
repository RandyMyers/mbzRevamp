const mongoose = require('mongoose');

const weeklyReportSchema = new mongoose.Schema(
	{
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    content: { type: String, default: '' },
    status: { type: String, enum: ['submitted', 'reviewed'], default: 'submitted' },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: { type: String, default: '' },
  },
	{ timestamps: true }
);

weeklyReportSchema.index({ employee: 1, weekStart: -1 });

const WeeklyReport = mongoose.model('WeeklyReport', weeklyReportSchema);

module.exports = WeeklyReport;












