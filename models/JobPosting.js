const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    description: 'Job title (e.g., Senior Frontend Developer)'
  },
  department: { 
    type: String, 
    required: true,
    trim: true,
    description: 'Department name (e.g., Engineering, Design)'
  },
  location: { 
    type: String, 
    enum: ['Remote', 'Hybrid', 'On-site'], 
    required: true,
    description: 'Work location type'
  },
  type: { 
    type: String, 
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'], 
    required: true,
    description: 'Employment type'
  },
  description: { 
    type: String, 
    required: true,
    description: 'Detailed job description'
  },
  requirements: [{
    type: String,
    trim: true,
    description: 'Job requirements and qualifications'
  }],
  responsibilities: [{
    type: String,
    trim: true,
    description: 'Job responsibilities and duties'
  }],
  salaryRange: {
    min: { type: Number, description: 'Minimum salary' },
    max: { type: Number, description: 'Maximum salary' },
    currency: { type: String, default: 'NGN', description: 'Salary currency' }
  },
  deadline: { 
    type: Date, 
    required: true,
    description: 'Application deadline'
  },
  status: { 
    type: String, 
    enum: ['Draft', 'Open', 'Closed'], 
    default: 'Draft',
    description: 'Job posting status'
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    description: 'User who created the job posting'
  },
  applicants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Applicant',
    description: 'List of applicants for this job'
  }],
  tags: [{
    type: String,
    trim: true,
    description: 'Job tags for categorization'
  }],
  isUrgent: { 
    type: Boolean, 
    default: false,
    description: 'Whether this is an urgent hiring'
  },
  experienceLevel: {
    type: String,
    enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'],
    default: 'Mid Level',
    description: 'Required experience level'
  },
  workSchedule: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Flexible', 'Shift'],
    default: 'Full-time',
    description: 'Work schedule type'
  }
}, { 
  timestamps: true,
  description: 'Job postings for recruitment'
});

// Indexes for better query performance
jobPostingSchema.index({ status: 1, department: 1 });
jobPostingSchema.index({ deadline: 1 });
jobPostingSchema.index({ createdBy: 1 });
jobPostingSchema.index({ title: 'text', description: 'text' });

// Virtual for applicant count
jobPostingSchema.virtual('applicantCount').get(function() {
  return this.applicants ? this.applicants.length : 0;
});

// Virtual for days until deadline
jobPostingSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.deadline) return null;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to check if job is still accepting applications
jobPostingSchema.methods.isAcceptingApplications = function() {
  return this.status === 'Open' && new Date() <= this.deadline;
};

// Method to get active applicants
jobPostingSchema.methods.getActiveApplicants = function() {
  return this.applicants.filter(applicant => 
    applicant.status !== 'Rejected' && applicant.status !== 'Hired'
  );
};

// Pre-save middleware to validate deadline
jobPostingSchema.pre('save', function(next) {
  if (this.deadline && this.deadline < new Date()) {
    this.status = 'Closed';
  }
  next();
});

const JobPosting = mongoose.model('JobPosting', jobPostingSchema);

module.exports = JobPosting;