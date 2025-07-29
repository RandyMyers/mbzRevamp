const AuditLog = require('../models/auditLog');

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.action - The action performed
 * @param {string} params.user - User ID who performed the action
 * @param {string} params.resource - Resource type (user, product, order, etc.)
 * @param {string} params.resourceId - ID of the affected resource
 * @param {Object} params.details - Additional details about the action
 * @param {string} params.organization - Organization ID
 * @param {string} params.severity - Severity level (info, warning, error, critical)
 * @param {string} params.ip - IP address of the user
 * @param {string} params.userAgent - User agent string
 */
const createAuditLog = async ({ 
  action, 
  user, 
  resource, 
  resourceId, 
  details = {}, 
  organization, 
  severity = 'info',
  ip = null,
  userAgent = null
}) => {
  try {
    const log = new AuditLog({
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
      timestamp: new Date()
    });
    
    await log.save();
    console.log(`📝 Audit Log: ${action} - ${resource} - ${severity}`);
    return log;
  } catch (error) {
    console.error('❌ Failed to create audit log:', error);
    // Don't throw error - audit logging shouldn't break main functionality
    return null;
  }
};

/**
 * Create audit log for CRUD operations
 */
const logCRUDOperation = async (operation, user, resource, resourceId, details, organization, severity = 'info') => {
  const actions = {
    create: 'Created',
    read: 'Viewed',
    update: 'Updated',
    delete: 'Deleted'
  };
  
  return await createAuditLog({
    action: `${resource.charAt(0).toUpperCase() + resource.slice(1)} ${actions[operation]}`,
    user,
    resource,
    resourceId,
    details,
    organization,
    severity
  });
};

/**
 * Create audit log for status changes
 */
const logStatusChange = async (user, resource, resourceId, oldStatus, newStatus, details, organization) => {
  return await createAuditLog({
    action: `${resource.charAt(0).toUpperCase() + resource.slice(1)} Status Changed`,
    user,
    resource,
    resourceId,
    details: {
      ...details,
      oldStatus,
      newStatus
    },
    organization,
    severity: 'info'
  });
};

/**
 * Create audit log for security events
 */
const logSecurityEvent = async (action, user, details, organization, severity = 'warning') => {
  return await createAuditLog({
    action,
    user,
    resource: 'security',
    details,
    organization,
    severity
  });
};

/**
 * Create audit log for financial events
 */
const logFinancialEvent = async (action, user, resourceId, details, organization, severity = 'info') => {
  return await createAuditLog({
    action,
    user,
    resource: 'payment',
    resourceId,
    details,
    organization,
    severity
  });
};

module.exports = { 
  createAuditLog, 
  logCRUDOperation, 
  logStatusChange, 
  logSecurityEvent, 
  logFinancialEvent 
}; 