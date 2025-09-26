const mongoose = require('mongoose');
const ReceiptTemplate = require('../models/ReceiptTemplate');
require('dotenv').config();

// Subscription receipt templates (duplicates of existing templates with subscription-specific fields)
const subscriptionReceiptTemplates = [
  {
    name: "Professional Subscription Receipt",
    description: "Corporate elegance with structured layout for subscription payments",
    templateType: "professional",
    scenario: "subscription_payment",
    isSystemDefault: true,
    isActive: true,
    design: {
      primaryColor: "#2563eb",
      secondaryColor: "#1e40af",
      backgroundColor: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontSize: 12,
      headerFontSize: 18,
      footerFontSize: 10
    },
    layout: {
      showLogo: true,
      logoPosition: "top-left",
      showCompanyInfo: true,
      showCustomerInfo: false, // Changed for subscription
      showItemsTable: false, // Changed for subscription
      showTotals: true,
      showPaymentInfo: true,
      showFooter: true
    },
    content: {
      headerText: "SUBSCRIPTION RECEIPT",
      footerText: "Thank you for your subscription!",
      thankYouMessage: "Thank you for your subscription payment!",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showReceiptNumber: true,
      showTransactionDate: true,
      showCustomerAddress: false, // Changed for subscription
      showCustomerEmail: false, // Changed for subscription
      showCustomerPhone: false, // Changed for subscription
      showItemDescription: false, // Changed for subscription
      showItemQuantity: false, // Changed for subscription
      showItemUnitPrice: false, // Changed for subscription
      showItemTotal: false, // Changed for subscription
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true,
      showPaymentMethod: true,
      showTransactionId: true,
      // New subscription-specific fields
      showSubscriptionId: true,
      showPlanName: true,
      showBillingInterval: true,
      showOrganizationName: true,
      showRenewalDate: true
    },
    templateStyles: {
      containerClass: "bg-white border-l-4 border-blue-600",
      headerClass: "bg-slate-50 border-b border-slate-200 p-6 -m-8 mb-8",
      textColor: "text-slate-800",
      accentColor: "#2563eb",
      tableClass: "border border-slate-200",
      footerClass: "border-t border-slate-200 text-center mt-8 pt-4",
      typography: "font-medium"
    }
  },
  {
    name: "Minimal Subscription Receipt",
    description: "Clean lines with maximum white space for subscription payments",
    templateType: "minimal",
    scenario: "subscription_payment",
    isSystemDefault: true,
    isActive: true,
    design: {
      primaryColor: "#000000",
      secondaryColor: "#666666",
      backgroundColor: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontSize: 12,
      headerFontSize: 18,
      footerFontSize: 10
    },
    layout: {
      showLogo: true,
      logoPosition: "top-left",
      showCompanyInfo: true,
      showCustomerInfo: false,
      showItemsTable: false,
      showTotals: true,
      showPaymentInfo: true,
      showFooter: true
    },
    content: {
      headerText: "SUBSCRIPTION RECEIPT",
      footerText: "Thank you for your subscription!",
      thankYouMessage: "Thank you for your subscription payment!",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showReceiptNumber: true,
      showTransactionDate: true,
      showCustomerAddress: false,
      showCustomerEmail: false,
      showCustomerPhone: false,
      showItemDescription: false,
      showItemQuantity: false,
      showItemUnitPrice: false,
      showItemTotal: false,
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true,
      showPaymentMethod: true,
      showTransactionId: true,
      showSubscriptionId: true,
      showPlanName: true,
      showBillingInterval: true,
      showOrganizationName: true,
      showRenewalDate: true
    },
    templateStyles: {
      containerClass: "bg-white p-8 shadow-none border-0",
      headerClass: "bg-transparent border-0 p-0 mb-12",
      textColor: "text-gray-800",
      accentColor: "#000000",
      tableClass: "border-0",
      footerClass: "border-0 text-center mt-16",
      typography: "font-light"
    }
  },
  {
    name: "Modern Subscription Receipt",
    description: "Bold geometric design with vibrant colors for subscription payments",
    templateType: "modern",
    scenario: "subscription_payment",
    isSystemDefault: true,
    isActive: true,
    design: {
      primaryColor: "#8b5cf6",
      secondaryColor: "#ec4899",
      backgroundColor: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontSize: 12,
      headerFontSize: 20,
      footerFontSize: 10
    },
    layout: {
      showLogo: true,
      logoPosition: "top-left",
      showCompanyInfo: true,
      showCustomerInfo: false,
      showItemsTable: false,
      showTotals: true,
      showPaymentInfo: true,
      showFooter: true
    },
    content: {
      headerText: "SUBSCRIPTION RECEIPT",
      footerText: "Thank you for your subscription!",
      thankYouMessage: "Thank you for your subscription payment!",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showReceiptNumber: true,
      showTransactionDate: true,
      showCustomerAddress: false,
      showCustomerEmail: false,
      showCustomerPhone: false,
      showItemDescription: false,
      showItemQuantity: false,
      showItemUnitPrice: false,
      showItemTotal: false,
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true,
      showPaymentMethod: true,
      showTransactionId: true,
      showSubscriptionId: true,
      showPlanName: true,
      showBillingInterval: true,
      showOrganizationName: true,
      showRenewalDate: true
    },
    templateStyles: {
      containerClass: "bg-white overflow-hidden",
      headerClass: "bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 p-8 -m-8 mb-8 text-white",
      textColor: "text-gray-800",
      accentColor: "#8b5cf6",
      tableClass: "border-collapse",
      footerClass: "bg-gradient-to-r from-purple-100 to-pink-100 p-4 -mx-8 mt-8 text-center rounded-t-3xl",
      typography: "font-medium"
    }
  },
  {
    name: "Classic Subscription Receipt",
    description: "Traditional formal business document style for subscription payments",
    templateType: "classic",
    scenario: "subscription_payment",
    isSystemDefault: true,
    isActive: true,
    design: {
      primaryColor: "#d97706",
      secondaryColor: "#92400e",
      backgroundColor: "#fffbeb",
      fontFamily: "serif",
      fontSize: 12,
      headerFontSize: 18,
      footerFontSize: 10
    },
    layout: {
      showLogo: true,
      logoPosition: "top-left",
      showCompanyInfo: true,
      showCustomerInfo: false,
      showItemsTable: false,
      showTotals: true,
      showPaymentInfo: true,
      showFooter: true
    },
    content: {
      headerText: "SUBSCRIPTION RECEIPT",
      footerText: "Thank you for your subscription!",
      thankYouMessage: "Thank you for your subscription payment!",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showReceiptNumber: true,
      showTransactionDate: true,
      showCustomerAddress: false,
      showCustomerEmail: false,
      showCustomerPhone: false,
      showItemDescription: false,
      showItemQuantity: false,
      showItemUnitPrice: false,
      showItemTotal: false,
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true,
      showPaymentMethod: true,
      showTransactionId: true,
      showSubscriptionId: true,
      showPlanName: true,
      showBillingInterval: true,
      showOrganizationName: true,
      showRenewalDate: true
    },
    templateStyles: {
      containerClass: "bg-gradient-to-b from-amber-50 to-yellow-50 border-t-8 border-amber-600",
      headerClass: "bg-white border-2 border-amber-200 p-6 -m-8 mb-8 rounded-none",
      textColor: "text-amber-900",
      accentColor: "#d97706",
      tableClass: "border-2 border-amber-200",
      footerClass: "border-t-2 border-amber-200 text-center mt-8 pt-4",
      typography: "font-serif"
    }
  },
  {
    name: "Creative Subscription Receipt",
    description: "Artistic design with custom elements for subscription payments",
    templateType: "creative",
    scenario: "subscription_payment",
    isSystemDefault: true,
    isActive: true,
    design: {
      primaryColor: "#f97316",
      secondaryColor: "#ec4899",
      backgroundColor: "#fff7ed",
      fontFamily: "Arial, sans-serif",
      fontSize: 12,
      headerFontSize: 18,
      footerFontSize: 10
    },
    layout: {
      showLogo: true,
      logoPosition: "top-left",
      showCompanyInfo: true,
      showCustomerInfo: false,
      showItemsTable: false,
      showTotals: true,
      showPaymentInfo: true,
      showFooter: true
    },
    content: {
      headerText: "SUBSCRIPTION RECEIPT",
      footerText: "Thank you for your subscription!",
      thankYouMessage: "Thank you for your subscription payment!",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showReceiptNumber: true,
      showTransactionDate: true,
      showCustomerAddress: false,
      showCustomerEmail: false,
      showCustomerPhone: false,
      showItemDescription: false,
      showItemQuantity: false,
      showItemUnitPrice: false,
      showItemTotal: false,
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true,
      showPaymentMethod: true,
      showTransactionId: true,
      showSubscriptionId: true,
      showPlanName: true,
      showBillingInterval: true,
      showOrganizationName: true,
      showRenewalDate: true
    },
    templateStyles: {
      containerClass: "bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50",
      headerClass: "bg-white border-2 border-dashed border-orange-400 p-6 -m-8 mb-8 rounded-2xl transform -rotate-1",
      textColor: "text-purple-800",
      accentColor: "#f97316",
      tableClass: "border-2 border-dashed border-purple-300 rounded-xl",
      footerClass: "bg-white border-2 border-dashed border-pink-300 p-4 -mx-8 mt-8 rounded-2xl transform rotate-1",
      typography: "font-medium"
    }
  }
];

async function migrateReceiptTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || 'mongodb+srv://Shop:0GY73Ol6FSHR6Re3@cluster0.tsz9xe5.mongodb.net/MBZCRM?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');

    // Update existing templates to woocommerce_order scenario
    const updateResult = await ReceiptTemplate.updateMany(
      { isSystemDefault: true, scenario: { $exists: false } },
      { $set: { scenario: 'woocommerce_order' } }
    );
    console.log(`Updated ${updateResult.modifiedCount} existing templates to woocommerce_order scenario`);

    // Clear existing subscription templates
    await ReceiptTemplate.deleteMany({ 
      isSystemDefault: true, 
      scenario: 'subscription_payment' 
    });
    console.log('Cleared existing subscription templates');

    // Create new subscription templates
    for (const templateData of subscriptionReceiptTemplates) {
      const template = new ReceiptTemplate({
        ...templateData,
        // System defaults don't need organizationId or userId
        organizationId: null,
        userId: null,
        createdBy: null,
        updatedBy: null
      });
      await template.save();
      console.log(`Created subscription template: ${templateData.name}`);
    }

    console.log('✅ Successfully migrated receipt templates!');
    console.log(`📄 Updated existing templates to woocommerce_order scenario`);
    console.log(`🧾 Created ${subscriptionReceiptTemplates.length} subscription receipt templates`);

  } catch (error) {
    console.error('❌ Error migrating receipt templates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration function
if (require.main === module) {
  migrateReceiptTemplates();
}

module.exports = { migrateReceiptTemplates, subscriptionReceiptTemplates };




