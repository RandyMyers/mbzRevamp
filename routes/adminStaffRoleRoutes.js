const express = require('express');
const router = express.Router();
const adminStaffRole = require('../controllers/adminStaffRoleController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication and authorization - only super-admin can manage staff roles
router.use(protect, restrictTo('super-admin'));

/**
 * @swagger
 * components:
 *   schemas:
 *     StaffRole:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Staff role ID
 *         name:
 *           type: string
 *           description: Role name
 *         description:
 *           type: string
 *           description: Role description
 *         permissions:
 *           type: object
 *           description: Module permissions
 *         roleType:
 *           type: string
 *           enum: [system, custom]
 *           description: Role type
 *         level:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Role hierarchy level
 *         isActive:
 *           type: boolean
 *           description: Whether role is active
 *         createdBy:
 *           type: object
 *           description: User who created the role
 *           properties:
 *             _id:
 *               type: string
 *             fullName:
 *               type: string
 *             email:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Staff role management routes
router.get('/', adminStaffRole.listStaffRoles);
router.post('/', adminStaffRole.createStaffRole);
router.get('/templates/default', adminStaffRole.getDefaultPermissionTemplates);
router.get('/:id', adminStaffRole.getStaffRole);
router.put('/:id', adminStaffRole.updateStaffRole);
router.delete('/:id', adminStaffRole.deleteStaffRole);

// Permission management routes
router.put('/:id/permissions', adminStaffRole.updateStaffRolePermissions);

module.exports = router;
