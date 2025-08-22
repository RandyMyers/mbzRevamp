const SupportTicket = require('../models/support');
const logEvent = require('../helper/logEvent');
const mongoose = require('mongoose');
const axios = require('axios');

/**
 * @swagger
 * /api/support:
 *   post:
 *     summary: Create a new support ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *               - customer
 *               - organizationId
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Ticket subject line
 *                 example: "Payment issue with subscription"
 *               description:
 *                 type: string
 *                 description: Detailed description of the issue
 *                 example: "I am unable to process my monthly payment"
 *               category:
 *                 type: string
 *                 enum: [technical, billing, account, general]
 *                 default: general
 *                 description: Ticket category
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Ticket priority level
 *               customer:
 *                 type: object
 *                 required:
 *                   - name
 *                   - email
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Customer name
 *                     example: "John Doe"
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Customer email address
 *                     example: "john@example.com"
 *                   avatar:
 *                     type: string
 *                     description: Customer avatar URL
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Support ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SupportTicket'
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Missing required fields"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

// Create a new support ticket
exports.createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority, customer, organizationId } = req.body;
    if (!subject || !description || !customer || !organizationId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const ticket = new SupportTicket({
      subject,
      description,
      category,
      priority,
      customer,
      organizationId: new mongoose.Types.ObjectId(organizationId),
      messages: [],
      hasUnreadMessages: false
    });
    await ticket.save();
    await logEvent({
      action: 'create_support_ticket',
      user: req.user._id,
      resource: 'SupportTicket',
      resourceId: ticket._id,
      details: { subject: ticket.subject, status: ticket.status },
      organization: req.user.organization
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * @swagger
 * /api/support:
 *   get:
 *     summary: Get all support tickets for an organization
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID to filter tickets
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Support tickets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SupportTicket'
 *       400:
 *         description: Bad request - Missing organizationId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "organizationId is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

// Get all tickets for an organization
exports.getTickets = async (req, res) => {
  try {
    const { organizationId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const tickets = await SupportTicket.find({ organizationId }).sort({ updatedAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * @swagger
 * /api/support/{id}:
 *   get:
 *     summary: Get a single support ticket by ID
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Support ticket ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID to verify ticket ownership
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Support ticket retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SupportTicket'
 *       400:
 *         description: Bad request - Missing organizationId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "organizationId is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Support ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Ticket not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

// Get a single ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    const { organizationId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const ticket = await SupportTicket.findOne({ _id: req.params.id, organizationId });
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * @swagger
 * /api/support/{id}:
 *   put:
 *     summary: Update a support ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Support ticket ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID to verify ticket ownership
 *                 example: "507f1f77bcf86cd799439011"
 *               subject:
 *                 type: string
 *                 description: Updated ticket subject line
 *                 example: "Updated: Payment issue with subscription"
 *               description:
 *                 type: string
 *                 description: Updated detailed description
 *                 example: "Updated description with more details"
 *               category:
 *                 type: string
 *                 enum: [technical, billing, account, general]
 *                 description: Updated ticket category
 *                 example: "billing"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Updated ticket priority level
 *                 example: "high"
 *     responses:
 *       200:
 *         description: Support ticket updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SupportTicket'
 *       400:
 *         description: Bad request - Missing organizationId or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "organizationId is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Support ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Ticket not found"
 *       500:
 *         description: Server error
 */

// Update a ticket (subject, description, category, priority)
exports.updateTicket = async (req, res) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: req.params.id, organizationId },
      req.body,
      { new: true }
    );
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    await logEvent({
      action: 'update_support_ticket',
      user: req.user._id,
      resource: 'SupportTicket',
      resourceId: ticket._id,
      details: { before: oldTicket, after: ticket },
      organization: req.user.organization
    });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * @swagger
 * /api/support/{id}/message:
 *   post:
 *     summary: Add a message to a support ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Support ticket ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - sender
 *               - content
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID to verify ticket ownership
 *                 example: "507f1f77bcf86cd799439011"
 *               sender:
 *                 type: string
 *                 enum: [customer, support]
 *                 description: Message sender type
 *                 example: "support"
 *               content:
 *                 type: string
 *                 description: Message content
 *                 example: "Thank you for your patience. We are working on resolving this issue."
 *     responses:
 *       200:
 *         description: Message added to ticket successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SupportTicket'
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Missing required fields"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Support ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Ticket not found"
 *       500:
 *         description: Server error
 */

// Add a message to a ticket
exports.addMessageToTicket = async (req, res) => {
  try {
    const { organizationId, sender, content } = req.body;
    if (!organizationId || !sender || !content) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const ticket = await SupportTicket.findOne({ _id: req.params.id, organizationId });
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    ticket.messages.push({ sender, content, readStatus: sender === 'support' ? false : true });
    ticket.hasUnreadMessages = sender === 'customer';
    ticket.updatedAt = new Date();
    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * Start a chat session with a customer (provider-agnostic placeholder)
 * This can be wired to a provider SDK/API; for now it logs an event and appends a system message
 */
exports.startChatSession = async (req, res) => {
  try {
    const { organizationId } = req.body;
    const ticket = await SupportTicket.findOne({ _id: req.params.id, organizationId });
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    ticket.messages.push({ sender: 'support', content: '[System] Chat session started', readStatus: false });
    ticket.updatedAt = new Date();
    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * Transfer chat session to another agent (recorded in messages for now)
 */
exports.transferChatSession = async (req, res) => {
  try {
    const { organizationId, toAgentName } = req.body;
    const ticket = await SupportTicket.findOne({ _id: req.params.id, organizationId });
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    ticket.messages.push({ sender: 'support', content: `[System] Chat transferred to ${toAgentName}`, readStatus: false });
    ticket.updatedAt = new Date();
    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * Convert a chat session to a ticket is NOP here (already a ticket), but we log intent
 */
exports.convertChatToTicket = async (req, res) => {
  try {
    const { organizationId } = req.body;
    const ticket = await SupportTicket.findOne({ _id: req.params.id, organizationId });
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    ticket.messages.push({ sender: 'support', content: '[System] Chat converted to ticket', readStatus: false });
    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * PressOne call session stubs
 */
exports.startCallSession = async (req, res) => {
  try {
    const { organizationId } = req.body;
    const ticket = await SupportTicket.findOne({ _id: req.params.id, organizationId });
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    ticket.messages.push({ sender: 'support', content: '[System] Call started', readStatus: false });
    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.endCallSession = async (req, res) => {
  try {
    const { organizationId, summary } = req.body;
    const ticket = await SupportTicket.findOne({ _id: req.params.id, organizationId });
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    ticket.messages.push({ sender: 'support', content: `[System] Call ended. Summary: ${summary || ''}`, readStatus: false });
    ticket.status = 'in-progress';
    ticket.updatedAt = new Date();
    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * @swagger
 * /api/support/{id}/status:
 *   patch:
 *     summary: Change support ticket status
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Support ticket ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - status
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID to verify ticket ownership
 *                 example: "507f1f77bcf86cd799439011"
 *               status:
 *                 type: string
 *                 enum: [open, in-progress, resolved, closed]
 *                 description: New ticket status
 *                 example: "resolved"
 *     responses:
 *       200:
 *         description: Ticket status changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SupportTicket'
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Missing required fields"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Support ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Ticket not found"
 *       500:
 *         description: Server error
 */

// Change ticket status
exports.changeTicketStatus = async (req, res) => {
  try {
    const { organizationId, status } = req.body;
    if (!organizationId || !status) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: req.params.id, organizationId },
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    await logEvent({
      action: 'close_support_ticket',
      user: req.user._id,
      resource: 'SupportTicket',
      resourceId: ticket._id,
      details: { subject: ticket.subject, closeDate: new Date() },
      organization: req.user.organization
    });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * @swagger
 * /api/support/{id}:
 *   delete:
 *     summary: Delete a support ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Support ticket ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID to verify ticket ownership
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Support ticket deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ticket deleted"
 *       400:
 *         description: Bad request - Missing organizationId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "organizationId is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Support ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Ticket not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

// Delete a ticket
exports.deleteTicket = async (req, res) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const ticket = await SupportTicket.findOneAndDelete({ _id: req.params.id, organizationId });
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * @swagger
 * /api/support/chat-integration:
 *   post:
 *     summary: Add a new chat integration for an organization
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - integration
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
 *               integration:
 *                 type: object
 *                 required:
 *                   - provider
 *                   - name
 *                 properties:
 *                   provider:
 *                     type: string
 *                     description: Chat provider name
 *                     example: "tawk"
 *                   name:
 *                     type: string
 *                     description: Integration name
 *                     example: "Main Support Chat"
 *                   apiKey:
 *                     type: string
 *                     description: Provider API key
 *                     example: "api_key_12345"
 *                   propertyId:
 *                     type: string
 *                     description: Provider property ID
 *                     example: "property_67890"
 *                   widgetId:
 *                     type: string
 *                     description: Widget identifier
 *                     example: "widget_abc123"
 *                   config:
 *                     type: object
 *                     description: Additional configuration options
 *                     example: { "theme": "dark", "position": "bottom-right" }
 *     responses:
 *       201:
 *         description: Chat integration added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       provider:
 *                         type: string
 *                         description: Chat provider name
 *                       name:
 *                         type: string
 *                         description: Integration name
 *                       apiKey:
 *                         type: string
 *                         description: Provider API key
 *                       propertyId:
 *                         type: string
 *                         description: Provider property ID
 *                       widgetId:
 *                         type: string
 *                         description: Widget identifier
 *                       config:
 *                         type: object
 *                         description: Additional configuration options
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "organizationId and integration are required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

// Add a new chat integration (organization-wide, not per ticket)
exports.addChatIntegration = async (req, res) => {
  try {
    const { organizationId, integration } = req.body;
    if (!organizationId || !integration) {
      return res.status(400).json({ success: false, error: 'organizationId and integration are required' });
    }
    // Find any ticket for this org (or create a dummy one if none exists)
    let ticket = await SupportTicket.findOne({ organizationId });
    if (!ticket) {
      ticket = new SupportTicket({
        subject: 'Integration Holder',
        description: 'Holder for chat integrations',
        category: 'general',
        priority: 'low',
        status: 'open',
        customer: { name: 'System', email: 'system@mbz.com' },
        organizationId: new mongoose.Types.ObjectId(organizationId),
        messages: [],
        hasUnreadMessages: false,
        chatIntegrations: [integration]
      });
      await ticket.save();
      return res.status(201).json({ success: true, data: ticket.chatIntegrations });
    }
    ticket.chatIntegrations.push(integration);
    await ticket.save();
    res.status(201).json({ success: true, data: ticket.chatIntegrations });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * @swagger
 * /api/support/chat-integration:
 *   get:
 *     summary: Get all chat integrations for an organization
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID to get chat integrations for
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Chat integrations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       provider:
 *                         type: string
 *                         description: Chat provider name
 *                         example: "tawk"
 *                       name:
 *                         type: string
 *                         description: Integration name
 *                         example: "Main Support Chat"
 *                       apiKey:
 *                         type: string
 *                         description: Provider API key
 *                       propertyId:
 *                         type: string
 *                         description: Provider property ID
 *                       widgetId:
 *                         type: string
 *                         description: Widget identifier
 *                       config:
 *                         type: object
 *                         description: Additional configuration options
 *       400:
 *         description: Bad request - Missing organizationId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "organizationId is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

// Get all chat integrations for an organization
exports.getChatIntegrations = async (req, res) => {
  try {
    const { organizationId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const ticket = await SupportTicket.findOne({ organizationId });
    res.json({ success: true, data: ticket ? ticket.chatIntegrations : [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * @swagger
 * /api/support/chat-integration:
 *   put:
 *     summary: Update a chat integration by index
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - index
 *               - integration
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
 *               index:
 *                 type: number
 *                 description: Index of the integration to update
 *                 example: 0
 *               integration:
 *                 type: object
 *                 required:
 *                   - provider
 *                   - name
 *                 properties:
 *                   provider:
 *                     type: string
 *                     description: Chat provider name
 *                     example: "tawk"
 *                   name:
 *                     type: string
 *                     description: Integration name
 *                     example: "Updated Support Chat"
 *                   apiKey:
 *                     type: string
 *                     description: Provider API key
 *                     example: "new_api_key_12345"
 *                   propertyId:
 *                     type: string
 *                     description: Provider property ID
 *                     example: "new_property_67890"
 *                   widgetId:
 *                     type: string
 *                     description: Widget identifier
 *                     example: "new_widget_abc123"
 *                   config:
 *                     type: object
 *                     description: Additional configuration options
 *                     example: { "theme": "light", "position": "top-right" }
 *     responses:
 *       200:
 *         description: Chat integration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       provider:
 *                         type: string
 *                         description: Chat provider name
 *                       name:
 *                         type: string
 *                         description: Integration name
 *                       apiKey:
 *                         type: string
 *                         description: Provider API key
 *                       propertyId:
 *                         type: string
 *                         description: Provider property ID
 *                       widgetId:
 *                         type: string
 *                         description: Widget identifier
 *                       config:
 *                         type: object
 *                         description: Additional configuration options
 *       400:
 *         description: Bad request - Missing required fields or invalid index
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "organizationId, index, and integration are required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Chat integration not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Integration not found"
 *       500:
 *         description: Server error
 */

// Update a chat integration by index
exports.updateChatIntegration = async (req, res) => {
  try {
    const { organizationId, index, integration } = req.body;
    if (!organizationId || typeof index !== 'number' || !integration) {
      return res.status(400).json({ success: false, error: 'organizationId, index, and integration are required' });
    }
    const ticket = await SupportTicket.findOne({ organizationId });
    if (!ticket || !ticket.chatIntegrations[index]) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }
    ticket.chatIntegrations[index] = integration;
    await ticket.save();
    res.json({ success: true, data: ticket.chatIntegrations });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * @swagger
 * /api/support/chat-integration:
 *   delete:
 *     summary: Delete a chat integration by index
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - index
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
 *               index:
 *                 type: number
 *                 description: Index of the integration to delete
 *                 example: 0
 *     responses:
 *       200:
 *         description: Chat integration deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       provider:
 *                         type: string
 *                         description: Chat provider name
 *                       name:
 *                         type: string
 *                         description: Integration name
 *                       apiKey:
 *                         type: string
 *                         description: Provider API key
 *                       propertyId:
 *                         type: string
 *                         description: Provider property ID
 *                       widgetId:
 *                         type: string
 *                         description: Widget identifier
 *                       config:
 *                         type: object
 *                         description: Additional configuration options
 *       400:
 *         description: Bad request - Missing required fields or invalid index
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "organizationId and index are required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Chat integration not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Integration not found"
 *       500:
 *         description: Server error
 */

// Delete a chat integration by index
exports.deleteChatIntegration = async (req, res) => {
  try {
    const { organizationId, index } = req.body;
    if (!organizationId || typeof index !== 'number') {
      return res.status(400).json({ success: false, error: 'organizationId and index are required' });
    }
    const ticket = await SupportTicket.findOne({ organizationId });
    if (!ticket || !ticket.chatIntegrations[index]) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }
    ticket.chatIntegrations.splice(index, 1);
    await ticket.save();
    res.json({ success: true, data: ticket.chatIntegrations });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * @swagger
 * /api/support/metrics/total-tickets/{organizationId}:
 *   get:
 *     summary: Get total number of support tickets for an organization
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID to get ticket count for
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Total tickets count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                       description: Total number of support tickets
 *                       example: 150
 *       400:
 *         description: Bad request - Missing organizationId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Organization ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to count tickets"
 */

// Support Stats Functions for Page Overview
exports.getTotalTickets = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const totalTickets = await SupportTicket.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(organizationId) 
    });

    res.json({
      success: true,
      data: { count: totalTickets }
    });
  } catch (error) {
    console.error('Total Tickets Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to count tickets"
    });
  }
};

/**
 * @swagger
 * /api/support/metrics/open-tickets/{organizationId}:
 *   get:
 *     summary: Get number of open support tickets for an organization
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID to get open ticket count for
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Open tickets count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                       description: Number of open support tickets
 *                       example: 25
 *       400:
 *         description: Bad request - Missing organizationId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Organization ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to count open tickets"
 */

exports.getOpenTickets = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const openTickets = await SupportTicket.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: { $in: ['open', 'in-progress'] }
    });

    res.json({
      success: true,
      data: { count: openTickets }
    });
  } catch (error) {
    console.error('Open Tickets Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to count open tickets"
    });
  }
};

/**
 * @swagger
 * /api/support/metrics/resolved-tickets/{organizationId}:
 *   get:
 *     summary: Get number of resolved support tickets for an organization
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID to get resolved ticket count for
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Resolved tickets count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                       description: Number of resolved support tickets
 *                       example: 125
 *       400:
 *         description: Bad request - Missing organizationId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Organization ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to count resolved tickets"
 */

exports.getResolvedTickets = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const resolvedTickets = await SupportTicket.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: { $in: ['resolved', 'closed'] }
    });

    res.json({
      success: true,
      data: { count: resolvedTickets }
    });
  } catch (error) {
    console.error('Resolved Tickets Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to count resolved tickets"
    });
  }
};

/**
 * @swagger
 * /api/support/metrics/avg-response-time/{organizationId}:
 *   get:
 *     summary: Get average response time for support tickets
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID to get average response time for
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Average response time retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     avgResponseTimeHours:
 *                       type: number
 *                       description: Average response time in hours
 *                       example: 4.5
 *       400:
 *         description: Bad request - Missing organizationId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Organization ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to calculate average response time"
 */

exports.getAvgResponseTime = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const pipeline = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          'messages.sender': 'support'
        }
      },
      {
        $unwind: '$messages'
      },
      {
        $match: {
          'messages.sender': 'support'
        }
      },
      {
        $group: {
          _id: '$_id',
          firstResponseTime: {
            $min: {
              $subtract: ['$messages.timestamp', '$createdAt']
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$firstResponseTime' }
        }
      }
    ];

    const result = await SupportTicket.aggregate(pipeline);
    const avgResponseTimeMs = result[0]?.avgResponseTime || 0;
    const avgResponseTimeHours = avgResponseTimeMs / (1000 * 60 * 60);

    res.json({
      success: true,
      data: { 
        avgResponseTimeHours: Math.round(avgResponseTimeHours * 100) / 100
      }
    });
  } catch (error) {
    console.error('Average Response Time Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate average response time"
    });
  }
}; 