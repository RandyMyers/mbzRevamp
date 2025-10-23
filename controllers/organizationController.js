const Organization = require('../models/organization');
const Store = require('../models/store');

/**
 * @swagger
 * /api/organizations/company-info:
 *   get:
 *     summary: Get organization company information for selectors
 *     description: Retrieves the organization's basic company information (name, email, phone, address, logo) that can be used as default values in template customization.
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization company information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Organization's company information
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Organization name
 *                       example: "Acme Corporation"
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: Organization email
 *                       example: "billing@acme.com"
 *                     phone:
 *                       type: string
 *                       description: Organization phone
 *                       example: "+1 (555) 123-4567"
 *                     address:
 *                       type: object
 *                       description: Organization address
 *                       properties:
 *                         street:
 *                           type: string
 *                           example: "123 Business Street"
 *                         city:
 *                           type: string
 *                           example: "Business City"
 *                         state:
 *                           type: string
 *                           example: "CA"
 *                         postalCode:
 *                           type: string
 *                           example: "12345"
 *                         country:
 *                           type: string
 *                           example: "USA"
 *                     logo:
 *                       type: string
 *                       description: Organization logo URL
 *                       example: "https://example.com/logo.png"
 *       401:
 *         description: Unauthorized - User not associated with organization
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
exports.getOrganizationCompanyInfo = async (req, res) => {
  try {
    const organizationId = req.user.organization;
    
    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: 'User not associated with any organization'
      });
    }

    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    const companyInfo = {
      name: organization.name,
      email: organization.email,
      phone: organization.phone,
      address: organization.address,
      logo: organization.logoUrl
    };

    res.status(200).json({
      success: true,
      data: companyInfo
    });
  } catch (error) {
    console.error('Error fetching organization company info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization company information'
    });
  }
};

/**
 * @swagger
 * /api/organizations/template-settings:
 *   get:
 *     summary: Get organization template settings for invoice/receipt customization
 *     description: Retrieves the organization's customized template settings including store info, custom fields, design, and layout preferences
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Template settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     invoiceTemplate:
 *                       type: object
 *                       description: Invoice template customization settings
 *                       properties:
 *                         storeInfo:
 *                           type: object
 *                           description: Store-specific information
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "My Store"
 *                             website:
 *                               type: string
 *                               example: "https://mystore.com"
 *                             logo:
 *                               type: string
 *                               example: "https://example.com/logo.png"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "billing@mystore.com"
 *                         customFields:
 *                           type: object
 *                           properties:
 *                             phone:
 *                               type: string
 *                               example: "+1 (555) 123-4567"
 *                             address:
 *                               type: object
 *                               properties:
 *                                 street:
 *                                   type: string
 *                                   example: "123 Business St"
 *                                 city:
 *                                   type: string
 *                                   example: "Business City"
 *                                 state:
 *                                   type: string
 *                                   example: "CA"
 *                                 zipCode:
 *                                   type: string
 *                                   example: "12345"
 *                                 country:
 *                                   type: string
 *                                   example: "USA"
 *                         design:
 *                           type: object
 *                           properties:
 *                             primaryColor:
 *                               type: string
 *                               example: "#3b82f6"
 *                             secondaryColor:
 *                               type: string
 *                               example: "#1e40af"
 *                             backgroundColor:
 *                               type: string
 *                               example: "#ffffff"
 *                         layout:
 *                           type: object
 *                           properties:
 *                             logoPosition:
 *                               type: string
 *                               enum: [top-left, top-right, top-center]
 *                               example: "top-left"
 *                             headerStyle:
 *                               type: string
 *                               example: "standard"
 *                             footerStyle:
 *                               type: string
 *                               example: "standard"
 *                     receiptTemplate:
 *                       type: object
 *                       description: Receipt template customization settings (same structure as invoiceTemplate)
 *       401:
 *         description: Unauthorized - User not associated with organization
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
exports.getTemplateSettings = async (req, res) => {
  try {
    const organizationId = req.user.organization;
    
    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: 'User not associated with any organization'
      });
    }

    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      data: organization.organizationTemplateSettings || {}
    });
  } catch (error) {
    console.error('Error fetching template settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template settings'
    });
  }
};

/**
 * @swagger
 * /api/organizations/template-settings:
 *   put:
 *     summary: Update organization template settings
 *     description: Updates the organization's template customization settings for invoices and receipts. These settings will be used when generating documents from orders.
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoiceTemplate:
 *                 type: object
 *                 description: Invoice template customization settings
 *                 properties:
 *                   storeInfo:
 *                     type: object
 *                     description: Store information to use for company details
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "My Store"
 *                       website:
 *                         type: string
 *                         example: "https://mystore.com"
 *                       logo:
 *                         type: string
 *                         example: "https://example.com/logo.png"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "billing@mystore.com"
 *                   customFields:
 *                     type: object
 *                     properties:
 *                       phone:
 *                         type: string
 *                         example: "+1 (555) 123-4567"
 *                       address:
 *                         type: object
 *                         properties:
 *                           street:
 *                             type: string
 *                             example: "123 Business St"
 *                           city:
 *                             type: string
 *                             example: "Business City"
 *                           state:
 *                             type: string
 *                             example: "CA"
 *                           zipCode:
 *                             type: string
 *                             example: "12345"
 *                           country:
 *                             type: string
 *                             example: "USA"
 *                   design:
 *                     type: object
 *                     properties:
 *                       primaryColor:
 *                         type: string
 *                         example: "#3b82f6"
 *                       secondaryColor:
 *                         type: string
 *                         example: "#1e40af"
 *                       backgroundColor:
 *                         type: string
 *                         example: "#ffffff"
 *                   layout:
 *                     type: object
 *                     properties:
 *                       logoPosition:
 *                         type: string
 *                         enum: [top-left, top-right, top-center]
 *                         example: "top-left"
 *               receiptTemplate:
 *                 type: object
 *                 description: Receipt template customization settings (same structure as invoiceTemplate)
 *     responses:
 *       200:
 *         description: Template settings updated successfully
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
 *                   example: "Template settings updated successfully"
 *                 data:
 *                   type: object
 *                   description: Updated template settings
 *       401:
 *         description: Unauthorized - User not associated with organization
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
exports.updateTemplateSettings = async (req, res) => {
  try {
    const organizationId = req.user.organization;
    const { invoiceTemplate, receiptTemplate } = req.body;
    
    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: 'User not associated with any organization'
      });
    }

    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Update template settings
    if (invoiceTemplate) {
      organization.organizationTemplateSettings.invoiceTemplate = invoiceTemplate;
    }
    if (receiptTemplate) {
      organization.organizationTemplateSettings.receiptTemplate = receiptTemplate;
    }

    await organization.save();

    res.status(200).json({
      success: true,
      message: 'Template settings updated successfully',
      data: organization.organizationTemplateSettings
    });
  } catch (error) {
    console.error('Error updating template settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template settings'
    });
  }
};

/**
 * @swagger
 * /api/organizations/stores:
 *   get:
 *     summary: Get organization's stores for template selector
 *     description: Retrieves all stores belonging to the organization for use in template customization. These stores can be selected to provide company information (name, website, logo) for invoices and receipts.
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stores retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: Array of organization's stores
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         format: ObjectId
 *                         description: Store ID
 *                         example: "507f1f77bcf86cd799439011"
 *                       name:
 *                         type: string
 *                         description: Store name
 *                         example: "My WooCommerce Store"
 *                       website:
 *                         type: string
 *                         description: Store URL
 *                         example: "https://mystore.com"
 *                       logo:
 *                         type: string
 *                         description: Store logo URL
 *                         example: "https://mystore.com/wp-content/uploads/logo.png"
 *       401:
 *         description: Unauthorized - User not associated with organization
 *       500:
 *         description: Server error
 */
exports.getOrganizationStores = async (req, res) => {
  try {
    const organizationId = req.user.organization;
    
    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: 'User not associated with any organization'
      });
    }

    const stores = await Store.find({ organizationId })
      .select('name url websiteLogo')
      .lean();

    const formattedStores = stores.map(store => ({
      _id: store._id,
      name: store.name,
      website: store.url,
      logo: store.websiteLogo
    }));

    res.status(200).json({
      success: true,
      data: formattedStores
    });
  } catch (error) {
    console.error('Error fetching organization stores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization stores'
    });
  }
};

/**
 * @swagger
 * /api/organizations/template-settings/reset:
 *   post:
 *     summary: Reset organization template settings to default
 *     description: Resets all organization template customizations to default values. This will remove all custom store info, email, phone, address, design, and layout settings.
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Template settings reset successfully
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
 *                   example: "Template settings reset successfully"
 *                 data:
 *                   type: object
 *                   description: Empty object indicating settings have been reset
 *                   example: {}
 *       401:
 *         description: Unauthorized - User not associated with organization
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
exports.resetTemplateSettings = async (req, res) => {
  try {
    const organizationId = req.user.organization;
    
    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: 'User not associated with any organization'
      });
    }

    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Reset template settings to empty object
    organization.organizationTemplateSettings = {};
    await organization.save();

    res.status(200).json({
      success: true,
      message: 'Template settings reset successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error resetting template settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset template settings'
    });
  }
};
