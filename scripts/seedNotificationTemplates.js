const NotificationTemplate = require('../models/notificationTemplates');
const mongoose = require('mongoose');

const notificationTemplates = [
  // Customer Templates
  {
    templateName: "new_customer_registration",
    subject: "New Customer Registration - {{customerName}}",
    body: "A new customer has registered: {{customerName}} ({{customerEmail}}). Customer ID: {{customerId}}",
    type: "system",
    triggerEvent: "custom",
    variables: {
      customerName: "string",
      customerEmail: "string", 
      customerId: "string"
    },
    isActive: true
  },
  {
    templateName: "customer_updated",
    subject: "Customer Profile Updated - {{customerName}}",
    body: "Customer profile has been updated: {{customerName}}. Changes: {{changes}}",
    type: "system",
    triggerEvent: "custom",
    variables: {
      customerName: "string",
      changes: "string"
    },
    isActive: true
  },
  
  // Inventory Templates
  {
    templateName: "new_product_added",
    subject: "New Product Added - {{productName}}",
    body: "A new product has been added to inventory: {{productName}} (SKU: {{productSku}}). Price: {{productPrice}}",
    type: "system",
    triggerEvent: "custom",
    variables: {
      productName: "string",
      productSku: "string",
      productPrice: "string"
    },
    isActive: true
  },
  {
    templateName: "low_inventory_alert",
    subject: "Low Inventory Alert - {{productName}}",
    body: "Product {{productName}} (SKU: {{productSku}}) is running low on stock. Current quantity: {{currentQuantity}}. Threshold: {{threshold}}",
    type: "system",
    triggerEvent: "custom",
    variables: {
      productName: "string",
      productSku: "string",
      currentQuantity: "number",
      threshold: "number"
    },
    isActive: true
  },
  {
    templateName: "out_of_stock_alert",
    subject: "Out of Stock Alert - {{productName}}",
    body: "Product {{productName}} (SKU: {{productSku}}) is now out of stock. Please restock immediately.",
    type: "system",
    triggerEvent: "custom",
    variables: {
      productName: "string",
      productSku: "string"
    },
    isActive: true
  },
  
  // Order Templates
  {
    templateName: "new_order_received",
    subject: "New Order Received - #{{orderNumber}}",
    body: "A new order has been received: Order #{{orderNumber}} from {{customerName}}. Total: {{orderTotal}} {{currency}}",
    type: "system",
    triggerEvent: "custom",
    variables: {
      orderNumber: "string",
      customerName: "string",
      orderTotal: "string",
      currency: "string"
    },
    isActive: true
  },
  {
    templateName: "order_status_updated",
    subject: "Order Status Updated - #{{orderNumber}}",
    body: "Order #{{orderNumber}} status has been updated from {{oldStatus}} to {{newStatus}}",
    type: "system",
    triggerEvent: "custom",
    variables: {
      orderNumber: "string",
      oldStatus: "string",
      newStatus: "string"
    },
    isActive: true
  },
  {
    templateName: "order_cancelled",
    subject: "Order Cancelled - #{{orderNumber}}",
    body: "Order #{{orderNumber}} has been cancelled. Customer: {{customerName}}. Refund amount: {{refundAmount}}",
    type: "system",
    triggerEvent: "custom",
    variables: {
      orderNumber: "string",
      customerName: "string",
      refundAmount: "string"
    },
    isActive: true
  },
  
  // System Templates
  {
    templateName: "woocommerce_sync_success",
    subject: "WooCommerce Sync Successful - {{entityType}}",
    body: "WooCommerce sync completed successfully for {{entityType}}: {{entityName}}. Sync time: {{syncTime}}",
    type: "system",
    triggerEvent: "custom",
    variables: {
      entityType: "string",
      entityName: "string",
      syncTime: "string"
    },
    isActive: true
  },
  {
    templateName: "woocommerce_sync_failed",
    subject: "WooCommerce Sync Failed - {{entityType}}",
    body: "WooCommerce sync failed for {{entityType}}: {{entityName}}. Error: {{errorMessage}}",
    type: "system",
    triggerEvent: "custom",
    variables: {
      entityType: "string",
      entityName: "string",
      errorMessage: "string"
    },
    isActive: true
  }
];

const seedNotificationTemplates = async () => {
  try {
    console.log('🌱 Seeding notification templates...');
    
    for (const template of notificationTemplates) {
      const existingTemplate = await NotificationTemplate.findOne({ 
        templateName: template.templateName 
      });
      
      if (!existingTemplate) {
        await NotificationTemplate.create({
          ...template,
          createdBy: new mongoose.Types.ObjectId() // System user
        });
        console.log(`✅ Created template: ${template.templateName}`);
      } else {
        console.log(`⏭️ Template already exists: ${template.templateName}`);
      }
    }
    
    console.log('🎉 Notification templates seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding notification templates:', error);
  }
};

module.exports = { seedNotificationTemplates };