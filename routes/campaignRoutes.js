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
router.post('/create', protect, campaignController.createCampaign);

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
router.get('/all', protect, campaignController.getCampaigns);

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
router.get('/organization/:organizationId', protect, campaignController.getCampaignsByOrganization);

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
router.get('/get/:campaignId', protect, campaignController.getCampaignById);

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
router.patch('/update/:campaignId', protect, campaignController.updateCampaign);

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
router.delete('/delete/:campaignId', protect, campaignController.deleteCampaign);

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
router.patch('/updateTemplate/:campaignId', protect, campaignController.updateTemplate);

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
router.patch('/updateContacts/:campaignId', protect, campaignController.updateContacts);

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
router.patch('/updateSenderEmails/:campaignId', protect, campaignController.updateSenderEmails);

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
router.patch('/updateTargetCategories/:campaignId', protect, campaignController.updateTargetCategories);

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
router.patch('/updateStatus/:campaignId', protect, campaignController.updateStatus);

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
router.post('/start/:campaignId', protect, campaignController.startCampaign);

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
router.get('/metrics/total-campaigns/:organizationId', protect, campaignController.getTotalCampaigns);

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
router.get('/metrics/active-campaigns/:organizationId', protect, campaignController.getActiveCampaigns);

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
router.get('/metrics/emails-sent/:organizationId', protect, campaignController.getEmailsSent);

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
router.get('/metrics/open-rate/:organizationId', protect, campaignController.getOpenRate);

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
router.get('/metrics/click-rate/:organizationId', protect, campaignController.getClickRate);

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

// Tracking endpoints

/**
 * @swagger
 * /api/campaigns/track/open/:campaignId/:customerId:
 *   get:
 *     summary: Get Open
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
router.get('/track/open/:campaignId/:customerId', protect, campaignController.trackOpen);

/**
 * @swagger
 * /api/campaigns/track/click/:campaignId/:contactId:
 *   get:
 *     summary: Get Click
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
// router.get('/track/click/:campaignId/:contactId', protect, campaignController.trackClick); // Implement if needed

module.exports = router; 
