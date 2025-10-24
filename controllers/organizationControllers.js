/**
 * @swagger
 * tags:
 *   - name: Organizations
 *     description: Organization management
 *
 * /api/organization/create:
 *   post:
 *     tags: [Organizations]
 *     summary: Create an organization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *               email: { type: string, format: email }
 *               businessType: { type: string }
 *     responses:
 *       201: { description: Created }
 *       500: { description: Server error }
 *
 * /api/organization/all:
 *   get:
 *     tags: [Organizations]
 *     summary: Get all organizations
 *     responses:
 *       200: { description: Organizations list }
 *       500: { description: Server error }
 *
 * /api/organization/get/{organizationId}:
 *   get:
 *     tags: [Organizations]
 *     summary: Get organization by ID
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Organization }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *
 * /api/organization/update/{organizationId}:
 *   patch:
 *     tags: [Organizations]
 *     summary: Update an organization
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *
 * /api/organization/delete/{organizationId}:
 *   delete:
 *     tags: [Organizations]
 *     summary: Delete an organization
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *
 * /api/organization/logo/{organizationId}:
 *   patch:
 *     tags: [Organizations]
 *     summary: Update organization logo
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: Updated }
 *       400: { description: No file uploaded }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
const Organization = require("../models/organization"); // Import the Organization model
const Store = require("../models/store");
const cloudinary = require('cloudinary').v2;

// CREATE a new organization
exports.createOrganization = async (req, res) => {
  try {
    const { name, description, address, phone, email, businessType } = req.body;

    const newOrganization = new Organization({
      name,
      description,
      address,
      phone,
      email,
      businessType,
    });

    const savedOrganization = await newOrganization.save();
    res.status(201).json({ success: true, organization: savedOrganization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create organization" });
  }
};

// GET all organizations
exports.getAllOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find();
    res.status(200).json({ success: true, organizations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve organizations" });
  }
};

// GET an organization by its ID
exports.getOrganizationById = async (req, res) => {
  const { organizationId } = req.params;
  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }
    res.status(200).json({ success: true, organization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve organization" });
  }
};

// UPDATE organization details
exports.updateOrganization = async (req, res) => {
  const { organizationId } = req.params;
  const updateData = req.body;

  try {
    const updatedOrganization = await Organization.findByIdAndUpdate(
      organizationId,
      { $set: updateData, updatedAt: Date.now() },
      { new: true } // return the updated organization
    );

    if (!updatedOrganization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    res.status(200).json({ success: true, organization: updatedOrganization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update organization" });
  }
};

// DELETE an organization
exports.deleteOrganization = async (req, res) => {
  const { organizationId } = req.params;
  try {
    const deletedOrganization = await Organization.findByIdAndDelete(organizationId);
    if (!deletedOrganization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }
    res.status(200).json({ success: true, message: "Organization deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete organization" });
  }
};

// UPDATE organization logo
exports.updateOrganizationLogo = async (req, res) => {
  const { organizationId } = req.params;

  if (!req.files || !req.files.logo) {
    return res.status(400).json({ success: false, message: "No logo file uploaded" });
  }

  const logoFile = req.files.logo;

  try {
    // Upload the logo file to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(logoFile.tempFilePath, {
      folder: "organization_logos", // Specify a folder in your Cloudinary account
    });

    // Update the organization's logo URL
    const updatedOrganization = await Organization.findByIdAndUpdate(
      organizationId,
      { logoUrl: uploadResult.secure_url, updatedAt: Date.now() },
      { new: true } // return the updated organization
    );

    if (!updatedOrganization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    res.status(200).json({ success: true, organization: updatedOrganization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update organization logo" });
  }
};

// ==================== TEMPLATE SETTINGS FUNCTIONS ====================

/**
 * @swagger
 * /api/organizations/template-settings:
 *   get:
 *     summary: Get organization template settings
 *     description: Retrieves the organization's template customization settings for invoices and receipts
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
 *                   description: Organization template settings
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
      return res.status(401).json({ success: false, message: 'User not associated with any organization' });
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }
    res.status(200).json({ success: true, data: organization.organizationTemplateSettings || {} });
  } catch (error) {
    console.error('Error fetching template settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch template settings' });
  }
};

/**
 * @swagger
 * /api/organizations/template-settings:
 *   put:
 *     summary: Update organization template settings
 *     description: Updates the organization's template customization settings for invoices and receipts
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
 *               receiptTemplate:
 *                 type: object
 *                 description: Receipt template customization settings
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
      return res.status(401).json({ success: false, message: 'User not associated with any organization' });
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }
    if (invoiceTemplate) {
      organization.organizationTemplateSettings.invoiceTemplate = invoiceTemplate;
    }
    if (receiptTemplate) {
      organization.organizationTemplateSettings.receiptTemplate = receiptTemplate;
    }
    await organization.save();
    res.status(200).json({ success: true, message: 'Template settings updated successfully', data: organization.organizationTemplateSettings });
  } catch (error) {
    console.error('Error updating template settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update template settings' });
  }
};

/**
 * @swagger
 * /api/organizations/stores:
 *   get:
 *     summary: Get organization's stores for template selector
 *     description: Retrieves all stores belonging to the organization for use in template customization
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
 *     description: Resets all organization template customizations to default values
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
      return res.status(401).json({ success: false, message: 'User not associated with any organization' });
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }
    organization.organizationTemplateSettings = {}; // Reset to empty object
    await organization.save();
    res.status(200).json({ success: true, message: 'Template settings reset successfully', data: {} });
  } catch (error) {
    console.error('Error resetting template settings:', error);
    res.status(500).json({ success: false, message: 'Failed to reset template settings' });
  }
};