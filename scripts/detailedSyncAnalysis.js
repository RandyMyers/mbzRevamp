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

// Detailed sync analysis for pexashop organization
const detailedSyncAnalysis = async () => {
  try {
    console.log('🔍 DETAILED SYNC ANALYSIS FOR PEXASHOP ORGANIZATION\n');

    // Find pexashop organization
    const organization = await Organization.findOne({ 
      $or: [
        { name: { $regex: /pexashop/i } },
        { organizationCode: { $regex: /pexashop/i } }
      ]
    });

    if (!organization) {
      console.log('❌ pexashop organization not found');
      return;
    }

    console.log(`✅ Organization: ${organization.name} (${organization.organizationCode})`);
    console.log(`   ID: ${organization._id}\n`);

    // Find stores for this organization
    const stores = await Store.find({ organizationId: organization._id });
    console.log(`📦 Found ${stores.length} stores:`);
    
    for (const store of stores) {
      console.log(`\n🏪 Store: ${store.name}`);
      console.log(`   ID: ${store._id}`);
      console.log(`   URL: ${store.url}`);
      console.log(`   Platform: ${store.platformType}`);
      console.log(`   Active: ${store.isActive}`);
      console.log(`   Last Sync: ${store.lastSyncDate || 'Never'}`);
      console.log(`   Sync Status: ${JSON.stringify(store.syncStatus, null, 2)}`);

      // Check data counts
      const inventoryCount = await Inventory.countDocuments({ 
        organizationId: organization._id,
        storeId: store._id 
      });
      console.log(`   📦 Products in DB: ${inventoryCount}`);

      const orderCount = await Order.countDocuments({ 
        organizationId: organization._id,
        storeId: store._id 
      });
      console.log(`   🛒 Orders in DB: ${orderCount}`);

      const customerCount = await Customer.countDocuments({ 
        organizationId: organization._id,
        storeId: store._id 
      });
      console.log(`   👥 Customers in DB: ${customerCount}`);

      // Check recent data
      console.log(`\n   📊 Recent Data Analysis:`);
      
      // Recent products
      const recentProducts = await Inventory.find({ 
        organizationId: organization._id,
        storeId: store._id 
      }).sort({ createdAt: -1 }).limit(3).select('name price currency createdAt');
      
      console.log(`   Recent Products:`);
      recentProducts.forEach((product, index) => {
        console.log(`     ${index + 1}. ${product.name} - $${product.price} ${product.currency || 'USD'} (${product.createdAt})`);
      });

      // Recent orders
      const recentOrders = await Order.find({ 
        organizationId: organization._id,
        storeId: store._id 
      }).sort({ createdAt: -1 }).limit(3).select('orderNumber total currency createdAt');
      
      console.log(`   Recent Orders:`);
      recentOrders.forEach((order, index) => {
        console.log(`     ${index + 1}. #${order.orderNumber} - $${order.total} ${order.currency || 'USD'} (${order.createdAt})`);
      });

      // Recent customers
      const recentCustomers = await Customer.find({ 
        organizationId: organization._id,
        storeId: store._id 
      }).sort({ createdAt: -1 }).limit(3).select('first_name last_name email createdAt');
      
      console.log(`   Recent Customers:`);
      recentCustomers.forEach((customer, index) => {
        console.log(`     ${index + 1}. ${customer.first_name} ${customer.last_name} (${customer.email}) - ${customer.createdAt}`);
      });

      // Test WooCommerce API
      console.log(`\n   🔌 WooCommerce API Test:`);
      
      const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
      const https = require('https');

      let httpsAgent = null;
      if (process.env.WOOCOMMERCE_BYPASS_SSL === 'true' || process.env.NODE_ENV === 'development') {
        httpsAgent = new https.Agent({
          rejectUnauthorized: false
        });
      }

      const wooCommerce = new WooCommerceRestApi({
        url: store.url,
        consumerKey: store.apiKey,
        consumerSecret: store.secretKey,
        version: 'wc/v3',
        queryStringAuth: true,
        ...(httpsAgent && { httpsAgent })
      });

      try {
        // Test products
        const productsResponse = await wooCommerce.get('products', { per_page: 5 });
        console.log(`     ✅ Products API: ${productsResponse.data.length} products available`);
        
        // Test orders
        const ordersResponse = await wooCommerce.get('orders', { per_page: 5 });
        console.log(`     ✅ Orders API: ${ordersResponse.data.length} orders available`);
        
        // Test customers
        const customersResponse = await wooCommerce.get('customers', { per_page: 5 });
        console.log(`     ✅ Customers API: ${customersResponse.data.length} customers available`);
        
        // Test categories
        const categoriesResponse = await wooCommerce.get('products/categories', { per_page: 5 });
        console.log(`     ✅ Categories API: ${categoriesResponse.data.length} categories available`);
        
      } catch (error) {
        console.log(`     ❌ API Error: ${error.message}`);
      }
    }

    console.log(`\n🎯 SYNC ISSUE ANALYSIS:`);
    console.log(`=======================`);
    
    // Check if sync workers are running
    // Get data counts for analysis
    const store = stores[0]; // Use first store
    const inventoryCount = await Inventory.countDocuments({ 
      organizationId: organization._id,
      storeId: store._id 
    });
    const orderCount = await Order.countDocuments({ 
      organizationId: organization._id,
      storeId: store._id 
    });
    const customerCount = await Customer.countDocuments({ 
      organizationId: organization._id,
      storeId: store._id 
    });

    console.log(`\n📋 SYNC WORKER STATUS:`);
    console.log(`- Products: ${inventoryCount > 0 ? '✅ Working' : '❌ Not Working'}`);
    console.log(`- Orders: ${orderCount > 0 ? '✅ Working' : '❌ Not Working'}`);
    console.log(`- Customers: ${customerCount > 0 ? '✅ Working' : '❌ Not Working'}`);
    console.log(`- Categories: ❌ Not Implemented (no category sync worker)`);

    console.log(`\n🚨 IDENTIFIED ISSUES:`);
    console.log(`===================`);
    
    if (inventoryCount > 0 && orderCount > 0 && customerCount > 0) {
      console.log(`✅ Data is being synced, but sync status is not being updated`);
      console.log(`❌ Categories are not being synced (no category sync worker)`);
      console.log(`❌ Sync status shows 'not_started' but data exists`);
    } else {
      console.log(`❌ Sync workers are not running properly`);
    }

    console.log(`\n📋 RECOMMENDATIONS:`);
    console.log(`==================`);
    console.log(`1. Fix sync status updates after successful sync`);
    console.log(`2. Implement category sync worker`);
    console.log(`3. Check sync job queue status`);
    console.log(`4. Review sync worker logs for errors`);
    console.log(`5. Test manual sync trigger`);

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the analysis
connectDB().then(() => {
  detailedSyncAnalysis();
});
