const mongoose = require('mongoose');
const InvoiceTemplate = require('../models/InvoiceTemplate');
const ReceiptTemplate = require('../models/ReceiptTemplate');
require('dotenv').config();

// Default templates from storehubomale
const defaultInvoiceTemplates = [
  {
    name: "Professional Invoice",
    description: "Corporate elegance with structured layout",
    templateType: "professional",
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
      showCustomerInfo: true,
      showItemsTable: true,
      showTotals: true,
      showTerms: true,
      showNotes: true,
      showFooter: true
    },
    content: {
      headerText: "INVOICE",
      footerText: "Thank you for your business!",
      defaultTerms: "Payment is due within 30 days of invoice date.",
      defaultNotes: "Please contact us if you have any questions about this invoice.",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showInvoiceNumber: true,
      showIssueDate: true,
      showDueDate: true,
      showCustomerAddress: true,
      showCustomerEmail: true,
      showCustomerPhone: true,
      showItemDescription: true,
      showItemQuantity: true,
      showItemUnitPrice: true,
      showItemTotal: true,
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true
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
    name: "Minimal Invoice",
    description: "Clean lines with maximum white space",
    templateType: "minimal",
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
      showCustomerInfo: true,
      showItemsTable: true,
      showTotals: true,
      showTerms: false,
      showNotes: false,
      showFooter: true
    },
    content: {
      headerText: "INVOICE",
      footerText: "Thank you for your business!",
      defaultTerms: "",
      defaultNotes: "",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showInvoiceNumber: true,
      showIssueDate: true,
      showDueDate: true,
      showCustomerAddress: true,
      showCustomerEmail: true,
      showCustomerPhone: false,
      showItemDescription: true,
      showItemQuantity: true,
      showItemUnitPrice: true,
      showItemTotal: true,
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true
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
    name: "Modern Invoice",
    description: "Bold geometric design with vibrant colors",
    templateType: "modern",
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
      showCustomerInfo: true,
      showItemsTable: true,
      showTotals: true,
      showTerms: true,
      showNotes: true,
      showFooter: true
    },
    content: {
      headerText: "INVOICE",
      footerText: "Thank you for your business!",
      defaultTerms: "Payment is due within 30 days of invoice date.",
      defaultNotes: "Please contact us if you have any questions about this invoice.",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showInvoiceNumber: true,
      showIssueDate: true,
      showDueDate: true,
      showCustomerAddress: true,
      showCustomerEmail: true,
      showCustomerPhone: true,
      showItemDescription: true,
      showItemQuantity: true,
      showItemUnitPrice: true,
      showItemTotal: true,
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true
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
    name: "Classic Invoice",
    description: "Traditional formal business document style",
    templateType: "classic",
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
      showCustomerInfo: true,
      showItemsTable: true,
      showTotals: true,
      showTerms: true,
      showNotes: true,
      showFooter: true
    },
    content: {
      headerText: "INVOICE",
      footerText: "Thank you for your business!",
      defaultTerms: "Payment is due within 30 days of invoice date.",
      defaultNotes: "Please contact us if you have any questions about this invoice.",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showInvoiceNumber: true,
      showIssueDate: true,
      showDueDate: true,
      showCustomerAddress: true,
      showCustomerEmail: true,
      showCustomerPhone: true,
      showItemDescription: true,
      showItemQuantity: true,
      showItemUnitPrice: true,
      showItemTotal: true,
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true
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
    name: "Creative Invoice",
    description: "Artistic design with custom elements",
    templateType: "creative",
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
      showCustomerInfo: true,
      showItemsTable: true,
      showTotals: true,
      showTerms: true,
      showNotes: true,
      showFooter: true
    },
    content: {
      headerText: "INVOICE",
      footerText: "Thank you for your business!",
      defaultTerms: "Payment is due within 30 days of invoice date.",
      defaultNotes: "Please contact us if you have any questions about this invoice.",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showInvoiceNumber: true,
      showIssueDate: true,
      showDueDate: true,
      showCustomerAddress: true,
      showCustomerEmail: true,
      showCustomerPhone: true,
      showItemDescription: true,
      showItemQuantity: true,
      showItemUnitPrice: true,
      showItemTotal: true,
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true
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

const defaultReceiptTemplates = [
  {
    name: "Professional Receipt",
    description: "Corporate elegance with structured layout",
    templateType: "professional",
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
      showCustomerInfo: true,
      showItemsTable: true,
      showTotals: true,
      showPaymentInfo: true,
      showFooter: true
    },
    content: {
      headerText: "RECEIPT",
      footerText: "Thank you for your payment!",
      thankYouMessage: "Thank you for your payment!",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showReceiptNumber: true,
      showTransactionDate: true,
      showCustomerAddress: true,
      showCustomerEmail: true,
      showCustomerPhone: true,
      showItemDescription: true,
      showItemQuantity: true,
      showItemUnitPrice: true,
      showItemTotal: true,
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true,
      showPaymentMethod: true,
      showTransactionId: true
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
    name: "Minimal Receipt",
    description: "Clean lines with maximum white space",
    templateType: "minimal",
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
      showCustomerInfo: true,
      showItemsTable: true,
      showTotals: true,
      showPaymentInfo: true,
      showFooter: true
    },
    content: {
      headerText: "RECEIPT",
      footerText: "Thank you for your payment!",
      thankYouMessage: "Thank you for your payment!",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showReceiptNumber: true,
      showTransactionDate: true,
      showCustomerAddress: true,
      showCustomerEmail: true,
      showCustomerPhone: false,
      showItemDescription: true,
      showItemQuantity: true,
      showItemUnitPrice: true,
      showItemTotal: true,
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true,
      showPaymentMethod: true,
      showTransactionId: true
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
    name: "Modern Receipt",
    description: "Bold geometric design with vibrant colors",
    templateType: "modern",
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
      showCustomerInfo: true,
      showItemsTable: true,
      showTotals: true,
      showPaymentInfo: true,
      showFooter: true
    },
    content: {
      headerText: "RECEIPT",
      footerText: "Thank you for your payment!",
      thankYouMessage: "Thank you for your payment!",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showReceiptNumber: true,
      showTransactionDate: true,
      showCustomerAddress: true,
      showCustomerEmail: true,
      showCustomerPhone: true,
      showItemDescription: true,
      showItemQuantity: true,
      showItemUnitPrice: true,
      showItemTotal: true,
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true,
      showPaymentMethod: true,
      showTransactionId: true
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
    name: "Classic Receipt",
    description: "Traditional formal business document style",
    templateType: "classic",
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
      showCustomerInfo: true,
      showItemsTable: true,
      showTotals: true,
      showPaymentInfo: true,
      showFooter: true
    },
    content: {
      headerText: "RECEIPT",
      footerText: "Thank you for your payment!",
      thankYouMessage: "Thank you for your payment!",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showReceiptNumber: true,
      showTransactionDate: true,
      showCustomerAddress: true,
      showCustomerEmail: true,
      showCustomerPhone: true,
      showItemDescription: true,
      showItemQuantity: true,
      showItemUnitPrice: true,
      showItemTotal: true,
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true,
      showPaymentMethod: true,
      showTransactionId: true
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
    name: "Creative Receipt",
    description: "Artistic design with custom elements",
    templateType: "creative",
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
      showCustomerInfo: true,
      showItemsTable: true,
      showTotals: true,
      showPaymentInfo: true,
      showFooter: true
    },
    content: {
      headerText: "RECEIPT",
      footerText: "Thank you for your payment!",
      thankYouMessage: "Thank you for your payment!",
      currencySymbol: "$",
      dateFormat: "MM/DD/YYYY"
    },
    fields: {
      showReceiptNumber: true,
      showTransactionDate: true,
      showCustomerAddress: true,
      showCustomerEmail: true,
      showCustomerPhone: true,
      showItemDescription: true,
      showItemQuantity: true,
      showItemUnitPrice: true,
      showItemTotal: true,
      showSubtotal: true,
      showTax: true,
      showDiscount: true,
      showTotal: true,
      showPaymentMethod: true,
      showTransactionId: true
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

async function seedDefaultTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || 'mongodb+srv://Shop:0GY73Ol6FSHR6Re3@cluster0.tsz9xe5.mongodb.net/MBZCRM?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');

    // Clear existing system default templates
    await InvoiceTemplate.deleteMany({ isSystemDefault: true });
    await ReceiptTemplate.deleteMany({ isSystemDefault: true });
    console.log('Cleared existing system default templates');

    // Seed invoice templates
    for (const templateData of defaultInvoiceTemplates) {
      const template = new InvoiceTemplate({
        ...templateData,
        // System defaults don't need organizationId or userId
        organizationId: null,
        userId: null,
        createdBy: null,
        updatedBy: null
      });
      await template.save();
      console.log(`Created invoice template: ${templateData.name}`);
    }

    // Seed receipt templates
    for (const templateData of defaultReceiptTemplates) {
      const template = new ReceiptTemplate({
        ...templateData,
        // System defaults don't need organizationId or userId
        organizationId: null,
        userId: null,
        createdBy: null,
        updatedBy: null
      });
      await template.save();
      console.log(`Created receipt template: ${templateData.name}`);
    }

    console.log('✅ Successfully seeded default templates!');
    console.log(`📄 Created ${defaultInvoiceTemplates.length} invoice templates`);
    console.log(`🧾 Created ${defaultReceiptTemplates.length} receipt templates`);

  } catch (error) {
    console.error('❌ Error seeding default templates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  seedDefaultTemplates();
}

module.exports = { seedDefaultTemplates, defaultInvoiceTemplates, defaultReceiptTemplates };
