const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Make it optional since it will be defaulted
  }
}, { timestamps: true });

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'inProgress', 'review', 'completed', 'cancelled', 'onHold'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    tags: [String],
    comments: [
      {
        text: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    attachments: [
      {
        filename: { type: String, required: true },
        url: { type: String, required: true },
        storageType: { type: String, enum: ['cloudinary', 'local'], required: true },
        publicId: { type: String }, // For Cloudinary files
        path: { type: String }, // For local files
        format: { type: String }, // File format/extension
        size: { type: Number }, // File size in bytes
        category: { type: String, enum: ['IMAGES', 'DOCUMENTS', 'ARCHIVES', 'MEDIA', 'UNKNOWN'] },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    // Add subtasks array
    subtasks: [subtaskSchema],
    // Add progress tracking
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true,
  }
);

// Update progress when subtasks are modified
taskSchema.pre('save', function(next) {
  if (this.subtasks && this.subtasks.length > 0) {
    const completedSubtasks = this.subtasks.filter(
      subtask => subtask.status === 'completed'
    );
    this.progress = Math.round((completedSubtasks.length / this.subtasks.length) * 100);
    
    // Ensure all subtasks have a createdBy field
    this.subtasks.forEach(subtask => {
      if (!subtask.createdBy) {
        subtask.createdBy = this.createdBy;
      }
    });
  }
  next();
});

// Update parent task status if all subtasks are completed
taskSchema.post('save', function(doc) {
  if (doc.subtasks && doc.subtasks.length > 0) {
    const allSubtasksCompleted = doc.subtasks.every(
      subtask => subtask.status === 'completed'
    );
    
    if (allSubtasksCompleted && doc.status !== 'completed') {
      mongoose.model('Task').findByIdAndUpdate(
        doc._id,
        { status: 'completed' },
        { new: true }
      ).exec();
    }
  }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;