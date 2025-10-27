const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    description: 'User who wrote the comment'
  },
  text: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 2000,
    description: 'Comment text content'
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    description: 'When the comment was created'
  },
  
  // Comment context and associations
  context: {
    type: { 
      type: String, 
      enum: ['Employee', 'Applicant', 'Training', 'Task', 'Performance', 'Leave', 'General'],
      required: true,
      description: 'Type of entity this comment is associated with'
    },
    entityId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      description: 'ID of the entity this comment is associated with'
    },
    entityType: { 
      type: String,
      description: 'Specific entity type (e.g., "Employee", "Applicant", "TrainingEnrollment")'
    }
  },
  
  // Comment metadata
  isInternal: { 
    type: Boolean, 
    default: false,
    description: 'Whether this is an internal comment (not visible to employee)'
  },
  isSystem: { 
    type: Boolean, 
    default: false,
    description: 'Whether this is a system-generated comment'
  },
  isEdited: { 
    type: Boolean, 
    default: false,
    description: 'Whether the comment has been edited'
  },
  
  // Edit history
  editHistory: [{
    editedAt: { type: Date, required: true, description: 'When the edit was made' },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, description: 'Who made the edit' },
    previousText: { type: String, required: true, description: 'Previous text content' },
    reason: { type: String, description: 'Reason for editing' }
  }],
  
  // Attachments
  attachments: [{
    name: { type: String, required: true, description: 'Attachment name' },
    path: { type: String, required: true, description: 'File path' },
    mimeType: { type: String, description: 'File MIME type' },
    size: { type: Number, description: 'File size in bytes' },
    uploadedAt: { type: Date, default: Date.now, description: 'Upload date' }
  }],
  
  // Mentions and notifications
  mentions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, description: 'Mentioned user' },
    mentionedAt: { type: Date, default: Date.now, description: 'When user was mentioned' },
    notified: { type: Boolean, default: false, description: 'Whether mention notification was sent' }
  }],
  
  // Reactions and interactions
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, description: 'User who reacted' },
    type: { 
      type: String, 
      enum: ['like', 'dislike', 'love', 'laugh', 'angry', 'sad', 'wow'],
      required: true,
      description: 'Reaction type'
    },
    reactedAt: { type: Date, default: Date.now, description: 'When reaction was made' }
  }],
  
  // Threading and replies
  parentComment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment',
    description: 'Parent comment if this is a reply'
  },
  replies: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment',
    description: 'Child comments (replies)'
  }],
  threadDepth: { 
    type: Number, 
    default: 0,
    max: 5,
    description: 'Depth in comment thread (0 = top level)'
  },
  
  // Visibility and permissions
  visibility: {
    isPublic: { type: Boolean, default: true, description: 'Whether comment is publicly visible' },
    visibleTo: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      description: 'Specific users who can see this comment'
    }],
    visibleRoles: [{ 
      type: String,
      description: 'Roles that can see this comment'
    }]
  },
  
  // Moderation
  moderation: {
    isFlagged: { type: Boolean, default: false, description: 'Whether comment is flagged for review' },
    flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', description: 'User who flagged the comment' },
    flaggedAt: { type: Date, description: 'When comment was flagged' },
    flagReason: { type: String, description: 'Reason for flagging' },
    isHidden: { type: Boolean, default: false, description: 'Whether comment is hidden' },
    hiddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', description: 'User who hid the comment' },
    hiddenAt: { type: Date, description: 'When comment was hidden' }
  },
  
  // Analytics
  analytics: {
    views: { type: Number, default: 0, description: 'Number of times comment was viewed' },
    likes: { type: Number, default: 0, description: 'Number of likes' },
    dislikes: { type: Number, default: 0, description: 'Number of dislikes' },
    replies: { type: Number, default: 0, description: 'Number of replies' }
  }
}, { 
  timestamps: true,
  description: 'Comments and notes system for HR management'
});

// Indexes for better query performance
commentSchema.index({ 'context.entityId': 1, 'context.type': 1 });
commentSchema.index({ authorId: 1, timestamp: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ timestamp: -1 });
commentSchema.index({ isInternal: 1 });
commentSchema.index({ 'moderation.isFlagged': 1 });

// Virtual for reaction count
commentSchema.virtual('reactionCount').get(function() {
  return this.reactions ? this.reactions.length : 0;
});

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
  if (!this.reactions) return 0;
  return this.reactions.filter(r => r.type === 'like').length;
});

// Method to add reaction
commentSchema.methods.addReaction = function(userId, reactionType) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.userId.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({
    userId,
    type: reactionType,
    reactedAt: new Date()
  });
  
  // Update analytics
  this.analytics.likes = this.reactions.filter(r => r.type === 'like').length;
  this.analytics.dislikes = this.reactions.filter(r => r.type === 'dislike').length;
  
  return this.save();
};

// Method to remove reaction
commentSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.userId.toString() !== userId.toString());
  
  // Update analytics
  this.analytics.likes = this.reactions.filter(r => r.type === 'like').length;
  this.analytics.dislikes = this.reactions.filter(r => r.type === 'dislike').length;
  
  return this.save();
};

// Method to edit comment
commentSchema.methods.editComment = function(newText, editedBy, reason) {
  // Save previous text to history
  this.editHistory.push({
    editedAt: new Date(),
    editedBy,
    previousText: this.text,
    reason
  });
  
  // Update comment
  this.text = newText;
  this.isEdited = true;
  
  return this.save();
};

// Method to add mention
commentSchema.methods.addMention = function(userId) {
  const existingMention = this.mentions.find(m => m.userId.toString() === userId.toString());
  if (!existingMention) {
    this.mentions.push({
      userId,
      mentionedAt: new Date(),
      notified: false
    });
  }
  return this.save();
};

// Method to flag comment
commentSchema.methods.flagComment = function(flaggedBy, reason) {
  this.moderation.isFlagged = true;
  this.moderation.flaggedBy = flaggedBy;
  this.moderation.flaggedAt = new Date();
  this.moderation.flagReason = reason;
  return this.save();
};

// Method to hide comment
commentSchema.methods.hideComment = function(hiddenBy) {
  this.moderation.isHidden = true;
  this.moderation.hiddenBy = hiddenBy;
  this.moderation.hiddenAt = new Date();
  return this.save();
};

// Pre-save middleware to update thread depth
commentSchema.pre('save', function(next) {
  if (this.parentComment) {
    this.threadDepth = 1; // This would need to be calculated based on parent depth
  }
  next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;


