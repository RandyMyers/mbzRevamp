const { createAndSendNotification, createNotificationFromTemplate } = require('../services/notificationService');
const NotificationTemplate = require('../models/notificationTemplates');
const User = require('../models/users');

// Get organization admin users
const getOrganizationAdmins = async (organizationId) => {
  try {
    const adminUsers = await User.find({
      organization: organizationId,
      role: { $in: ['admin', 'super-admin'] }
    }).select('_id email notificationSettings');
    
    return adminUsers;
  } catch (error) {
    console.error('Error getting organization admins:', error);
    return [];
  }
};

// Send notification to organization admins
const sendNotificationToAdmins = async (organizationId, notificationData) => {
  try {
    const adminUsers = await getOrganizationAdmins(organizationId);
    
    if (adminUsers.length === 0) {
      console.log('⚠️ No admin users found for organization:', organizationId);
      return { success: false, error: 'No admin users found' };
    }
    
    const results = [];
    for (const admin of adminUsers) {
      // Check if admin has notifications enabled for this category
      const category = getNotificationCategory(notificationData.type);
      const settings = admin.notificationSettings;
      
      if (settings && settings.system?.enabled && settings.system?.categories?.[category]) {
        const result = await createAndSendNotification({
          ...notificationData,
          userId: admin._id
        });
        results.push({ userId: admin._id, ...result });
      }
    }
    
    return {
      success: true,
      total: adminUsers.length,
      sent: results.length,
      results
    };
  } catch (error) {
    console.error('Error sending notification to admins:', error);
    return { success: false, error: error.message };
  }
};

// Get notification category from type
const getNotificationCategory = (type) => {
  const categoryMap = {
    'customer_registered': 'customers',
    'customer_updated': 'customers',
    'product_created': 'inventory',
    'inventory_low': 'inventory',
    'inventory_out': 'inventory',
    'order_created': 'orders',
    'order_updated': 'orders',
    'order_cancelled': 'orders',
    'woocommerce_sync_success': 'system',
    'woocommerce_sync_failed': 'system'
  };
  
  return categoryMap[type] || 'system';
};

// Send notification using template
const sendTemplateNotification = async (templateName, variables, organizationId, type = 'system') => {
  try {
    const template = await NotificationTemplate.findOne({ 
      templateName, 
      isActive: true 
    });
    
    if (!template) {
      console.error(`❌ Template not found: ${templateName}`);
      return { success: false, error: 'Template not found' };
    }
    
    const adminUsers = await getOrganizationAdmins(organizationId);
    
    if (adminUsers.length === 0) {
      return { success: false, error: 'No admin users found' };
    }
    
    const results = [];
    for (const admin of adminUsers) {
      const result = await createNotificationFromTemplate(
        template._id,
        admin._id,
        variables
      );
      results.push({ userId: admin._id, ...result });
    }
    
    return {
      success: true,
      templateName,
      total: adminUsers.length,
      sent: results.length,
      results
    };
  } catch (error) {
    console.error('Error sending template notification:', error);
    return { success: false, error: error.message };
  }
};

// Customer notification functions
const notifyCustomerRegistered = async (customer, organizationId) => {
  const variables = {
    customerName: `${customer.first_name} ${customer.last_name}`,
    customerEmail: customer.email,
    customerId: customer.customer_id || customer._id
  };
  
  return await sendTemplateNotification(
    'new_customer_registration',
    variables,
    organizationId,
    'customer_registered'
  );
};

const notifyCustomerUpdated = async (customer, changes, organizationId) => {
  const variables = {
    customerName: `${customer.first_name} ${customer.last_name}`,
    changes: changes.join(', ')
  };
  
  return await sendTemplateNotification(
    'customer_updated',
    variables,
    organizationId,
    'customer_updated'
  );
};

// Inventory notification functions
const notifyProductCreated = async (product, organizationId) => {
  const variables = {
    productName: product.name,
    productSku: product.sku,
    productPrice: `$${product.price || product.regular_price || 0}`
  };
  
  return await sendTemplateNotification(
    'new_product_added',
    variables,
    organizationId,
    'product_created'
  );
};

const notifyLowInventory = async (product, currentQuantity, threshold = 10, organizationId) => {
  const variables = {
    productName: product.name,
    productSku: product.sku,
    currentQuantity: currentQuantity.toString(),
    threshold: threshold.toString()
  };
  
  return await sendTemplateNotification(
    'low_inventory_alert',
    variables,
    organizationId,
    'inventory_low'
  );
};

const notifyOutOfStock = async (product, organizationId) => {
  const variables = {
    productName: product.name,
    productSku: product.sku
  };
  
  return await sendTemplateNotification(
    'out_of_stock_alert',
    variables,
    organizationId,
    'inventory_out'
  );
};

// Order notification functions
const notifyOrderCreated = async (order, customer, organizationId) => {
  const variables = {
    orderNumber: order.number || order.order_id,
    customerName: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown',
    orderTotal: `$${order.total || 0}`,
    currency: order.currency || 'USD'
  };
  
  return await sendTemplateNotification(
    'new_order_received',
    variables,
    organizationId,
    'order_created'
  );
};

const notifyOrderStatusUpdated = async (order, oldStatus, newStatus, organizationId) => {
  const variables = {
    orderNumber: order.number || order.order_id,
    oldStatus: oldStatus,
    newStatus: newStatus
  };
  
  return await sendTemplateNotification(
    'order_status_updated',
    variables,
    organizationId,
    'order_updated'
  );
};

const notifyOrderCancelled = async (order, customer, refundAmount, organizationId) => {
  const variables = {
    orderNumber: order.number || order.order_id,
    customerName: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown',
    refundAmount: `$${refundAmount || 0}`
  };
  
  return await sendTemplateNotification(
    'order_cancelled',
    variables,
    organizationId,
    'order_cancelled'
  );
};

// WooCommerce sync notification functions
const notifyWooCommerceSyncSuccess = async (entityType, entityName, organizationId) => {
  const variables = {
    entityType: entityType,
    entityName: entityName,
    syncTime: new Date().toLocaleString()
  };
  
  return await sendTemplateNotification(
    'woocommerce_sync_success',
    variables,
    organizationId,
    'woocommerce_sync_success'
  );
};

const notifyWooCommerceSyncFailed = async (entityType, entityName, errorMessage, organizationId) => {
  const variables = {
    entityType: entityType,
    entityName: entityName,
    errorMessage: errorMessage
  };
  
  return await sendTemplateNotification(
    'woocommerce_sync_failed',
    variables,
    organizationId,
    'woocommerce_sync_failed'
  );
};

module.exports = {
  getOrganizationAdmins,
  sendNotificationToAdmins,
  getNotificationCategory,
  sendTemplateNotification,
  notifyCustomerRegistered,
  notifyCustomerUpdated,
  notifyProductCreated,
  notifyLowInventory,
  notifyOutOfStock,
  notifyOrderCreated,
  notifyOrderStatusUpdated,
  notifyOrderCancelled,
  notifyWooCommerceSyncSuccess,
  notifyWooCommerceSyncFailed
};