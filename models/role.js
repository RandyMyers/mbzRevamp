const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoleSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  permissions: { type: Object, default: {} },
  // ✅ SIMPLE ORGANIZATION REFERENCE
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  // ✅ SIMPLE USER REFERENCE
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional to support registration flow
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ COMPOUND UNIQUE INDEX: Role name must be unique within each organization
RoleSchema.index({ name: 1, organization: 1 }, { unique: true });

RoleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Role', RoleSchema); 