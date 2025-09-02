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
 *               participants: 
 *                 type: array
 *                 items: { type: string }
 *                 description: Array of user IDs from the same organization
 *               meetingLink: { type: string }
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
 *               participants: 
 *                 type: array
 *                 items: { type: string }
 *                 description: Array of user IDs from the same organization
 *               meetingLink: { type: string }
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
 *
 * /api/calls/available-participants/{organizationId}:
 *   get:
 *     tags: [Call Scheduler]
 *     summary: Get available participants for an organization
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *         description: Organization ID to get participants from
 *     responses:
 *       200: 
 *         description: Available participants list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id: { type: string }
 *                       name: { type: string }
 *                       email: { type: string }
 *       400: { description: Missing organizationId }
 *       500: { description: Server error }
 */
const CallScheduler = require('../models/callScheduler');
const User = require('../models/users');

// Validate that participants belong to the organization
const validateParticipants = async (participants, organizationId) => {
  if (!participants || participants.length === 0) return true;
  
  const participantUserIds = participants.filter(id => id); // Remove any null/undefined
  if (participantUserIds.length === 0) return true;
  
  const validUsers = await User.find({
    _id: { $in: participantUserIds },
    organization: organizationId
  });
  
  if (validUsers.length !== participantUserIds.length) {
    throw new Error('Some participants do not belong to this organization');
  }
  
  return true;
};

// Create a new call
exports.createCall = async (req, res) => {
  try {
    const { organizationId, userId, participants, ...callData } = req.body;
    console.log(req.body);
    if (!organizationId || !userId) {
      return res.status(400).json({ success: false, error: 'organizationId and userId are required' });
    }
    
    // Validate participants belong to organization
    if (participants && participants.length > 0) {
      await validateParticipants(participants, organizationId);
    }
    
    const call = new CallScheduler({ ...callData, organizationId, userId, participants });
    await call.save();
    
    // Populate participants with user details
    await call.populate('participants', 'name email');
    
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
    const calls = await CallScheduler.find(filter)
      .populate('participants', 'name email')
      .populate('userId', 'name email')
      .sort({ startTime: 1 });
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
    const call = await CallScheduler.findOne({ _id: req.params.id, organizationId })
      .populate('participants', 'name email')
      .populate('userId', 'name email');
    if (!call) return res.status(404).json({ success: false, error: 'Call not found or not authorized' });
    res.json({ success: true, data: call });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update a call (must belong to org)
exports.updateCall = async (req, res) => {
  try {
    const { organizationId, participants, ...updateData } = req.body;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    
    // Validate participants belong to organization if provided
    if (participants && participants.length > 0) {
      await validateParticipants(participants, organizationId);
    }
    
    const call = await CallScheduler.findOneAndUpdate(
      { _id: req.params.id, organizationId },
      { ...updateData, participants },
      { new: true }
    ).populate('participants', 'name email').populate('userId', 'name email');
    
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

// Get available participants for an organization
exports.getAvailableParticipants = async (req, res) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    
    const users = await User.find({ organization: organizationId })
      .select('name email _id')
      .sort({ name: 1 });
    
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 