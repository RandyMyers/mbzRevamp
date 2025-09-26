const mongoose = require('mongoose');

const contentManagementSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true,
    enum: ['page', 'article', 'announcement', 'policy', 'procedure', 'faq', 'news', 'event']
  },
  category: {
    type: String,
    required: true
  },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'scheduled'],
    default: 'draft'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  publishedAt: {
    type: Date
  },
  scheduledFor: {
    type: Date
  },
  featured: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'staff_only', 'specific_roles'],
    default: 'staff_only'
  },
  allowedRoles: [String],
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }],
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    content: String,
    version: Number,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
contentManagementSchema.index({ organizationId: 1, contentType: 1 });
contentManagementSchema.index({ status: 1, organizationId: 1 });
contentManagementSchema.index({ publishedAt: -1 });
contentManagementSchema.index({ category: 1, organizationId: 1 });
contentManagementSchema.index({ tags: 1 });
contentManagementSchema.index({ author: 1 });

module.exports = mongoose.model('ContentManagement', contentManagementSchema);