const mongoose = require('mongoose');
const Organization = require('../models/organization');
const Store = require('../models/store');
const InvoiceTemplate = require('../models/InvoiceTemplate');
const ReceiptTemplate = require('../models/ReceiptTemplate');

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Load environment variables
    require('dotenv').config();
    
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test the template update feature
const testTemplateUpdate = async () => {
  try {
    console.log('\n🔍 === TESTING TEMPLATE UPDATE FEATURE ===\n');

    // 1. Find the "pexashop" organization
    console.log('1️⃣ Finding "pexashop" organization...');
    const organization = await Organization.findOne({ name: 'pexashop' });
    
    if (!organization) {
      console.log('❌ Organization "pexashop" not found');
      return;
    }
    
    console.log('✅ Found organization:', {
      id: organization._id,
      name: organization.name,
      currentInvoiceTemplate: organization.invoiceSettings?.defaultInvoiceTemplate,
      currentReceiptTemplates: {
        order: organization.receiptSettings?.defaultOrderTemplate,
        subscription: organization.receiptSettings?.defaultSubscriptionTemplate
      }
    });

    // 2. Check stores for this organization
    console.log('\n2️⃣ Checking stores for this organization...');
    const stores = await Store.find({ organizationId: organization._id });
    console.log(`✅ Found ${stores.length} stores:`);
    stores.forEach((store, index) => {
      console.log(`   Store ${index + 1}:`, {
        id: store._id,
        name: store.name,
        url: store.url,
        logo: store.websiteLogo,
        platform: store.platformType
      });
    });

    // 3. Check available invoice templates
    console.log('\n3️⃣ Checking available invoice templates...');
    const invoiceTemplates = await InvoiceTemplate.find({ isActive: true });
    console.log(`✅ Found ${invoiceTemplates.length} invoice templates:`);
    invoiceTemplates.forEach((template, index) => {
      console.log(`   Template ${index + 1}:`, {
        id: template._id,
        name: template.name,
        type: template.templateType,
        isDefault: template.isDefault,
        isSystemDefault: template.isSystemDefault
      });
    });

    // 4. Check available receipt templates
    console.log('\n4️⃣ Checking available receipt templates...');
    const receiptTemplates = await ReceiptTemplate.find({ isActive: true });
    console.log(`✅ Found ${receiptTemplates.length} receipt templates:`);
    receiptTemplates.forEach((template, index) => {
      console.log(`   Template ${index + 1}:`, {
        id: template._id,
        name: template.name,
        type: template.templateType,
        scenario: template.scenario,
        isDefault: template.isDefault,
        isSystemDefault: template.isSystemDefault
      });
    });

    // 5. Test the template update function
    console.log('\n5️⃣ Testing template update function...');
    
    // Simulate the request body that would come from frontend
    const testRequestBody = {
      // Use first available templates
      invoiceTemplateId: invoiceTemplates[0]?._id,
      receiptTemplateId: receiptTemplates[0]?._id,
      
      // Use first store if available
      storeId: stores[0]?._id,
      
      // Test company customization
      companyName: "PexaShop Custom Company",
      companyEmail: "billing@pexashop.com",
      companyPhone: "+1 (555) 999-8888",
      companyAddress: "456 Custom Street, Custom City, Custom State, 54321, Custom Country",
      logo: "https://pexashop.com/custom-logo.png",
      
      // Test design colors
      primaryColor: "#ff6b35",
      secondaryColor: "#004e89"
    };

    console.log('📝 Test request body:', JSON.stringify(testRequestBody, null, 2));

    // Simulate the updateOrganizationTemplates function logic
    const updateData = {};
    
    // 1. Update template assignments
    if (testRequestBody.invoiceTemplateId) {
      updateData['invoiceSettings.defaultInvoiceTemplate'] = testRequestBody.invoiceTemplateId;
    }
    
    if (testRequestBody.receiptTemplateId) {
      updateData['receiptSettings.defaultOrderTemplate'] = testRequestBody.receiptTemplateId;
      updateData['receiptSettings.defaultSubscriptionTemplate'] = testRequestBody.receiptTemplateId;
    }
    
    // 2. Handle store selection and company information
    let invoiceStoreInfo = {};
    let receiptStoreInfo = {};
    
    if (testRequestBody.storeId) {
      const store = await Store.findById(testRequestBody.storeId);
      if (store) {
        invoiceStoreInfo = {
          name: store.name,
          website: store.url,
          logo: store.websiteLogo
        };
        receiptStoreInfo = {
          name: store.name,
          website: store.url,
          logo: store.websiteLogo
        };
      }
    }
    
    // Override store info with custom company information if provided
    if (testRequestBody.companyName) {
      invoiceStoreInfo.name = testRequestBody.companyName;
      receiptStoreInfo.name = testRequestBody.companyName;
    }
    
    if (testRequestBody.logo) {
      invoiceStoreInfo.logo = testRequestBody.logo;
      receiptStoreInfo.logo = testRequestBody.logo;
    }
    
    // Apply store info if we have any data
    if (Object.keys(invoiceStoreInfo).length > 0) {
      updateData['organizationTemplateSettings.invoiceTemplate.storeInfo'] = invoiceStoreInfo;
      updateData['organizationTemplateSettings.receiptTemplate.storeInfo'] = receiptStoreInfo;
    }
    
    if (testRequestBody.companyEmail) {
      updateData['organizationTemplateSettings.invoiceTemplate.email'] = testRequestBody.companyEmail;
      updateData['organizationTemplateSettings.receiptTemplate.email'] = testRequestBody.companyEmail;
    }
    
    if (testRequestBody.companyPhone) {
      updateData['organizationTemplateSettings.invoiceTemplate.customFields.phone'] = testRequestBody.companyPhone;
      updateData['organizationTemplateSettings.receiptTemplate.customFields.phone'] = testRequestBody.companyPhone;
    }
    
    if (testRequestBody.companyAddress) {
      const addressParts = testRequestBody.companyAddress.split(',').map(part => part.trim());
      const addressObj = {
        street: addressParts[0] || '',
        city: addressParts[1] || '',
        state: addressParts[2] || '',
        zipCode: addressParts[3] || '',
        country: addressParts[4] || ''
      };
      
      updateData['organizationTemplateSettings.invoiceTemplate.customFields.address'] = addressObj;
      updateData['organizationTemplateSettings.receiptTemplate.customFields.address'] = addressObj;
    }
    
    
    // 4. Update design colors
    if (testRequestBody.primaryColor || testRequestBody.secondaryColor) {
      const designUpdate = {};
      if (testRequestBody.primaryColor) designUpdate.primaryColor = testRequestBody.primaryColor;
      if (testRequestBody.secondaryColor) designUpdate.secondaryColor = testRequestBody.secondaryColor;
      
      updateData['organizationTemplateSettings.invoiceTemplate.design'] = designUpdate;
      updateData['organizationTemplateSettings.receiptTemplate.design'] = designUpdate;
    }

    console.log('\n📊 Update data that would be applied:', JSON.stringify(updateData, null, 2));

    // 6. Apply the update
    console.log('\n6️⃣ Applying template update...');
    const updatedOrganization = await Organization.findByIdAndUpdate(
      organization._id,
      updateData,
      { new: true }
    ).populate('invoiceSettings.defaultInvoiceTemplate', 'name templateType design layout content companyInfo isDefault isActive')
     .populate('receiptSettings.defaultOrderTemplate', 'name templateType design layout content companyInfo isDefault isActive scenario')
     .populate('receiptSettings.defaultSubscriptionTemplate', 'name templateType design layout content companyInfo isDefault isActive scenario');

    console.log('✅ Template update applied successfully!');
    console.log('\n📋 Updated organization details:');
    console.log('   Invoice Template:', updatedOrganization.invoiceSettings?.defaultInvoiceTemplate?.name);
    console.log('   Receipt Templates:', {
      order: updatedOrganization.receiptSettings?.defaultOrderTemplate?.name,
      subscription: updatedOrganization.receiptSettings?.defaultSubscriptionTemplate?.name
    });
    
    console.log('\n🎨 Template personalization settings:');
    console.log('   Invoice Template Settings:', {
      storeInfo: updatedOrganization.organizationTemplateSettings?.invoiceTemplate?.storeInfo,
      email: updatedOrganization.organizationTemplateSettings?.invoiceTemplate?.email,
      customFields: updatedOrganization.organizationTemplateSettings?.invoiceTemplate?.customFields,
      design: updatedOrganization.organizationTemplateSettings?.invoiceTemplate?.design
    });
    
    console.log('   Receipt Template Settings:', {
      storeInfo: updatedOrganization.organizationTemplateSettings?.receiptTemplate?.storeInfo,
      email: updatedOrganization.organizationTemplateSettings?.receiptTemplate?.email,
      customFields: updatedOrganization.organizationTemplateSettings?.receiptTemplate?.customFields,
      design: updatedOrganization.organizationTemplateSettings?.receiptTemplate?.design
    });

    console.log('\n🎉 Template update test completed successfully!');

  } catch (error) {
    console.error('❌ Error during template update test:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await testTemplateUpdate();
  
  console.log('\n🔚 Closing database connection...');
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  process.exit(0);
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

// Run the test
main();
