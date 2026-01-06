const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { validatePermissions, generateDefaultPermissions } = require('../config/permissions');

// Permission action sub-schema
const PermissionActionsSchema = new Schema({
  view: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
  export: { type: Boolean, default: false },
  sync: { type: Boolean, default: false },
  assign: { type: Boolean, default: false },
  schedule: { type: Boolean, default: false },
}, { _id: false, strict: false });

// Permissions schema matching config/permissions.js
const PermissionsSchema = new Schema({
  dashboard: { type: PermissionActionsSchema, default: () => ({ view: false, edit: false }) },
  users: { type: PermissionActionsSchema, default: () => ({ view: false, create: false, edit: false, delete: false }) },
  stores: { type: PermissionActionsSchema, default: () => ({ view: false, create: false, edit: false, delete: false, sync: false }) },
  products: { type: PermissionActionsSchema, default: () => ({ view: false, create: false, edit: false, delete: false }) },
  orders: { type: PermissionActionsSchema, default: () => ({ view: false, create: false, edit: false, delete: false, export: false }) },
  customers: { type: PermissionActionsSchema, default: () => ({ view: false, create: false, edit: false, delete: false, export: false }) },
  inventory: { type: PermissionActionsSchema, default: () => ({ view: false, edit: false }) },
  tasks: { type: PermissionActionsSchema, default: () => ({ view: false, create: false, edit: false, delete: false, assign: false }) },
  calls: { type: PermissionActionsSchema, default: () => ({ view: false, create: false, edit: false, delete: false, schedule: false }) },
  marketing: { type: PermissionActionsSchema, default: () => ({ view: false, create: false, edit: false, delete: false }) },
  websites: { type: PermissionActionsSchema, default: () => ({ view: false, create: false, edit: false, delete: false }) },
  analytics: { type: PermissionActionsSchema, default: () => ({ view: false, export: false }) },
  settings: { type: PermissionActionsSchema, default: () => ({ view: false, edit: false }) },
  roles: { type: PermissionActionsSchema, default: () => ({ view: false, create: false, edit: false, delete: false }) },
  audit_logs: { type: PermissionActionsSchema, default: () => ({ view: false }) },
}, { _id: false, strict: false });

const RoleSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  permissions: { type: PermissionsSchema, default: () => generateDefaultPermissions() },
  isSystemRole: { type: Boolean, default: false },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compound unique index: Role name must be unique within each organization
RoleSchema.index({ name: 1, organization: 1 }, { unique: true });

// Update timestamp on save
RoleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Validate permissions on save
RoleSchema.pre('save', function (next) {
  if (this.permissions) {
    const validation = validatePermissions(this.permissions);
    if (!validation.valid) {
      console.warn('Permission validation warnings:', validation.errors);
      // Don't block save for invalid permissions, just warn
    }
  }
  next();
});

// Virtual for user count
RoleSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'role',
  count: true
});

// Ensure virtuals are included in JSON
RoleSchema.set('toJSON', { virtuals: true });
RoleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Role', RoleSchema);
