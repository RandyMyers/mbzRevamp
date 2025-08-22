const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    locationType: { type: String, enum: ['jitsi', 'in_person', 'other'], default: 'jitsi' },
    meetingLink: { type: String, default: '' },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    seriesId: { type: String, default: null },
    recurrence: {
      frequency: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
      interval: { type: Number, default: 1 },
      count: { type: Number, default: null },
      until: { type: Date, default: null },
      byWeekday: { type: [Number], default: [] } // 0=Sun..6=Sat
    },
  },
  { timestamps: true }
);

meetingSchema.index({ organizationId: 1, startTime: -1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;




