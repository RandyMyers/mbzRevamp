const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'JobPosting', 
    required: true,
    description: 'Reference to the job posting'
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    description: 'Applicant full name'
  },
  email: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true,
    description: 'Applicant email address'
  },
  phone: { 
    type: String, 
    required: true,
    trim: true,
    description: 'Applicant phone number'
  },
  resume: { 
    type: String, 
    required: true,
    description: 'Path to resume file'
  },
  coverLetter: { 
    type: String,
    description: 'Cover letter text or file path'
  },
  appliedDate: { 
    type: Date, 
    default: Date.now,
    description: 'Date when application was submitted'
  },
  status: { 
    type: String, 
    enum: ['Under Review', 'Interview Scheduled', 'Offered', 'Hired', 'Rejected'], 
    default: 'Under Review',
    description: 'Current application status'
  },
  notes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment',
    description: 'Notes and comments about the applicant'
  }],
  
  // Additional applicant information
  experience: {
    years: { type: Number, default: 0, description: 'Years of experience' },
    currentPosition: { type: String, trim: true, description: 'Current job title' },
    currentCompany: { type: String, trim: true, description: 'Current company' },
    skills: [{ type: String, trim: true, description: 'Applicant skills' }]
  },
  
  // Interview details
  interview: {
    scheduledDate: { type: Date, description: 'Scheduled interview date' },
    interviewType: { 
      type: String, 
      enum: ['Phone', 'Video', 'In-Person', 'Technical'], 
      description: 'Type of interview'
    },
    interviewer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      description: 'Interviewer user ID'
    },
    location: { type: String, trim: true, description: 'Interview location' },
    meetingLink: { type: String, trim: true, description: 'Video meeting link' },
    notes: { type: String, description: 'Interview notes' },
    rating: { 
      type: Number, 
      min: 1, 
      max: 5, 
      description: 'Interview rating (1-5)'
    }
  },
  
  // Offer details
  offer: {
    salary: { type: Number, description: 'Offered salary' },
    startDate: { type: Date, description: 'Proposed start date' },
    benefits: [{ type: String, description: 'Offered benefits' }],
    offerDate: { type: Date, description: 'Date offer was made' },
    responseDeadline: { type: Date, description: 'Deadline for offer response' },
    accepted: { type: Boolean, default: false, description: 'Whether offer was accepted' }
  },
  
  // Source tracking
  source: {
    type: { 
      type: String, 
      enum: ['Job Board', 'Company Website', 'Referral', 'Recruiter', 'Other'],
      default: 'Company Website',
      description: 'How applicant found the job'
    },
    referrer: { type: String, trim: true, description: 'Name of referrer if applicable' },
    jobBoard: { type: String, trim: true, description: 'Specific job board if applicable' }
  },
  
  // Additional documents
  documents: [{
    name: { type: String, required: true, description: 'Document name' },
    path: { type: String, required: true, description: 'File path' },
    type: { type: String, required: true, description: 'Document type' },
    uploadedAt: { type: Date, default: Date.now, description: 'Upload date' }
  }],
  
  // Communication history
  communications: [{
    type: { 
      type: String, 
      enum: ['Email', 'Phone', 'SMS', 'Meeting'], 
      required: true,
      description: 'Communication type'
    },
    subject: { type: String, trim: true, description: 'Communication subject' },
    content: { type: String, description: 'Communication content' },
    date: { type: Date, default: Date.now, description: 'Communication date' },
    initiatedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      description: 'Who initiated the communication'
    }
  }]
}, { 
  timestamps: true,
  description: 'Job applicants and their application details'
});

// Indexes for better query performance
applicantSchema.index({ jobId: 1, status: 1 });
applicantSchema.index({ email: 1 });
applicantSchema.index({ appliedDate: -1 });
applicantSchema.index({ status: 1 });

// Virtual for days since application
applicantSchema.virtual('daysSinceApplication').get(function() {
  const now = new Date();
  const applied = new Date(this.appliedDate);
  const diffTime = now - applied;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to update status with history
applicantSchema.methods.updateStatus = function(newStatus, updatedBy, reason) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add to communications
  this.communications.push({
    type: 'Email',
    subject: `Status Update: ${oldStatus} → ${newStatus}`,
    content: reason || `Status changed from ${oldStatus} to ${newStatus}`,
    initiatedBy: updatedBy
  });
  
  return this.save();
};

// Method to schedule interview
applicantSchema.methods.scheduleInterview = function(interviewData) {
  this.status = 'Interview Scheduled';
  this.interview = { ...this.interview, ...interviewData };
  return this.save();
};

// Method to make offer
applicantSchema.methods.makeOffer = function(offerData) {
  this.status = 'Offered';
  this.offer = { ...this.offer, ...offerData };
  return this.save();
};

// Pre-save middleware to validate email format
applicantSchema.pre('save', function(next) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(this.email)) {
    return next(new Error('Invalid email format'));
  }
  next();
});

const Applicant = mongoose.model('Applicant', applicantSchema);

module.exports = Applicant;


