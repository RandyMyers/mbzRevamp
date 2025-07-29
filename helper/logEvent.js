const AuditLog = require('../models/auditLog');

/**
 * Logs an audit event.
 * @param {Object} params
 * @param {string} params.action - Action name (e.g., 'create_user')
 * @param {ObjectId} params.user - User performing the action
 * @param {string} params.resource - Resource type (e.g., 'User', 'Product')
 * @param {ObjectId} [params.resourceId] - ID of the resource
 * @param {Object} [params.details] - Extra details (before/after, etc.)
 * @param {ObjectId} [params.organization] - Organization (optional)
 * @param {string} [params.ip] - IP address of the user
 * @param {string} [params.userAgent] - User agent string
 * @param {string} [params.severity] - Severity level (info, warning, error, critical)
 */
module.exports = async function logEvent({ 
  action, 
  user, 
  resource, 
  resourceId, 
  details = {}, 
  organization,
  ip = null,
  userAgent = null,
  severity = 'info'
}) {
  try {
    await AuditLog.create({
      action,
      user,
      resource,
      resourceId,
      details: {
        ...details,
        ip,
        userAgent,
        timestamp: new Date()
      },
      organization,
      severity,
      ip,
      userAgent,
      timestamp: new Date()
    });
    
    console.log(`📝 Audit Log: ${action} - ${resource} - ${severity}`);
  } catch (error) {
    console.error('❌ Failed to create audit log:', error);
    // Don't throw error - audit logging shouldn't break main functionality
  }
}; 