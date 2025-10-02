const Store = require("../models/store"); // Import the Store model
const Organization = require("../models/organization"); // Import the Organization model if needed
const User = require("../models/users"); // Import the User model if needed
const cloudinary = require('cloudinary').v2;
const { createDefaultWebhooks, validateStoreForWebhooks } = require('../services/webhookAutoCreationService');
const { Worker } = require('worker_threads');
const path = require('path');
const StoreErrorHandler = require('../services/storeErrorHandler');
const { createAuditLog } = require('../helpers/auditLogHelper');

// Store error notifications for user feedback
const storeErrorNotification = async (storeId, operation, errorMessage, organizationId, userId) => {
  try {
    // Create audit log for store sync error
    await createAuditLog({
      action: `Store ${operation} Error`,
      user: userId,
      resource: 'store_sync_error',
      resourceId: storeId,
      details: {
        storeId,
        operation,
        errorMessage: errorMessage.message,
        errorType: errorMessage.errorType,
        suggestions: errorMessage.suggestions,
        technicalDetails: errorMessage.technicalDetails,
        severity: errorMessage.severity
      },
      organization: organizationId,
      severity: errorMessage.severity || 'error'
    });

    console.log(`📝 Store ${operation} error logged for user notification`);
  } catch (auditError) {
    console.error('Failed to create audit log for store error:', auditError);
  }
};

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
        console.error(`📋 Error Type: ${message.errorType}`);
        console.error(`💡 Suggestions: ${message.suggestions?.join(', ')}`);
        
        // Store error information in the database for user notification
        storeErrorNotification(storeId, 'product_sync', message, organizationId, userId);
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
        console.error(`📋 Error Type: ${message.errorType}`);
        console.error(`💡 Suggestions: ${message.suggestions?.join(', ')}`);
        
        // Store error information in the database for user notification
        storeErrorNotification(storeId, 'customer_sync', message, organizationId, userId);
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
        console.error(`📋 Error Type: ${message.errorType}`);
        console.error(`💡 Suggestions: ${message.suggestions?.join(', ')}`);
        
        // Store error information in the database for user notification
        storeErrorNotification(storeId, 'order_sync', message, organizationId, userId);
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
/**
 * @swagger
 * /api/stores/create:
 *   post:
 *     summary: Create a new store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - organizationId
 *               - userId
 *               - platformType
 *               - url
 *               - apiKey
 *               - secretKey
 *             properties:
 *               name:
 *                 type: string
 *                 description: Store name
 *                 example: "My Online Store"
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID who owns the store
 *                 example: "507f1f77bcf86cd799439011"
 *               description:
 *                 type: string
 *                 description: Store description (optional)
 *                 example: "A great online store"
 *               platformType:
 *                 type: string
 *                 enum: [woocommerce, shopify, magento, bigcommerce, custom]
 *                 description: E-commerce platform type
 *                 example: "woocommerce"
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Store website URL
 *                 example: "https://mystore.com"
 *               apiKey:
 *                 type: string
 *                 description: Platform API key
 *                 example: "ck_1234567890abcdef"
 *               secretKey:
 *                 type: string
 *                 description: Platform secret key
 *                 example: "cs_1234567890abcdef"
 *               createWebhooks:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to create default webhooks automatically
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Store logo file (optional)
 *     responses:
 *       201:
 *         description: Store created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Store created successfully"
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *                 webhookResults:
 *                   type: object
 *                   description: Results of webhook creation (if applicable)
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
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
          
          // Parse the sync error using our error handler
          const errorInfo = StoreErrorHandler.parseStoreError(syncError, savedStore, 'auto sync');
          StoreErrorHandler.logError(errorInfo, 'createStore.autoSync');
          
          // Store error notification for user feedback
          storeErrorNotification(savedStore._id, 'auto_sync', {
            message: StoreErrorHandler.createUserMessage(errorInfo),
            errorType: errorInfo.errorType,
            suggestions: errorInfo.suggestedActions,
            technicalDetails: errorInfo.technicalDetails,
            severity: errorInfo.severity
          }, organizationId, userId);
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

/**
 * @swagger
 * /api/stores/get/{storeId}:
 *   get:
 *     summary: Get a single store by ID
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Store retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Store not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error fetching store"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/stores/update/{storeId}:
 *   patch:
 *     summary: Update a store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Store name
 *                 example: "My Updated Store"
 *               description:
 *                 type: string
 *                 description: Store description
 *                 example: "Updated store description"
 *               platformType:
 *                 type: string
 *                 enum: [woocommerce, shopify, magento, bigcommerce, custom]
 *                 description: E-commerce platform type
 *                 example: "woocommerce"
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Store website URL
 *                 example: "https://updatedstore.com"
 *               apiKey:
 *                 type: string
 *                 description: Platform API key
 *                 example: "ck_updated1234567890abcdef"
 *               secretKey:
 *                 type: string
 *                 description: Platform secret key
 *                 example: "cs_updated1234567890abcdef"
 *               lastSyncDate:
 *                 type: string
 *                 format: date-time
 *                 description: Last sync date
 *                 example: "2024-01-15T10:30:00.000Z"
 *               isActive:
 *                 type: boolean
 *                 description: Whether the store is active
 *                 example: true
 *     responses:
 *       200:
 *         description: Store updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Store updated successfully"
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Store not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error updating store"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/stores/delete/{storeId}:
 *   delete:
 *     summary: Delete a store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Store deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Store deleted successfully"
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Store not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error deleting store"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/stores/organization/{organizationId}:
 *   get:
 *     summary: Get all stores for a specific organization
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Stores retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stores:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Store'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error fetching stores"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/stores/sync/{storeId}:
 *   patch:
 *     summary: Sync store with WooCommerce
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Store synced with WooCommerce successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Store synced with WooCommerce"
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Store not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to sync store with WooCommerce"
 */
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

/**
 * @swagger
 * /api/stores/{storeId}/webhooks:
 *   post:
 *     summary: Create default webhooks for an existing store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               topics:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Webhook topics to create
 *                 example: ["order.created", "product.updated"]
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID creating the webhooks
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Webhooks created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Webhooks created successfully"
 *                 store:
 *                   type: string
 *                   description: Store name
 *                   example: "My Store"
 *                 webhookResults:
 *                   type: object
 *                   description: Results of webhook creation
 *       400:
 *         description: Bad request - Store not ready for webhook creation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Store not ready for webhook creation"
 *                 error:
 *                   type: string
 *                   example: "Invalid store configuration"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Store not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to create webhooks"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/stores/{storeId}/webhooks/status:
 *   get:
 *     summary: Get webhook status for a store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Webhook status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: object
 *                   description: Webhook status information
 *                   properties:
 *                     storeId:
 *                       type: string
 *                       format: ObjectId
 *                       description: Store ID
 *                       example: "507f1f77bcf86cd799439011"
 *                     webhooks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Webhook ID
 *                             example: "12345"
 *                           topic:
 *                             type: string
 *                             description: Webhook topic
 *                             example: "order.created"
 *                           status:
 *                             type: string
 *                             description: Webhook status
 *                             example: "active"
 *                           deliveryUrl:
 *                             type: string
 *                             description: Webhook delivery URL
 *                             example: "https://api.example.com/webhooks"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Store not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get webhook status"
 */
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

// Get store error notifications for user feedback
exports.getStoreErrorNotifications = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { userId, organizationId } = req.user;

    // Get recent error notifications for the store from audit logs
    const AuditLog = require('../models/auditLog');
    
    const errorNotifications = await AuditLog.find({
      resource: 'store_sync_error',
      resourceId: storeId,
      organization: organizationId,
      severity: { $in: ['error', 'warning'] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('action details createdAt severity');

    const formattedNotifications = errorNotifications.map(notification => ({
      id: notification._id,
      action: notification.action,
      message: notification.details?.errorMessage || notification.action,
      errorType: notification.details?.errorType,
      suggestions: notification.details?.suggestions || [],
      technicalDetails: notification.details?.technicalDetails,
      severity: notification.severity,
      timestamp: notification.createdAt
    }));

    res.status(200).json({
      success: true,
      notifications: formattedNotifications,
      count: formattedNotifications.length
    });

  } catch (error) {
    console.error('Error fetching store error notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store error notifications'
    });
  }
};
