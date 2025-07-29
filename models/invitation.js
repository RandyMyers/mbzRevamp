const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvitationSchema = new Schema({
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  },
  invitedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  organization: { 
    type: Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true 
  },
  role: { 
    type: Schema.Types.ObjectId, 
    ref: 'Role',
    required: false
  },
  department: { 
    type: String,
    enum: [
      'Customer Support', 
      'IT', 
      'HR', 
      'Sales', 
      'Marketing', 
      'Finance', 
      'Billing', 
      'Shipping'
    ],
    required: false
  },
  groups: [{
    type: Schema.Types.ObjectId,
    ref: 'Group'
  }],
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'cancelled', 'expired'], 
    default: 'pending' 
  },
  token: { 
    type: String, 
    required: true, 
    unique: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Update timestamp on save
InvitationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for checking if invitation is expired
InvitationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Method to check if invitation is valid
InvitationSchema.methods.isValid = function() {
  return this.status === 'pending' && !this.isExpired;
};

// Static method to find valid invitations
InvitationSchema.statics.findValidInvitation = function(token) {
  return this.findOne({
    token,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });
};

module.exports = mongoose.model('Invitation', InvitationSchema); 