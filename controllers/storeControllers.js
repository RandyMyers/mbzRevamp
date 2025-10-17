const Store = require("../models/store"); // Import the Store model
const Organization = require("../models/organization"); // Import the Organization model if needed
const User = require("../models/users"); // Import the User model if needed
const cloudinary = require('cloudinary').v2;
const { createDefaultWebhooks, validateStoreForWebhooks } = require('../services/webhookAutoCreationService');
const { Worker } = require('worker_threads');
const path = require('path');
const StoreErrorHandler = require('../services/storeErrorHandler');
const { createAuditLog } = require('../helpers/auditLogHelper');
const { createAndSendNotification } = require('../services/notificationService');

// Store error notifications for user feedback
const storeErrorNotification = async (storeId, operation, errorMessage, organizationId, userId) => {
  try {
    console.log(`🔔 Creating error notification for ${operation} - Store: ${storeId}, User: ${userId}`);
    
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

    // Create detailed error notification for user
    const errorSubject = `Store Sync Error - ${operation.replace('_', ' ').toUpperCase()}`;
    const errorBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">⚠️ Store Sync Error</h2>
        <p><strong>Store Operation:</strong> ${operation.replace('_', ' ').toUpperCase()}</p>
        <p><strong>Error Message:</strong> ${errorMessage.message}</p>
        <p><strong>Error Type:</strong> ${errorMessage.errorType || 'Unknown'}</p>
        ${errorMessage.suggestions ? `<p><strong>Suggestions:</strong></p><ul>${errorMessage.suggestions.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <hr>
        <p style="color: #6c757d; font-size: 12px;">
          This is an automated notification from your MBZ Tech Platform. 
          Please check your store settings and try syncing again.
        </p>
      </div>
    `;

    // Send notification to user
    const notificationResult = await createAndSendNotification({
      userId,
      organization: organizationId,
      type: 'system',
      subject: errorSubject,
      body: errorBody
    });

    if (notificationResult.success) {
      console.log(`✅ Error notification sent successfully for ${operation}`);
    } else {
      console.error(`❌ Failed to send error notification for ${operation}:`, notificationResult.error);
    }

    console.log(`📝 Store ${operation} error logged for user notification`);
  } catch (auditError) {
    console.error('Failed to create audit log for store error:', auditError);
    
    // Try to send a basic error notification even if audit logging fails
    try {
      await createAndSendNotification({
        userId,
        organization: organizationId,
        type: 'system',
        subject: `Store Sync Error - ${operation}`,
        body: `An error occurred during ${operation}. Please check your store configuration.`
      });
    } catch (notificationError) {
      console.error('Failed to send basic error notification:', notificationError);
    }
  }
};

// Synchronize products with WooCommerce API
exports.syncProducts = async (storeId, organizationId, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`🔄 Starting product sync for store: ${storeId}`);

      const store = await Store.findById(storeId);
      if (!store) {
        console.error('❌ Store not found for product sync');
        reject(new Error('Store not found for product sync'));
        return;
      }

      const organization = await Organization.findById(organizationId);
      if (!organization) {
        console.error('❌ Organization not found for product sync');
        reject(new Error('Organization not found for product sync'));
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
          // Notify success for product sync
          createAndSendNotification({
            userId,
            organization: organizationId,
            type: 'system',
            subject: `WooCommerce Product Sync Succeeded - ${store.name}`,
            body: `Product sync completed successfully for ${store.name} at ${new Date().toISOString()}.`
          }).catch(() => {});
          resolve(message);
        } else if (message.status === 'error') {
          console.error(`❌ Product sync error: ${message.message}`);
          console.error(`📋 Error Type: ${message.errorType}`);
          console.error(`💡 Suggestions: ${message.suggestions?.join(', ')}`);
          
          // Store error information in the database for user notification
          storeErrorNotification(storeId, 'product_sync', message, organizationId, userId);
          // Notify failure for product sync
          createAndSendNotification({
            userId,
            organization: organizationId,
            type: 'system',
            subject: `WooCommerce Product Sync Failed - ${store.name}`,
            body: `Product sync failed for ${store.name}. Error: ${message.message}. Type: ${message.errorType}`
          }).catch(() => {});
          reject(new Error(message.message));
        }
      });

      worker.on('error', (error) => {
        console.error(`❌ Product sync worker error: ${error.message}`);
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`❌ Product sync worker stopped with exit code ${code}`);
          reject(new Error(`Worker exited with code ${code}`));
        } else {
          console.log('✅ Product sync worker completed successfully');
          resolve({ status: 'completed' });
        }
      });

    } catch (error) {
      console.error('❌ Error in syncProducts:', error.message);
      reject(error);
    }
  });
};

exports.syncCustomers = async (storeId, organizationId, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`🔄 Starting customer sync for store: ${storeId}`);

      const store = await Store.findById(storeId);
      if (!store) {
        console.error('❌ Store not found for customer sync');
        reject(new Error('Store not found for customer sync'));
        return;
      }

      const organization = await Organization.findById(organizationId);
      if (!organization) {
        console.error('❌ Organization not found for customer sync');
        reject(new Error('Organization not found for customer sync'));
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
          // Notify success for customer sync
          createAndSendNotification({
            userId,
            organization: organizationId,
            type: 'system',
            subject: `WooCommerce Customer Sync Succeeded - ${store.name}`,
            body: `Customer sync completed successfully for ${store.name} at ${new Date().toISOString()}.`
          }).catch(() => {});
          resolve(message);
        } else if (message.status === 'error') {
          console.error(`❌ Customer sync error: ${message.message}`);
          console.error(`📋 Error Type: ${message.errorType}`);
          console.error(`💡 Suggestions: ${message.suggestions?.join(', ')}`);
          
          // Store error information in the database for user notification
          storeErrorNotification(storeId, 'customer_sync', message, organizationId, userId);
          // Notify failure for customer sync
          createAndSendNotification({
            userId,
            organization: organizationId,
            type: 'system',
            subject: `WooCommerce Customer Sync Failed - ${store.name}`,
            body: `Customer sync failed for ${store.name}. Error: ${message.message}. Type: ${message.errorType}`
          }).catch(() => {});
          reject(new Error(message.message));
        }
      });

      worker.on('error', (error) => {
        console.error(`❌ Customer sync worker error: ${error.message}`);
        console.error(`❌ Customer sync worker stack: ${error.stack}`);
        
        // Store error notification for user feedback
        storeErrorNotification(storeId, 'customer_sync_worker_error', {
          message: error.message,
          errorType: 'worker_thread_error',
          suggestions: ['Check worker thread implementation', 'Verify database connections'],
          technicalDetails: error.stack,
          severity: 'error'
        }, organizationId, userId);
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`❌ Customer sync worker stopped with exit code ${code}`);
          
          // Store error notification for user feedback
          storeErrorNotification(storeId, 'customer_sync_worker_exit', {
            message: `Worker exited with code ${code}`,
            errorType: 'worker_thread_exit',
            suggestions: ['Check worker thread logs', 'Verify API credentials'],
            technicalDetails: `Exit code: ${code}`,
            severity: 'error'
          }, organizationId, userId);
          reject(new Error(`Worker exited with code ${code}`));
        } else {
          console.log('✅ Customer sync worker completed successfully');
          resolve({ status: 'completed' });
        }
      });

    } catch (error) {
      console.error('❌ Error in syncCustomers:', error.message);
      reject(error);
    }
  });
};

exports.syncOrders = async (storeId, organizationId, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`🔄 Starting order sync for store: ${storeId}`);

      const store = await Store.findById(storeId);
      if (!store) {
        console.error('❌ Store not found for order sync');
        reject(new Error('Store not found for order sync'));
        return;
      }

      const organization = await Organization.findById(organizationId);
      if (!organization) {
        console.error('❌ Organization not found for order sync');
        reject(new Error('Organization not found for order sync'));
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
          // Notify success for order sync
          createAndSendNotification({
            userId,
            organization: organizationId,
            type: 'system',
            subject: `WooCommerce Order Sync Succeeded - ${store.name}`,
            body: `Order sync completed successfully for ${store.name} at ${new Date().toISOString()}.`
          }).catch(() => {});
          resolve(message);
        } else if (message.status === 'error') {
          console.error(`❌ Order sync error: ${message.message}`);
          console.error(`📋 Error Type: ${message.errorType}`);
          console.error(`💡 Suggestions: ${message.suggestions?.join(', ')}`);
          
          // Store error information in the database for user notification
          storeErrorNotification(storeId, 'order_sync', message, organizationId, userId);
          // Notify failure for order sync
          createAndSendNotification({
            userId,
            organization: organizationId,
            type: 'system',
            subject: `WooCommerce Order Sync Failed - ${store.name}`,
            body: `Order sync failed for ${store.name}. Error: ${message.message}. Type: ${message.errorType}`
          }).catch(() => {});
          reject(new Error(message.message));
        }
      });

      worker.on('error', (error) => {
        console.error(`❌ Order sync worker error: ${error.message}`);
        console.error(`❌ Order sync worker stack: ${error.stack}`);
        
        // Store error notification for user feedback
        storeErrorNotification(storeId, 'order_sync_worker_error', {
          message: error.message,
          errorType: 'worker_thread_error',
          suggestions: ['Check worker thread implementation', 'Verify database connections'],
          technicalDetails: error.stack,
          severity: 'error'
        }, organizationId, userId);
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`❌ Order sync worker stopped with exit code ${code}`);
          
          // Store error notification for user feedback
          storeErrorNotification(storeId, 'order_sync_worker_exit', {
            message: `Worker exited with code ${code}`,
            errorType: 'worker_thread_exit',
            suggestions: ['Check worker thread logs', 'Verify API credentials'],
            technicalDetails: `Exit code: ${code}`,
            severity: 'error'
          }, organizationId, userId);
          reject(new Error(`Worker exited with code ${code}`));
        } else {
          console.log('✅ Order sync worker completed successfully');
          resolve({ status: 'completed' });
        }
      });

    } catch (error) {
      console.error('❌ Error in syncOrders:', error.message);
      reject(error);
    }
  });
};

// Category sync function (different pattern - uses helper function)
exports.syncCategoriesWithWooCommerce = async (storeId, organizationId, userId) => {
  try {
    console.log(`🔄 Starting category sync for store: ${storeId}`);

    const store = await Store.findById(storeId);
    if (!store) {
      console.error('❌ Store not found for category sync');
      return;
    }

    const { syncCategories } = require('../helper/wooCommerceCategoryHelper');
    
    const syncResult = await syncCategories(storeId, userId, organizationId);
    if (syncResult && syncResult.success) {
      console.log(`✅ Category sync completed:`, syncResult);
      createAndSendNotification({
        userId,
        organization: organizationId,
        type: 'system',
        subject: `WooCommerce Category Sync Succeeded - ${store.name}`,
        body: `Category sync completed successfully for ${store.name} at ${new Date().toISOString()}.`
      }).catch(() => {});
    } else {
      const errorMsg = (syncResult && syncResult.error) || 'Unknown error';
      console.error('❌ Category sync failed:', errorMsg);
      createAndSendNotification({
        userId,
        organization: organizationId,
        type: 'system',
        subject: `WooCommerce Category Sync Failed - ${store.name}`,
        body: `Category sync failed for ${store.name}. Error: ${errorMsg}`
      }).catch(() => {});
    }

  } catch (error) {
    console.error('❌ Error in syncCategoriesWithWooCommerce:', error.message);
    createAndSendNotification({
      userId,
      organization: organizationId,
      type: 'system',
      subject: `WooCommerce Category Sync Failed - ${storeId}`,
      body: `Category sync failed for store ${storeId}. Error: ${error.message}`
    }).catch(() => {});
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
          await exports.syncCategoriesWithWooCommerce(savedStore._id, organizationId, userId);
          await exports.syncProducts(savedStore._id, organizationId, userId);
          await exports.syncCustomers(savedStore._id, organizationId, userId);
          await exports.syncOrders(savedStore._id, organizationId, userId);
          
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
// Sync store with WooCommerce (triggers categories, products, customers, orders)
exports.syncStoreWithWooCommerce = async (req, res) => {
  const { storeId } = req.params;
  try {
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    // Map IDs from authenticated user document
    const userId = req.user?._id?.toString();
    const organizationId = (req.user?.organization?._id || req.user?.organization)?.toString();
    console.log('req.user', req.user);
    console.log('user and organization id', userId, organizationId);
    if (!organizationId || !userId) {
      return res.status(400).json({ success: false, message: 'Missing organization or user context for sync' });
    }

    if (
      store.platformType !== 'woocommerce' ||
      !store.url ||
      !store.apiKey ||
      !store.secretKey
    ) {
      return res.status(400).json({
        success: false,
        message: 'Store is not configured for WooCommerce sync (platform/credentials missing)'
      });
    }

    // Notify sync started
    createAndSendNotification({
      userId,
      organization: organizationId,
      type: 'system',
      subject: `WooCommerce Sync Started - ${store.name}`,
      body: `Sync started for ${store.name} at ${new Date().toISOString()}.`
    }).catch(() => {});

    // Kick off syncs asynchronously (do not block response)
    setImmediate(async () => {
      try {
        console.log('🔄 Starting sync pipeline for store:', storeId);
        
        // Track sync status
        const syncStatus = {
          categories: 'pending',
          products: 'pending', 
          customers: 'pending',
          orders: 'pending'
        };
        
        // Update store with sync status
        await Store.findByIdAndUpdate(storeId, { 
          syncStatus,
          lastSyncDate: new Date()
        });
        
        console.log('🔄 Starting category sync...');
        await exports.syncCategoriesWithWooCommerce(storeId, organizationId, userId);
        syncStatus.categories = 'completed';
        await Store.findByIdAndUpdate(storeId, { syncStatus });
        console.log('✅ Category sync completed');
        
        console.log('🔄 Starting product sync...');
        await exports.syncProducts(storeId, organizationId, userId);
        syncStatus.products = 'completed';
        await Store.findByIdAndUpdate(storeId, { syncStatus });
        console.log('✅ Product sync completed');
        
        console.log('🔄 Starting customer sync...');
        await exports.syncCustomers(storeId, organizationId, userId);
        syncStatus.customers = 'completed';
        await Store.findByIdAndUpdate(storeId, { syncStatus });
        console.log('✅ Customer sync completed');
        
        console.log('🔄 Starting order sync...');
        await exports.syncOrders(storeId, organizationId, userId);
        syncStatus.orders = 'completed';
        await Store.findByIdAndUpdate(storeId, { syncStatus });
        console.log('✅ Order sync completed');
        
        console.log('✅ All syncs completed for store:', storeId);
        
      } catch (e) {
        console.error('❌ Error starting store sync pipeline:', e);
        
        // Update sync status to failed
        await Store.findByIdAndUpdate(storeId, { 
          syncStatus: {
            categories: 'failed',
            products: 'failed',
            customers: 'failed', 
            orders: 'failed'
          }
        });
      }
    });

    store.lastSyncDate = new Date();
    await store.save();

    return res.status(200).json({
      success: true,
      message: 'Store sync started (categories, products, customers, orders)',
      store: {
        _id: store._id,
        name: store.name,
        platformType: store.platformType,
        lastSyncDate: store.lastSyncDate
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to start store sync" });
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

/**
 * @swagger
 * /api/stores/{storeId}/sync-status:
 *   get:
 *     summary: Get sync status for a store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Sync status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 syncStatus:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: string
 *                       example: "completed"
 *                     products:
 *                       type: string
 *                       example: "completed"
 *                     customers:
 *                       type: string
 *                       example: "failed"
 *                     orders:
 *                       type: string
 *                       example: "pending"
 *       404:
 *         description: Store not found
 */
exports.getSyncStatus = async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const store = await Store.findById(storeId).select('syncStatus lastSyncDate name');
    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }
    
    res.status(200).json({
      success: true,
      syncStatus: store.syncStatus,
      lastSyncDate: store.lastSyncDate,
      storeName: store.name
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ success: false, message: "Failed to get sync status" });
  }
};

/**
 * @swagger
 * /api/stores/{storeId}/notifications:
 *   get:
 *     summary: Get all notifications for a store (including sync errors)
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [system, email, sms, push]
 *         description: Filter by notification type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, failed, read]
 *         description: Filter by notification status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of notifications to return
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       subject:
 *                         type: string
 *                       body:
 *                         type: string
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       sentAt:
 *                         type: string
 *                 count:
 *                   type: integer
 *                   example: 5
 *       404:
 *         description: Store not found
 */
exports.getStoreNotifications = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { type, status, limit = 50 } = req.query;
    
    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }
    
    // Get user ID from request
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res.status(400).json({ success: false, message: "User not authenticated" });
    }
    
    // Build query for notifications
    const query = { user: userId };
    if (type) query.type = type;
    if (status) query.status = status;
    
    // Get notifications
    const notifications = await require('../models/notification').find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('_id subject body type status createdAt sentAt deliveryStatus errorMessage');
    
    // Format notifications for response
    const formattedNotifications = notifications.map(notification => ({
      _id: notification._id,
      subject: notification.subject,
      body: notification.body,
      type: notification.type,
      status: notification.status,
      createdAt: notification.createdAt,
      sentAt: notification.sentAt,
      deliveryStatus: notification.deliveryStatus,
      errorMessage: notification.errorMessage
    }));
    
    res.status(200).json({
      success: true,
      notifications: formattedNotifications,
      count: formattedNotifications.length,
      storeId: storeId,
      storeName: store.name
    });
    
  } catch (error) {
    console.error('Error getting store notifications:', error);
    res.status(500).json({ success: false, message: "Failed to get store notifications" });
  }
};

/**
 * @swagger
 * /api/stores/{storeId}/test-notification:
 *   post:
 *     summary: Send a test notification to verify notification system
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Test notification from store sync system"
 *     responses:
 *       200:
 *         description: Test notification sent successfully
 *       404:
 *         description: Store not found
 */
exports.sendTestNotification = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { message = "Test notification from store sync system" } = req.body;
    
    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }
    
    // Get user ID from request
    const userId = req.user?._id?.toString();
    const organizationId = (req.user?.organization?._id || req.user?.organization)?.toString();
    
    if (!userId || !organizationId) {
      return res.status(400).json({ success: false, message: "User context missing" });
    }
    
    // Send test notification
    const notificationResult = await createAndSendNotification({
      userId,
      organization: organizationId,
      type: 'system',
      subject: `Test Notification - ${store.name}`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">✅ Test Notification</h2>
          <p><strong>Store:</strong> ${store.name}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <hr>
          <p style="color: #6c757d; font-size: 12px;">
            This is a test notification to verify the notification system is working correctly.
          </p>
        </div>
      `
    });
    
    if (notificationResult.success) {
      res.status(200).json({
        success: true,
        message: "Test notification sent successfully",
        notificationId: notificationResult.notificationId
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send test notification",
        error: notificationResult.error
      });
    }
    
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ success: false, message: "Failed to send test notification" });
  }
};
