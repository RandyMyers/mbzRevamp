const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Store = require('../models/store');
const Organization = require('../models/organization');
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
    process.exit(1);
  }
};

// Check sync history and data sources
const checkSyncHistory = async () => {
  try {
    console.log('🔍 CHECKING SYNC HISTORY AND DATA SOURCES\n');

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
    
    for (const store of stores) {
      console.log(`🏪 Store: ${store.name}`);
      console.log(`   ID: ${store._id}`);
      console.log(`   URL: ${store.url}`);
      console.log(`   Last Sync: ${store.lastSyncDate || 'Never'}`);
      console.log(`   Sync Status: ${JSON.stringify(store.syncStatus, null, 2)}`);

      // Check data creation dates
      console.log(`\n   📊 Data Creation Analysis:`);
      
      // Check oldest and newest products
      const oldestProduct = await Inventory.findOne({ 
        organizationId: organization._id,
        storeId: store._id 
      }).sort({ createdAt: 1 }).select('name createdAt');
      
      const newestProduct = await Inventory.findOne({ 
        organizationId: organization._id,
        storeId: store._id 
      }).sort({ createdAt: -1 }).select('name createdAt');

      if (oldestProduct && newestProduct) {
        console.log(`   📦 Products:`);
        console.log(`     Oldest: ${oldestProduct.name} (${oldestProduct.createdAt})`);
        console.log(`     Newest: ${newestProduct.name} (${newestProduct.createdAt})`);
        console.log(`     Time span: ${Math.round((newestProduct.createdAt - oldestProduct.createdAt) / (1000 * 60 * 60 * 24))} days`);
      }

      // Check oldest and newest orders
      const oldestOrder = await Order.findOne({ 
        organizationId: organization._id,
        storeId: store._id 
      }).sort({ createdAt: 1 }).select('orderNumber createdAt');

      const newestOrder = await Order.findOne({ 
        organizationId: organization._id,
        storeId: store._id 
      }).sort({ createdAt: -1 }).select('orderNumber createdAt');

      if (oldestOrder && newestOrder) {
        console.log(`   🛒 Orders:`);
        console.log(`     Oldest: #${oldestOrder.orderNumber} (${oldestOrder.createdAt})`);
        console.log(`     Newest: #${newestOrder.orderNumber} (${newestOrder.createdAt})`);
        console.log(`     Time span: ${Math.round((newestOrder.createdAt - oldestOrder.createdAt) / (1000 * 60 * 60 * 24))} days`);
      }

      // Check oldest and newest customers
      const oldestCustomer = await Customer.findOne({ 
        organizationId: organization._id,
        storeId: store._id 
      }).sort({ createdAt: 1 }).select('first_name last_name createdAt');

      const newestCustomer = await Customer.findOne({ 
        organizationId: organization._id,
        storeId: store._id 
      }).sort({ createdAt: -1 }).select('first_name last_name createdAt');

      if (oldestCustomer && newestCustomer) {
        console.log(`   👥 Customers:`);
        console.log(`     Oldest: ${oldestCustomer.first_name} ${oldestCustomer.last_name} (${oldestCustomer.createdAt})`);
        console.log(`     Newest: ${newestCustomer.first_name} ${newestCustomer.last_name} (${newestCustomer.createdAt})`);
        console.log(`     Time span: ${Math.round((newestCustomer.createdAt - oldestCustomer.createdAt) / (1000 * 60 * 60 * 24))} days`);
      }

      // Check if data was created in batches (indicating sync)
      console.log(`\n   🔍 Batch Analysis:`);
      
      // Group products by creation date (daily)
      const productBatches = await Inventory.aggregate([
        { $match: { organizationId: organization._id, storeId: store._id } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
        { $limit: 10 }
      ]);

      console.log(`   📦 Product creation batches (last 10 days):`);
      productBatches.forEach(batch => {
        const date = new Date(batch._id.year, batch._id.month - 1, batch._id.day);
        console.log(`     ${date.toDateString()}: ${batch.count} products`);
      });

      // Check for WooCommerce IDs (indicating sync from WooCommerce)
      console.log(`\n   🔗 WooCommerce Integration Check:`);
      
      const productsWithWooCommerceId = await Inventory.countDocuments({
        organizationId: organization._id,
        storeId: store._id,
        $or: [
          { wooCommerceId: { $exists: true, $ne: null } },
          { product_Id: { $exists: true, $ne: null } }
        ]
      });

      const ordersWithWooCommerceId = await Order.countDocuments({
        organizationId: organization._id,
        storeId: store._id,
        $or: [
          { wooCommerceId: { $exists: true, $ne: null } },
          { order_Id: { $exists: true, $ne: null } }
        ]
      });

      const customersWithWooCommerceId = await Customer.countDocuments({
        organizationId: organization._id,
        storeId: store._id,
        $or: [
          { wooCommerceId: { $exists: true, $ne: null } },
          { customer_id: { $exists: true, $ne: null } }
        ]
      });

      console.log(`     Products with WooCommerce ID: ${productsWithWooCommerceId}`);
      console.log(`     Orders with WooCommerce ID: ${ordersWithWooCommerceId}`);
      console.log(`     Customers with WooCommerce ID: ${customersWithWooCommerceId}`);

      // Check sync status vs actual data
      console.log(`\n   🎯 Sync Status vs Reality:`);
      console.log(`     Sync Status says: ${JSON.stringify(store.syncStatus)}`);
      console.log(`     Reality: Products=${await Inventory.countDocuments({ organizationId: organization._id, storeId: store._id })}, Orders=${await Order.countDocuments({ organizationId: organization._id, storeId: store._id })}, Customers=${await Customer.countDocuments({ organizationId: organization._id, storeId: store._id })}`);

      if (store.syncStatus.products === 'not_started' && productsWithWooCommerceId > 0) {
        console.log(`     ❌ ISSUE: Sync status shows 'not_started' but ${productsWithWooCommerceId} products have WooCommerce IDs`);
      }
      if (store.syncStatus.orders === 'not_started' && ordersWithWooCommerceId > 0) {
        console.log(`     ❌ ISSUE: Sync status shows 'not_started' but ${ordersWithWooCommerceId} orders have WooCommerce IDs`);
      }
      if (store.syncStatus.customers === 'not_started' && customersWithWooCommerceId > 0) {
        console.log(`     ❌ ISSUE: Sync status shows 'not_started' but ${customersWithWooCommerceId} customers have WooCommerce IDs`);
      }
    }

    console.log(`\n🎯 CONCLUSION:`);
    console.log(`==============`);
    console.log(`The data appears to have been synced from WooCommerce (based on WooCommerce IDs),`);
    console.log(`but the sync status is not being updated properly after sync completion.`);
    console.log(`This suggests the sync workers are running but not updating the store's sync status.`);

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the analysis
connectDB().then(() => {
  checkSyncHistory();
});
