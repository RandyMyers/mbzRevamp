const mongoose = require('mongoose');

const trainingMaterialSchema = new mongoose.Schema({
  trainingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Training', 
    required: true,
    description: 'Reference to the training program'
  },
  title: { 
    type: String, 
    required: true,
    trim: true,
    description: 'Material title'
  },
  description: { 
    type: String,
    trim: true,
    description: 'Material description'
  },
  type: { 
    type: String, 
    enum: ['Document', 'Video', 'Quiz', 'Link', 'Assignment'], 
    required: true,
    description: 'Type of training material'
  },
  url: { 
    type: String,
    trim: true,
    description: 'URL for external links or video content'
  },
  filePath: {
    type: String,
    trim: true,
    description: 'Path to uploaded file'
  },
  fileSize: { 
    type: Number,
    description: 'File size in bytes'
  },
  mimeType: {
    type: String,
    trim: true,
    description: 'MIME type of the file'
  },
  uploadDate: { 
    type: Date, 
    default: Date.now,
    description: 'Date when material was uploaded'
  },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    description: 'User who uploaded the material'
  },
  isRequired: { 
    type: Boolean, 
    default: true,
    description: 'Whether this material is required for completion'
  },
  order: { 
    type: Number, 
    default: 0,
    description: 'Display order in the training sequence'
  },
  duration: { 
    type: Number,
    description: 'Duration in minutes (for videos and assignments)'
  },
  
  // Quiz-specific fields
  quiz: {
    questions: [{
      question: { type: String, required: true, description: 'Quiz question' },
      type: { 
        type: String, 
        enum: ['multiple-choice', 'true-false', 'short-answer', 'essay'],
        default: 'multiple-choice',
        description: 'Question type'
      },
      options: [{ type: String, description: 'Answer options for multiple choice' }],
      correctAnswer: { type: String, description: 'Correct answer' },
      points: { type: Number, default: 1, description: 'Points for correct answer' },
      explanation: { type: String, description: 'Explanation for the answer' }
    }],
    passingScore: { type: Number, default: 70, description: 'Minimum score to pass (%)' },
    attempts: { type: Number, default: 3, description: 'Maximum attempts allowed' },
    timeLimit: { type: Number, description: 'Time limit in minutes' }
  },
  
  // Assignment-specific fields
  assignment: {
    instructions: { type: String, description: 'Assignment instructions' },
    submissionType: { 
      type: String, 
      enum: ['file', 'text', 'url'],
      default: 'file',
      description: 'How submissions should be made'
    },
    allowedFormats: [{ type: String, description: 'Allowed file formats' }],
    maxFileSize: { type: Number, description: 'Maximum file size in MB' },
    dueDate: { type: Date, description: 'Assignment due date' },
    gradingCriteria: { type: String, description: 'Grading criteria' }
  },
  
  // Video-specific fields
  video: {
    platform: { 
      type: String, 
      enum: ['YouTube', 'Vimeo', 'Internal', 'Other'],
      description: 'Video platform'
    },
    thumbnail: { type: String, description: 'Video thumbnail URL' },
    transcript: { type: String, description: 'Video transcript' },
    captions: { type: String, description: 'Captions file path' }
  },
  
  // Access control
  access: {
    isPublic: { type: Boolean, default: true, description: 'Whether material is publicly accessible' },
    allowedRoles: [{ type: String, description: 'Roles that can access this material' }],
    prerequisites: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'TrainingMaterial',
      description: 'Materials that must be completed first'
    }]
  },
  
  // Analytics
  analytics: {
    views: { type: Number, default: 0, description: 'Number of times viewed' },
    completions: { type: Number, default: 0, description: 'Number of completions' },
    averageScore: { type: Number, description: 'Average score (for quizzes)' },
    averageTime: { type: Number, description: 'Average completion time in minutes' }
  },
  
  // Version control
  version: { type: String, default: '1.0', description: 'Material version' },
  isActive: { type: Boolean, default: true, description: 'Whether material is active' },
  archivedAt: { type: Date, description: 'Date when material was archived' }
}, { 
  timestamps: true,
  description: 'Training materials and resources'
});

// Indexes for better query performance
trainingMaterialSchema.index({ trainingId: 1, order: 1 });
trainingMaterialSchema.index({ type: 1 });
trainingMaterialSchema.index({ uploadedBy: 1 });
trainingMaterialSchema.index({ isActive: 1 });

// Virtual for completion rate
trainingMaterialSchema.virtual('completionRate').get(function() {
  if (this.analytics.views === 0) return 0;
  return Math.round((this.analytics.completions / this.analytics.views) * 100);
});

// Method to record view
trainingMaterialSchema.methods.recordView = function() {
  this.analytics.views += 1;
  return this.save();
};

// Method to record completion
trainingMaterialSchema.methods.recordCompletion = function(score = null) {
  this.analytics.completions += 1;
  if (score !== null) {
    const currentAverage = this.analytics.averageScore || 0;
    const totalCompletions = this.analytics.completions;
    this.analytics.averageScore = ((currentAverage * (totalCompletions - 1)) + score) / totalCompletions;
  }
  return this.save();
};

// Method to check if user can access material
trainingMaterialSchema.methods.canAccess = function(userRoles = []) {
  if (!this.isActive) return false;
  if (this.access.isPublic) return true;
  if (this.access.allowedRoles.length === 0) return true;
  return this.access.allowedRoles.some(role => userRoles.includes(role));
};

// Pre-save middleware to validate file types
trainingMaterialSchema.pre('save', function(next) {
  if (this.type === 'Video' && !this.url && !this.filePath) {
    return next(new Error('Video materials must have either URL or file path'));
  }
  if (this.type === 'Quiz' && (!this.quiz || this.quiz.questions.length === 0)) {
    return next(new Error('Quiz materials must have questions'));
  }
  next();
});

const TrainingMaterial = mongoose.model('TrainingMaterial', trainingMaterialSchema);

module.exports = TrainingMaterial;


