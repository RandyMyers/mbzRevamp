const mongoose = require('mongoose');
const Store = require('../models/store');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('Failed to connect to MongoDB', error);
  process.exit(1);
});

// Function to add a test WooCommerce store
async function addTestWooCommerceStore() {
  try {
    // You'll need to replace these with actual values from your system
    const organizationId = process.argv[2]; // Pass organization ID as command line argument
    const userId = process.argv[3]; // Pass user ID as command line argument
    
    if (!organizationId || !userId) {
      console.error('Usage: node addTestWooCommerceStore.js <organizationId> <userId>');
      console.error('Please provide the organization ID and user ID as command line arguments.');
      process.exit(1);
    }

    // Check if test store already exists
    const existingStore = await Store.findOne({
      organizationId,
      name: 'Test WooCommerce Store'
    });

    if (existingStore) {
      console.log('Test WooCommerce store already exists:', existingStore._id);
      return existingStore;
    }

    // Create test WooCommerce store
    const testStore = new Store({
      name: 'Test WooCommerce Store',
      organizationId: new mongoose.Types.ObjectId(organizationId),
      userId: new mongoose.Types.ObjectId(userId),
      description: 'Test store for WooCommerce analytics comparison',
      platformType: 'woocommerce',
      url: 'https://test-woocommerce-store.com',
      apiKey: 'ck_test_1234567890abcdef',
      secretKey: 'cs_test_1234567890abcdef',
      isActive: true,
      lastSyncDate: new Date()
    });

    const savedStore = await testStore.save();
    console.log('Test WooCommerce store created successfully:', savedStore._id);
    console.log('Store details:', {
      name: savedStore.name,
      platformType: savedStore.platformType,
      url: savedStore.url,
      isActive: savedStore.isActive
    });

    return savedStore;
  } catch (error) {
    console.error('Error creating test WooCommerce store:', error);
    throw error;
  }
}

// Run the script
addTestWooCommerceStore()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 