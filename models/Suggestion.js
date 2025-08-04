const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SuggestionSchema = new Schema({
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
    enum: ['UI/UX', 'Feature', 'Integration', 'Analytics', 'Performance', 'Security', 'Other'],
    default: 'Feature'
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
    enum: ['new', 'under-review', 'planned', 'implemented', 'considering', 'declined'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Voting System
  votes: {
    upvotes: {
      type: Number,
      default: 0
    },
    downvotes: {
      type: Number,
      default: 0
    },
    voters: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      vote: {
        type: String,
        enum: ['upvote', 'downvote']
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Comments
  comments: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Implementation Details
  estimatedEffort: {
    type: String,
    enum: ['small', 'medium', 'large', 'epic'],
    default: 'medium'
  },
  estimatedTimeline: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  // Tags and Labels
  tags: [{
    type: String,
    trim: true
  }],

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
SuggestionSchema.index({ organizationId: 1, createdAt: -1 });
SuggestionSchema.index({ userId: 1, createdAt: -1 });
SuggestionSchema.index({ status: 1 });
SuggestionSchema.index({ category: 1 });
SuggestionSchema.index({ 'votes.upvotes': -1 });
SuggestionSchema.index({ 'votes.downvotes': -1 });

// Pre-save middleware to update timestamps
SuggestionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total votes
SuggestionSchema.methods.getTotalVotes = function() {
  return this.votes.upvotes - this.votes.downvotes;
};

// Check if user has voted
SuggestionSchema.methods.hasUserVoted = function(userId) {
  return this.votes.voters.some(voter => voter.userId.toString() === userId.toString());
};

// Get user's vote
SuggestionSchema.methods.getUserVote = function(userId) {
  const voter = this.votes.voters.find(voter => voter.userId.toString() === userId.toString());
  return voter ? voter.vote : null;
};

module.exports = mongoose.model('Suggestion', SuggestionSchema); 