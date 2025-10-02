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
  meetingLink: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CallScheduler', callSchedulerSchema); 