const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');
const authMiddleware = require('../middlewares/authMiddleware');

// Protect all routes with authentication
//router.use(authMiddleware.protect);

// Admin and super-admin routes
router.post('/create', userController.createUser);

// Organization-wide routes (accessible to super-admin)
router.get('/all', userController.getAllUsers);
router.get('/get/:userId', userController.getUserById);

// Update user details (admin and above)
router.patch('/update/:userId', userController.updateUser);

// Update user status (admin and super-admin)
router.patch('/change/:userId/status', userController.updateUserStatus);

// Get users by organization
router.get('/organization/:organizationId', userController.getUsersByOrganization);

// Delete a user (admin only)
router.delete('/delete/:userId', userController.deleteUser);

// Update profile picture (authenticated user)
router.patch('/:userId/profile-picture',  userController.updateProfilePicture);

// Regional settings routes
router.get('/:userId/regional-settings', userController.getUserRegionalSettings);
router.patch('/:userId/regional-settings', userController.updateUserRegionalSettings);

// Profile picture routes
router.post('/:userId/avatar', userController.uploadProfilePicture);
router.delete('/:userId/avatar', userController.removeProfilePicture);

// Session management routes
router.get('/:userId/sessions', userController.getUserSessions);
router.delete('/:userId/sessions/:sessionId', userController.terminateSession);

// Update user role route (no protect middleware as requested)
//router.patch('/:userId/role', userController.updateUserRole);

module.exports = router;
