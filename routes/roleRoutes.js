const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Roles
 *     description: roles operations
 */

const roleController = require('../controllers/roleController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');


/**
 * @swagger
 * /api/roles/:
 *   post:
 *     summary: Create Item
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', protect, requirePermission('roles', 'create'), roleController.createRole);

/**
 * @swagger
 * /api/roles/:
 *   get:
 *     summary: Get Item
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', protect, requirePermission('roles', 'view'), roleController.getRoles);

/**
 * @swagger
 * /api/roles/:roleId:
 *   get:
 *     summary: Get Item
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:roleId', protect, requirePermission('roles', 'view'), roleController.getRoleById);

/**
 * @swagger
 * /api/roles/:roleId:
 *   patch:
 *     summary: Update Item
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/:roleId', protect, requirePermission('roles', 'edit'), roleController.updateRole);

/**
 * @swagger
 * /api/roles/:roleId:
 *   delete:
 *     summary: Delete Item
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:roleId', protect, requirePermission('roles', 'delete'), roleController.deleteRole);

module.exports = router; 
