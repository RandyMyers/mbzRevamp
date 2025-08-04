const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeedbackResponseSchema = new Schema({
  // Feedback Reference
  feedbackId: {
    type: Schema.Types.ObjectId,
    ref: 'Feedback',
    required: true
  },

  // Response Content
  response: {
    type: String,
    required: true,
    trim: true
  },
  responseType: {
    type: String,
    enum: ['acknowledgment', 'update', 'resolution', 'question'],
    default: 'acknowledgment'
  },

  // Admin Information
  respondedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },

  // Status and Actions
  status: {
    type: String,
    enum: ['draft', 'sent', 'read'],
    default: 'sent'
  },
  isInternal: {
    type: Boolean,
    default: false
  },

  // Notification
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentDate: {
    type: Date
  },

  // Audit Information
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
FeedbackResponseSchema.index({ feedbackId: 1, createdAt: -1 });
FeedbackResponseSchema.index({ respondedBy: 1, createdAt: -1 });
FeedbackResponseSchema.index({ organizationId: 1, createdAt: -1 });
FeedbackResponseSchema.index({ status: 1 });

// Pre-save middleware to update timestamps
FeedbackResponseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FeedbackResponse', FeedbackResponseSchema); 