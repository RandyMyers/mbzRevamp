const { parentPort, workerData } = require('worker_threads');
const Order = require('../models/order');
const DeletedOrder = require('../models/deletedOrder');
const Customer = require('../models/customers');
const Inventory = require('../models/inventory'); // Import Inventory model
const User = require('../models/users');
const Organization = require('../models/organization');
const connectDB = require('./connectDB');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const https = require('https');
const StoreErrorHandler = require('../services/storeErrorHandler');
const currencyUtils = require('../utils/currencyUtils');

// Extract and upsert customer from order data
const upsertCustomerFromOrder = async (order, organizationId, storeId, userId) => {
  try {
    // Skip if no billing email (required field for customer)
    if (!order.billing || !order.billing.email) {
      return null;
    }

    const email = order.billing.email;
    const woocommerceCustomerId = order.customer_id;

    // Find existing customer by email (primary) or wooCommerceId (secondary)
    let existingCustomer = await Customer.findOne({
      $and: [
        { organizationId },
        { storeId },
        { $or: [
          { email }, // Primary: match by email
          { wooCommerceId: woocommerceCustomerId }, // Secondary: match by WooCommerce ID
          { customer_id: woocommerceCustomerId } // Tertiary: legacy customer_id field
        ]}
      ]
    });

    // Prepare customer data from order
    const customerData = {
      storeId,
      organizationId,
      userId,
      wooCommerceId: woocommerceCustomerId || null,
      customer_id: woocommerceCustomerId ? woocommerceCustomerId.toString() : null,
      email: email,
      first_name: order.billing.first_name || '',
      last_name: order.billing.last_name || '',
      role: 'customer', // Set role to 'customer' so they pass the API filters
      billing: order.billing,
      shipping: order.shipping || {},
      customer_ip_address: order.customer_ip_address || '',
      date_created: order.date_created ? new Date(order.date_created) : new Date(),
      date_modified: new Date(),
      // Set is_paying_customer to true since they placed an order
      is_paying_customer: true,
      // Sync tracking fields
      lastWooCommerceSync: new Date(),
      syncStatus: 'synced',
      syncError: null
    };

    if (existingCustomer) {
      await Customer.findByIdAndUpdate(existingCustomer._id, customerData, { new: true });
      return existingCustomer._id;
    } else {
      const newCustomer = new Customer(customerData);
      await newCustomer.save();
      return newCustomer._id;
    }
  } catch (error) {
    console.error(`Failed to upsert customer for order ${order.id}:`, error.message);
    return null;
  }
};
  

const getInventoryIdByProductId = async (productId, sku, organizationId, storeId) => {
    const inventory = await Inventory.findOne({
      $and: [
        { organizationId },
        { storeId },
        { $or: [{ wooCommerceId: productId }, { product_Id: productId }, { sku }] },
      ],
    });
    return inventory ? inventory._id : null; // Return null if inventory not found
  };

const syncOrderJob = async (jobData) => {
  const { storeId, store, organizationId, userId } = workerData;

  try {
    await connectDB();

    // Get user and organization currency preferences
    const user = await User.findById(userId).select('displayCurrency');
    const organization = await Organization.findById(organizationId).select('analyticsCurrency defaultCurrency');
    
    const targetCurrency = user?.displayCurrency || organization?.analyticsCurrency || organization?.defaultCurrency || 'USD';

    // Create HTTPS agent configuration for SSL bypass (if needed)
    let httpsAgent = null;
    if (process.env.WOOCOMMERCE_BYPASS_SSL === 'true' || process.env.NODE_ENV === 'development') {
      httpsAgent = new https.Agent({
        rejectUnauthorized: false // WARNING: This bypasses SSL certificate validation
      });
    }

    const wooCommerce = new WooCommerceRestApi({
      url: store.url,
      consumerKey: store.apiKey?.trim(),
      consumerSecret: store.secretKey?.trim(),
      version: 'wc/v3',
      queryStringAuth: true, // Force Basic Authentication as query string
      ...(httpsAgent && { httpsAgent }) // Only add httpsAgent if it's configured
    });

    const getAllOrders = async (page = 1) => {
      try {
        const response = await wooCommerce.get('orders', {
          per_page: 100,
          page,
          status: 'any', // Fetch orders with any status (pending, processing, completed, cancelled, refunded, failed, etc.)
          orderby: 'id',
          order: 'asc'
        });
        return response.data;
      } catch (error) {
        // Parse the error using our error handler
        const errorInfo = StoreErrorHandler.parseStoreError(error, store, 'order sync');
        StoreErrorHandler.logError(errorInfo, 'syncOrderWorker.getAllOrders');

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

    let orders = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const currentPageOrders = await getAllOrders(page);
      if (currentPageOrders.length === 0) hasMore = false;
      else {
        orders = [...orders, ...currentPageOrders];
        page++;
      }
    }


    // Sync statistics
    let created = 0;
    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (const order of orders) {
      try {
        const wooCommerceId = order.id;
        
        // Check for existing order by wooCommerceId first (primary check)
        let existingOrder = await Order.findOne({
          wooCommerceId: wooCommerceId,
          storeId: storeId
        });

        // Fallback check: if no wooCommerceId match, check by order_id
        if (!existingOrder && order.id) {
          existingOrder = await Order.findOne({
            order_id: order.id.toString(),
            storeId: storeId
          });
        }

        // Additional fallback: check by order_key + storeId (for cases where wooCommerceId might be missing)
        if (!existingOrder && order.order_key) {
          existingOrder = await Order.findOne({
            order_key: order.order_key,
            storeId: storeId
          });
        }

        // Check if this order was intentionally deleted from the dashboard
        // If so, skip it to prevent re-creation during sync
        if (!existingOrder) {
          const deletedOrder = await DeletedOrder.findOne({
            wooCommerceId: wooCommerceId,
            storeId: storeId,
            deletedFromWooCommerce: false // Only skip if it wasn't deleted from WooCommerce
          });

          if (deletedOrder) {
            skipped++;
            continue;
          }
        }

        // Extract and upsert customer from order data
        const customerId = await upsertCustomerFromOrder(order, organizationId, storeId, userId);
      
        // Process line items to fetch inventory IDs
        const lineItems = await Promise.all(
          order.line_items.map(async (item) => {
            const inventoryId = await getInventoryIdByProductId(
              item.product_id,
              item.sku,
              organizationId,
              storeId
            );
            return {
              ...item,
              inventoryId, // Add inventoryId to line item
            };
          })
        );

        // Get original order amounts and currency from WooCommerce
        const originalTotal = parseFloat(order.total) || 0;
        const originalCurrency = order.currency || 'USD';
        
        // Convert order total to user's base currency
        let convertedTotal = originalTotal;
        
        if (originalCurrency !== targetCurrency && originalTotal > 0) {
          try {
            convertedTotal = await currencyUtils.convertCurrency(originalTotal, originalCurrency, targetCurrency);
          } catch (conversionError) {
            convertedTotal = originalTotal;
          }
        }

        const orderData = {
          storeId,
          organizationId,
          userId,
          customerId,
          wooCommerceId: wooCommerceId, // Primary identifier
          customer_Id: order.customer_id,
          billing: order.billing,
          shipping: order.shipping,
          order_id: order.id.toString(),
          number: order.id.toString(), // Set number to WooCommerce order ID
          status: order.status,
          currency: targetCurrency, // Use converted currency
          version: order.version,
          prices_include_tax: order.prices_include_tax,
          date_created: new Date(order.date_created),
          date_modified: new Date(order.date_modified),
          discount_total: order.discount_total,
          discount_tax: order.discount_tax,
          shipping_total: order.shipping_total,
          shipping_tax: order.shipping_tax,
          cart_tax: order.cart_tax,
          total: convertedTotal.toString(), // Use converted total
          total_tax: order.total_tax,
          // Currency conversion fields
          originalTotal: originalTotal.toString(),
          originalCurrency: originalCurrency,
          displayCurrency: targetCurrency,
          convertedTotal: convertedTotal,
          customer_note: order.customer_note,
          payment_method: order.payment_method,
          payment_method_title: order.payment_method_title,
          transaction_id: order.transaction_id,
          customer_ip_address: order.customer_ip_address,
          customer_user_agent: order.customer_user_agent,
          created_via: order.created_via,
          date_completed: order.date_completed,
          date_paid: order.date_paid,
          cart_hash: order.cart_hash,
          meta_data: order.meta_data,
          line_items: lineItems, // Updated line items with inventory IDs
          shipping_lines: order.shipping_lines,
          fee_lines: order.fee_lines,
          coupon_lines: order.coupon_lines,
          refunds: order.refunds,
          payment_url: order.payment_url,
          is_editable: order.is_editable,
          needs_payment: order.needs_payment,
          needs_processing: order.needs_processing,
          date_created_gmt: order.date_created_gmt,
          date_modified_gmt: order.date_modified_gmt,
          date_completed_gmt: order.date_completed_gmt,
          date_paid_gmt: order.date_paid_gmt,
          currency_symbol: order.currency_symbol,
          _links: order._links,
          // Sync tracking fields
          lastSyncedAt: new Date(),
          syncStatus: 'synced',
          syncError: null
        };

        if (existingOrder) {
          // Update existing order
          await Order.findOneAndUpdate(
            { _id: existingOrder._id },
            { $set: orderData },
            { new: true, runValidators: true }
          );
          updated++;
        } else {
          await Order.create(orderData);
          created++;
        }
      } catch (error) {
        failed++;
        console.error(`Failed to sync order ${order.id}:`, error.message);
      }
    }

    const syncSummary = {
      total: orders.length,
      created,
      updated,
      failed,
      skipped
    };

    console.log('Order sync completed:', syncSummary);
    parentPort.postMessage({ 
      status: 'success', 
      message: 'Orders synchronized successfully',
      data: syncSummary
    });
  } catch (error) {
    console.error('Error in order sync job:', error);
    
    // Parse the error using our error handler
    const errorInfo = StoreErrorHandler.parseStoreError(error, store, 'order sync');
    StoreErrorHandler.logError(errorInfo, 'syncOrderWorker.main');
    
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

syncOrderJob(workerData);
