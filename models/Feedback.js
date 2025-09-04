const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeedbackSchema = new Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['general', 'product', 'usability', 'support', 'feature', 'bug', 'other'],
    default: 'general'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },

  // User Information
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
 
  // Status and Priority
  status: {
    type: String,
    enum: ['new', 'under-review', 'responded', 'resolved', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Response Information
  hasResponse: {
    type: Boolean,
    default: false
  },
  responseDate: {
    type: Date
  },
  respondedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  // Tags and Labels
  tags: [{
    type: String,
    trim: true
  }],

  // Additional Metadata
  userAgent: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  browser: {
    type: String,
    trim: true
  },
  device: {
    type: String,
    trim: true
  },

  // Audit Information
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
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
FeedbackSchema.index({ organizationId: 1, createdAt: -1 });
FeedbackSchema.index({ userId: 1, createdAt: -1 });
FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ category: 1 });
FeedbackSchema.index({ rating: 1 });
FeedbackSchema.index({ hasResponse: 1 });

// Pre-save middleware to update timestamps
FeedbackSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Feedback', FeedbackSchema); 