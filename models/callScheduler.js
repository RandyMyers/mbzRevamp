const mongoose = require('mongoose');

const callSchedulerSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: { type: String, required: true },
  description: { 
    type: String, 
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number }, // Duration in minutes
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed'],
    default: 'scheduled'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  externalParticipants: [{
    name: { type: String, required: true },
    email: { 
      type: String, 
      required: true,
      lowercase: true,
      trim: true
    },
    invitedAt: { type: Date, default: Date.now },
    invitationSent: { type: Boolean, default: false }
  }],
  meetingLink: { type: String },
  // Recurring meeting fields
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'custom'],
    default: null
  },
  recurrenceEndDate: {
    type: Date,
    default: null
  },
  recurrenceInterval: {
    type: Number,
    default: 1 // Every 1 week, 1 month, etc.
  },
  recurrenceDays: [{
    type: Number, // 0 = Sunday, 1 = Monday, etc.
    min: 0,
    max: 6
  }],
  // Timezone support
  timezone: {
    type: String,
    default: 'UTC'
  },
  organizerTimezone: {
    type: String,
    default: 'UTC'
  },
  // Reminder tracking
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Indexes for performance
callSchedulerSchema.index({ organizationId: 1 });
callSchedulerSchema.index({ startTime: 1 });
callSchedulerSchema.index({ status: 1 });
callSchedulerSchema.index({ organizationId: 1, startTime: 1 });
callSchedulerSchema.index({ status: 1, startTime: 1, reminderSent: 1 });

module.exports = mongoose.model('CallScheduler', callSchedulerSchema); 