const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Chat Integration
 *     description: chat integration operations
 */

const chatIntegrationController = require('../controllers/chatIntegrationController');

router.post('/create', chatIntegrationController.createChatIntegration);
router.get('/all', chatIntegrationController.getAllChatIntegrations);
router.get('/get/:id', chatIntegrationController.getChatIntegrationById);
router.put('/update/:id', chatIntegrationController.updateChatIntegration);
router.delete('/delete/:id', chatIntegrationController.deleteChatIntegration);

module.exports = router;
