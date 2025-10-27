const mongoose = require('mongoose');

const trainingEnrollmentSchema = new mongoose.Schema({
  trainingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Training', 
    required: true,
    description: 'Reference to the training program'
  },
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true,
    description: 'Employee enrolled in the training'
  },
  enrollmentDate: { 
    type: Date, 
    default: Date.now,
    description: 'Date when employee enrolled'
  },
  status: { 
    type: String, 
    enum: ['Enrolled', 'In Progress', 'Completed', 'Dropped'], 
    default: 'Enrolled',
    description: 'Current enrollment status'
  },
  completionDate: { 
    type: Date,
    description: 'Date when training was completed'
  },
  progress: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 100,
    description: 'Completion percentage (0-100)'
  },
  materialsCompleted: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TrainingMaterial',
    description: 'Materials that have been completed'
  }],
  
  // Assignment submissions
  assignmentSubmissions: [{
    materialId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'TrainingMaterial',
      required: true,
      description: 'Reference to the assignment material'
    },
    submissionDate: { 
      type: Date, 
      default: Date.now,
      description: 'Date when assignment was submitted'
    },
    status: { 
      type: String, 
      enum: ['Submitted', 'Reviewed', 'Approved', 'Needs Revision'], 
      default: 'Submitted',
      description: 'Assignment submission status'
    },
    feedback: { 
      type: String,
      description: 'Instructor feedback on the assignment'
    },
    score: { 
      type: Number,
      min: 0,
      max: 100,
      description: 'Assignment score (0-100)'
    },
    submittedFiles: [{
      name: { type: String, required: true, description: 'File name' },
      path: { type: String, required: true, description: 'File path' },
      size: { type: Number, description: 'File size in bytes' },
      mimeType: { type: String, description: 'File MIME type' }
    }],
    textSubmission: { 
      type: String,
      description: 'Text-based submission'
    },
    urlSubmission: { 
      type: String,
      description: 'URL submission'
    },
    reviewedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      description: 'User who reviewed the assignment'
    },
    reviewedAt: { 
      type: Date,
      description: 'Date when assignment was reviewed'
    }
  }],
  
  // Quiz attempts and scores
  quizAttempts: [{
    materialId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'TrainingMaterial',
      required: true,
      description: 'Reference to the quiz material'
    },
    attemptNumber: { 
      type: Number, 
      required: true,
      description: 'Attempt number (1, 2, 3, etc.)'
    },
    startTime: { 
      type: Date, 
      default: Date.now,
      description: 'When quiz attempt started'
    },
    endTime: { 
      type: Date,
      description: 'When quiz attempt ended'
    },
    score: { 
      type: Number,
      min: 0,
      max: 100,
      description: 'Quiz score (0-100)'
    },
    passed: { 
      type: Boolean,
      description: 'Whether the quiz was passed'
    },
    answers: [{
      questionId: { type: String, required: true, description: 'Question identifier' },
      answer: { type: String, description: 'User answer' },
      isCorrect: { type: Boolean, description: 'Whether answer is correct' },
      points: { type: Number, description: 'Points earned for this answer' }
    }],
    timeSpent: { 
      type: Number,
      description: 'Time spent on quiz in minutes'
    }
  }],
  
  // Training feedback
  feedback: {
    rating: { 
      type: Number, 
      min: 1, 
      max: 5,
      description: 'Overall training rating (1-5 stars)'
    },
    comments: { 
      type: String,
      description: 'Training feedback comments'
    },
    submittedAt: { 
      type: Date,
      description: 'When feedback was submitted'
    },
    anonymous: { 
      type: Boolean, 
      default: false,
      description: 'Whether feedback is anonymous'
    }
  },
  
  // Certificate information
  certificate: {
    issued: { 
      type: Boolean, 
      default: false,
      description: 'Whether certificate was issued'
    },
    issuedDate: { 
      type: Date,
      description: 'Date when certificate was issued'
    },
    certificateId: { 
      type: String,
      description: 'Unique certificate identifier'
    },
    certificateUrl: { 
      type: String,
      description: 'URL to download certificate'
    }
  },
  
  // Enrollment metadata
  enrollmentType: { 
    type: String, 
    enum: ['Self', 'Assigned', 'Required'], 
    default: 'Self',
    description: 'How the employee was enrolled'
  },
  enrolledBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    description: 'User who enrolled the employee (if not self-enrolled)'
  },
  dueDate: { 
    type: Date,
    description: 'Training completion due date'
  },
  reminderSent: { 
    type: Boolean, 
    default: false,
    description: 'Whether reminder was sent'
  },
  lastAccessed: { 
    type: Date,
    description: 'Last time employee accessed the training'
  }
}, { 
  timestamps: true,
  description: 'Training enrollments and progress tracking'
});

// Indexes for better query performance
trainingEnrollmentSchema.index({ trainingId: 1, employeeId: 1 }, { unique: true });
trainingEnrollmentSchema.index({ employeeId: 1, status: 1 });
trainingEnrollmentSchema.index({ status: 1 });
trainingEnrollmentSchema.index({ completionDate: -1 });

// Virtual for days since enrollment
trainingEnrollmentSchema.virtual('daysSinceEnrollment').get(function() {
  const now = new Date();
  const enrolled = new Date(this.enrollmentDate);
  const diffTime = now - enrolled;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for days until due date
trainingEnrollmentSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to update progress
trainingEnrollmentSchema.methods.updateProgress = function() {
  // This would typically be called when materials are completed
  // Progress calculation logic would go here
  return this.save();
};

// Method to complete training
trainingEnrollmentSchema.methods.completeTraining = function() {
  this.status = 'Completed';
  this.completionDate = new Date();
  this.progress = 100;
  return this.save();
};

// Method to submit assignment
trainingEnrollmentSchema.methods.submitAssignment = function(materialId, submissionData) {
  const submission = {
    materialId,
    submissionDate: new Date(),
    status: 'Submitted',
    ...submissionData
  };
  
  this.assignmentSubmissions.push(submission);
  return this.save();
};

// Method to attempt quiz
trainingEnrollmentSchema.methods.attemptQuiz = function(materialId, answers) {
  const existingAttempts = this.quizAttempts.filter(attempt => 
    attempt.materialId.toString() === materialId.toString()
  );
  
  const attemptNumber = existingAttempts.length + 1;
  
  const attempt = {
    materialId,
    attemptNumber,
    startTime: new Date(),
    answers
  };
  
  this.quizAttempts.push(attempt);
  return this.save();
};

// Pre-save middleware to update last accessed
trainingEnrollmentSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastAccessed = new Date();
  }
  next();
});

const TrainingEnrollment = mongoose.model('TrainingEnrollment', trainingEnrollmentSchema);

module.exports = TrainingEnrollment;