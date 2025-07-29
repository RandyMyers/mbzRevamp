const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AuditLogSchema = new Schema({
  action: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  resource: { type: String },
  resourceId: { type: Schema.Types.ObjectId },
  details: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  severity: { 
    type: String, 
    enum: ['info', 'warning', 'error', 'critical'], 
    default: 'info' 
  },
  ip: { type: String },
  userAgent: { type: String }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema); 