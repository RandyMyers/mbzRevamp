const InvoiceTemplate = require('../models/InvoiceTemplate');
const ReceiptTemplate = require('../models/ReceiptTemplate');
const Organization = require('../models/organization');
const Store = require('../models/store');

/**
 * Service to merge base templates with organization-specific customizations and dynamic data.
 */

/**
 * Merges company information from organization settings and selected store data.
 * @param {Object} organizationSettings - The organization's template customization settings.
 * @param {Object} storeData - The selected store's data (name, website, logo).
 * @returns {Object} Merged company information.
 */
exports.getMergedCompanyInfo = (organizationSettings, storeData) => {
  const companyInfo = {
    name: storeData?.name || organizationSettings?.storeInfo?.name || '',
    email: organizationSettings?.email || '',
    phone: organizationSettings?.customFields?.phone || '',
    website: storeData?.website || organizationSettings?.storeInfo?.website || '',
    address: {
      street: organizationSettings?.customFields?.address?.street || '',
      city: organizationSettings?.customFields?.address?.city || '',
      state: organizationSettings?.customFields?.address?.state || '',
      zipCode: organizationSettings?.customFields?.address?.zipCode || '',
      country: organizationSettings?.customFields?.address?.country || ''
    },
    logo: storeData?.logo || organizationSettings?.storeInfo?.logo || ''
  };
  return companyInfo;
};

/**
 * Merges a base invoice template with organization-specific customizations and order data.
 * @param {Object} baseTemplate - The base InvoiceTemplate document.
 * @param {Object} organizationSettings - The organization's template customization settings.
 * @param {Object} storeData - The selected store's data.
 * @param {Object} orderData - The WooCommerce order data.
 * @returns {Object} Merged invoice data ready for generation.
 */
exports.mergeInvoiceTemplate = (baseTemplate, organizationSettings, storeData, orderData) => {
  const mergedCompanyInfo = exports.getMergedCompanyInfo(organizationSettings.invoiceTemplate, storeData);

  // Merge design and layout from organization settings, falling back to base template
  const design = {
    ...baseTemplate.design,
    ...organizationSettings.invoiceTemplate?.design
  };
  const layout = {
    ...baseTemplate.layout,
    ...organizationSettings.invoiceTemplate?.layout
  };

  return {
    templateId: baseTemplate._id,
    companyInfo: mergedCompanyInfo,
    design,
    layout,
    // Customer info from order
    customerName: `${orderData.billing?.first_name || ''} ${orderData.billing?.last_name || ''}`.trim(),
    customerEmail: orderData.billing?.email || '',
    customerAddress: {
      street: orderData.billing?.address_1 || '',
      city: orderData.billing?.city || '',
      state: orderData.billing?.state || '',
      zipCode: orderData.billing?.postcode || '',
      country: orderData.billing?.country || ''
    },
    // Items from order
    items: orderData.line_items?.map(item => ({
      name: item.name,
      description: item.meta_data?.find(m => m.key === 'description')?.value || '',
      quantity: item.quantity,
      unitPrice: parseFloat(item.price),
      totalPrice: parseFloat(item.total),
      taxRate: 0 // Assuming tax rate is not per item in order, or needs calculation
    })) || [],
    // Amounts from order
    subtotal: parseFloat(orderData.total) - parseFloat(orderData.total_tax || 0),
    taxAmount: parseFloat(orderData.total_tax || 0),
    discountAmount: parseFloat(orderData.discount_total || 0),
    totalAmount: parseFloat(orderData.total),
    currency: orderData.currency || 'USD',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
    notes: orderData.customer_note || '',
    terms: 'Net 30', // Default terms
    type: 'one_time', // Default type
  };
};

/**
 * Merges a base receipt template with organization-specific customizations and order data.
 * @param {Object} baseTemplate - The base ReceiptTemplate document.
 * @param {Object} organizationSettings - The organization's template customization settings.
 * @param {Object} storeData - The selected store's data.
 * @param {Object} orderData - The WooCommerce order data.
 * @returns {Object} Merged receipt data ready for generation.
 */
exports.mergeReceiptTemplate = (baseTemplate, organizationSettings, storeData, orderData) => {
  const mergedCompanyInfo = exports.getMergedCompanyInfo(organizationSettings.receiptTemplate, storeData);

  // Merge design and layout from organization settings, falling back to base template
  const design = {
    ...baseTemplate.design,
    ...organizationSettings.receiptTemplate?.design
  };
  const layout = {
    ...baseTemplate.layout,
    ...organizationSettings.receiptTemplate?.layout
  };

  return {
    templateId: baseTemplate._id,
    companyInfo: mergedCompanyInfo,
    design,
    layout,
    // Customer info from order
    customerName: `${orderData.billing?.first_name || ''} ${orderData.billing?.last_name || ''}`.trim(),
    customerEmail: orderData.billing?.email || '',
    customerAddress: {
      street: orderData.billing?.address_1 || '',
      city: orderData.billing?.city || '',
      state: orderData.billing?.state || '',
      zipCode: orderData.billing?.postcode || '',
      country: orderData.billing?.country || ''
    },
    // Items from order
    items: orderData.line_items?.map(item => ({
      name: item.name,
      description: item.meta_data?.find(m => m.key === 'description')?.value || '',
      quantity: item.quantity,
      unitPrice: parseFloat(item.price),
      totalPrice: parseFloat(item.total),
      taxRate: 0
    })) || [],
    // Amounts from order
    subtotal: parseFloat(orderData.total) - parseFloat(orderData.total_tax || 0),
    taxAmount: parseFloat(orderData.total_tax || 0),
    discountAmount: parseFloat(orderData.discount_total || 0),
    totalAmount: parseFloat(orderData.total),
    currency: orderData.currency || 'USD',
    paymentMethod: orderData.payment_method_title || 'Credit Card',
    transactionId: orderData.transaction_id || '',
    transactionDate: orderData.date_created || new Date(),
    description: orderData.customer_note || '',
    type: 'purchase',
  };
};

/**
 * Gets merged company info for invoice/receipt generation
 * @param {string} organizationId - Organization ID
 * @param {string} storeId - Store ID (optional)
 * @param {string} templateType - 'invoice' or 'receipt'
 * @returns {Object} Merged company information
 */
exports.getMergedCompanyInfoForGeneration = async (organizationId, storeId, templateType) => {
  try {
    // Get organization with template settings
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

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

    // Get organization template settings
    const organizationSettings = organization.organizationTemplateSettings || {};
    const templateSettings = organizationSettings[`${templateType}Template`] || {};

    // Merge company info
    const mergedCompanyInfo = exports.getMergedCompanyInfo(templateSettings, storeData);

    return mergedCompanyInfo;
  } catch (error) {
    console.error('Error getting merged company info:', error);
    // Return empty company info as fallback
    return {
      name: '',
      email: '',
      phone: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      logo: ''
    };
  }
};