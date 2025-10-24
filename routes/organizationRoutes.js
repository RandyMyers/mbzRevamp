const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Organizations
 *     description: organizations operations
 */

const organizationController = require("../controllers/organizationControllers");

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

// Template settings routes
router.get('/template-settings', organizationController.getTemplateSettings);
router.put('/template-settings', organizationController.updateTemplateSettings);
router.get('/stores', organizationController.getOrganizationStores);
router.post('/template-settings/reset', organizationController.resetTemplateSettings);

// UPDATE organization template assignments
/**
 * @swagger
 * /api/organization/{organizationId}/templates:
 *   put:
 *     summary: 🎨 UPDATE ORGANIZATION INVOICE & RECEIPT TEMPLATE SETTINGS
 *     description: |
 *       **FRONTEND DEVELOPERS: This is the route to update which invoice and receipt templates are assigned to an organization.**
 *       
 *       Use this route when users want to:
 *       - Change their default invoice template
 *       - Change their default receipt template for orders
 *       - Change their default receipt template for subscriptions
 *       
 *       **Template Assignment Flow:**
 *       1. User selects new templates in frontend
 *       2. Frontend calls this route with template IDs
 *       3. Organization's template settings are updated
 *       4. All future invoices/receipts use the new templates
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               # Template Assignment
 *               invoiceTemplateId:
 *                 type: string
 *                 format: ObjectId
 *                 description: "🎨 INVOICE TEMPLATE ID - The template to use for all invoices"
 *                 example: "507f1f77bcf86cd799439011"
 *               receiptTemplateId:
 *                 type: string
 *                 format: ObjectId
 *                 description: "🎨 RECEIPT TEMPLATE ID - The template to use for all receipts (orders & subscriptions)"
 *                 example: "507f1f77bcf86cd799439011"
 *               
 *               # Store Selection (gets company info automatically)
 *               storeId:
 *                 type: string
 *                 format: ObjectId
 *                 description: "🏪 STORE ID - Select a store to get company name, website, logo automatically"
 *                 example: "507f1f77bcf86cd799439011"
 *               
 *               # Company Information (from TemplateCustomization page)
 *               companyName:
 *                 type: string
 *                 description: "🏢 Company name for templates"
 *                 example: "My Company Name"
 *               companyEmail:
 *                 type: string
 *                 description: "📧 Company email for templates"
 *                 example: "billing@mycompany.com"
 *               companyPhone:
 *                 type: string
 *                 description: "📞 Company phone for templates"
 *                 example: "+1 (555) 123-4567"
 *               companyAddress:
 *                 type: string
 *                 description: "📍 Company address for templates (comma-separated: street, city, state, zip, country)"
 *                 example: "123 Business Street, Business City, Business State, 12345, Business Country"
 *               logo:
 *                 type: string
 *                 description: "🖼️ Company logo URL"
 *                 example: "https://mycompany.com/logo.png"
 *               
 *               # Design Colors (from TemplateCustomization page)
 *               primaryColor:
 *                 type: string
 *                 description: "🎨 Primary color for templates"
 *                 example: "#3b82f6"
 *               secondaryColor:
 *                 type: string
 *                 description: "🎨 Secondary color for templates"
 *                 example: "#1e40af"
 *           examples:
 *             template_selection:
 *               summary: "Select Templates Only"
 *               value:
 *                 invoiceTemplateId: "507f1f77bcf86cd799439011"
 *                 receiptTemplateId: "507f1f77bcf86cd799439012"
 *             
 *             store_selection:
 *               summary: "Select Store (gets company info automatically)"
 *               value:
 *                 storeId: "507f1f77bcf86cd799439011"
 *                 invoiceTemplateId: "507f1f77bcf86cd799439011"
 *                 receiptTemplateId: "507f1f77bcf86cd799439012"
 *             
 *             company_customization:
 *               summary: "Customize Company Information"
 *               value:
 *                 companyName: "My Company Name"
 *                 companyEmail: "billing@mycompany.com"
 *                 companyPhone: "+1 (555) 123-4567"
 *                 companyAddress: "123 Business Street, Business City, Business State, 12345, Business Country"
 *                 logo: "https://mycompany.com/logo.png"
 *             
 *             design_customization:
 *               summary: "Customize Colors"
 *               value:
 *                 primaryColor: "#3b82f6"
 *                 secondaryColor: "#1e40af"
 *             
 *             complete_customization:
 *               summary: "Complete Template Customization"
 *               value:
 *                 storeId: "507f1f77bcf86cd799439011"
 *                 invoiceTemplateId: "507f1f77bcf86cd799439011"
 *                 receiptTemplateId: "507f1f77bcf86cd799439012"
 *                 companyName: "My Company Name"
 *                 companyEmail: "billing@mycompany.com"
 *                 companyPhone: "+1 (555) 123-4567"
 *                 companyAddress: "123 Business Street, Business City, Business State, 12345, Business Country"
 *                 logo: "https://mycompany.com/logo.png"
 *                 primaryColor: "#3b82f6"
 *                 secondaryColor: "#1e40af"
 *     responses:
 *       200:
 *         description: ✅ Organization invoice & receipt template settings updated successfully
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
 *                   example: "Organization templates updated successfully"
 *                 organization:
 *                   type: object
 *                   description: Updated organization object with new template assignments
 *                 templateDetails:
 *                   type: object
 *                   description: "🎨 Complete template information for frontend display"
 *                   properties:
 *                     invoiceTemplate:
 *                       type: object
 *                       description: "📄 Invoice template details (name, design, layout, etc.)"
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         name:
 *                           type: string
 *                           example: "Professional Invoice Template"
 *                         templateType:
 *                           type: string
 *                           example: "professional"
 *                         design:
 *                           type: object
 *                           description: "Color scheme, fonts, styling"
 *                         layout:
 *                           type: object
 *                           description: "Template layout options"
 *                         content:
 *                           type: object
 *                           description: "Text content and messaging"
 *                     receiptTemplates:
 *                       type: object
 *                       description: "🧾 Receipt template details"
 *                       properties:
 *                         order:
 *                           type: object
 *                           description: "📄 Order receipt template details"
 *                           properties:
 *                             _id:
 *                               type: string
 *                               example: "507f1f77bcf86cd799439012"
 *                             name:
 *                               type: string
 *                               example: "Order Receipt Template"
 *                             scenario:
 *                               type: string
 *                               example: "order"
 *                         subscription:
 *                           type: object
 *                           description: "📄 Subscription receipt template details"
 *                           properties:
 *                             _id:
 *                               type: string
 *                               example: "507f1f77bcf86cd799439013"
 *                             name:
 *                               type: string
 *                               example: "Subscription Receipt Template"
 *                             scenario:
 *                               type: string
 *                               example: "subscription"
 *       404:
 *         description: ❌ Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Organization not found"
 *       500:
 *         description: ❌ Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to update organization templates"
 */
router.put('/:organizationId/templates', organizationController.updateOrganizationTemplates);

module.exports = router;
