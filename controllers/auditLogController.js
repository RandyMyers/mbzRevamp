/**
 * @swagger
 * tags:
 *   - name: Audit Logs
 *     description: System audit logs
 *
 * /api/audit-logs:
 *   post:
 *     tags: [Audit Logs]
 *     summary: Create an audit log entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action: { type: string }
 *               user: { type: string }
 *               resource: { type: string }
 *               resourceId: { type: string }
 *               details: { type: object }
 *               organization: { type: string }
 *     responses:
 *       201: { description: Created }
 *       500: { description: Server error }
 *   get:
 *     tags: [Audit Logs]
 *     summary: Get audit logs (filterable)
 *     parameters:
 *       - in: query
 *         name: user
 *         schema: { type: string }
 *       - in: query
 *         name: resource
 *         schema: { type: string }
 *       - in: query
 *         name: organization
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: Logs list }
 *       500: { description: Server error }
 *
 * /api/audit-logs/organization/{organizationId}:
 *   get:
 *     tags: [Audit Logs]
 *     summary: Get audit logs by organization (filterable)
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: user
 *         schema: { type: string }
 *       - in: query
 *         name: resource
 *         schema: { type: string }
 *       - in: query
 *         name: severity
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: Logs list }
 *       500: { description: Server error }
 *
 * /api/audit-logs/{logId}:
 *   get:
 *     tags: [Audit Logs]
 *     summary: Get an audit log by ID
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Log }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *   delete:
 *     tags: [Audit Logs]
 *     summary: Delete an audit log by ID
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
const AuditLog = require('../models/auditLog');

// Create a new audit log entry
exports.createLog = async (req, res) => {
  try {
    const { action, user, resource, resourceId, details, organization } = req.body;
    const log = new AuditLog({ action, user, resource, resourceId, details, organization });
    await log.save();
    
    // Populate the saved log before returning
    const populatedLog = await AuditLog.findById(log._id)
      .populate('user', 'name email role')
      .populate('organization', 'name domain')
      .exec();
    
    res.status(201).json({ success: true, log: populatedLog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create audit log' });
  }
};

// Get audit logs (with optional filters)
exports.getLogs = async (req, res) => {
  try {
    const { user, resource, organization, startDate, endDate } = req.query;
    const filter = {};
    if (user) filter.user = user;
    if (resource) filter.resource = resource;
    if (organization) filter.organization = organization;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .populate('organization', 'name domain')
      .sort({ timestamp: -1 })
      .exec();
    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

// Get audit logs by organization
exports.getLogsByOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { user, resource, startDate, endDate, severity, action } = req.query;
    
    const filter = { organization: organizationId };
    if (user) filter.user = user;
    if (resource) filter.resource = resource;
    if (severity) filter.severity = severity;
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .populate('organization', 'name domain')
      .sort({ timestamp: -1 })
      .exec();
      
    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch organization audit logs' });
  }
};

// Get a single audit log by ID
exports.getLogById = async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await AuditLog.findById(logId)
      .populate('user', 'name email role')
      .populate('organization', 'name domain')
      .exec();
    if (!log) return res.status(404).json({ success: false, message: 'Audit log not found' });
    res.status(200).json({ success: true, log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit log' });
  }
};

// Delete an audit log
exports.deleteLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await AuditLog.findByIdAndDelete(logId);
    if (!log) return res.status(404).json({ success: false, message: 'Audit log not found' });
    res.status(200).json({ success: true, message: 'Audit log deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete audit log' });
  }
}; 