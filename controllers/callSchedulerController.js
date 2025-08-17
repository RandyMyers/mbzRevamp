/**
 * @swagger
 * tags:
 *   - name: Call Scheduler
 *     description: Schedule and manage calls
 *
 * /api/calls:
 *   post:
 *     tags: [Call Scheduler]
 *     summary: Create a call
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationId, userId]
 *             properties:
 *               organizationId: { type: string }
 *               userId: { type: string }
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *               title: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Missing required fields }
 *       500: { description: Server error }
 *   get:
 *     tags: [Call Scheduler]
 *     summary: Get calls for an organization (optionally by user)
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         required: false
 *         schema: { type: string }
 *     responses:
 *       200: { description: Calls list }
 *       400: { description: Missing organizationId }
 *       500: { description: Server error }
 *
 * /api/calls/{id}:
 *   get:
 *     tags: [Call Scheduler]
 *     summary: Get a call by ID (must belong to organization)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Call }
 *       400: { description: Missing organizationId }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *   put:
 *     tags: [Call Scheduler]
 *     summary: Update a call
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               organizationId: { type: string }
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *               title: { type: string }
 *               notes: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       400: { description: Missing organizationId }
 *       404: { description: Not found or unauthorized }
 *       500: { description: Server error }
 *   delete:
 *     tags: [Call Scheduler]
 *     summary: Delete a call
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               organizationId: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       400: { description: Missing organizationId }
 *       404: { description: Not found or unauthorized }
 *       500: { description: Server error }
 *
 * /api/calls/{id}/cancel:
 *   patch:
 *     tags: [Call Scheduler]
 *     summary: Cancel a call
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               organizationId: { type: string }
 *     responses:
 *       200: { description: Cancelled }
 *       400: { description: Missing organizationId }
 *       404: { description: Not found or unauthorized }
 *       500: { description: Server error }
 */
const CallScheduler = require('../models/callScheduler');

// Create a new call
exports.createCall = async (req, res) => {
  try {
    const { organizationId, userId, ...callData } = req.body;
    console.log(req.body);
    if (!organizationId || !userId) {
      return res.status(400).json({ success: false, error: 'organizationId and userId are required' });
    }
    const call = new CallScheduler({ ...callData, organizationId, userId });
    await call.save();
    res.status(201).json({ success: true, data: call });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all calls for an organization (and optionally user)
exports.getCalls = async (req, res) => {
  try {
    const { organizationId, userId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const filter = { organizationId };
    if (userId) filter.userId = userId;
    const calls = await CallScheduler.find(filter).sort({ startTime: 1 });
    res.json({ success: true, data: calls });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get a single call by ID (must belong to org)
exports.getCallById = async (req, res) => {
  try {
    const { organizationId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const call = await CallScheduler.findOne({ _id: req.params.id, organizationId });
    if (!call) return res.status(404).json({ success: false, error: 'Call not found or not authorized' });
    res.json({ success: true, data: call });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update a call (must belong to org)
exports.updateCall = async (req, res) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const call = await CallScheduler.findOneAndUpdate(
      { _id: req.params.id, organizationId },
      req.body,
      { new: true }
    );
    if (!call) return res.status(404).json({ success: false, error: 'Call not found or not authorized' });
    res.json({ success: true, data: call });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Cancel a call (must belong to org)
exports.cancelCall = async (req, res) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const call = await CallScheduler.findOneAndUpdate(
      { _id: req.params.id, organizationId },
      { status: 'cancelled' },
      { new: true }
    );
    if (!call) return res.status(404).json({ success: false, error: 'Call not found or not authorized' });
    res.json({ success: true, data: call });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete a call (must belong to org)
exports.deleteCall = async (req, res) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const call = await CallScheduler.findOneAndDelete({ _id: req.params.id, organizationId });
    if (!call) return res.status(404).json({ success: false, error: 'Call not found or not authorized' });
    res.json({ success: true, message: 'Call deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 