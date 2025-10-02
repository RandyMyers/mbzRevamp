const { parentPort, workerData } = require('worker_threads');
const Customer = require('../models/customers');
const connectDB = require('./connectDB');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const https = require('https');
const StoreErrorHandler = require('../services/storeErrorHandler');

const syncCustomerJob = async (jobData) => {
  try {
    const { storeId, store, organizationId, userId } = workerData;

    // Connect to MongoDB
    connectDB();

    // Create HTTPS agent configuration for SSL bypass (if needed)
    let httpsAgent = null;
    if (process.env.WOOCOMMERCE_BYPASS_SSL === 'true' || process.env.NODE_ENV === 'development') {
      httpsAgent = new https.Agent({
        rejectUnauthorized: false // WARNING: This bypasses SSL certificate validation
      });
    }

    const wooCommerce = new WooCommerceRestApi({
      url: store.url,
      consumerKey: store.apiKey,
      consumerSecret: store.secretKey,
      version: 'wc/v3',
      queryStringAuth: true, // Force Basic Authentication as query string
      ...(httpsAgent && { httpsAgent }) // Only add httpsAgent if it's configured
    });

    const getAllCustomers = async (page = 1) => {
      try {
        const response = await wooCommerce.get('customers', { per_page: 100, page });
        return response.data;
      } catch (error) {
        // Parse the error using our error handler
        const errorInfo = StoreErrorHandler.parseStoreError(error, store, 'customer sync');
        StoreErrorHandler.logError(errorInfo, 'syncCustomerWorker.getAllCustomers');
        
        // Send detailed error message to parent process
        parentPort.postMessage({
          status: 'error',
          message: StoreErrorHandler.createUserMessage(errorInfo),
          errorType: errorInfo.errorType,
          suggestions: errorInfo.suggestedActions,
          technicalDetails: errorInfo.technicalDetails
        });
        
        throw error;
      }
    };

    let customers = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const currentPageCustomers = await getAllCustomers(page);
      if (currentPageCustomers.length === 0) hasMore = false;
      else {
        customers = [...customers, ...currentPageCustomers];
        page++;
      }
    }

    // Sync statistics
    let created = 0;
    let updated = 0;
    let failed = 0;
    let skipped = 0;

    console.log(`Starting customer sync for store ${storeId}. Total customers to process: ${customers.length}`);

    for (const customer of customers) {
      try {
        const wooCommerceId = customer.id;
        
        // Check for existing customer by wooCommerceId first (primary check)
        let existingCustomer = await Customer.findOne({
          wooCommerceId: wooCommerceId,
          storeId: storeId
        });

        // Fallback check: if no wooCommerceId match, check by customer_id
        if (!existingCustomer && customer.id) {
          existingCustomer = await Customer.findOne({
            customer_id: customer.id.toString(),
            storeId: storeId
          });
        }

        // Additional fallback: check by email + storeId (for cases where wooCommerceId might be missing)
        if (!existingCustomer && customer.email) {
          existingCustomer = await Customer.findOne({
            email: customer.email,
            storeId: storeId
          });
        }

        const customerData = {
          storeId,
          organizationId,
          userId,
          wooCommerceId: wooCommerceId, // Primary identifier
          customer_id: customer.id.toString(),
          date_created: new Date(customer.date_created),
          date_created_gmt: new Date(customer.date_created_gmt),
          date_modified: new Date(customer.date_modified),
          date_modified_gmt: new Date(customer.date_modified_gmt),
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name,
          role: customer.role,
          username: customer.username,
          billing: customer.billing,
          shipping: customer.shipping,
          is_paying_customer: customer.is_paying_customer,
          avatar_url: customer.avatar_url,
          meta_data: customer.meta_data,
          _links: customer._links,
          // Sync tracking fields
          lastSyncedAt: new Date(),
          syncStatus: 'synced',
          syncError: null
        };

        if (existingCustomer) {
          // Update existing customer
          await Customer.findOneAndUpdate(
            { _id: existingCustomer._id },
            { $set: customerData },
            { new: true, runValidators: true }
          );
          updated++;
          console.log(`Updated customer: ${customer.email} (WooCommerce ID: ${wooCommerceId})`);
        } else {
          // Create new customer
          await Customer.create(customerData);
          created++;
          console.log(`Created customer: ${customer.email} (WooCommerce ID: ${wooCommerceId})`);
        }
      } catch (error) {
        failed++;
        console.error(`Failed to sync customer ${customer.email} (WooCommerce ID: ${customer.id}):`, error.message);
        
        // Log detailed error for debugging
        console.error('Customer data:', {
          email: customer.email,
          wooCommerceId: customer.id,
          storeId: storeId,
          error: error.message
        });
      }
    }

    const syncSummary = {
      total: customers.length,
      created,
      updated,
      failed,
      skipped
    };

    console.log('Customer sync completed:', syncSummary);
    parentPort.postMessage({ 
      status: 'success', 
      message: 'Customers synchronized successfully',
      data: syncSummary
    });
  } catch (error) {
    console.error('Error in customer sync job:', error);
    
    // Parse the error using our error handler
    const errorInfo = StoreErrorHandler.parseStoreError(error, store, 'customer sync');
    StoreErrorHandler.logError(errorInfo, 'syncCustomerWorker.main');
    
    // Send detailed error information to parent process
    parentPort.postMessage({
      status: 'error',
      message: StoreErrorHandler.createUserMessage(errorInfo),
      errorType: errorInfo.errorType,
      suggestions: errorInfo.suggestedActions,
      technicalDetails: errorInfo.technicalDetails,
      severity: errorInfo.severity
    });
  }
};

syncCustomerJob(workerData);
