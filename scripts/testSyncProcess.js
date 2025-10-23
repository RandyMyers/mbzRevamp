const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Store = require('../models/store');
const Organization = require('../models/organization');
const User = require('../models/users');
const Inventory = require('../models/inventory');
const Order = require('../models/order');
const Customer = require('../models/customers');

// Load environment variables
dotenv.config();

// Connect to MongoDB using the same method as app.js
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    console.error('MONGO_URL:', process.env.MONGO_URL);
    process.exit(1);
  }
};

// Test sync process for tredykool organization
const testSyncProcess = async () => {
  try {
    console.log('🔍 Testing sync process for pexashop organization...\n');

    // Find pexashop organization
    const organization = await Organization.findOne({ 
      $or: [
        { name: { $regex: /pexashop/i } },
        { organizationCode: { $regex: /pexashop/i } }
      ]
    });

    if (!organization) {
      console.log('❌ pexashop organization not found');
      console.log('📋 Available organizations:');
      const orgs = await Organization.find({}).select('name organizationCode');
      orgs.forEach(org => {
        console.log(`  - ${org.name} (${org.organizationCode})`);
      });
      return;
    }

    console.log(`✅ Found organization: ${organization.name} (${organization.organizationCode})`);
    console.log(`   ID: ${organization._id}`);
    console.log(`   Default Currency: ${organization.defaultCurrency}`);
    console.log(`   Analytics Currency: ${organization.analyticsCurrency}\n`);

    // Find stores for this organization
    const stores = await Store.find({ organizationId: organization._id });
    console.log(`📦 Found ${stores.length} stores for this organization:`);
    
    stores.forEach((store, index) => {
      console.log(`   ${index + 1}. ${store.name}`);
      console.log(`      ID: ${store._id}`);
      console.log(`      URL: ${store.url}`);
      console.log(`      Platform: ${store.platformType}`);
      console.log(`      Active: ${store.isActive}`);
      console.log(`      Last Sync: ${store.lastSyncDate || 'Never'}`);
      console.log(`      Sync Status: ${store.syncStatus || 'Unknown'}\n`);
    });

    if (stores.length === 0) {
      console.log('❌ No stores found for this organization');
      return;
    }

    // Test with the first store
    const testStore = stores[0];
    console.log(`🎯 Testing sync for store: ${testStore.name}`);
    console.log(`   Store ID: ${testStore._id}`);
    console.log(`   Store URL: ${testStore.url}\n`);

    // Check current data counts
    console.log('📊 Current data counts:');
    
    const inventoryCount = await Inventory.countDocuments({ 
      organizationId: organization._id,
      storeId: testStore._id 
    });
    console.log(`   📦 Products: ${inventoryCount}`);

    const orderCount = await Order.countDocuments({ 
      organizationId: organization._id,
      storeId: testStore._id 
    });
    console.log(`   🛒 Orders: ${orderCount}`);

    const customerCount = await Customer.countDocuments({ 
      organizationId: organization._id,
      storeId: testStore._id 
    });
    console.log(`   👥 Customers: ${customerCount}\n`);

    // Test WooCommerce API connection
    console.log('🔌 Testing WooCommerce API connection...');
    
    const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
    const https = require('https');

    // Create HTTPS agent for SSL bypass if needed
    let httpsAgent = null;
    if (process.env.WOOCOMMERCE_BYPASS_SSL === 'true' || process.env.NODE_ENV === 'development') {
      httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });
    }

    const wooCommerce = new WooCommerceRestApi({
      url: testStore.url,
      consumerKey: testStore.apiKey,
      consumerSecret: testStore.secretKey,
      version: 'wc/v3',
      queryStringAuth: true,
      ...(httpsAgent && { httpsAgent })
    });

    // Test API connection with a simple request
    try {
      console.log('   Testing products endpoint...');
      const productsResponse = await wooCommerce.get('products', { per_page: 1 });
      console.log(`   ✅ Products API working - Found ${productsResponse.data.length} products (showing first 1)`);
      
      if (productsResponse.data.length > 0) {
        const product = productsResponse.data[0];
        console.log(`   Sample product: ${product.name} - $${product.price}`);
      }
    } catch (error) {
      console.log(`   ❌ Products API failed: ${error.message}`);
    }

    try {
      console.log('   Testing orders endpoint...');
      const ordersResponse = await wooCommerce.get('orders', { per_page: 1 });
      console.log(`   ✅ Orders API working - Found ${ordersResponse.data.length} orders (showing first 1)`);
      
      if (ordersResponse.data.length > 0) {
        const order = ordersResponse.data[0];
        console.log(`   Sample order: #${order.number} - $${order.total} ${order.currency}`);
      }
    } catch (error) {
      console.log(`   ❌ Orders API failed: ${error.message}`);
    }

    try {
      console.log('   Testing customers endpoint...');
      const customersResponse = await wooCommerce.get('customers', { per_page: 1 });
      console.log(`   ✅ Customers API working - Found ${customersResponse.data.length} customers (showing first 1)`);
      
      if (customersResponse.data.length > 0) {
        const customer = customersResponse.data[0];
        console.log(`   Sample customer: ${customer.first_name} ${customer.last_name} (${customer.email})`);
      }
    } catch (error) {
      console.log(`   ❌ Customers API failed: ${error.message}`);
    }

    try {
      console.log('   Testing categories endpoint...');
      const categoriesResponse = await wooCommerce.get('products/categories', { per_page: 1 });
      console.log(`   ✅ Categories API working - Found ${categoriesResponse.data.length} categories (showing first 1)`);
      
      if (categoriesResponse.data.length > 0) {
        const category = categoriesResponse.data[0];
        console.log(`   Sample category: ${category.name}`);
      }
    } catch (error) {
      console.log(`   ❌ Categories API failed: ${error.message}`);
    }

    console.log('\n🎯 SYNC ANALYSIS:');
    console.log('================');
    
    if (inventoryCount === 0) {
      console.log('❌ ISSUE: No products synced - Product sync may not be working');
    } else {
      console.log('✅ Products are being synced');
    }

    if (orderCount === 0) {
      console.log('❌ ISSUE: No orders synced - Order sync may not be working');
    } else {
      console.log('✅ Orders are being synced');
    }

    if (customerCount === 0) {
      console.log('❌ ISSUE: No customers synced - Customer sync may not be working');
    } else {
      console.log('✅ Customers are being synced');
    }

    console.log('\n📋 RECOMMENDATIONS:');
    console.log('===================');
    
    if (inventoryCount === 0 || orderCount === 0 || customerCount === 0) {
      console.log('1. Check if sync workers are running');
      console.log('2. Verify WooCommerce API credentials');
      console.log('3. Check sync job queue status');
      console.log('4. Review sync worker logs for errors');
      console.log('5. Test manual sync trigger');
    } else {
      console.log('✅ All sync processes appear to be working correctly');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the test
connectDB().then(() => {
  testSyncProcess();
});
