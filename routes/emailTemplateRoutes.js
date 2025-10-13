const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Email Templates
 *     description: email templates operations
 */

const emailTemplateController = require("../controllers/emailTemplateControllers");
const { protect } = require('../middleware/authMiddleware');


/**
 * @swagger
 * /api/email/templates/create:
 *   post:
 *     summary: Create Create
 *     tags: [Email Templates]
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
router.post("/create", protect, emailTemplateController.createEmailTemplate);

/**
 * @swagger
 * /api/email/templates/all:
 *   get:
 *     summary: Get All
 *     tags: [Email Templates]
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
router.get("/all", protect, emailTemplateController.getAllEmailTemplates);

/**
 * @swagger
 * /api/email/templates/get/:emailTemplateId:
 *   get:
 *     summary: Get Get
 *     tags: [Email Templates]
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
router.get("/get/:emailTemplateId", protect, emailTemplateController.getEmailTemplateById);

/**
 * @swagger
 * /api/email/templates/update/:emailTemplateId:
 *   patch:
 *     summary: Update Update
 *     tags: [Email Templates]
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
router.patch("/update/:emailTemplateId", protect, emailTemplateController.updateEmailTemplate);

/**
 * @swagger
 * /api/email/templates/delete/:emailTemplateId:
 *   delete:
 *     summary: Delete Delete
 *     tags: [Email Templates]
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
router.delete("/delete/:emailTemplateId", protect, emailTemplateController.deleteEmailTemplate);

/**
 * @swagger
 * /api/email/templates/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Email Templates]
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
router.get("/organization/:organizationId", protect, emailTemplateController.getEmailTemplatesByOrganization);

// New variable management routes

/**
 * @swagger
 * /api/email/templates/variables:
 *   get:
 *     summary: Get Variables
 *     tags: [Email Templates]
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
router.get("/variables", protect, emailTemplateController.getAvailableVariables);

/**
 * @swagger
 * /api/email/templates/validate-variables:
 *   post:
 *     summary: Create Validate-variables
 *     tags: [Email Templates]
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
router.post("/validate-variables", protect, emailTemplateController.validateTemplateVariables);


module.exports = router;
