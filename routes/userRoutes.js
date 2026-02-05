const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission, requirePermissionOrOwner } = require('../middleware/permissionMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User management operations
 */

// Protect all routes with authentication
router.use(authMiddleware.protect);

// Admin and super-admin routes
/**
 * @swagger
 * /api/users/create:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - organization
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               organization:
 *                 type: string
 *                 format: ObjectId
 *                 example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *               role:
 *                 type: string
 *                 example: "user"
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   example: "User created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/create', authMiddleware.protect, requirePermission('users', 'create'), userController.createUser);

// Organization-wide routes (accessible to super-admin)
/**
 * @swagger
 * /api/users/all:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/all', requirePermission('users', 'view'), userController.getAllUsers);

// Check if current user is the account owner (first admin of organization)
router.get('/check-owner-status', userController.checkOwnerStatus);

/**
 * @swagger
 * /api/users/get/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Get user by ID - users can always view themselves, viewing others requires users.view permission (checked in controller)
router.get('/get/:userId', userController.getUserById);

// Update user details (requires users.edit permission)
router.patch('/update/:userId', requirePermission('users', 'edit'), userController.updateUser);
router.put('/:userId', requirePermission('users', 'edit'), userController.updateUser); // Alias for frontend compatibility

// Update user status (requires users.edit permission)
router.patch('/change/:userId/status', requirePermission('users', 'edit'), userController.updateUserStatus);
router.patch('/:userId/status', requirePermission('users', 'edit'), userController.updateUserStatus); // Alias for frontend compatibility

// Get users by organization (requires users.view permission)
router.get('/organization/:organizationId', requirePermission('users', 'view'), userController.getUsersByOrganization);

// Delete a user (requires users.delete permission)
router.delete('/delete/:userId', requirePermission('users', 'delete'), userController.deleteUser);

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

// Celebration milestones routes (gamification)
router.get('/celebration-milestones', userController.getCelebrationMilestones);
router.post('/celebration-milestones', userController.addCelebrationMilestone);

// Update user role route (no protect middleware as requested)
//router.patch('/:userId/role', userController.updateUserRole);

// Generic delete user route (MUST be last to avoid conflicts with specific routes)
// Supports frontend calling DELETE /api/users/:userId directly
router.delete('/:userId', requirePermission('users', 'delete'), userController.deleteUser);

module.exports = router;
