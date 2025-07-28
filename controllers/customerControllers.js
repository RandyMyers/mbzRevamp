const Customer = require('../models/customers'); // Adjust the path as per your project structure
const { Worker } = require('worker_threads');
const path = require('path');
const Store = require('../models/store');
const Organization = require('../models/organization');
const WooCommerceService = require('../services/wooCommerceService.js');
const logEvent = require('../helper/logEvent');
const cloudinary = require('cloudinary').v2;

exports.syncCustomers = async (req, res) => {
  try {
    const { storeId, organizationId } = req.params;
    const { userId } = req.body;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const organization = await Organization.findById(organizationId);
    if (!organization) return res.status(404).json({ error: 'Organization not found' });

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
        console.log(message.message);
      } else if (message.status === 'error') {
        console.error(`Error in worker thread: ${message.message}`);
      }
    });

    worker.on('error', (error) => {
      console.error(`Worker thread error: ${error.message}`);
    });

    worker.on('exit', (code) => {
      if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
    });

    res.json({ message: 'Customer synchronization started in the background' });
  } catch (error) {
    console.error('Error in syncCustomers:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.createCustomer = async (req, res) => {
    try {
      const {
        storeId,
        userId,
        organizationId,
        customer_id, // Optional - will be set after WooCommerce sync
        customer_ip_address,
        date_created,
        date_created_gmt,
        date_modified,
        date_modified_gmt,
        email,
        first_name,
        last_name,
        role,
        username,
        billing,
        shipping,
        is_paying_customer,
        avatar_url,
        meta_data,
        _links,
        syncToWooCommerce = false, // NEW: Option to sync to WooCommerce
      } = req.body;
  
      // Validate required fields (removed customer_id from required fields)
      const requiredFields = ['storeId', 'userId', 'organizationId'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }

      // Validate data types and convert if necessary
      const now = new Date();
      
      // Handle avatar upload if file is provided
      let processedAvatarUrl = avatar_url;
      
      if (req.files && req.files.avatar) {
        try {
          // Upload the avatar to Cloudinary
          const result = await cloudinary.uploader.upload(req.files.avatar.tempFilePath, {
            folder: 'customer_avatars',
          });
          
          processedAvatarUrl = result.secure_url;
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload avatar to Cloudinary',
            error: uploadError.message
          });
        }
      }
      
      // Process billing data if provided
      const processedBilling = billing ? {
        first_name: billing.first_name || '',
        last_name: billing.last_name || '',
        company: billing.company || '',
        address_1: billing.address_1 || '',
        address_2: billing.address_2 || '',
        city: billing.city || '',
        state: billing.state || '',
        postcode: billing.postcode || '',
        country: billing.country || '',
        email: billing.email || email || '',
        phone: billing.phone || ''
      } : null;

      // Process shipping data if provided
      const processedShipping = shipping ? {
        first_name: shipping.first_name || '',
        last_name: shipping.last_name || '',
        company: shipping.company || '',
        address_1: shipping.address_1 || '',
        address_2: shipping.address_2 || '',
        city: shipping.city || '',
        state: shipping.state || '',
        postcode: shipping.postcode || '',
        country: shipping.country || ''
      } : null;

      // Process meta_data if provided
      const processedMetaData = meta_data ? meta_data.map(item => ({
        key: item.key || '',
        value: item.value || null
      })) : [];

      // Process _links if provided
      const processedLinks = _links ? {
        self: _links.self ? _links.self.map(link => ({
          href: link.href || ''
        })) : [],
        collection: _links.collection ? _links.collection.map(link => ({
          href: link.href || ''
        })) : []
      } : null;

      // PHASE 1: Create customer in local database first
      const newCustomer = new Customer({
        storeId,
        userId,
        organizationId,
        customer_id: customer_id ? Number(customer_id) : null, // Optional now
        customer_ip_address,
        date_created: date_created || now,
        date_created_gmt: date_created_gmt || now,
        date_modified: date_modified || now,
        date_modified_gmt: date_modified_gmt || now,
        email,
        first_name,
        last_name,
        role: role || 'customer',
        username,
        billing: processedBilling,
        shipping: processedShipping,
        is_paying_customer: Boolean(is_paying_customer),
        avatar_url: processedAvatarUrl,
        meta_data: processedMetaData,
        _links: processedLinks,
        syncStatus: syncToWooCommerce ? 'pending' : 'not_synced',
        syncError: null,
      });

      const savedCustomer = await newCustomer.save();

      let wooCommerceId = null;
      let syncStatus = savedCustomer.syncStatus;
      let syncError = null;

      // PHASE 2: Sync to WooCommerce if requested
      if (syncToWooCommerce && storeId) {
        try {
          // Get store information
          const store = await Store.findById(storeId);
          if (!store) {
            syncStatus = 'failed';
            syncError = 'Store not found for WooCommerce sync';
          } else {
            // Create WooCommerce service instance
            const wooCommerceService = new WooCommerceService(store);

            // Prepare customer data for WooCommerce
            const customerData = {
              storeId,
              userId,
              organizationId,
              customer_id: savedCustomer.local_id, // Use local_id for WooCommerce
              customer_ip_address,
              date_created: date_created || now,
              date_created_gmt: date_created_gmt || now,
              date_modified: date_modified || now,
              date_modified_gmt: date_modified_gmt || now,
              email,
              first_name,
              last_name,
              role: role || 'customer',
              username,
              billing: processedBilling,
              shipping: processedShipping,
              is_paying_customer: Boolean(is_paying_customer),
              avatar_url: processedAvatarUrl,
              meta_data: processedMetaData,
              _links: processedLinks,
            };

            // Create customer in WooCommerce
            const wooCommerceResult = await wooCommerceService.createCustomer(customerData);
            
            if (wooCommerceResult.success) {
              wooCommerceId = wooCommerceResult.data.id;
              syncStatus = 'synced';
              
              // Update local record with WooCommerce ID
              await Customer.findByIdAndUpdate(savedCustomer._id, {
                customer_id: wooCommerceId,
                wooCommerceId: wooCommerceId,
                lastWooCommerceSync: new Date(),
                syncStatus: 'synced',
                syncError: null
              });
            } else {
              syncStatus = 'failed';
              syncError = wooCommerceResult.error?.message || 'WooCommerce sync failed';
              console.error('WooCommerce sync error:', wooCommerceResult.error);
              
              // Update local record with sync failure
              await Customer.findByIdAndUpdate(savedCustomer._id, {
                syncStatus: 'failed',
                syncError: syncError
              });
            }
          }
        } catch (wooCommerceError) {
          syncStatus = 'failed';
          syncError = wooCommerceError.message;
          console.error('WooCommerce sync error:', wooCommerceError);
          
          // Update local record with sync failure
          await Customer.findByIdAndUpdate(savedCustomer._id, {
            syncStatus: 'failed',
            syncError: syncError
          });
        }
      }

      // Get updated customer record
      const updatedCustomer = await Customer.findById(savedCustomer._id);

      // Log the event
      await logEvent({
        action: 'create_customer',
        user: req.user?._id || userId,
        resource: 'Customer',
        resourceId: updatedCustomer._id,
        details: { 
          email: updatedCustomer.email, 
          syncToWooCommerce,
          syncStatus,
          wooCommerceId 
        },
        organization: req.user?.organization || organizationId
      });

      res.status(201).json({ 
        success: true,
        message: 'Customer created successfully.', 
        data: updatedCustomer,
        wooCommerceSync: {
          synced: syncStatus === 'synced',
          wooCommerceId,
          status: syncStatus,
          error: syncError
        }
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating customer.', 
        error: error.message 
      });
    }
  };

  exports.getCustomersByOrganizationId = async (req, res) => {
    try {
      const { organizationId } = req.params;
  
      // Fetch customers by organizationId and populate related fields
      const customers = await Customer.find({ organizationId })
        .populate('storeId', 'name') // Adjust fields to match Store schema
        .populate('userId', 'name email') // Adjust fields to match User schema
        .populate('organizationId', 'name'); // Adjust fields to match Organization schema
  
      if (customers.length === 0) {
        return res.status(404).json({ message: 'No customers found for this organization.' });
      }
  
      res.status(200).json({
        message: 'Customers retrieved successfully for the organization.',
        customers,
      });
    } catch (error) {
      console.error('Error retrieving customers by organization ID:', error);
      res.status(500).json({
        message: 'Error retrieving customers by organization ID.',
        error: error.message,
      });
    }
  }

  exports.getAllCustomers = async (req, res) => {
    try {
      const customers = await Customer.find()
        .populate('storeId', 'name') // Adjust fields to populate as per your Store schema
        .populate('userId', 'name email') // Adjust fields to populate as per your User schema
        .populate('organizationId', 'name'); // Adjust fields to populate as per your Organization schema
  
      res.status(200).json({ message: 'Customers retrieved successfully.', data: customers });
    } catch (error) {
      console.error('Error retrieving customers:', error);
      res.status(500).json({ message: 'Error retrieving customers.', error });
    }
  };

  exports.getCustomerById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const customer = await Customer.findById(id)
        .populate('storeId', 'name')
        .populate('userId', 'name email')
        .populate('organizationId', 'name');
  
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found.' });
      }
  
      res.status(200).json({ message: 'Customer retrieved successfully.', data: customer });
    } catch (error) {
      console.error('Error retrieving customer:', error);
      res.status(500).json({ message: 'Error retrieving customer.', error });
    }
  };

  exports.updateCustomer = async (req, res) => {
    try {
      const { id } = req.params;
      const { syncToWooCommerce = false, ...updates } = req.body;

      // Define allowed fields that can be updated
      const allowedFields = [
        'customer_ip_address',
        'date_created',
        'date_created_gmt',
        'date_modified',
        'date_modified_gmt',
        'email',
        'first_name',
        'last_name',
        'role',
        'username',
        'billing',
        'shipping',
        'is_paying_customer',
        'avatar_url',
        'meta_data',
        '_links'
      ];

      // Sanitize update data - only allow specified fields
      const sanitizedUpdates = {};
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          sanitizedUpdates[field] = updates[field];
        }
      });

      // Validate and process specific fields
      if (sanitizedUpdates.is_paying_customer !== undefined) {
        sanitizedUpdates.is_paying_customer = Boolean(sanitizedUpdates.is_paying_customer);
      }

      // Process billing data if provided
      if (sanitizedUpdates.billing) {
        sanitizedUpdates.billing = {
          first_name: sanitizedUpdates.billing.first_name || '',
          last_name: sanitizedUpdates.billing.last_name || '',
          company: sanitizedUpdates.billing.company || '',
          address_1: sanitizedUpdates.billing.address_1 || '',
          address_2: sanitizedUpdates.billing.address_2 || '',
          city: sanitizedUpdates.billing.city || '',
          state: sanitizedUpdates.billing.state || '',
          postcode: sanitizedUpdates.billing.postcode || '',
          country: sanitizedUpdates.billing.country || '',
          email: sanitizedUpdates.billing.email || '',
          phone: sanitizedUpdates.billing.phone || ''
        };
      }

      // Process shipping data if provided
      if (sanitizedUpdates.shipping) {
        sanitizedUpdates.shipping = {
          first_name: sanitizedUpdates.shipping.first_name || '',
          last_name: sanitizedUpdates.shipping.last_name || '',
          company: sanitizedUpdates.shipping.company || '',
          address_1: sanitizedUpdates.shipping.address_1 || '',
          address_2: sanitizedUpdates.shipping.address_2 || '',
          city: sanitizedUpdates.shipping.city || '',
          state: sanitizedUpdates.shipping.state || '',
          postcode: sanitizedUpdates.shipping.postcode || '',
          country: sanitizedUpdates.shipping.country || ''
        };
      }

      // Process meta_data if provided
      if (sanitizedUpdates.meta_data) {
        sanitizedUpdates.meta_data = sanitizedUpdates.meta_data.map(item => ({
          key: item.key || '',
          value: item.value || null
        }));
      }

      // Process _links if provided
      if (sanitizedUpdates._links) {
        sanitizedUpdates._links = {
          self: sanitizedUpdates._links.self ? sanitizedUpdates._links.self.map(link => ({
            href: link.href || ''
          })) : [],
          collection: sanitizedUpdates._links.collection ? sanitizedUpdates._links.collection.map(link => ({
            href: link.href || ''
          })) : []
        };
      }

      // Handle avatar upload if file is provided
      if (req.files && req.files.avatar) {
        try {
          // Upload the avatar to Cloudinary
          const result = await cloudinary.uploader.upload(req.files.avatar.tempFilePath, {
            folder: 'customer_avatars',
          });
          
          sanitizedUpdates.avatar_url = result.secure_url;
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload avatar to Cloudinary',
            error: uploadError.message
          });
        }
      }

      // Get the current customer to check if it has a WooCommerce ID
      const currentCustomer = await Customer.findById(id);
      if (!currentCustomer) {
        return res.status(404).json({ success: false, message: 'Customer not found.' });
      }

      let wooCommerceSync = null;

      // If sync to WooCommerce is requested
      if (syncToWooCommerce && currentCustomer.storeId) {
        try {
          // Get store information
          const store = await Store.findById(currentCustomer.storeId);
          if (!store) {
            return res.status(404).json({ 
              success: false, 
              message: "Store not found for WooCommerce sync" 
            });
          }

          // Create WooCommerce service instance
          const wooCommerceService = new WooCommerceService(store);

          // Prepare customer data for WooCommerce (merge current data with updates)
          const customerData = {
            ...currentCustomer.toObject(),
            ...sanitizedUpdates
          };

          let wooCommerceResult;

          // If customer already exists in WooCommerce, update it
          if (currentCustomer.wooCommerceId) {
            wooCommerceResult = await wooCommerceService.updateCustomer(
              currentCustomer.wooCommerceId, 
              customerData
            );
          } else {
            // If customer doesn't exist in WooCommerce, create it
            wooCommerceResult = await wooCommerceService.createCustomer(customerData);
          }
          
          if (wooCommerceResult.success) {
            // Update the WooCommerce ID if it's a new customer
            if (!currentCustomer.wooCommerceId && wooCommerceResult.data.id) {
              sanitizedUpdates.wooCommerceId = wooCommerceResult.data.id;
            }
            
            sanitizedUpdates.lastWooCommerceSync = new Date();
            sanitizedUpdates.syncStatus = 'synced';
            sanitizedUpdates.syncError = null;
            
            wooCommerceSync = {
              synced: true,
              wooCommerceId: sanitizedUpdates.wooCommerceId || currentCustomer.wooCommerceId,
              status: 'synced',
              error: null
            };
          } else {
            sanitizedUpdates.syncStatus = 'failed';
            sanitizedUpdates.syncError = wooCommerceResult.error?.message || 'WooCommerce sync failed';
            
            wooCommerceSync = {
              synced: false,
              wooCommerceId: currentCustomer.wooCommerceId,
              status: 'failed',
              error: sanitizedUpdates.syncError
            };
            
            console.error('WooCommerce sync error:', wooCommerceResult.error);
          }
        } catch (wooCommerceError) {
          sanitizedUpdates.syncStatus = 'failed';
          sanitizedUpdates.syncError = wooCommerceError.message;
          
          wooCommerceSync = {
            synced: false,
            wooCommerceId: currentCustomer.wooCommerceId,
            status: 'failed',
            error: wooCommerceError.message
          };
          
          console.error('WooCommerce sync error:', wooCommerceError);
        }
      }
  
      const updatedCustomer = await Customer.findByIdAndUpdate(id, sanitizedUpdates, {
        new: true,
        runValidators: true,
      });
  
      // Log the event
      await logEvent({
        action: 'update_customer',
        user: req.user?._id,
        resource: 'Customer',
        resourceId: updatedCustomer._id,
        details: { 
          email: updatedCustomer.email, 
          syncToWooCommerce,
          syncStatus: sanitizedUpdates.syncStatus,
          wooCommerceId: sanitizedUpdates.wooCommerceId || currentCustomer.wooCommerceId
        },
        organization: req.user?.organization || currentCustomer.organizationId
      });

      res.status(200).json({ 
        success: true,
        message: 'Customer updated successfully.', 
        data: updatedCustomer,
        wooCommerceSync
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating customer.', 
        error: error.message 
      });
    }
  };

  exports.deleteCustomer = async (req, res) => {
    try {
      const { id } = req.params;
      const { syncToWooCommerce = false } = req.body;

      // Get the customer before deleting to check if it has a WooCommerce ID
      const customerToDelete = await Customer.findById(id);
      if (!customerToDelete) {
        return res.status(404).json({ success: false, message: 'Customer not found.' });
      }

      let wooCommerceSync = null;

      // If sync to WooCommerce is requested and customer exists in WooCommerce
      if (syncToWooCommerce && customerToDelete.wooCommerceId && customerToDelete.storeId) {
        try {
          // Get store information
          const store = await Store.findById(customerToDelete.storeId);
          if (!store) {
            return res.status(404).json({ 
              success: false, 
              message: "Store not found for WooCommerce sync" 
            });
          }

          // Create WooCommerce service instance
          const wooCommerceService = new WooCommerceService(store);

          // Delete customer from WooCommerce
          const wooCommerceResult = await wooCommerceService.deleteCustomer(customerToDelete.wooCommerceId);
          
          if (wooCommerceResult.success) {
            wooCommerceSync = {
              synced: true,
              wooCommerceId: customerToDelete.wooCommerceId,
              status: 'deleted',
              error: null
            };
          } else {
            wooCommerceSync = {
              synced: false,
              wooCommerceId: customerToDelete.wooCommerceId,
              status: 'failed',
              error: wooCommerceResult.error?.message || 'WooCommerce delete failed'
            };
            console.error('WooCommerce delete error:', wooCommerceResult.error);
          }
        } catch (wooCommerceError) {
          wooCommerceSync = {
            synced: false,
            wooCommerceId: customerToDelete.wooCommerceId,
            status: 'failed',
            error: wooCommerceError.message
          };
          console.error('WooCommerce delete error:', wooCommerceError);
        }
      }
  
      const deletedCustomer = await Customer.findByIdAndDelete(id);
  
      // Log the event
      await logEvent({
        action: 'delete_customer',
        user: req.user?._id,
        resource: 'Customer',
        resourceId: customerToDelete._id,
        details: { 
          email: customerToDelete.email, 
          syncToWooCommerce,
          wooCommerceId: customerToDelete.wooCommerceId
        },
        organization: req.user?.organization || customerToDelete.organizationId
      });

      res.status(200).json({ 
        success: true,
        message: 'Customer deleted successfully.', 
        data: deletedCustomer,
        wooCommerceSync
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ message: 'Error deleting customer.', error });
    }
  };

  exports.getCustomersByStoreId = async (req, res) => {
    try {
      const { storeId } = req.params;
  
      const customers = await Customer.find({ storeId }).populate('userId', 'name email');
  
      res.status(200).json({ message: 'Customers retrieved successfully for the store.', data: customers });
    } catch (error) {
      console.error('Error retrieving customers by store ID:', error);
      res.status(500).json({ message: 'Error retrieving customers by store ID.', error });
    }
  };

  // DELETE all customers for a specific store
  exports.deleteAllCustomersByStore = async (req, res) => {
    try {
      const { storeId } = req.params;
      const { syncToWooCommerce = false } = req.body;

      console.log(`🗑️ Starting bulk customer deletion for store: ${storeId}`);
      console.log(`🔄 WooCommerce sync enabled: ${syncToWooCommerce}`);

      // Get store information for WooCommerce sync
      let store = null;
      if (syncToWooCommerce) {
        store = await Store.findById(storeId);
        if (!store) {
          return res.status(404).json({ 
            success: false, 
            message: "Store not found for WooCommerce sync" 
          });
        }
      }

      // Get all customers for the store
      const customers = await Customer.find({ storeId });
      console.log(`📊 Found ${customers.length} customers to delete`);

      if (customers.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "No customers found for this store" 
        });
      }

      let wooCommerceSyncResults = {
        total: customers.length,
        synced: 0,
        failed: 0,
        errors: []
      };

      // Delete from WooCommerce if requested
      if (syncToWooCommerce && store) {
        console.log(`🔄 Starting WooCommerce deletion for ${customers.length} customers`);
        
        const WooCommerceService = require('../services/wooCommerceService');
        const wooCommerceService = new WooCommerceService(store);

        for (const customer of customers) {
          if (customer.wooCommerceId) {
            try {
              const wooCommerceResult = await wooCommerceService.deleteCustomer(customer.wooCommerceId);
              
              if (wooCommerceResult.success) {
                wooCommerceSyncResults.synced++;
                console.log(`✅ WooCommerce customer deleted: ${customer.email} (ID: ${customer.wooCommerceId})`);
              } else {
                wooCommerceSyncResults.failed++;
                wooCommerceSyncResults.errors.push({
                  customerId: customer._id,
                  email: customer.email,
                  wooCommerceId: customer.wooCommerceId,
                  error: wooCommerceResult.error?.message || 'WooCommerce delete failed'
                });
                console.error(`❌ WooCommerce delete failed for customer ${customer.email}:`, wooCommerceResult.error);
              }
            } catch (wooCommerceError) {
              wooCommerceSyncResults.failed++;
              wooCommerceSyncResults.errors.push({
                customerId: customer._id,
                email: customer.email,
                wooCommerceId: customer.wooCommerceId,
                error: wooCommerceError.message
              });
              console.error(`❌ WooCommerce delete error for customer ${customer.email}:`, wooCommerceError);
            }
          } else {
            console.log(`⚠️ Customer ${customer.email} has no WooCommerce ID, skipping WooCommerce deletion`);
          }
        }
      }

      // Delete from database
      const result = await Customer.deleteMany({ storeId });
      console.log(`🗑️ Deleted ${result.deletedCount} customers from database`);

      // Log the event
      await logEvent({
        action: 'delete_all_customers_by_store',
        user: req.user?._id,
        resource: 'Customer',
        resourceId: storeId,
        details: { 
          storeId, 
          deletedCount: result.deletedCount,
          totalCustomers: customers.length,
          syncToWooCommerce,
          wooCommerceSyncResults
        },
        organization: req.user?.organization
      });

      const response = {
        success: true,
        message: `Successfully deleted ${result.deletedCount} customers from store`,
        data: {
          deletedCount: result.deletedCount,
          totalCustomers: customers.length,
          storeId: storeId
        }
      };

      // Include WooCommerce sync results if sync was attempted
      if (syncToWooCommerce) {
        response.wooCommerceSync = wooCommerceSyncResults;
      }

      console.log(`✅ Bulk customer deletion completed for store ${storeId}`);
      res.status(200).json(response);

    } catch (error) {
      console.error('❌ Error in bulk customer deletion:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting customers from store', 
        error: error.message 
      });
    }
  };
  
  // MANUAL SYNC: Sync a customer to WooCommerce
  exports.syncCustomerToWooCommerce = async (req, res) => {
    const { customerId } = req.params;
    
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      if (!customer.storeId) {
        return res.status(400).json({ 
          success: false, 
          message: "Customer is not associated with a store" 
        });
      }

      // Get store information
      const store = await Store.findById(customer.storeId);
      if (!store) {
        return res.status(404).json({ 
          success: false, 
          message: "Store not found" 
        });
      }

      // Create WooCommerce service instance
      const wooCommerceService = new WooCommerceService(store);

      let wooCommerceResult;
      let syncAction = '';

      // Prepare customer data for WooCommerce
      const customerData = customer.toObject();

      // If customer already exists in WooCommerce, update it
      if (customer.wooCommerceId) {
        wooCommerceResult = await wooCommerceService.updateCustomer(customer.wooCommerceId, customerData);
        syncAction = 'updated';
      } else {
        // If customer doesn't exist in WooCommerce, create it
        wooCommerceResult = await wooCommerceService.createCustomer(customerData);
        syncAction = 'created';
      }

      if (wooCommerceResult.success) {
        // Update local record with WooCommerce sync results
        const updateData = {
          wooCommerceId: wooCommerceResult.data.id,
          customer_id: wooCommerceResult.data.id,
          lastWooCommerceSync: new Date(),
          syncStatus: 'synced',
          syncError: null
        };

        const updatedCustomer = await Customer.findByIdAndUpdate(
          customerId, 
          updateData, 
          { new: true }
        );

        // Log the event
        await logEvent({
          action: 'sync_customer_to_woocommerce',
          user: req.user?._id || customer.userId,
          resource: 'Customer',
          resourceId: customer._id,
          details: { 
            email: customer.email, 
            action: syncAction,
            wooCommerceId: wooCommerceResult.data.id 
          },
          organization: req.user?.organization || customer.organizationId
        });

        res.json({ 
          success: true, 
          message: `Customer ${syncAction} in WooCommerce successfully`,
          data: updatedCustomer,
          wooCommerceSync: {
            synced: true,
            action: syncAction,
            wooCommerceId: wooCommerceResult.data.id,
            status: 'synced',
            error: null
          }
        });
      } else {
        // Update local record with sync failure
        await Customer.findByIdAndUpdate(customerId, {
          syncStatus: 'failed',
          syncError: wooCommerceResult.error?.message || 'WooCommerce sync failed'
        });

        res.status(500).json({ 
          success: false, 
          message: "Failed to sync customer to WooCommerce",
          wooCommerceSync: {
            synced: false,
            action: syncAction,
            wooCommerceId: null,
            status: 'failed',
            error: wooCommerceResult.error?.message || 'WooCommerce sync failed'
          }
        });
      }
    } catch (error) {
      console.error('Error syncing customer to WooCommerce:', error);
      
      // Update local record with sync failure
      await Customer.findByIdAndUpdate(customerId, {
        syncStatus: 'failed',
        syncError: error.message
      });

      res.status(500).json({ 
        success: false, 
        message: "Error syncing customer to WooCommerce",
        error: error.message 
      });
    }
  };

  // RETRY SYNC: Retry WooCommerce sync for failed customers
  exports.retryCustomerWooCommerceSync = async (req, res) => {
    const { customerId } = req.params;
    
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      if (customer.syncStatus !== 'failed') {
        return res.status(400).json({ 
          success: false, 
          message: "Customer is not in failed sync status" 
        });
      }

      // Call the sync function
      return await exports.syncCustomerToWooCommerce(req, res);
    } catch (error) {
      console.error('Error retrying customer WooCommerce sync:', error);
      res.status(500).json({ 
        success: false, 
        message: "Error retrying customer WooCommerce sync",
        error: error.message 
      });
    }
  };