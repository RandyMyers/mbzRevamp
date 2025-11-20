/**
 * Database Index Migration Script for Overview Performance
 *
 * This script adds indexes to improve the performance of the overview stats endpoint.
 * Run this once to create the indexes.
 *
 * Usage: node scripts/add-overview-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Order = require('../models/order');
const Customer = require('../models/customers');
const Inventory = require('../models/inventory');
const ExchangeRate = require('../models/exchangeRate');

async function addIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB\n');

    // Order indexes for overview queries
    console.log('Creating indexes for Order collection...');
    await Order.collection.createIndex(
      { organizationId: 1, status: 1, date_created: -1 },
      { background: true, name: 'overview_orders_by_org_status_date' }
    );
    await Order.collection.createIndex(
      { organizationId: 1, currency: 1 },
      { background: true, name: 'overview_orders_by_org_currency' }
    );
    await Order.collection.createIndex(
      { organizationId: 1, created_via: 1 },
      { background: true, name: 'overview_orders_by_org_source' }
    );
    console.log('✅ Order indexes created\n');

    // Customer indexes
    console.log('Creating indexes for Customer collection...');
    await Customer.collection.createIndex(
      { organizationId: 1 },
      { background: true, name: 'overview_customers_by_org' }
    );
    console.log('✅ Customer indexes created\n');

    // Inventory indexes for overview queries
    console.log('Creating indexes for Inventory collection...');
    await Inventory.collection.createIndex(
      { organizationId: 1, stock_status: 1 },
      { background: true, name: 'overview_inventory_by_org_status' }
    );
    await Inventory.collection.createIndex(
      { organizationId: 1, 'categories.name': 1 },
      { background: true, name: 'overview_inventory_by_org_category' }
    );
    await Inventory.collection.createIndex(
      { organizationId: 1, 'images.src': 1 },
      { background: true, name: 'overview_inventory_by_org_images', sparse: true }
    );
    console.log('✅ Inventory indexes created\n');

    // ExchangeRate indexes for currency conversion
    console.log('Creating indexes for ExchangeRate collection...');
    await ExchangeRate.collection.createIndex(
      { organizationId: 1, baseCurrency: 1, targetCurrency: 1, isActive: 1 },
      { background: true, name: 'overview_exchange_rate_lookup' }
    );
    await ExchangeRate.collection.createIndex(
      { baseCurrency: 1, targetCurrency: 1, isGlobal: 1, isActive: 1 },
      { background: true, name: 'overview_global_exchange_rate' }
    );
    console.log('✅ ExchangeRate indexes created\n');

    // List all indexes
    console.log('Current indexes:');
    console.log('\nOrder collection:');
    const orderIndexes = await Order.collection.indexes();
    orderIndexes.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

    console.log('\nCustomer collection:');
    const customerIndexes = await Customer.collection.indexes();
    customerIndexes.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

    console.log('\nInventory collection:');
    const inventoryIndexes = await Inventory.collection.indexes();
    inventoryIndexes.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

    console.log('\nExchangeRate collection:');
    const exchangeRateIndexes = await ExchangeRate.collection.indexes();
    exchangeRateIndexes.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

    console.log('\n✅ All indexes created successfully!');
    console.log('💡 The overview endpoint should now perform significantly faster.');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

// Run the script
addIndexes();
