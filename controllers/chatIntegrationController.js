const ChatIntegration = require('../models/chatIntegration');

/**
 * @swagger
 * /api/chat-integration/create:
 *   post:
 *     summary: Create a new chat integration
 *     tags: [Chat Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *             properties:
 *               provider:
 *                 type: string
 *                 description: Chat service provider name
 *                 example: "Intercom"
 *               scriptId:
 *                 type: string
 *                 description: Provider script ID for integration
 *                 example: "script_12345"
 *               propertyUrl:
 *                 type: string
 *                 description: Website URL where chat widget is deployed
 *                 example: "https://example.com"
 *               ticketEmail:
 *                 type: string
 *                 format: email
 *                 description: Email for ticket notifications
 *                 example: "support@example.com"
 *               jsApiKey:
 *                 type: string
 *                 description: JavaScript API key for the provider
 *                 example: "api_key_12345"
 *               widgetId:
 *                 type: string
 *                 description: Widget identifier
 *                 example: "widget_67890"
 *               directChatLink:
 *                 type: string
 *                 description: Direct link to chat conversation
 *                 example: "https://chat.provider.com/conversation/123"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the integration is active
 *               status:
 *                 type: string
 *                 default: "connected"
 *                 description: Integration connection status
 *               showOnCustomerDashboard:
 *                 type: boolean
 *                 default: true
 *                 description: Show chat widget on customer dashboard
 *               showOnAdminDashboard:
 *                 type: boolean
 *                 default: false
 *                 description: Show chat widget on admin dashboard
 *     responses:
 *       201:
 *         description: Chat integration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatIntegration'
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Provider is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */

exports.createChatIntegration = async (req, res) => {
  try {
    const chatIntegration = new ChatIntegration(req.body);
    await chatIntegration.save();
    res.status(201).json(chatIntegration);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/chat-integration/all:
 *   get:
 *     summary: Get all chat integrations
 *     tags: [Chat Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat integrations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatIntegration'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

exports.getAllChatIntegrations = async (req, res) => {
  try {
    const integrations = await ChatIntegration.find();
    console.log(integrations);
    res.json(integrations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/chat-integration/get/{id}:
 *   get:
 *     summary: Get chat integration by ID
 *     tags: [Chat Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Chat integration ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Chat integration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatIntegration'
 *       400:
 *         description: Bad request - Invalid ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid ID"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Chat integration not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

exports.getChatIntegrationById = async (req, res) => {
  if (req.params.id === 'all') {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  try {
    const integration = await ChatIntegration.findById(req.params.id);
    if (!integration) return res.status(404).json({ error: 'Not found' });
    res.json(integration);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/chat-integration/update/{id}:
 *   put:
 *     summary: Update chat integration by ID
 *     tags: [Chat Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Chat integration ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *                 description: Chat service provider name
 *                 example: "Intercom"
 *               scriptId:
 *                 type: string
 *                 description: Provider script ID for integration
 *                 example: "script_12345"
 *               propertyUrl:
 *                 type: string
 *                 description: Website URL where chat widget is deployed
 *                 example: "https://example.com"
 *               ticketEmail:
 *                 type: string
 *                 format: email
 *                 description: Email for ticket notifications
 *                 example: "support@example.com"
 *               jsApiKey:
 *                 type: string
 *                 description: JavaScript API key for the provider
 *                 example: "api_key_12345"
 *               widgetId:
 *                 type: string
 *                 description: Widget identifier
 *                 example: "widget_67890"
 *               directChatLink:
 *                 type: string
 *                 description: Direct link to chat conversation
 *                 example: "https://chat.provider.com/conversation/123"
 *               isActive:
 *                 type: boolean
 *                 description: Whether the integration is active
 *                 example: true
 *               status:
 *                 type: string
 *                 description: Integration connection status
 *                 example: "connected"
 *               showOnCustomerDashboard:
 *                 type: boolean
 *                 description: Show chat widget on customer dashboard
 *                 example: true
 *               showOnAdminDashboard:
 *                 type: boolean
 *                 description: Show chat widget on admin dashboard
 *                 example: false
 *     responses:
 *       200:
 *         description: Chat integration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatIntegration'
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation error"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Chat integration not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Not found"
 *       500:
 *         description: Server error
 */

exports.updateChatIntegration = async (req, res) => {
  try {
    const integration = await ChatIntegration.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!integration) return res.status(404).json({ error: 'Not found' });
    res.json(integration);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/chat-integration/delete/{id}:
 *   delete:
 *     summary: Delete chat integration by ID
 *     tags: [Chat Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Chat integration ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Chat integration deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Deleted"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Chat integration not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

exports.deleteChatIntegration = async (req, res) => {
  try {
    const integration = await ChatIntegration.findByIdAndDelete(req.params.id);
    if (!integration) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 