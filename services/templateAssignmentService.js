const InvoiceTemplate = require('../models/InvoiceTemplate');
const ReceiptTemplate = require('../models/ReceiptTemplate');
const Organization = require('../models/organization');

/**
 * Service to handle default template assignment for organizations
 */

/**
 * Assign default templates to a new organization
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Object>} - Result with assigned templates
 */
exports.assignDefaultTemplates = async (organizationId) => {
  try {
    console.log(`🔧 [TEMPLATE ASSIGNMENT] Assigning default templates for organization: ${organizationId}`);

    // Find the organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Get default system templates
    const defaultInvoiceTemplate = await InvoiceTemplate.findOne({ 
      isSystemDefault: true, 
      isActive: true 
    }).sort({ createdAt: 1 }); // Get the first system default

    const defaultReceiptTemplate = await ReceiptTemplate.findOne({ 
      isSystemDefault: true, 
      isActive: true 
    }).sort({ createdAt: 1 }); // Get the first system default

    // Update organization with default templates
    const updateData = {};

    if (defaultInvoiceTemplate) {
      updateData['invoiceSettings.defaultInvoiceTemplate'] = defaultInvoiceTemplate._id;
      updateData['invoiceSettings.autoGenerateInvoices'] = true;
      console.log(`✅ [TEMPLATE ASSIGNMENT] Assigned invoice template: ${defaultInvoiceTemplate.name}`);
    } else {
      console.warn('⚠️ [TEMPLATE ASSIGNMENT] No default invoice template found');
    }

    if (defaultReceiptTemplate) {
      updateData['receiptSettings.defaultOrderTemplate'] = defaultReceiptTemplate._id;
      updateData['receiptSettings.defaultSubscriptionTemplate'] = defaultReceiptTemplate._id;
      updateData['receiptSettings.autoGenerateOrderReceipts'] = true;
      updateData['receiptSettings.autoGenerateSubscriptionReceipts'] = true;
      console.log(`✅ [TEMPLATE ASSIGNMENT] Assigned receipt template: ${defaultReceiptTemplate.name}`);
    } else {
      console.warn('⚠️ [TEMPLATE ASSIGNMENT] No default receipt template found');
    }

    // Update the organization
    await Organization.findByIdAndUpdate(organizationId, updateData);

    console.log(`✅ [TEMPLATE ASSIGNMENT] Successfully assigned default templates for organization: ${organizationId}`);

    return {
      success: true,
      organizationId,
      assignedTemplates: {
        invoice: defaultInvoiceTemplate ? {
          id: defaultInvoiceTemplate._id,
          name: defaultInvoiceTemplate.name
        } : null,
        receipt: defaultReceiptTemplate ? {
          id: defaultReceiptTemplate._id,
          name: defaultReceiptTemplate.name
        } : null
      }
    };

  } catch (error) {
    console.error('❌ [TEMPLATE ASSIGNMENT] Error assigning default templates:', error);
    throw error;
  }
};

/**
 * Set default invoice template for an organization
 * @param {string} organizationId - The organization ID
 * @param {string} templateId - The template ID to set as default
 * @returns {Promise<Object>} - Result of the operation
 */
exports.setDefaultInvoiceTemplate = async (organizationId, templateId) => {
  try {
    // Verify template exists and is active
    const template = await InvoiceTemplate.findById(templateId);
    if (!template || !template.isActive) {
      throw new Error('Template not found or inactive');
    }

    // Update organization
    await Organization.findByIdAndUpdate(organizationId, {
      'invoiceSettings.defaultInvoiceTemplate': templateId
    });

    return {
      success: true,
      message: 'Default invoice template updated successfully',
      template: {
        id: template._id,
        name: template.name
      }
    };

  } catch (error) {
    console.error('❌ [TEMPLATE ASSIGNMENT] Error setting default invoice template:', error);
    throw error;
  }
};

/**
 * Set default receipt template for an organization
 * @param {string} organizationId - The organization ID
 * @param {string} templateId - The template ID to set as default
 * @param {string} type - Template type ('order' or 'subscription')
 * @returns {Promise<Object>} - Result of the operation
 */
exports.setDefaultReceiptTemplate = async (organizationId, templateId, type = 'order') => {
  try {
    // Verify template exists and is active
    const template = await ReceiptTemplate.findById(templateId);
    if (!template || !template.isActive) {
      throw new Error('Template not found or inactive');
    }

    // Update organization based on type
    const updateField = type === 'subscription' 
      ? 'receiptSettings.defaultSubscriptionTemplate'
      : 'receiptSettings.defaultOrderTemplate';

    await Organization.findByIdAndUpdate(organizationId, {
      [updateField]: templateId
    });

    return {
      success: true,
      message: `Default ${type} receipt template updated successfully`,
      template: {
        id: template._id,
        name: template.name
      }
    };

  } catch (error) {
    console.error('❌ [TEMPLATE ASSIGNMENT] Error setting default receipt template:', error);
    throw error;
  }
};

/**
 * Get default templates for an organization
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Object>} - Organization's default templates
 */
exports.getDefaultTemplates = async (organizationId) => {
  try {
    const organization = await Organization.findById(organizationId)
      .populate('invoiceSettings.defaultInvoiceTemplate', 'name templateType isActive')
      .populate('receiptSettings.defaultOrderTemplate', 'name templateType isActive')
      .populate('receiptSettings.defaultSubscriptionTemplate', 'name templateType isActive');

    if (!organization) {
      throw new Error('Organization not found');
    }

    return {
      success: true,
      organizationId,
      templates: {
        invoice: organization.invoiceSettings?.defaultInvoiceTemplate || null,
        receipt: {
          order: organization.receiptSettings?.defaultOrderTemplate || null,
          subscription: organization.receiptSettings?.defaultSubscriptionTemplate || null
        }
      },
      settings: {
        invoice: organization.invoiceSettings || {},
        receipt: organization.receiptSettings || {}
      }
    };

  } catch (error) {
    console.error('❌ [TEMPLATE ASSIGNMENT] Error getting default templates:', error);
    throw error;
  }
};

/**
 * Create system default templates if they don't exist
 * @returns {Promise<Object>} - Result of template creation
 */
exports.createSystemDefaultTemplates = async () => {
  try {
    console.log('🔧 [TEMPLATE ASSIGNMENT] Creating system default templates...');

    // Check if system defaults already exist
    const existingInvoiceDefault = await InvoiceTemplate.findOne({ isSystemDefault: true });
    const existingReceiptDefault = await ReceiptTemplate.findOne({ isSystemDefault: true });

    const results = {};

    // Create default invoice template if none exists
    if (!existingInvoiceDefault) {
      const defaultInvoiceTemplate = new InvoiceTemplate({
        name: 'Professional Invoice',
        templateType: 'professional',
        isSystemDefault: true,
        isDefault: true,
        isActive: true,
        companyInfo: {
          name: 'Your Company Name',
          email: 'billing@yourcompany.com',
          phone: '+1 (555) 123-4567',
          address: {
            street: '123 Business Street',
            city: 'Your City',
            state: 'Your State',
            zipCode: '12345',
            country: 'Your Country'
          }
        },
        design: {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          backgroundColor: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: 12,
          headerFontSize: 18,
          footerFontSize: 10
        },
        layout: {
          showLogo: true,
          logoPosition: 'top-left',
          showCompanyInfo: true,
          showCustomerInfo: true,
          showItemsTable: true,
          showTotals: true,
          showTerms: true,
          showNotes: true,
          showFooter: true
        },
        content: {
          headerText: 'INVOICE',
          footerText: 'Thank you for your business!',
          defaultTerms: 'Payment is due within 30 days.',
          defaultNotes: 'Please contact us if you have any questions.',
          currencySymbol: '$',
          dateFormat: 'MM/DD/YYYY'
        }
      });

      await defaultInvoiceTemplate.save();
      results.invoice = defaultInvoiceTemplate._id;
      console.log('✅ [TEMPLATE ASSIGNMENT] Created default invoice template');
    } else {
      results.invoice = existingInvoiceDefault._id;
      console.log('✅ [TEMPLATE ASSIGNMENT] Default invoice template already exists');
    }

    // Create default receipt template if none exists
    if (!existingReceiptDefault) {
      const defaultReceiptTemplate = new ReceiptTemplate({
        name: 'Professional Receipt',
        templateType: 'professional',
        isSystemDefault: true,
        isDefault: true,
        isActive: true,
        scenario: 'universal',
        companyInfo: {
          name: 'Your Company Name',
          email: 'billing@yourcompany.com',
          phone: '+1 (555) 123-4567',
          address: {
            street: '123 Business Street',
            city: 'Your City',
            state: 'Your State',
            zipCode: '12345',
            country: 'Your Country'
          }
        },
        design: {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          backgroundColor: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: 12,
          headerFontSize: 18,
          footerFontSize: 10
        },
        layout: {
          showLogo: true,
          logoPosition: 'top-left',
          showCompanyInfo: true,
          showCustomerInfo: true,
          showItemsTable: true,
          showTotals: true,
          showTerms: true,
          showNotes: true,
          showFooter: true
        },
        content: {
          headerText: 'RECEIPT',
          footerText: 'Thank you for your purchase!',
          defaultTerms: 'This receipt serves as proof of payment.',
          defaultNotes: 'Please keep this receipt for your records.',
          currencySymbol: '$',
          dateFormat: 'MM/DD/YYYY'
        }
      });

      await defaultReceiptTemplate.save();
      results.receipt = defaultReceiptTemplate._id;
      console.log('✅ [TEMPLATE ASSIGNMENT] Created default receipt template');
    } else {
      results.receipt = existingReceiptDefault._id;
      console.log('✅ [TEMPLATE ASSIGNMENT] Default receipt template already exists');
    }

    return {
      success: true,
      message: 'System default templates ready',
      templates: results
    };

  } catch (error) {
    console.error('❌ [TEMPLATE ASSIGNMENT] Error creating system default templates:', error);
    throw error;
  }
};
