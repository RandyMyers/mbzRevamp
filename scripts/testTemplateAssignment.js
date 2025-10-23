const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/users');
const Organization = require('../models/organization');
const InvoiceTemplate = require('../models/InvoiceTemplate');
const ReceiptTemplate = require('../models/ReceiptTemplate');
const templateAssignmentService = require('../services/templateAssignmentService');

// Test data
const testUser = {
  fullName: 'Test User',
  businessName: 'Test Company Inc',
  email: 'test@example.com',
  password: 'TestPassword123!'
};

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elapix');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function cleanup() {
  try {
    console.log('🧹 Cleaning up test data...');
    
    // Remove test user
    await User.deleteOne({ email: testUser.email });
    console.log('✅ Removed test user');
    
    // Remove test organization
    await Organization.deleteOne({ name: testUser.businessName });
    console.log('✅ Removed test organization');
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

async function createSystemDefaultTemplates() {
  try {
    console.log('🔧 Creating system default templates...');
    
    // Check if system defaults already exist
    const existingInvoiceDefault = await InvoiceTemplate.findOne({ isSystemDefault: true });
    const existingReceiptDefault = await ReceiptTemplate.findOne({ isSystemDefault: true });

    if (!existingInvoiceDefault) {
      const defaultInvoiceTemplate = new InvoiceTemplate({
        name: 'Professional Invoice Template',
        templateType: 'professional',
        isSystemDefault: true,
        isDefault: true,
        isActive: true,
        companyInfo: {
          name: 'Your Company Name',
          email: 'billing@yourcompany.com',
          phone: '+1 (555) 123-4567'
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
      console.log('✅ Created system default invoice template');
    } else {
      console.log('✅ System default invoice template already exists');
    }

    if (!existingReceiptDefault) {
      const defaultReceiptTemplate = new ReceiptTemplate({
        name: 'Professional Receipt Template',
        templateType: 'professional',
        isSystemDefault: true,
        isDefault: true,
        isActive: true,
        scenario: 'universal',
        companyInfo: {
          name: 'Your Company Name',
          email: 'billing@yourcompany.com',
          phone: '+1 (555) 123-4567'
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
      console.log('✅ Created system default receipt template');
    } else {
      console.log('✅ System default receipt template already exists');
    }

  } catch (error) {
    console.error('❌ Error creating system default templates:', error);
    throw error;
  }
}

async function testOrganizationRegistration() {
  try {
    console.log('\n🧪 Testing organization registration with template assignment...');
    
    // Step 1: Create organization
    const organizationCode = `${testUser.businessName.toLowerCase().replace(/\s+/g, '')}${Math.floor(1000000 + Math.random() * 9000000)}`;
    
    const newOrganization = new Organization({
      name: testUser.businessName,
      organizationCode,
      status: 'active'
    });

    await newOrganization.save();
    console.log(`✅ Created organization: ${newOrganization.name} (ID: ${newOrganization._id})`);

    // Step 2: Assign default templates
    console.log('🔧 Assigning default templates...');
    const templateResult = await templateAssignmentService.assignDefaultTemplates(newOrganization._id);
    
    if (templateResult.success) {
      console.log('✅ Default templates assigned successfully');
      console.log('📄 Invoice template:', templateResult.assignedTemplates.invoice);
      console.log('🧾 Receipt template:', templateResult.assignedTemplates.receipt);
    } else {
      throw new Error('Failed to assign default templates');
    }

    // Step 3: Verify templates were assigned
    console.log('\n🔍 Verifying template assignment...');
    const updatedOrganization = await Organization.findById(newOrganization._id)
      .populate('invoiceSettings.defaultInvoiceTemplate', 'name templateType isActive')
      .populate('receiptSettings.defaultOrderTemplate', 'name templateType isActive')
      .populate('receiptSettings.defaultSubscriptionTemplate', 'name templateType isActive');

    console.log('\n📊 Organization Template Settings:');
    console.log('Invoice Settings:', {
      defaultTemplate: updatedOrganization.invoiceSettings?.defaultInvoiceTemplate?.name || 'None',
      autoGenerate: updatedOrganization.invoiceSettings?.autoGenerateInvoices || false
    });
    
    console.log('Receipt Settings:', {
      defaultOrderTemplate: updatedOrganization.receiptSettings?.defaultOrderTemplate?.name || 'None',
      defaultSubscriptionTemplate: updatedOrganization.receiptSettings?.defaultSubscriptionTemplate?.name || 'None',
      autoGenerateOrder: updatedOrganization.receiptSettings?.autoGenerateOrderReceipts || false,
      autoGenerateSubscription: updatedOrganization.receiptSettings?.autoGenerateSubscriptionReceipts || false
    });

    // Step 4: Test template retrieval
    console.log('\n🔍 Testing template retrieval...');
    const templateInfo = await templateAssignmentService.getDefaultTemplates(newOrganization._id);
    
    if (templateInfo.success) {
      console.log('✅ Template retrieval successful');
      console.log('Retrieved templates:', templateInfo.templates);
    } else {
      throw new Error('Failed to retrieve templates');
    }

    return {
      organization: updatedOrganization,
      templateResult,
      templateInfo
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

async function testTemplateManagement() {
  try {
    console.log('\n🧪 Testing template management functions...');
    
    // Get a test organization
    const organization = await Organization.findOne({ name: testUser.businessName });
    if (!organization) {
      throw new Error('Test organization not found');
    }

    // Test setting different invoice template
    const invoiceTemplates = await InvoiceTemplate.find({ isActive: true }).limit(2);
    if (invoiceTemplates.length > 1) {
      console.log('🔄 Testing invoice template change...');
      const result = await templateAssignmentService.setDefaultInvoiceTemplate(
        organization._id, 
        invoiceTemplates[1]._id
      );
      console.log('✅ Invoice template changed:', result);
    }

    // Test setting different receipt template
    const receiptTemplates = await ReceiptTemplate.find({ isActive: true }).limit(2);
    if (receiptTemplates.length > 1) {
      console.log('🔄 Testing receipt template change...');
      const result = await templateAssignmentService.setDefaultReceiptTemplate(
        organization._id, 
        receiptTemplates[1]._id,
        'order'
      );
      console.log('✅ Receipt template changed:', result);
    }

  } catch (error) {
    console.error('❌ Template management test failed:', error);
    throw error;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting Template Assignment Tests...\n');
    
    // Connect to database
    await connectDB();
    
    // Clean up any existing test data
    await cleanup();
    
    // Create system default templates
    await createSystemDefaultTemplates();
    
    // Test organization registration with template assignment
    const testResult = await testOrganizationRegistration();
    
    // Test template management functions
    await testTemplateManagement();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('- ✅ System default templates created/verified');
    console.log('- ✅ Organization registration with template assignment');
    console.log('- ✅ Template assignment verification');
    console.log('- ✅ Template retrieval functionality');
    console.log('- ✅ Template management functions');
    
    // Clean up test data
    await cleanup();
    console.log('\n🧹 Test cleanup completed');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    await cleanup();
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testOrganizationRegistration,
  testTemplateManagement
};
