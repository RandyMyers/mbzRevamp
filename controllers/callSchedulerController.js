const dotenv = require('dotenv');
dotenv.config();

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
 *               description: { type: string, maxLength: 1000 }
 *               participants: 
 *                 type: array
 *                 items: { type: string }
 *                 description: Array of user IDs from the same organization
 *               externalParticipants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string, description: "External participant name" }
 *                     email: { type: string, format: email, description: "External participant email" }
 *                 description: Array of external participants (non-organization members)
 *               meetingLink: { type: string }
 *               senderId: { type: string, description: "Sender ID for email notifications" }
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
 *               description: { type: string, maxLength: 1000 }
 *               participants: 
 *                 type: array
 *                 items: { type: string }
 *                 description: Array of user IDs from the same organization
 *               externalParticipants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string, description: "External participant name" }
 *                     email: { type: string, format: email, description: "External participant email" }
 *                 description: Array of external participants (non-organization members)
 *               meetingLink: { type: string }
 *               senderId: { type: string, description: "Sender ID for email notifications" }
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
 *
 * /api/calls/available-senders/{organizationId}:
 *   get:
 *     tags: [Call Scheduler]
 *     summary: Get available senders for an organization
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *         description: Organization ID to get senders from
 *     responses:
 *       200: 
 *         description: Available senders list
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
const callNotificationService = require('../services/callNotificationService');

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
    const { organizationId, userId, participants, externalParticipants, senderId, ...callData } = req.body;
    console.log(req.body);
    if (!organizationId || !userId) {
      return res.status(400).json({ success: false, error: 'organizationId and userId are required' });
    }
    
    // Validate participants belong to organization
    if (participants && participants.length > 0) {
      await validateParticipants(participants, organizationId);
    }
    
    // Validate external participants have required fields
    if (externalParticipants && externalParticipants.length > 0) {
      for (const extParticipant of externalParticipants) {
        if (!extParticipant.name || !extParticipant.email) {
          return res.status(400).json({ 
            success: false, 
            error: 'External participants must have both name and email' 
          });
        }
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(extParticipant.email)) {
          return res.status(400).json({ 
            success: false, 
            error: `Invalid email format for external participant: ${extParticipant.email}` 
          });
        }
      }
    }
    
    const call = new CallScheduler({ 
      ...callData, 
      organizationId, 
      userId, 
      participants,
      externalParticipants: externalParticipants || []
    });
    await call.save();
    
    // Populate participants with user details
    await call.populate('participants', 'name email');
    
    // Send notifications asynchronously (don't block the response)
    setImmediate(async () => {
      try {
        // Send call scheduled notification to organizer
        await callNotificationService.sendCallScheduledNotification(call);
        
        // Send call invitations to internal participants if any
        if (participants && participants.length > 0 && senderId) {
          await callNotificationService.sendCallInvitations(call, participants, senderId);
        }
        
        // Send call invitations to external participants if any
        if (externalParticipants && externalParticipants.length > 0) {
          await callNotificationService.sendExternalCallInvitations(call, externalParticipants);
        }
      } catch (notificationError) {
        console.error('❌ Call notification error (non-blocking):', notificationError.message);
      }
    });
    
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
    const { organizationId, participants, externalParticipants, senderId, ...updateData } = req.body;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    
    // Get the original call to compare changes
    const originalCall = await CallScheduler.findOne({ _id: req.params.id, organizationId })
      .populate('participants', 'name email');
    
    if (!originalCall) return res.status(404).json({ success: false, error: 'Call not found or not authorized' });
    
    // Validate participants belong to organization if provided
    if (participants && participants.length > 0) {
      await validateParticipants(participants, organizationId);
    }
    
    // Validate external participants have required fields if provided
    if (externalParticipants && externalParticipants.length > 0) {
      for (const extParticipant of externalParticipants) {
        if (!extParticipant.name || !extParticipant.email) {
          return res.status(400).json({ 
            success: false, 
            error: 'External participants must have both name and email' 
          });
        }
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(extParticipant.email)) {
          return res.status(400).json({ 
            success: false, 
            error: `Invalid email format for external participant: ${extParticipant.email}` 
          });
        }
      }
    }
    
    const call = await CallScheduler.findOneAndUpdate(
      { _id: req.params.id, organizationId },
      { ...updateData, participants, externalParticipants },
      { new: true }
    ).populate('participants', 'name email').populate('userId', 'name email');
    
    if (!call) return res.status(404).json({ success: false, error: 'Call not found or not authorized' });
    
    // Send update notifications asynchronously (don't block the response)
    setImmediate(async () => {
      try {
        // Check if participants changed
        const originalParticipantIds = originalCall.participants ? originalCall.participants.map(p => p._id.toString()) : [];
        const newParticipantIds = call.participants ? call.participants.map(p => p._id.toString()) : [];
        const participantsChanged = JSON.stringify(originalParticipantIds.sort()) !== JSON.stringify(newParticipantIds.sort());
        
        // Check if important call details changed
        const detailsChanged = (
          originalCall.title !== call.title ||
          originalCall.startTime.getTime() !== call.startTime.getTime() ||
          originalCall.endTime.getTime() !== call.endTime.getTime() ||
          originalCall.description !== call.description ||
          originalCall.meetingLink !== call.meetingLink
        );
        
        // Send updated call invitations if participants changed or details changed
        if ((participantsChanged || detailsChanged) && call.participants && call.participants.length > 0 && senderId) {
          const participantIds = call.participants.map(p => p._id);
          await callNotificationService.sendCallInvitations(call, participantIds, senderId);
        }
      } catch (notificationError) {
        console.error('❌ Call update notification error (non-blocking):', notificationError.message);
      }
    });
    
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
    
    // Get the call with participants before updating
    const call = await CallScheduler.findOne({ _id: req.params.id, organizationId })
      .populate('participants', 'name email');
    
    if (!call) return res.status(404).json({ success: false, error: 'Call not found or not authorized' });
    
    // Update call status
    const updatedCall = await CallScheduler.findOneAndUpdate(
      { _id: req.params.id, organizationId },
      { status: 'cancelled' },
      { new: true }
    );
    
    // Send cancellation notifications asynchronously (don't block the response)
    setImmediate(async () => {
      try {
        // Send cancellation notifications to participants if any
        if (call.participants && call.participants.length > 0) {
          const participantIds = call.participants.map(p => p._id);
          await callNotificationService.sendCallCancelledNotification(call, participantIds);
        }
      } catch (notificationError) {
        console.error('❌ Call cancellation notification error (non-blocking):', notificationError.message);
      }
    });
    
    res.json({ success: true, data: updatedCall });
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

// Get available senders for an organization (for email invites)
exports.getAvailableSenders = async (req, res) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    
    const Sender = require('../models/sender');
    const senders = await Sender.find({ 
      organization: organizationId,
      isActive: true 
    })
      .select('name email _id')
      .sort({ name: 1 });
    
    res.json({ success: true, data: senders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 