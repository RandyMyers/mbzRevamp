const mongoose = require('mongoose');

const performanceReviewSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: '' },
    scheduledAt: { type: Date, required: true },
    locationType: { type: String, enum: ['in_person', 'online'], default: 'online' },
    meetingLink: { type: String, default: '' },
    status: { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
    feedback: { type: String, default: '' },
    acknowledged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

performanceReviewSchema.index({ employee: 1, scheduledAt: -1 });

const PerformanceReview = mongoose.model('PerformanceReview', performanceReviewSchema);

module.exports = PerformanceReview;

















