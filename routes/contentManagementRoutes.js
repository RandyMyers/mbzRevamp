const express = require('express');
const router = express.Router();
const contentManagementControllers = require('../controllers/contentManagementControllers');
const { authenticateToken } = require('../middleware/authMiddleware');

// Content Management Routes
router.post('/', authenticateToken, contentManagementControllers.createContent);
router.get('/', authenticateToken, contentManagementControllers.getContent);
router.get('/:id', authenticateToken, contentManagementControllers.getContentById);
router.put('/:id', authenticateToken, contentManagementControllers.updateContent);
router.delete('/:id', authenticateToken, contentManagementControllers.deleteContent);
router.post('/:id/publish', authenticateToken, contentManagementControllers.publishContent);
router.post('/:id/like', authenticateToken, contentManagementControllers.likeContent);
router.post('/:id/comment', authenticateToken, contentManagementControllers.addComment);

module.exports = router;





