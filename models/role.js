const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoleSchema = new Schema({
  name: { type: String, required: true, unique: true },
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
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

RoleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Role', RoleSchema); 