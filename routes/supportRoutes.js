const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Support
 *     description: support operations
 */

const supportControllers = require('../controllers/supportControllers');
const { protect } = require('../middleware/authMiddleware');

// All endpoints require organizationId
// For GET: pass as query params; for POST/PUT/PATCH/DELETE: pass as body fields

router.post('/', protect, supportControllers.createTicket);
router.get('/', protect, supportControllers.getTickets);
router.get('/:id', protect, supportControllers.getTicketById);
router.put('/:id', protect, supportControllers.updateTicket);
router.post('/:id/message', protect, supportControllers.addMessageToTicket);
router.post('/:id/chat/start', protect, supportControllers.startChatSession);
router.post('/:id/chat/transfer', protect, supportControllers.transferChatSession);
router.post('/:id/chat/convert', protect, supportControllers.convertChatToTicket);
router.post('/:id/call/start', protect, supportControllers.startCallSession);
router.post('/:id/call/end', protect, supportControllers.endCallSession);
router.patch('/:id/status', protect, supportControllers.changeTicketStatus);
router.delete('/:id', protect, supportControllers.deleteTicket);

// Chat integration routes
router.post('/chat-integration', protect, supportControllers.addChatIntegration);
router.get('/chat-integration', protect, supportControllers.getChatIntegrations);
router.put('/chat-integration', protect, supportControllers.updateChatIntegration);
router.delete('/chat-integration', protect, supportControllers.deleteChatIntegration);

// Stats routes for page overview
router.get('/metrics/total-tickets/:organizationId', protect, supportControllers.getTotalTickets);
router.get('/metrics/open-tickets/:organizationId', protect, supportControllers.getOpenTickets);
router.get('/metrics/resolved-tickets/:organizationId', protect, supportControllers.getResolvedTickets);
router.get('/metrics/avg-response-time/:organizationId', protect, supportControllers.getAvgResponseTime);

module.exports = router; 
