const { parentPort, workerData } = require('worker_threads');
const Order = require('../models/order');
const Customer = require('../models/customers');
const Inventory = require('../models/inventory'); // Import Inventory model
const connectDB = require('./connectDB');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const https = require('https');
const StoreErrorHandler = require('../services/storeErrorHandler');

// Get the customerId if customer exists, otherwise return null
const getCustomerIdByWooCommerceId = async (woocommerceCustomerId, email, organizationId, storeId) => {
    const customer = await Customer.findOne({
      $and: [
        { organizationId },
        { storeId },
        { $or: [{ wooCommerceId: woocommerceCustomerId }, { customer_id: woocommerceCustomerId }, { email }] },
      ],
    });
    return customer ? customer._id : null; // Return null if customer not found
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
  try {
    const { storeId, store, organizationId, userId } = workerData;
    connectDB();

    console.log('Starting order sync for store:', storeId);

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

    const getAllOrders = async (page = 1) => {
      try {
        const response = await wooCommerce.get('orders', { per_page: 100, page });
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

    console.log(`Total orders to sync: ${orders.length}`);

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

        const customerId = await getCustomerIdByWooCommerceId(
          order.customer_id,
          order.billing.email,
          organizationId,
          storeId
        );
      
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
          currency: order.currency,
          version: order.version,
          prices_include_tax: order.prices_include_tax,
          date_created: new Date(order.date_created),
          date_modified: new Date(order.date_modified),
          discount_total: order.discount_total,
          discount_tax: order.discount_tax,
          shipping_total: order.shipping_total,
          shipping_tax: order.shipping_tax,
          cart_tax: order.cart_tax,
          total: order.total,
          total_tax: order.total_tax,
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
          console.log(`Updated order: ${order.id} (WooCommerce ID: ${wooCommerceId})`);
        } else {
          // Create new order
          await Order.create(orderData);
          created++;
          console.log(`Created order: ${order.id} (WooCommerce ID: ${wooCommerceId})`);
        }
      } catch (error) {
        failed++;
        console.error(`Failed to sync order ${order.id} (WooCommerce ID: ${order.id}):`, error.message);
        
        // Log detailed error for debugging
        console.error('Order data:', {
          orderId: order.id,
          orderKey: order.order_key,
          wooCommerceId: order.id,
          storeId: storeId,
          error: error.message
        });
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
