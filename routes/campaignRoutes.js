const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Campaigns
 *     description: campaigns operations
 */

const campaignController = require('../controllers/campaignControllers');
const { protect } = require('../middleware/authMiddleware');
const { requireMarketingAccess } = require('../middleware/permissionMiddleware');

// Public tracking endpoints (no auth required - used for email open/click tracking)
router.get('/track/open/:campaignId/:customerId', campaignController.trackOpen);
router.get('/track/click/:campaignId/:customerId', campaignController.trackClick);

// Apply marketing access check to all other campaign routes
// Campaigns require 'campaigns' marketing access (Standard and Premium plans)
router.use(protect, requireMarketingAccess('campaigns'));

// CRUD routes

/**
 * @swagger
 * /api/campaigns/create:
 *   post:
 *     summary: Create Create
 *     tags: [Campaigns]
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
router.post('/create', campaignController.createCampaign);

/**
 * @swagger
 * /api/campaigns/all:
 *   get:
 *     summary: Get All
 *     tags: [Campaigns]
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
router.get('/all', campaignController.getCampaigns);

/**
 * @swagger
 * /api/campaigns/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Campaigns]
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
router.get('/organization/:organizationId', campaignController.getCampaignsByOrganization);

/**
 * @swagger
 * /api/campaigns/get/:campaignId:
 *   get:
 *     summary: Get Get
 *     tags: [Campaigns]
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
router.get('/get/:campaignId', campaignController.getCampaignById);

/**
 * @swagger
 * /api/campaigns/update/:campaignId:
 *   patch:
 *     summary: Update Update
 *     tags: [Campaigns]
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
router.patch('/update/:campaignId', campaignController.updateCampaign);

/**
 * @swagger
 * /api/campaigns/delete/:campaignId:
 *   delete:
 *     summary: Delete Delete
 *     tags: [Campaigns]
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
router.delete('/delete/:campaignId', campaignController.deleteCampaign);

// Specialized campaign updates

/**
 * @swagger
 * /api/campaigns/updateTemplate/:campaignId:
 *   patch:
 *     summary: Update UpdateTemplate
 *     tags: [Campaigns]
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
router.patch('/updateTemplate/:campaignId', campaignController.updateTemplate);

/**
 * @swagger
 * /api/campaigns/updateContacts/:campaignId:
 *   patch:
 *     summary: Update UpdateContacts
 *     tags: [Campaigns]
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
router.patch('/updateContacts/:campaignId', campaignController.updateContacts);

/**
 * @swagger
 * /api/campaigns/updateSenderEmails/:campaignId:
 *   patch:
 *     summary: Update UpdateSenderEmails
 *     tags: [Campaigns]
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
router.patch('/updateSenderEmails/:campaignId', campaignController.updateSenderEmails);

/**
 * @swagger
 * /api/campaigns/updateTargetCategories/:campaignId:
 *   patch:
 *     summary: Update UpdateTargetCategories
 *     tags: [Campaigns]
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
router.patch('/updateTargetCategories/:campaignId', campaignController.updateTargetCategories);

/**
 * @swagger
 * /api/campaigns/updateStatus/:campaignId:
 *   patch:
 *     summary: Update UpdateStatus
 *     tags: [Campaigns]
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
router.patch('/updateStatus/:campaignId', campaignController.updateStatus);

// Start campaign

/**
 * @swagger
 * /api/campaigns/start/:campaignId:
 *   post:
 *     summary: Create Start
 *     tags: [Campaigns]
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
router.post('/start/:campaignId', campaignController.startCampaign);

// Stats routes for page overview

/**
 * @swagger
 * /api/campaigns/metrics/total-campaigns/:organizationId:
 *   get:
 *     summary: Get Total-campaigns
 *     tags: [Campaigns]
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
router.get('/metrics/total-campaigns/:organizationId', campaignController.getTotalCampaigns);

/**
 * @swagger
 * /api/campaigns/metrics/active-campaigns/:organizationId:
 *   get:
 *     summary: Get Active-campaigns
 *     tags: [Campaigns]
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
router.get('/metrics/active-campaigns/:organizationId', campaignController.getActiveCampaigns);

/**
 * @swagger
 * /api/campaigns/metrics/emails-sent/:organizationId:
 *   get:
 *     summary: Get Emails-sent
 *     tags: [Campaigns]
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
router.get('/metrics/emails-sent/:organizationId', campaignController.getEmailsSent);

/**
 * @swagger
 * /api/campaigns/metrics/open-rate/:organizationId:
 *   get:
 *     summary: Get Open-rate
 *     tags: [Campaigns]
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
router.get('/metrics/open-rate/:organizationId', campaignController.getOpenRate);

/**
 * @swagger
 * /api/campaigns/metrics/click-rate/:organizationId:
 *   get:
 *     summary: Get Click-rate
 *     tags: [Campaigns]
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
router.get('/metrics/click-rate/:organizationId', campaignController.getClickRate);

// Stats route for overview

/**
 * @swagger
 * /api/campaigns/stats/overview:
 *   get:
 *     summary: Get Overview
 *     tags: [Campaigns]
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
//router.get('/stats/overview', campaignController.getCampaignStats);

module.exports = router; 
