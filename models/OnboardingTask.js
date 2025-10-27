const mongoose = require('mongoose');

const onboardingTaskSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true,
    description: 'Employee for whom the task is assigned'
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    description: 'Task name'
  },
  description: { 
    type: String,
    trim: true,
    description: 'Detailed task description'
  },
  dueDate: { 
    type: Date,
    description: 'Task due date'
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    description: 'User responsible for completing the task'
  },
  status: { 
    type: String, 
    enum: ['Not Started', 'In Progress', 'Completed'], 
    default: 'Not Started',
    description: 'Current task status'
  },
  
  // Task categorization
  category: { 
    type: String, 
    enum: ['Documentation', 'Training', 'Equipment', 'Access', 'Orientation', 'Other'],
    default: 'Other',
    description: 'Task category'
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium',
    description: 'Task priority level'
  },
  
  // Task details
  taskType: { 
    type: String, 
    enum: ['Manual', 'Automatic', 'Approval Required'], 
    default: 'Manual',
    description: 'Type of task'
  },
  estimatedDuration: { 
    type: Number,
    description: 'Estimated duration in minutes'
  },
  instructions: { 
    type: String,
    description: 'Step-by-step instructions'
  },
  resources: [{
    name: { type: String, required: true, description: 'Resource name' },
    url: { type: String, description: 'Resource URL' },
    type: { type: String, enum: ['Link', 'Document', 'Video', 'Form'], description: 'Resource type' }
  }],
  
  // Completion tracking
  startedAt: { 
    type: Date,
    description: 'When task was started'
  },
  completedAt: { 
    type: Date,
    description: 'When task was completed'
  },
  completedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    description: 'User who completed the task'
  },
  
  // Dependencies
  dependencies: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'OnboardingTask',
    description: 'Tasks that must be completed first'
  }],
  blocks: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'OnboardingTask',
    description: 'Tasks that are blocked by this task'
  }],
  
  // Approval workflow
  approval: {
    required: { 
      type: Boolean, 
      default: false,
      description: 'Whether task requires approval'
    },
    approver: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      description: 'User who must approve the task'
    },
    approvedAt: { 
      type: Date,
      description: 'When task was approved'
    },
    approvalNotes: { 
      type: String,
      description: 'Approval notes'
    }
  },
  
  // Attachments and evidence
  attachments: [{
    name: { type: String, required: true, description: 'Attachment name' },
    path: { type: String, required: true, description: 'File path' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now, description: 'Upload date' },
    type: { type: String, description: 'File type' },
    size: { type: Number, description: 'File size in bytes' }
  }],
  
  // Comments and notes
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, description: 'Comment text' },
    createdAt: { type: Date, default: Date.now, description: 'Comment date' },
    isInternal: { type: Boolean, default: false, description: 'Whether comment is internal only' }
  }],
  
  // Reminders and notifications
  reminders: [{
    sentAt: { type: Date, required: true, description: 'When reminder was sent' },
    type: { type: String, enum: ['Email', 'SMS', 'Push'], required: true, description: 'Reminder type' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, description: 'Reminder recipient' }
  }],
  
  // Task metadata
  tags: [{ 
    type: String, 
    trim: true,
    description: 'Task tags for categorization'
  }],
  isTemplate: { 
    type: Boolean, 
    default: false,
    description: 'Whether this is a template task'
  },
  templateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'OnboardingTask',
    description: 'Template this task was created from'
  },
  
  // Analytics
  analytics: {
    timeSpent: { type: Number, default: 0, description: 'Time spent on task in minutes' },
    attempts: { type: Number, default: 0, description: 'Number of attempts' },
    lastAccessed: { type: Date, description: 'Last time task was accessed' }
  }
}, { 
  timestamps: true,
  description: 'Employee onboarding tasks and workflow'
});

// Indexes for better query performance
onboardingTaskSchema.index({ employeeId: 1, status: 1 });
onboardingTaskSchema.index({ assignedTo: 1, status: 1 });
onboardingTaskSchema.index({ dueDate: 1 });
onboardingTaskSchema.index({ category: 1 });
onboardingTaskSchema.index({ priority: 1 });

// Virtual for days until due
onboardingTaskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is overdue
onboardingTaskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'Completed') return false;
  return new Date() > this.dueDate;
});

// Method to start task
onboardingTaskSchema.methods.startTask = function(userId) {
  this.status = 'In Progress';
  this.startedAt = new Date();
  this.analytics.attempts += 1;
  this.analytics.lastAccessed = new Date();
  return this.save();
};

// Method to complete task
onboardingTaskSchema.methods.completeTask = function(userId, attachments = []) {
  this.status = 'Completed';
  this.completedAt = new Date();
  this.completedBy = userId;
  
  if (attachments.length > 0) {
    this.attachments.push(...attachments);
  }
  
  return this.save();
};

// Method to add comment
onboardingTaskSchema.methods.addComment = function(authorId, text, isInternal = false) {
  this.comments.push({
    author: authorId,
    text,
    isInternal
  });
  return this.save();
};

// Method to check if task can be started
onboardingTaskSchema.methods.canStart = function() {
  if (this.status !== 'Not Started') return false;
  
  // Check if dependencies are completed
  if (this.dependencies && this.dependencies.length > 0) {
    // This would need to be implemented with a query to check dependency status
    // For now, return true
  }
  
  return true;
};

// Method to get task progress
onboardingTaskSchema.methods.getProgress = function() {
  switch (this.status) {
    case 'Not Started': return 0;
    case 'In Progress': return 50;
    case 'Completed': return 100;
    default: return 0;
  }
};

// Pre-save middleware to update analytics
onboardingTaskSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.analytics.lastAccessed = new Date();
  }
  next();
});

const OnboardingTask = mongoose.model('OnboardingTask', onboardingTaskSchema);

module.exports = OnboardingTask;


