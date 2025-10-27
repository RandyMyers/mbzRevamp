const express = require('express');
const router = express.Router();
const adminStaff = require('../controllers/adminStaffController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication and authorization - only super-admin can manage staff
router.use(protect, restrictTo('super-admin'));

/**
 * @swagger
 * components:
 *   schemas:
 *     StaffAccount:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Staff account ID
 *         fullName:
 *           type: string
 *           description: Full name
 *         email:
 *           type: string
 *           description: Email address
 *         role:
 *           type: string
 *           description: User role
 *         isStaffAccount:
 *           type: boolean
 *           description: True if this is a nexusfinal2 staff account
 *         employeeId:
 *           type: string
 *           description: Linked employee ID
 *         staffRole:
 *           type: object
 *           description: Staff role details
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             description:
 *               type: string
 *             permissions:
 *               type: object
 *             level:
 *               type: number
 *         permissions:
 *           type: object
 *           description: Module permissions
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           description: Account status
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         lastPasswordReset:
 *           type: string
 *           format: date-time
 *           description: Last password reset timestamp
 *         loginAttempts:
 *           type: number
 *           description: Number of failed login attempts
 *         lockedUntil:
 *           type: string
 *           format: date-time
 *           description: Account lockout expiration
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         employeeDetails:
 *           type: object
 *           description: Linked employee details
 *           properties:
 *             _id:
 *               type: string
 *             fullName:
 *               type: string
 *             employeeId:
 *               type: string
 *             department:
 *               type: string
 *             roleTitle:
 *               type: string
 *             avatar:
 *               type: string
 */

// Staff account management routes
router.get('/', adminStaff.listStaffAccounts);
router.post('/', adminStaff.createStaffAccount);
router.get('/:id', adminStaff.getStaffAccount);
router.put('/:id', adminStaff.updateStaffAccount);

// Staff operations routes
router.post('/:id/suspend', adminStaff.suspendStaffAccount);
router.post('/:id/activate', adminStaff.activateStaffAccount);
router.post('/:id/reset-password', adminStaff.resetStaffPassword);
router.put('/:id/permissions', adminStaff.manageStaffPermissions);

// Employee linking routes
router.post('/:id/link-employee', adminStaff.linkToEmployee);
router.delete('/:id/unlink-employee', adminStaff.unlinkFromEmployee);

// Activity and analytics routes
router.get('/:id/activity', adminStaff.getStaffActivity);
router.get('/analytics/overview', adminStaff.getStaffAnalytics);

module.exports = router;
