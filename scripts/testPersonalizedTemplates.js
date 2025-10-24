const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Organization = require('../models/organization');
const Store = require('../models/store');
const Order = require('../models/order');
const templateMergerService = require('../services/templateMergerService');

/**
 * Test script to verify personalized template functionality
 */
async function testPersonalizedTemplates() {
  try {
    console.log('🔧 [TEST] Starting personalized template test...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ [TEST] Connected to MongoDB');

    // Find pexashop organization
    const organization = await Organization.findOne({ name: 'pexashop' });
    if (!organization) {
      throw new Error('Pexashop organization not found');
    }
    console.log('✅ [TEST] Found organization:', organization.name);

    // Find Trendy kool store
    const store = await Store.findOne({ 
      organizationId: organization._id, 
      name: 'Trendy kool' 
    });
    if (!store) {
      throw new Error('Trendykool store not found');
    }
    console.log('✅ [TEST] Found store:', store.name);

    // Test 1: Check if organization has template settings
    console.log('\n📋 [TEST 1] Checking organization template settings...');
    const templateSettings = organization.organizationTemplateSettings;
    console.log('Template settings:', JSON.stringify(templateSettings, null, 2));

    // Test 2: Set up sample template settings if none exist
    if (!templateSettings || !templateSettings.invoiceTemplate) {
      console.log('\n🔧 [TEST 2] Setting up sample template settings...');
      
      organization.organizationTemplateSettings = {
        invoiceTemplate: {
          storeInfo: {
            name: 'Trendykool Store',
            website: 'https://trendykool.com',
            logo: 'https://example.com/logo.png'
          },
          email: 'billing@trendykool.com',
          customFields: {
            phone: '+1-555-TRENDYKOOL',
            address: {
              street: '123 Fashion Street',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              country: 'USA'
            }
          },
          design: {
            primaryColor: '#FF6B6B',
            secondaryColor: '#4ECDC4',
            backgroundColor: '#FFFFFF'
          },
          layout: {
            logoPosition: 'top-left',
            headerStyle: 'modern',
            footerStyle: 'minimal'
          }
        },
        receiptTemplate: {
          storeInfo: {
            name: 'Trendykool Store',
            website: 'https://trendykool.com',
            logo: 'https://example.com/logo.png'
          },
          email: 'billing@trendykool.com',
          customFields: {
            phone: '+1-555-TRENDYKOOL',
            address: {
              street: '123 Fashion Street',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              country: 'USA'
            }
          },
          design: {
            primaryColor: '#FF6B6B',
            secondaryColor: '#4ECDC4',
            backgroundColor: '#FFFFFF'
          },
          layout: {
            logoPosition: 'top-left',
            headerStyle: 'modern',
            footerStyle: 'minimal'
          }
        }
      };

      await organization.save();
      console.log('✅ [TEST 2] Sample template settings saved');
    }

    // Test 3: Test template merger service
    console.log('\n🔧 [TEST 3] Testing template merger service...');
    const mergedCompanyInfo = await templateMergerService.getMergedCompanyInfoForGeneration(
      organization._id, 
      store._id, 
      'invoice'
    );
    console.log('Merged company info:', JSON.stringify(mergedCompanyInfo, null, 2));

    // Test 4: Find a non-cancelled order
    console.log('\n📋 [TEST 4] Looking for non-cancelled orders...');
    const order = await Order.findOne({ 
      organizationId: organization._id,
      storeId: store._id,
      status: { $ne: 'cancelled' }
    });

    if (!order) {
      console.log('⚠️ [TEST 4] No non-cancelled orders found');
    } else {
      console.log('✅ [TEST 4] Found order:', {
        id: order._id,
        status: order.status,
        total: order.total,
        currency: order.currency,
        customerName: order.billing?.first_name,
        lineItemsCount: order.line_items?.length || 0
      });
    }

    // Test 5: Test order data mapping
    if (order) {
      console.log('\n🔧 [TEST 5] Testing order data mapping...');
      
      const orderData = {
        customerName: order.billing?.first_name || 'Customer',
        customerEmail: order.billing?.email || 'customer@example.com',
        customerAddress: {
          street: order.billing?.address_1 || '',
          city: order.billing?.city || '',
          state: order.billing?.state || '',
          zipCode: order.billing?.postcode || '',
          country: order.billing?.country || ''
        },
        items: order.line_items?.map(item => ({
          name: item.name,
          description: item.meta_data?.find(m => m.key === 'description')?.value || '',
          quantity: item.quantity,
          unitPrice: parseFloat(item.price),
          totalPrice: parseFloat(item.total),
          taxRate: 0
        })) || [],
        subtotal: parseFloat(order.total) - parseFloat(order.total_tax || 0),
        taxAmount: parseFloat(order.total_tax || 0),
        discountAmount: parseFloat(order.discount_total || 0),
        totalAmount: parseFloat(order.total),
        currency: order.currency || 'USD'
      };

      console.log('Order data mapping:', JSON.stringify(orderData, null, 2));
    }

    console.log('\n✅ [TEST] Personalized template test completed successfully!');

  } catch (error) {
    console.error('❌ [TEST] Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 [TEST] Disconnected from MongoDB');
  }
}

// Run the test
testPersonalizedTemplates();
