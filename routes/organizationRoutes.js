const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Organizations
 *     description: organizations operations
 */

const organizationController = require("../controllers/organizationControllers");
const organizationControllerNew = require("../controllers/organizationController");

// CREATE a new organization

/**
 * @swagger
 * /api/organization/create:
 *   post:
 *     summary: Create Create
 *     tags: [Organizations]
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
router.post("/create", organizationController.createOrganization);

// GET all organizations

/**
 * @swagger
 * /api/organization/all:
 *   get:
 *     summary: Get All
 *     tags: [Organizations]
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
router.get("/all", organizationController.getAllOrganizations);

// GET a specific organization by ID

/**
 * @swagger
 * /api/organization/get/:organizationId:
 *   get:
 *     summary: Get Get
 *     tags: [Organizations]
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
router.get("/get/:organizationId", organizationController.getOrganizationById);

// UPDATE an organization by ID

/**
 * @swagger
 * /api/organization/update/:organizationId:
 *   patch:
 *     summary: Update Update
 *     tags: [Organizations]
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
router.patch("/update/:organizationId", organizationController.updateOrganization);

// DELETE an organization by ID

/**
 * @swagger
 * /api/organization/delete/:organizationId:
 *   delete:
 *     summary: Delete Delete
 *     tags: [Organizations]
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
router.delete("/delete/:organizationId", organizationController.deleteOrganization);


/**
 * @swagger
 * /api/organization/logo/:organizationId:
 *   patch:
 *     summary: Update Logo
 *     tags: [Organizations]
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
router.patch('/logo/:organizationId', organizationController.updateOrganizationLogo);

// GET organization company info for selectors
router.get('/company-info', organizationControllerNew.getOrganizationCompanyInfo);

// Template settings routes
router.get('/template-settings', organizationControllerNew.getTemplateSettings);
router.put('/template-settings', organizationControllerNew.updateTemplateSettings);
router.get('/stores', organizationControllerNew.getOrganizationStores);
router.post('/template-settings/reset', organizationControllerNew.resetTemplateSettings);

module.exports = router;
