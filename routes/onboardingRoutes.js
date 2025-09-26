const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   - name: Onboarding
 *     description: Onboarding process management
 */

// Status and Progress
/**
 * @swagger
 * /api/onboarding/status:
 *   get:
 *     summary: Get onboarding status for current user's organization
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding status retrieved successfully
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
 *                   example: "Onboarding status retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Onboarding'
 *                 status:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "in_progress"
 *                     currentStep:
 *                       type: number
 *                       example: 2
 *                     redirectTo:
 *                       type: string
 *                       example: "/onboarding?step=2"
 *                     isComplete:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/status', onboardingController.getOnboardingStatus);

/**
 * @swagger
 * /api/onboarding/start:
 *   post:
 *     summary: Start onboarding process for organization
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding process started successfully
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
 *                   example: "Onboarding process started successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Onboarding'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/start', onboardingController.startOnboarding);

/**
 * @swagger
 * /api/onboarding/complete:
 *   post:
 *     summary: Complete onboarding process
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding process completed successfully
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
 *                   example: "Onboarding process completed successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Onboarding'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Onboarding not found
 *       500:
 *         description: Server error
 */
router.post('/complete', onboardingController.completeOnboarding);

/**
 * @swagger
 * /api/onboarding/skip:
 *   post:
 *     summary: Skip onboarding process
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding process skipped successfully
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
 *                   example: "Onboarding process skipped successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Onboarding'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/skip', onboardingController.skipOnboarding);

/**
 * @swagger
 * /api/onboarding/step/{stepNumber}:
 *   patch:
 *     summary: Update onboarding step
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stepNumber
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *         description: Step number to update (1-4)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isComplete:
 *                 type: boolean
 *                 description: Whether the step is complete
 *                 example: true
 *               data:
 *                 type: object
 *                 description: Step-specific data
 *                 properties:
 *                   storeId:
 *                     type: string
 *                     format: ObjectId
 *                     description: Store ID (for step 1)
 *                   setupMode:
 *                     type: string
 *                     enum: [new, existing]
 *                     description: Store setup mode (for step 1)
 *                   planId:
 *                     type: string
 *                     format: ObjectId
 *                     description: Plan ID (for step 2)
 *                   subscriptionId:
 *                     type: string
 *                     format: ObjectId
 *                     description: Subscription ID (for step 2)
 *                   isTrialActivated:
 *                     type: boolean
 *                     description: Whether trial was activated (for step 2)
 *                   completedModules:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Completed tour modules (for step 3)
 *                   preferences:
 *                     type: object
 *                     description: User preferences (for step 4)
 *     responses:
 *       200:
 *         description: Onboarding step updated successfully
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
 *                   example: "Onboarding step 2 updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Onboarding'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Onboarding not found
 *       500:
 *         description: Server error
 */
router.patch('/step/:stepNumber', onboardingController.updateOnboardingStep);

/**
 * @swagger
 * /api/onboarding/preferences:
 *   patch:
 *     summary: Update onboarding preferences
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skipTutorials:
 *                 type: boolean
 *                 description: Whether to skip tutorials
 *                 example: false
 *               showTips:
 *                 type: boolean
 *                 description: Whether to show tips
 *                 example: true
 *     responses:
 *       200:
 *         description: Onboarding preferences updated successfully
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
 *                   example: "Onboarding preferences updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Onboarding'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Onboarding not found
 *       500:
 *         description: Server error
 */
router.patch('/preferences', onboardingController.updateOnboardingPreferences);

// Module Tour Management
/**
 * @swagger
 * /api/onboarding/modules/{moduleId}/complete:
 *   post:
 *     summary: Complete a specific module tour
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           enum: [stores, tasks, inventory, billing, analytics, customers, marketing, settings, user-management, integrations, customer-support, audit-logs, invoices]
 *         description: Module ID to mark as completed
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timeSpent:
 *                 type: number
 *                 description: Time spent on module tour in minutes
 *                 example: 5
 *               tourType:
 *                 type: string
 *                 enum: [interactive, video, help]
 *                 description: Type of tour completed
 *                 example: "interactive"
 *     responses:
 *       200:
 *         description: Module tour completed successfully
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
 *                   example: "Module tour 'stores' completed successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Onboarding'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Onboarding not found
 *       500:
 *         description: Server error
 */
router.post('/modules/:moduleId/complete', onboardingController.completeModuleTour);

/**
 * @swagger
 * /api/onboarding/modules/status:
 *   get:
 *     summary: Get status of all module tours
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Module status retrieved successfully
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
 *                   example: "Module status retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     moduleStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           moduleId:
 *                             type: string
 *                             example: "stores"
 *                           isCompleted:
 *                             type: boolean
 *                             example: true
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2023-12-01T10:00:00.000Z"
 *                           timeSpent:
 *                             type: number
 *                             example: 5
 *                           tourType:
 *                             type: string
 *                             example: "interactive"
 *                           progressPercentage:
 *                             type: number
 *                             example: 100
 *                           lastAccessedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2023-12-01T10:00:00.000Z"
 *                     overallProgress:
 *                       type: number
 *                       example: 75
 *                     completedCount:
 *                       type: number
 *                       example: 12
 *                     totalModules:
 *                       type: number
 *                       example: 16
 *                     dashboardTourCompleted:
 *                       type: boolean
 *                       example: true
 *                     platformTourCompleted:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Onboarding not found
 *       500:
 *         description: Server error
 */
router.get('/modules/status', onboardingController.getModuleStatus);

/**
 * @swagger
 * /api/onboarding/modules/{moduleId}/progress:
 *   patch:
 *     summary: Update progress for a specific module tour
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           enum: [stores, tasks, inventory, billing, analytics, customers, marketing, settings, user-management, integrations, customer-support, audit-logs, invoices]
 *         description: Module ID to update progress for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               progressPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Progress percentage (0-100)
 *                 example: 75
 *               timeSpent:
 *                 type: number
 *                 description: Time spent on module in minutes
 *                 example: 3
 *     responses:
 *       200:
 *         description: Module progress updated successfully
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
 *                   example: "Module progress for 'stores' updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     moduleId:
 *                       type: string
 *                       example: "stores"
 *                     progressPercentage:
 *                       type: number
 *                       example: 75
 *                     timeSpent:
 *                       type: number
 *                       example: 3
 *                     lastAccessedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-12-01T10:00:00.000Z"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Onboarding not found
 *       500:
 *         description: Server error
 */
router.patch('/modules/:moduleId/progress', onboardingController.updateModuleProgress);

/**
 * @swagger
 * /api/onboarding/modules/{moduleId}/completed:
 *   get:
 *     summary: Check if a specific module tour is completed
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           enum: [stores, tasks, inventory, billing, analytics, customers, marketing, settings, user-management, integrations, customer-support, audit-logs, invoices]
 *         description: Module ID to check completion status for
 *     responses:
 *       200:
 *         description: Module completion status retrieved successfully
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
 *                   example: "Module completion status retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     moduleId:
 *                       type: string
 *                       example: "stores"
 *                     isCompleted:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Onboarding not found
 *       500:
 *         description: Server error
 */
router.get('/modules/:moduleId/completed', onboardingController.isModuleTourCompleted);

module.exports = router;