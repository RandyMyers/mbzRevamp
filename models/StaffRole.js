const mongoose = require('mongoose');

const staffRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  permissions: {
    type: Object,
    required: true,
    default: {}
  },
  isSystemRole: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Staff role specific fields
  roleType: {
    type: String,
    enum: ['system', 'custom'],
    default: 'custom',
    description: 'System roles are predefined, custom roles are created by super admin'
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
    description: 'Role hierarchy level (1 = highest)'
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
staffRoleSchema.index({ staffRole: 1, isActive: 1 });
staffRoleSchema.index({ level: 1 });

// Pre-save middleware
staffRoleSchema.pre('save', function(next) {
  if (this.isNew) {
    // Set level based on roleType
    if (this.roleType === 'system') {
      this.level = 1; // System roles have highest level
    } else {
      this.level = this.level || 5; // Custom roles default to level 5
    }
  }
  next();
});

module.exports = mongoose.model('StaffRole', staffRoleSchema);