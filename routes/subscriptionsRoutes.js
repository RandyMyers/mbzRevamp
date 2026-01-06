const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Subscriptions
 *     description: subscriptions operations
 */

const subscriptionController = require('../controllers/subscriptionController');

// CRUD

/**
 * @swagger
 * /api/subscriptions/:
 *   post:
 *     summary: Create Item
 *     tags: [Subscriptions]
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
router.post('/', protect, subscriptionController.createSubscription);

/**
 * @swagger
 * /api/subscriptions/:
 *   get:
 *     summary: Get Item
 *     tags: [Subscriptions]
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
router.get('/', protect, subscriptionController.getSubscriptions);

// ========== Scheduled Downgrade Routes (MUST be before /:id routes) ==========

/**
 * @swagger
 * /api/subscriptions/scheduled-downgrade:
 *   get:
 *     summary: Get scheduled downgrade info for user
 *     tags: [Subscriptions]
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
 *                 hasScheduledDowngrade:
 *                   type: boolean
 *                 scheduledDowngrade:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/scheduled-downgrade', protect, subscriptionController.getScheduledDowngrade);

/**
 * @swagger
 * /api/subscriptions/cancel-scheduled-downgrade:
 *   post:
 *     summary: Cancel a scheduled downgrade
 *     tags: [Subscriptions]
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
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No scheduled downgrade found
 *       500:
 *         description: Server error
 */
router.post('/cancel-scheduled-downgrade', protect, subscriptionController.cancelScheduledDowngrade);

/**
 * @swagger
 * /api/subscriptions/:id:
 *   get:
 *     summary: Get Item
 *     tags: [Subscriptions]
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
router.get('/:id', protect, subscriptionController.getSubscriptionById);

/**
 * @swagger
 * /api/subscriptions/:id:
 *   put:
 *     summary: Update Item
 *     tags: [Subscriptions]
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
router.put('/:id', protect, subscriptionController.updateSubscription);

/**
 * @swagger
 * /api/subscriptions/:id:
 *   delete:
 *     summary: Delete Item
 *     tags: [Subscriptions]
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
router.delete('/:id', protect, subscriptionController.deleteSubscription);

// Create subscription with payment (NEW)

/**
 * @swagger
 * /api/subscriptions/create:
 *   post:
 *     summary: Create Create
 *     tags: [Subscriptions]
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
router.post('/create', protect, subscriptionController.createSubscriptionWithPayment);

// Create trial subscription

/**
 * @swagger
 * /api/subscriptions/trial:
 *   post:
 *     summary: Create a 14-day free trial subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Trial subscription created successfully
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
 *                   example: "14-day free trial activated successfully"
 *       400:
 *         description: Validation error or user already has active subscription
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/trial', protect, subscriptionController.createTrialSubscription);

// Assign a plan to a user

/**
 * @swagger
 * /api/subscriptions/assign:
 *   post:
 *     summary: Create Assign
 *     tags: [Subscriptions]
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
router.post('/assign', protect, subscriptionController.assignSubscription);
// Renew a subscription

/**
 * @swagger
 * /api/subscriptions/:id/renew:
 *   post:
 *     summary: Create Renew
 *     tags: [Subscriptions]
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
router.post('/:id/renew', protect, subscriptionController.renewSubscription);
// Cancel a subscription

/**
 * @swagger
 * /api/subscriptions/:id/cancel:
 *   post:
 *     summary: Create Cancel
 *     tags: [Subscriptions]
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
router.post('/:id/cancel', protect, subscriptionController.cancelSubscription);

module.exports = router; 
