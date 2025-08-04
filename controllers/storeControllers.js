const Store = require("../models/store"); // Import the Store model
const Organization = require("../models/organization"); // Import the Organization model if needed
const User = require("../models/users"); // Import the User model if needed
const cloudinary = require('cloudinary').v2;
const { createDefaultWebhooks, validateStoreForWebhooks } = require('../services/webhookAutoCreationService');
const { Worker } = require('worker_threads');
const path = require('path');

// Synchronize products with WooCommerce API
const syncProducts = async (storeId, organizationId, userId) => {
  try {
    console.log(`🔄 Starting product sync for store: ${storeId}`);

    const store = await Store.findById(storeId);
    if (!store) {
      console.error('❌ Store not found for product sync');
      return;
    }

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      console.error('❌ Organization not found for product sync');
      return;
    }

    // Extract only serializable properties from the store document
    const storeData = {
      _id: store._id,
      name: store.name,
      url: store.url,
      apiKey: store.apiKey,
      secretKey: store.secretKey,
      platformType: store.platformType,
      isActive: store.isActive
    };

    const worker = new Worker(path.resolve(__dirname, '../helper/syncProductWorker.js'), {
      workerData: { storeId, store: storeData, organizationId, userId },
    });

    console.log('Worker Path:', path.resolve(__dirname, '../helper/syncProductWorker.js'));

    worker.on('message', (message) => {
      if (message.status === 'success') {
        console.log(`✅ Product sync completed: ${message.message}`);
      } else if (message.status === 'error') {
        console.error(`❌ Product sync error: ${message.message}`);
      }
    });

    worker.on('error', (error) => {
      console.error(`❌ Product sync worker error: ${error.message}`);
    });

    worker.on('exit', (code) => {
      if (code !== 0) console.error(`❌ Product sync worker stopped with exit code ${code}`);
    });

  } catch (error) {
    console.error('❌ Error in syncProducts:', error.message);
  }
};

const syncCustomers = async (storeId, organizationId, userId) => {
  try {
    console.log(`🔄 Starting customer sync for store: ${storeId}`);

    const store = await Store.findById(storeId);
    if (!store) {
      console.error('❌ Store not found for customer sync');
      return;
    }

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      console.error('❌ Organization not found for customer sync');
      return;
    }

    // Extract only serializable properties from the store document
    const storeData = {
      _id: store._id,
      name: store.name,
      url: store.url,
      apiKey: store.apiKey,
      secretKey: store.secretKey,
      platformType: store.platformType,
      isActive: store.isActive
    };

    const worker = new Worker(path.resolve(__dirname, '../helper/syncCustomerWorker.js'), {
      workerData: { storeId, store: storeData, organizationId, userId },
    });

    worker.on('message', (message) => {
      if (message.status === 'success') {
        console.log(`✅ Customer sync completed: ${message.message}`);
      } else if (message.status === 'error') {
        console.error(`❌ Customer sync error: ${message.message}`);
      }
    });

    worker.on('error', (error) => {
      console.error(`❌ Customer sync worker error: ${error.message}`);
    });

    worker.on('exit', (code) => {
      if (code !== 0) console.error(`❌ Customer sync worker stopped with exit code ${code}`);
    });

  } catch (error) {
    console.error('❌ Error in syncCustomers:', error.message);
  }
};

const syncOrders = async (storeId, organizationId, userId) => {
  try {
    console.log(`🔄 Starting order sync for store: ${storeId}`);

    const store = await Store.findById(storeId);
    if (!store) {
      console.error('❌ Store not found for order sync');
      return;
    }

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      console.error('❌ Organization not found for order sync');
      return;
    }

    // Extract only serializable properties from the store document
    const storeData = {
      _id: store._id,
      name: store.name,
      url: store.url,
      apiKey: store.apiKey,
      secretKey: store.secretKey,
      platformType: store.platformType,
      isActive: store.isActive
    };

    const worker = new Worker(path.resolve(__dirname, '../helper/syncOrderWorker.js'), {
      workerData: { storeId, store: storeData, organizationId, userId },
    });

    worker.on('message', (message) => {
      if (message.status === 'success') {
        console.log(`✅ Order sync completed: ${message.message}`);
      } else if (message.status === 'error') {
        console.error(`❌ Order sync error: ${message.message}`);
      }
    });

    worker.on('error', (error) => {
      console.error(`❌ Order sync worker error: ${error.message}`);
    });

    worker.on('exit', (code) => {
      if (code !== 0) console.error(`❌ Order sync worker stopped with exit code ${code}`);
    });

  } catch (error) {
    console.error('❌ Error in syncOrders:', error.message);
  }
};

// Category sync function (different pattern - uses helper function)
const syncCategoriesWithWooCommerce = async (storeId, organizationId, userId) => {
  try {
    console.log(`🔄 Starting category sync for store: ${storeId}`);

    const store = await Store.findById(storeId);
    if (!store) {
      console.error('❌ Store not found for category sync');
      return;
    }

    const { syncCategories } = require('../helper/wooCommerceCategoryHelper');
    
    const syncResult = await syncCategories(storeId, userId, organizationId);
    console.log(`✅ Category sync completed:`, syncResult);

  } catch (error) {
    console.error('❌ Error in syncCategoriesWithWooCommerce:', error.message);
  }
};

// CREATE a new store
exports.createStore = async (req, res) => {
  const { name, organizationId, userId, description, platformType, url, apiKey, secretKey, createWebhooks = true } = req.body;
  console.log(req.body, req.files);

  try {
    let websiteLogoUrl = null;

    // Check if a file is uploaded
    if (req.files && req.files.logo) {
      const file = req.files.logo;

      // Upload the image to Cloudinary
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'website_logos',
      });

      websiteLogoUrl = result.secure_url;
    }

    const newStore = new Store({
      name,
      organizationId,
      userId,
      description,
      platformType,
      url,
      apiKey,
      secretKey,
      websiteLogo: websiteLogoUrl,
    });

    const savedStore = await newStore.save();
    
    // Initialize webhook creation results
    let webhookResults = null;
    
    // Create webhooks automatically if requested and store is WooCommerce
    if (createWebhooks && platformType === 'woocommerce' && url && apiKey && secretKey) {
      try {
        // Validate store for webhook creation
        const validation = validateStoreForWebhooks(savedStore);
        if (validation.valid) {
          console.log(`Creating default webhooks for new store: ${savedStore.name}`);
          webhookResults = await createDefaultWebhooks(savedStore, userId);
        } else {
          console.warn(`Store validation failed for webhook creation: ${validation.error}`);
          webhookResults = {
            total: 0,
            successful: 0,
            failed: 0,
            webhooks: [],
            errors: [{ topic: 'validation', error: validation.error }]
          };
        }
      } catch (webhookError) {
        console.error('Error creating default webhooks:', webhookError);
        webhookResults = {
          total: 0,
          successful: 0,
          failed: 0,
          webhooks: [],
          errors: [{ topic: 'general', error: webhookError.message }]
        };
      }
    }

    // Auto-sync data if store is WooCommerce and has valid credentials
    if (platformType === 'woocommerce' && url && apiKey && secretKey) {
      console.log(`🚀 Starting auto-sync for new store: ${savedStore.name}`);
      
      // Trigger syncs asynchronously (don't block the response)
      setTimeout(async () => {
        try {
          // Trigger syncs in sequence to avoid overwhelming the API
          await syncCategoriesWithWooCommerce(savedStore._id, organizationId, userId);
          await syncProducts(savedStore._id, organizationId, userId);
          await syncCustomers(savedStore._id, organizationId, userId);
          await syncOrders(savedStore._id, organizationId, userId);
          
          console.log(`✅ Auto-sync completed for store: ${savedStore.name}`);
        } catch (syncError) {
          console.error(`❌ Auto-sync error for store ${savedStore.name}:`, syncError);
        }
      }, 1000); // Small delay to ensure store is fully saved
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Store created successfully', 
      store: savedStore,
      webhookCreation: webhookResults,
      autoSync: platformType === 'woocommerce' && url && apiKey && secretKey ? {
        initiated: true,
        syncs: ['categories', 'products', 'customers', 'orders'],
        estimatedTime: '2-3 minutes'
      } : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating store', error: error.message });
  }
};
// Get all stores
exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.find().populate('organizationId userId', 'name email');
    res.status(200).json({ success: true, stores });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stores', error: error.message });
  }
};

// Get a single store by ID
exports.getStoreById = async (req, res) => {
  const { storeId  } = req.params;

  try {
    const store = await Store.findById(storeId ).populate('organizationId userId', 'name email');
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    res.status(200).json({ success: true, store });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching store', error: error.message });
  }
};

// Update a store
exports.updateStore = async (req, res) => {
  const { storeId } = req.params;
  const { name, description, platformType, url, apiKey, secretKey, lastSyncDate, isActive } = req.body;

  try {
    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      { name, description, platformType, url, apiKey, secretKey, lastSyncDate, isActive },
      { new: true, runValidators: true }
    );

    if (!updatedStore) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    res.status(200).json({ success: true, message: 'Store updated successfully', store: updatedStore });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating store', error: error.message });
  }
};

// Delete a store
exports.deleteStore = async (req, res) => {
  const { storeId  } = req.params;

  try {
    const deletedStore = await Store.findByIdAndDelete(storeId );
    if (!deletedStore) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    res.status(200).json({ success: true, message: 'Store deleted successfully', store: deletedStore });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting store', error: error.message });
  }
};

// Get all stores for a specific organization
exports.getStoresByOrganization = async (req, res) => {
  const { organizationId } = req.params;

  try {
    const stores = await Store.find({ organizationId }).populate('userId', 'name email');
    res.status(200).json({ success: true, stores });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stores', error: error.message });
  }
};

// Get all stores for a specific user
exports.getStoresByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const stores = await Store.find({ userId }).populate('organizationId', 'name');
    res.status(200).json({ success: true, stores });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stores', error: error.message });
  }
};
// Sync store with WooCommerce (dummy example)
exports.syncStoreWithWooCommerce = async (req, res) => {
  const { storeId } = req.params;
  try {
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    // Simulating WooCommerce sync process
    store.lastSyncDate = new Date();
    await store.save();

    res.status(200).json({ success: true, message: "Store synced with WooCommerce", store });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to sync store with WooCommerce" });
  }
};

// Create default webhooks for an existing store
exports.createStoreWebhooks = async (req, res) => {
  const { storeId } = req.params;
  const { topics, userId } = req.body;
  
  try {
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    // Validate store for webhook creation
    const validation = validateStoreForWebhooks(store);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: "Store not ready for webhook creation", 
        error: validation.error 
      });
    }

    // Create webhooks
    const webhookResults = await createDefaultWebhooks(store, userId, topics);
    
    res.status(200).json({
      success: true,
      message: "Webhooks created successfully",
      store: store.name,
      webhookResults
    });
    
  } catch (error) {
    console.error('Error creating store webhooks:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create webhooks", 
      error: error.message 
    });
  }
};

// Get webhook status for a store
exports.getStoreWebhookStatus = async (req, res) => {
  const { storeId } = req.params;
  
  try {
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    const { getWebhookStatus } = require('../services/webhookAutoCreationService');
    const status = await getWebhookStatus(storeId);
    
    if (status.success) {
      res.status(200).json({
        success: true,
        store: store.name,
        webhookStatus: status.status
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to get webhook status",
        error: status.error
      });
    }
    
  } catch (error) {
    console.error('Error getting store webhook status:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get webhook status", 
      error: error.message 
    });
  }
};
