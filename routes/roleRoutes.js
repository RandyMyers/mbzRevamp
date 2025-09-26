const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, roleController.createRole);
router.get('/', protect, roleController.getRoles);
router.get('/:roleId', protect, roleController.getRoleById);
router.patch('/:roleId', protect, roleController.updateRole);
router.delete('/:roleId', protect, roleController.deleteRole);

module.exports = router; 
