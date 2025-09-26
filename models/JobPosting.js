const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  employmentType: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'internship', 'temporary'],
    required: true
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'executive'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  responsibilities: [String],
  benefits: [String],
  skills: [String],
  salaryRange: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'NGN'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed', 'cancelled'],
    default: 'draft'
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedAt: {
    type: Date
  },
  applicationDeadline: {
    type: Date
  },
  startDate: {
    type: Date
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  applications: [{
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['applied', 'reviewed', 'shortlisted', 'interviewed', 'rejected', 'hired'],
      default: 'applied'
    },
    resume: {
      filename: String,
      originalName: String,
      url: String
    },
    coverLetter: String,
    notes: String
  }],
  isRemote: {
    type: Boolean,
    default: false
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes
jobPostingSchema.index({ organizationId: 1, status: 1 });
jobPostingSchema.index({ publishedAt: -1 });
jobPostingSchema.index({ department: 1, organizationId: 1 });
jobPostingSchema.index({ employmentType: 1, organizationId: 1 });
jobPostingSchema.index({ experienceLevel: 1, organizationId: 1 });
jobPostingSchema.index({ tags: 1 });

module.exports = mongoose.model('JobPosting', jobPostingSchema);



