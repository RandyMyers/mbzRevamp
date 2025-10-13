const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Call Scheduler
 *     description: call scheduler operations
 */

const callSchedulerController = require('../controllers/callSchedulerController');

// All endpoints require organizationId (and userId for create)
// For GET: pass as query params; for POST/PUT/PATCH/DELETE: pass as body fields


/**
 * @swagger
 * /api/calls/:
 *   post:
 *     summary: Create Item
 *     tags: [Call Scheduler]
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
router.post('/', callSchedulerController.createCall); // organizationId, userId in body

/**
 * @swagger
 * /api/calls/:
 *   get:
 *     summary: Get Item
 *     tags: [Call Scheduler]
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
router.get('/', callSchedulerController.getCalls);

/**
 * @swagger
 * /api/calls/available-senders/:organizationId:
 *   get:
 *     summary: Get Available-senders
 *     tags: [Call Scheduler]
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
router.get('/available-senders/:organizationId', callSchedulerController.getAvailableSenders); // organizationId (and optional userId) in query

/**
 * @swagger
 * /api/calls/available-participants/:organizationId:
 *   get:
 *     summary: Get Available-participants
 *     tags: [Call Scheduler]
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
router.get('/available-participants/:organizationId', callSchedulerController.getAvailableParticipants); // Get available participants

// Timezone and recurring meeting routes

/**
 * @swagger
 * /api/calls/timezones:
 *   get:
 *     summary: Get Timezones
 *     tags: [Call Scheduler]
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
router.get('/timezones', callSchedulerController.getAvailableTimezones);

/**
 * @swagger
 * /api/calls/convert-timezone:
 *   post:
 *     summary: Create Convert-timezone
 *     tags: [Call Scheduler]
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
router.post('/convert-timezone', callSchedulerController.convertMeetingTime);

/**
 * @swagger
 * /api/calls/optimal-times:
 *   post:
 *     summary: Create Optimal-times
 *     tags: [Call Scheduler]
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
router.post('/optimal-times', callSchedulerController.findOptimalTimes);

/**
 * @swagger
 * /api/calls/generate-recurring:
 *   post:
 *     summary: Create Generate-recurring
 *     tags: [Call Scheduler]
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
router.post('/generate-recurring', callSchedulerController.generateRecurringDates);

/**
 * @swagger
 * /api/calls/current-time/:timezone:
 *   get:
 *     summary: Get Current-time
 *     tags: [Call Scheduler]
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
router.get('/current-time/:timezone', callSchedulerController.getCurrentTime);


/**
 * @swagger
 * /api/calls/:id:
 *   get:
 *     summary: Get Item
 *     tags: [Call Scheduler]
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
router.get('/:id', callSchedulerController.getCallById); // organizationId in query

/**
 * @swagger
 * /api/calls/:id:
 *   put:
 *     summary: Update Item
 *     tags: [Call Scheduler]
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
router.put('/:id', callSchedulerController.updateCall); // organizationId in body

/**
 * @swagger
 * /api/calls/:id/cancel:
 *   patch:
 *     summary: Update Cancel
 *     tags: [Call Scheduler]
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
router.patch('/:id/cancel', callSchedulerController.cancelCall); // organizationId in body

/**
 * @swagger
 * /api/calls/:id:
 *   delete:
 *     summary: Delete Item
 *     tags: [Call Scheduler]
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
router.delete('/:id', callSchedulerController.deleteCall); // organizationId in body

module.exports = router; 
