const InvoiceTemplate = require('../models/InvoiceTemplate');
const ReceiptTemplate = require('../models/ReceiptTemplate');
const Organization = require('../models/organization');
const Store = require('../models/store');

/**
 * Service to merge base templates with organization customizations and data sources
 */

/**
 * Merge invoice template with organization customizations and data
 * @param {string} organizationId - Organization ID
 * @param {string} storeId - Store ID (optional)
 * @param {Object} orderData - Order data for customer and product info
 * @returns {Promise<Object>} - Merged template data
 */
exports.mergeInvoiceTemplate = async (organizationId, storeId = null, orderData = null) => {
  try {
    // Get organization and its template settings
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Get organization's default invoice template
    const defaultTemplateId = organization.invoiceSettings?.defaultInvoiceTemplate;
    if (!defaultTemplateId) {
      throw new Error('No default invoice template found for organization');
    }

    // Get base template
    const baseTemplate = await InvoiceTemplate.findById(defaultTemplateId);
    if (!baseTemplate) {
      throw new Error('Base invoice template not found');
    }

    // Get organization's customizations
    const customizations = organization.organizationTemplateSettings?.invoiceTemplate || {};

    // Get store data if storeId provided
    let storeData = null;
    if (storeId) {
      const store = await Store.findById(storeId);
      if (store) {
        storeData = {
          name: store.name,
          website: store.url,
          logo: store.websiteLogo
        };
      }
    }

    // Merge template with customizations and data
    const mergedTemplate = {
      // Base template data
      ...baseTemplate.toObject(),
      
      // Override with organization customizations
      companyInfo: {
        // Use store data if available, otherwise use customizations
        name: storeData?.name || customizations.storeInfo?.name || baseTemplate.companyInfo?.name,
        email: customizations.email || baseTemplate.companyInfo?.email,
        phone: customizations.customFields?.phone || baseTemplate.companyInfo?.phone,
        website: storeData?.website || customizations.storeInfo?.website || baseTemplate.companyInfo?.website,
        logo: storeData?.logo || customizations.storeInfo?.logo || baseTemplate.companyInfo?.logo,
        address: customizations.customFields?.address || baseTemplate.companyInfo?.address
      },
      
      // Override design settings
      design: {
        ...baseTemplate.design,
        ...customizations.design
      },
      
      // Override layout settings
      layout: {
        ...baseTemplate.layout,
        ...customizations.layout
      }
    };

    // Add order data if provided
    if (orderData) {
      mergedTemplate.orderData = {
        customer: {
          name: `${orderData.billing?.first_name || ''} ${orderData.billing?.last_name || ''}`.trim(),
          email: orderData.billing?.email,
          address: {
            street: orderData.billing?.address_1,
            city: orderData.billing?.city,
            state: orderData.billing?.state,
            zipCode: orderData.billing?.postcode,
            country: orderData.billing?.country
          }
        },
        items: orderData.line_items?.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: parseFloat(item.price),
          total: parseFloat(item.total)
        })) || [],
        totals: {
          subtotal: parseFloat(orderData.total) - parseFloat(orderData.total_tax || 0),
          tax: parseFloat(orderData.total_tax || 0),
          discount: parseFloat(orderData.discount_total || 0),
          total: parseFloat(orderData.total)
        }
      };
    }

    return mergedTemplate;
  } catch (error) {
    console.error('Error merging invoice template:', error);
    throw error;
  }
};

/**
 * Merge receipt template with organization customizations and data
 * @param {string} organizationId - Organization ID
 * @param {string} storeId - Store ID (optional)
 * @param {Object} orderData - Order data for customer and product info
 * @returns {Promise<Object>} - Merged template data
 */
exports.mergeReceiptTemplate = async (organizationId, storeId = null, orderData = null) => {
  try {
    // Get organization and its template settings
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Get organization's default receipt template
    const defaultTemplateId = organization.receiptSettings?.defaultOrderTemplate;
    if (!defaultTemplateId) {
      throw new Error('No default receipt template found for organization');
    }

    // Get base template
    const baseTemplate = await ReceiptTemplate.findById(defaultTemplateId);
    if (!baseTemplate) {
      throw new Error('Base receipt template not found');
    }

    // Get organization's customizations
    const customizations = organization.organizationTemplateSettings?.receiptTemplate || {};

    // Get store data if storeId provided
    let storeData = null;
    if (storeId) {
      const store = await Store.findById(storeId);
      if (store) {
        storeData = {
          name: store.name,
          website: store.url,
          logo: store.websiteLogo
        };
      }
    }

    // Merge template with customizations and data
    const mergedTemplate = {
      // Base template data
      ...baseTemplate.toObject(),
      
      // Override with organization customizations
      companyInfo: {
        // Use store data if available, otherwise use customizations
        name: storeData?.name || customizations.storeInfo?.name || baseTemplate.companyInfo?.name,
        email: customizations.email || baseTemplate.companyInfo?.email,
        phone: customizations.customFields?.phone || baseTemplate.companyInfo?.phone,
        website: storeData?.website || customizations.storeInfo?.website || baseTemplate.companyInfo?.website,
        logo: storeData?.logo || customizations.storeInfo?.logo || baseTemplate.companyInfo?.logo,
        address: customizations.customFields?.address || baseTemplate.companyInfo?.address
      },
      
      // Override design settings
      design: {
        ...baseTemplate.design,
        ...customizations.design
      },
      
      // Override layout settings
      layout: {
        ...baseTemplate.layout,
        ...customizations.layout
      }
    };

    // Add order data if provided
    if (orderData) {
      mergedTemplate.orderData = {
        customer: {
          name: `${orderData.billing?.first_name || ''} ${orderData.billing?.last_name || ''}`.trim(),
          email: orderData.billing?.email,
          address: {
            street: orderData.billing?.address_1,
            city: orderData.billing?.city,
            state: orderData.billing?.state,
            zipCode: orderData.billing?.postcode,
            country: orderData.billing?.country
          }
        },
        items: orderData.line_items?.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: parseFloat(item.price),
          total: parseFloat(item.total)
        })) || [],
        totals: {
          subtotal: parseFloat(orderData.total) - parseFloat(orderData.total_tax || 0),
          tax: parseFloat(orderData.total_tax || 0),
          discount: parseFloat(orderData.discount_total || 0),
          total: parseFloat(orderData.total)
        }
      };
    }

    return mergedTemplate;
  } catch (error) {
    console.error('Error merging receipt template:', error);
    throw error;
  }
};

/**
 * Get merged company info for invoice/receipt generation
 * @param {string} organizationId - Organization ID
 * @param {string} storeId - Store ID (optional)
 * @param {string} templateType - 'invoice' or 'receipt'
 * @returns {Promise<Object>} - Merged company info
 */
exports.getMergedCompanyInfo = async (organizationId, storeId = null, templateType = 'invoice') => {
  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const customizations = organization.organizationTemplateSettings?.[`${templateType}Template`] || {};

    // Get store data if storeId provided
    let storeData = null;
    if (storeId) {
      const store = await Store.findById(storeId);
      if (store) {
        storeData = {
          name: store.name,
          website: store.url,
          logo: store.websiteLogo
        };
      }
    }

    // Return merged company info
    return {
      name: storeData?.name || customizations.storeInfo?.name,
      email: customizations.email,
      phone: customizations.customFields?.phone,
      website: storeData?.website || customizations.storeInfo?.website,
      logo: storeData?.logo || customizations.storeInfo?.logo,
      address: customizations.customFields?.address
    };
  } catch (error) {
    console.error('Error getting merged company info:', error);
    throw error;
  }
};
