const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Websites
 *     description: websites operations
 */

const websiteController = require('../controllers/websiteControllers');


// Website creation and domain check

/**
 * @swagger
 * /api/websites/create:
 *   post:
 *     summary: Create Create
 *     tags: [Websites]
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
router.post('/create',  websiteController.createWebsite);

/**
 * @swagger
 * /api/websites/check-domain:
 *   get:
 *     summary: Get Check-domain
 *     tags: [Websites]
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
router.get('/check-domain', websiteController.checkDomain);

// Super admin routes (must come before /:id to avoid conflicts)

/**
 * @swagger
 * /api/websites/all/:userId:
 *   get:
 *     summary: Get All
 *     tags: [Websites]
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
router.get('/all/:userId', websiteController.getAllWebsites);

/**
 * @swagger
 * /api/websites/analytics/:userId:
 *   get:
 *     summary: Get Analytics
 *     tags: [Websites]
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
router.get('/analytics/:userId', websiteController.getWebsiteAnalytics);

// Organization analytics (must come before /:id to avoid conflicts)

/**
 * @swagger
 * /api/websites/analytics/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Websites]
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
router.get('/analytics/organization/:organizationId', websiteController.getOrganizationWebsiteAnalytics);

// Organization websites (must come before /:id to avoid conflicts)

/**
 * @swagger
 * /api/websites/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Websites]
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
router.get('/organization/:organizationId', websiteController.getOrganizationWebsites);

// Step-by-step website configuration (must come before /:id to avoid conflicts)

/**
 * @swagger
 * /api/websites/basic-info/:id:
 *   patch:
 *     summary: Update Basic-info
 *     tags: [Websites]
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
router.patch('/basic-info/:id', websiteController.updateBasicInfo);

/**
 * @swagger
 * /api/websites/business-info/:id:
 *   patch:
 *     summary: Update Business-info
 *     tags: [Websites]
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
router.patch('/business-info/:id', websiteController.updateBusinessInfo);

/**
 * @swagger
 * /api/websites/colors/:id:
 *   patch:
 *     summary: Update Colors
 *     tags: [Websites]
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
router.patch('/colors/:id', websiteController.updateColors);

/**
 * @swagger
 * /api/websites/emails/:id:
 *   patch:
 *     summary: Update Emails
 *     tags: [Websites]
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
router.patch('/emails/:id', websiteController.updateEmails);

// Delete website (must come before /:id to avoid conflicts)

/**
 * @swagger
 * /api/websites/delete/:id:
 *   delete:
 *     summary: Delete Delete
 *     tags: [Websites]
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
router.delete('/delete/:id', websiteController.deleteWebsite);

// Generic website CRUD operations (MUST be last due to /:id catching all)

/**
 * @swagger
 * /api/websites/:id:
 *   get:
 *     summary: Get Item
 *     tags: [Websites]
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
router.get('/:id', websiteController.getWebsiteById);


module.exports = router;
