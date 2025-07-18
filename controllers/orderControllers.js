const { Worker } = require('worker_threads');
const path = require('path');
const Store = require('../models/store');
const Organization = require('../models/organization');
const Order = require('../models/order');
const mongoose = require('mongoose');
const logEvent = require('../helper/logEvent');
const WooCommerceService = require('../services/wooCommerceService.js');

exports.syncOrders = async (req, res) => {
  try {
    const { storeId, organizationId } = req.params;
    const { userId } = req.body;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const organization = await Organization.findById(organizationId);
    if (!organization) return res.status(404).json({ error: 'Organization not found' });

    const worker = new Worker(path.resolve(__dirname, '../helper/syncOrderWorker.js'), {
      workerData: { storeId, store, organizationId, userId },
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

    res.json({ message: 'Order synchronization started in the background' });
  } catch (error) {
    console.error('Error in syncOrders:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// CREATE a new order
exports.createOrder = async (req, res) => {
  try {
    const {
      storeId,
      userId,
      organizationId,
      customer_id,
      customer_Id,
      parent_id,
      billing,
      shipping,
      order_id,
      number,
      status,
      currency,
      version,
      prices_include_tax,
      date_created,
      date_modified,
      discount_total,
      discount_tax,
      shipping_total,
      shipping_tax,
      cart_tax,
      total,
      total_tax,
      order_key,
      payment_method,
      payment_method_title,
      transaction_id,
      customer_ip_address,
      customer_user_agent,
      created_via,
      customer_note,
      date_completed,
      date_paid,
      cart_hash,
      line_items,
      shipping_lines,
      meta_data,
      syncToWooCommerce = false, // NEW: Option to sync to WooCommerce
    } = req.body;

    // Validate required fields
    const requiredFields = ['storeId', 'userId', 'organizationId', 'customer_id'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate data types and convert if necessary
    const now = new Date();
    
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
      email: billing.email || '',
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
      country: shipping.country || '',
      phone: shipping.phone || ''
    } : null;

    // Process line_items if provided
    const processedLineItems = line_items ? line_items.map(item => ({
      product_id: item.product_id || '',
      inventoryId: item.inventoryId || null,
      name: item.name || '',
      quantity: Number(item.quantity) || 0,
      subtotal: Number(item.subtotal) || 0,
      total: Number(item.total) || 0,
      total_tax: Number(item.total_tax) || 0,
      taxes: item.taxes || [],
      meta_data: item.meta_data || [],
      sku: item.sku || '',
      price: Number(item.price) || 0
    })) : [];

    // Process shipping_lines if provided
    const processedShippingLines = shipping_lines ? shipping_lines.map(line => ({
      id: Number(line.id) || 0,
      method_title: line.method_title || '',
      method_id: line.method_id || '',
      total: Number(line.total) || 0,
      total_tax: Number(line.total_tax) || 0,
      taxes: line.taxes || [],
      meta_data: line.meta_data || []
    })) : [];

    // Process meta_data if provided
    const processedMetaData = meta_data ? meta_data.map(item => ({
      key: item.key || '',
      value: item.value || null
    })) : [];

    // Validate and process numeric fields
    const processedParentId = parent_id ? Number(parent_id) : null;
    const processedDiscountTotal = discount_total ? Number(discount_total) : 0;
    const processedDiscountTax = discount_tax ? Number(discount_tax) : 0;
    const processedShippingTotal = shipping_total ? Number(shipping_total) : 0;
    const processedShippingTax = shipping_tax ? Number(shipping_tax) : 0;
    const processedCartTax = cart_tax ? Number(cart_tax) : 0;
    const processedTotalTax = total_tax ? Number(total_tax) : 0;

    // Validate and process boolean fields
    const processedPricesIncludeTax = Boolean(prices_include_tax);

    // Validate and process date fields
    const processedDateCompleted = date_completed ? new Date(date_completed) : null;
    const processedDatePaid = date_paid ? new Date(date_paid) : null;

    let wooCommerceId = null;
    let syncStatus = 'pending';
    let syncError = null;

    // If sync to WooCommerce is requested
    if (syncToWooCommerce && storeId) {
      try {
        // Get store information
        const store = await Store.findById(storeId);
        if (!store) {
          return res.status(404).json({ 
            success: false, 
            message: "Store not found for WooCommerce sync" 
          });
        }

        // Create WooCommerce service instance
        const wooCommerceService = new WooCommerceService(store);

        // Prepare order data for WooCommerce
        const orderData = {
          storeId,
          userId,
          organizationId,
          customer_id: Number(customer_id),
          billing: processedBilling,
          shipping: processedShipping,
          order_id: Number(order_id),
          number,
          status: status || 'pending',
          currency: currency || 'USD',
          date_created: date_created || now,
          total: total ? Number(total) : 0,
          customer_note,
          line_items: processedLineItems,
          shipping_lines: processedShippingLines
        };

        // Create order in WooCommerce
        const wooCommerceResult = await wooCommerceService.createOrder(orderData);
        
        if (wooCommerceResult.success) {
          wooCommerceId = wooCommerceResult.data.id;
          syncStatus = 'synced';
        } else {
          syncStatus = 'failed';
          syncError = wooCommerceResult.error?.message || 'WooCommerce sync failed';
          console.error('WooCommerce sync error:', wooCommerceResult.error);
        }
      } catch (wooCommerceError) {
        syncStatus = 'failed';
        syncError = wooCommerceError.message;
        console.error('WooCommerce sync error:', wooCommerceError);
      }
    }

    const newOrder = new Order({
      storeId,
      userId,
      organizationId,
      customer_id: Number(customer_id),
      customer_Id,
      parent_id: processedParentId,
      billing: processedBilling,
      shipping: processedShipping,
      order_id: Number(order_id),
      number,
      status: status || 'pending',
      currency: currency || 'USD',
      version: version || '6.0.0',
      prices_include_tax: processedPricesIncludeTax,
      date_created: date_created || now,
      date_modified: date_modified || now,
      discount_total: processedDiscountTotal,
      discount_tax: processedDiscountTax,
      shipping_total: processedShippingTotal,
      shipping_tax: processedShippingTax,
      cart_tax: processedCartTax,
      total: total ? Number(total) : 0,
      total_tax: processedTotalTax,
      order_key: order_key || '',
      payment_method: payment_method || '',
      payment_method_title: payment_method_title || '',
      transaction_id: transaction_id || '',
      customer_ip_address: customer_ip_address || '',
      customer_user_agent: customer_user_agent || '',
      created_via: created_via || 'checkout',
      customer_note,
      date_completed: processedDateCompleted,
      date_paid: processedDatePaid,
      cart_hash: cart_hash || '',
      line_items: processedLineItems,
      shipping_lines: processedShippingLines,
      meta_data: processedMetaData,
      wooCommerceId,
      lastWooCommerceSync: syncStatus === 'synced' ? new Date() : null,
      syncStatus,
      syncError,
    });

    const savedOrder = await newOrder.save();
    await logEvent({
      action: 'create_order',
      user: req.user?._id || userId,
      resource: 'Order',
      resourceId: savedOrder._id,
      details: { 
        order_id: savedOrder.order_id, 
        syncToWooCommerce,
        syncStatus,
        wooCommerceId 
      },
      organization: req.user?.organization || organizationId
    });
    res.status(201).json({ 
      success: true, 
      order: savedOrder,
      wooCommerceSync: {
        synced: syncStatus === 'synced',
        wooCommerceId,
        status: syncStatus,
        error: syncError
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create order",
      error: error.message 
    });
  }
};

// GET all orders for a specific organization
exports.getAllOrders = async (req, res) => {
  
  try {
    const orders = await Order.find()
      .populate("storeId userId organizationId customer_id", "name email") // Populate relevant fields
      .exec();
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve orders" });
  }
};

exports.getAllOrdersByOrganization = async (req, res) => {
  const { organizationId } = req.params;
  try {
    const orders = await Order.find({ organizationId: new mongoose.Types.ObjectId(organizationId) })
      .populate("storeId userId organizationId customer_id", "name email") // Populate relevant fields
      .exec();
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve orders" });
  }
};

// GET a specific order by its ID
exports.getOrderById = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId)
      .populate("storeId userId organizationId customer_id", "name email") // Populate store, user, organization, and customer
      .populate("line_items.inventoryId", "product_Id sku name images") // Populate inventoryId in line_items
      .exec();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve order" });
  }
};

// GET all orders for a specific store ID
exports.getOrdersByStoreId = async (req, res) => {
  const { storeId } = req.params;
  try {
    const orders = await Order.find({ storeId })
      .populate("storeId userId organizationId customer_id", "name email") // Populate relevant fields
      .exec();

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No orders found for this store" });
    }

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders by store ID:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve orders" });
  }
}

// UPDATE order details (e.g., status, customer_note)
exports.updateOrder = async (req, res) => {
  const { orderId } = req.params;
  const { syncToWooCommerce = false, ...updateData } = req.body;

  try {
    // Define allowed fields that can be updated
    const allowedFields = [
      'status',
      'currency',
      'version',
      'prices_include_tax',
      'total',
      'discount_total',
      'discount_tax',
      'shipping_total',
      'shipping_tax',
      'cart_tax',
      'total_tax',
      'order_key',
      'customer_note',
      'line_items',
      'shipping_lines',
      'billing',
      'shipping',
      'payment_method',
      'payment_method_title',
      'transaction_id',
      'customer_ip_address',
      'customer_user_agent',
      'created_via',
      'date_completed',
      'date_paid',
      'cart_hash',
      'number',
      'meta_data'
    ];

    // Sanitize update data - only allow specified fields
    const sanitizedData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        sanitizedData[field] = updateData[field];
      }
    });

    // Validate and process specific fields
    if (sanitizedData.total !== undefined) {
      sanitizedData.total = sanitizedData.total ? Number(sanitizedData.total) : 0;
    }

    // Validate and process numeric fields
    if (sanitizedData.discount_total !== undefined) {
      sanitizedData.discount_total = sanitizedData.discount_total ? Number(sanitizedData.discount_total) : 0;
    }
    
    if (sanitizedData.discount_tax !== undefined) {
      sanitizedData.discount_tax = sanitizedData.discount_tax ? Number(sanitizedData.discount_tax) : 0;
    }
    
    if (sanitizedData.shipping_total !== undefined) {
      sanitizedData.shipping_total = sanitizedData.shipping_total ? Number(sanitizedData.shipping_total) : 0;
    }
    
    if (sanitizedData.shipping_tax !== undefined) {
      sanitizedData.shipping_tax = sanitizedData.shipping_tax ? Number(sanitizedData.shipping_tax) : 0;
    }
    
    if (sanitizedData.cart_tax !== undefined) {
      sanitizedData.cart_tax = sanitizedData.cart_tax ? Number(sanitizedData.cart_tax) : 0;
    }
    
    if (sanitizedData.total_tax !== undefined) {
      sanitizedData.total_tax = sanitizedData.total_tax ? Number(sanitizedData.total_tax) : 0;
    }

    // Validate and process boolean fields
    if (sanitizedData.prices_include_tax !== undefined) {
      sanitizedData.prices_include_tax = Boolean(sanitizedData.prices_include_tax);
    }

    // Validate and process date fields
    if (sanitizedData.date_completed !== undefined) {
      sanitizedData.date_completed = sanitizedData.date_completed ? new Date(sanitizedData.date_completed) : null;
    }
    
    if (sanitizedData.date_paid !== undefined) {
      sanitizedData.date_paid = sanitizedData.date_paid ? new Date(sanitizedData.date_paid) : null;
    }

    // Process billing data if provided
    if (sanitizedData.billing) {
      sanitizedData.billing = {
        first_name: sanitizedData.billing.first_name || '',
        last_name: sanitizedData.billing.last_name || '',
        company: sanitizedData.billing.company || '',
        address_1: sanitizedData.billing.address_1 || '',
        address_2: sanitizedData.billing.address_2 || '',
        city: sanitizedData.billing.city || '',
        state: sanitizedData.billing.state || '',
        postcode: sanitizedData.billing.postcode || '',
        country: sanitizedData.billing.country || '',
        email: sanitizedData.billing.email || '',
        phone: sanitizedData.billing.phone || ''
      };
    }

    // Process shipping data if provided
    if (sanitizedData.shipping) {
      sanitizedData.shipping = {
        first_name: sanitizedData.shipping.first_name || '',
        last_name: sanitizedData.shipping.last_name || '',
        company: sanitizedData.shipping.company || '',
        address_1: sanitizedData.shipping.address_1 || '',
        address_2: sanitizedData.shipping.address_2 || '',
        city: sanitizedData.shipping.city || '',
        state: sanitizedData.shipping.state || '',
        postcode: sanitizedData.shipping.postcode || '',
        country: sanitizedData.shipping.country || '',
        phone: sanitizedData.shipping.phone || ''
      };
    }

    // Process line_items if provided
    if (sanitizedData.line_items) {
      sanitizedData.line_items = sanitizedData.line_items.map(item => ({
        product_id: item.product_id || '',
        inventoryId: item.inventoryId || null,
        name: item.name || '',
        quantity: Number(item.quantity) || 0,
        subtotal: Number(item.subtotal) || 0,
        total: Number(item.total) || 0,
        total_tax: Number(item.total_tax) || 0,
        taxes: item.taxes || [],
        meta_data: item.meta_data || [],
        sku: item.sku || '',
        price: Number(item.price) || 0
      }));
    }

    // Process shipping_lines if provided
    if (sanitizedData.shipping_lines) {
      sanitizedData.shipping_lines = sanitizedData.shipping_lines.map(line => ({
        id: Number(line.id) || 0,
        method_title: line.method_title || '',
        method_id: line.method_id || '',
        total: Number(line.total) || 0,
        total_tax: Number(line.total_tax) || 0,
        taxes: line.taxes || [],
        meta_data: line.meta_data || []
      }));
    }

    // Add timestamp
    sanitizedData.date_modified = new Date();

    // Get the current order to check if it has a WooCommerce ID
    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let wooCommerceSync = null;

    // If sync to WooCommerce is requested
    if (syncToWooCommerce && currentOrder.storeId) {
      try {
        // Get store information
        const store = await Store.findById(currentOrder.storeId);
        if (!store) {
          return res.status(404).json({ 
            success: false, 
            message: "Store not found for WooCommerce sync" 
          });
        }

        // Create WooCommerce service instance
        const wooCommerceService = new WooCommerceService(store);

        // Prepare order data for WooCommerce (merge current data with updates)
        const orderData = {
          ...currentOrder.toObject(),
          ...sanitizedData
        };

        let wooCommerceResult;

        // If order already exists in WooCommerce, update it
        if (currentOrder.wooCommerceId) {
          wooCommerceResult = await wooCommerceService.updateOrder(
            currentOrder.wooCommerceId, 
            orderData
          );
        } else {
          // If order doesn't exist in WooCommerce, create it
          wooCommerceResult = await wooCommerceService.createOrder(orderData);
        }
        
        if (wooCommerceResult.success) {
          // Update the WooCommerce ID if it's a new order
          if (!currentOrder.wooCommerceId && wooCommerceResult.data.id) {
            sanitizedData.wooCommerceId = wooCommerceResult.data.id;
          }
          
          sanitizedData.lastWooCommerceSync = new Date();
          sanitizedData.syncStatus = 'synced';
          sanitizedData.syncError = null;
          
          wooCommerceSync = {
            synced: true,
            wooCommerceId: sanitizedData.wooCommerceId || currentOrder.wooCommerceId,
            status: 'synced',
            error: null
          };
        } else {
          sanitizedData.syncStatus = 'failed';
          sanitizedData.syncError = wooCommerceResult.error?.message || 'WooCommerce sync failed';
          
          wooCommerceSync = {
            synced: false,
            wooCommerceId: currentOrder.wooCommerceId,
            status: 'failed',
            error: sanitizedData.syncError
          };
          
          console.error('WooCommerce sync error:', wooCommerceResult.error);
        }
      } catch (wooCommerceError) {
        sanitizedData.syncStatus = 'failed';
        sanitizedData.syncError = wooCommerceError.message;
        
        wooCommerceSync = {
          synced: false,
          wooCommerceId: currentOrder.wooCommerceId,
          status: 'failed',
          error: wooCommerceError.message
        };
        
        console.error('WooCommerce sync error:', wooCommerceError);
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: sanitizedData },
      { new: true, runValidators: true } // return the updated order and run validators
    );

    await logEvent({
      action: 'update_order',
      user: req.user?._id,
      resource: 'Order',
      resourceId: updatedOrder._id,
      details: { 
        order_id: updatedOrder.order_id, 
        syncToWooCommerce,
        syncStatus: sanitizedData.syncStatus,
        wooCommerceId: sanitizedData.wooCommerceId || currentOrder.wooCommerceId
      },
      organization: req.user?.organization || currentOrder.organizationId
    });

    res.status(200).json({ 
      success: true, 
      order: updatedOrder,
      wooCommerceSync
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update order",
      error: error.message 
    });
  }
};

// DELETE an order from the system
exports.deleteOrder = async (req, res) => {
  const { orderId } = req.params;
  const { syncToWooCommerce = false } = req.body;

  try {
    // Get the order before deleting to check if it has a WooCommerce ID
    const orderToDelete = await Order.findById(orderId);
    if (!orderToDelete) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let wooCommerceSync = null;

    // If sync to WooCommerce is requested and order exists in WooCommerce
    if (syncToWooCommerce && orderToDelete.wooCommerceId && orderToDelete.storeId) {
      try {
        // Get store information
        const store = await Store.findById(orderToDelete.storeId);
        if (!store) {
          return res.status(404).json({ 
            success: false, 
            message: "Store not found for WooCommerce sync" 
          });
        }

        // Create WooCommerce service instance
        const wooCommerceService = new WooCommerceService(store);

        // Delete order from WooCommerce
        const wooCommerceResult = await wooCommerceService.deleteOrder(orderToDelete.wooCommerceId);
        
        if (wooCommerceResult.success) {
          wooCommerceSync = {
            synced: true,
            wooCommerceId: orderToDelete.wooCommerceId,
            status: 'deleted',
            error: null
          };
        } else {
          wooCommerceSync = {
            synced: false,
            wooCommerceId: orderToDelete.wooCommerceId,
            status: 'failed',
            error: wooCommerceResult.error?.message || 'WooCommerce delete failed'
          };
          console.error('WooCommerce delete error:', wooCommerceResult.error);
        }
      } catch (wooCommerceError) {
        wooCommerceSync = {
          synced: false,
          wooCommerceId: orderToDelete.wooCommerceId,
          status: 'failed',
          error: wooCommerceError.message
        };
        console.error('WooCommerce delete error:', wooCommerceError);
      }
    }

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    // Log the event
    await logEvent({
      action: 'delete_order',
      user: req.user?._id,
      resource: 'Order',
      resourceId: orderToDelete._id,
      details: { 
        order_id: orderToDelete.order_id, 
        syncToWooCommerce,
        wooCommerceId: orderToDelete.wooCommerceId
      },
      organization: req.user?.organization || orderToDelete.organizationId
    });

    res.status(200).json({ 
      success: true, 
      message: "Order deleted successfully",
      wooCommerceSync
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete order" });
  }
};

// Helper function for date filtering - moved to top
function getDateFilter(timeRange) {
  const now = new Date();
  let startDate;
  
  switch(timeRange) {
    case '7d':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case '30d':
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case '90d':
      startDate = new Date(now.setDate(now.getDate() - 90));
      break;
    case '1y':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(0); // All time
  }
  
  return { $gte: startDate };
}

// 1. Cross-Store Performance Analytics (without time range filter)
exports.getCrossStorePerformance = async (req, res) => {
  try {
    const { organizationId } = req.params;
  
    const result = await Order.aggregate([
      { $match: { 
        organizationId: new mongoose.Types.ObjectId(organizationId)
        // Removed the date_created filter
      }},
      { $group: {
        _id: "$storeId",
        orderCount: { $sum: 1 },
        totalRevenue: { $sum: { $toDouble: "$total" } },
        avgOrderValue: { $avg: { $toDouble: "$total" } },
        statusCounts: { $push: "$status" }
      }},
      { $project: {
        storeId: "$_id",
        orderCount: 1,
        totalRevenue: 1,
        avgOrderValue: 1,
        statusDistribution: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: "$statusCounts" },
              as: "status",
              in: { 
                k: "$$status", 
                v: { 
                  $size: { 
                    $filter: { 
                      input: "$statusCounts", 
                      as: "s", 
                      cond: { $eq: ["$$s", "$$status"] } 
                    } 
                  } 
                } 
              }
            }
          }
        }
      }}
    ]);

    res.json({
      summary: {
        totalOrders: result.reduce((sum, store) => sum + store.orderCount, 0),
        totalRevenue: result.reduce((sum, store) => sum + store.totalRevenue, 0),
        avgOrderValue: result.reduce((sum, store) => sum + store.avgOrderValue, 0) / (result.length || 1) // Added protection against division by zero
      },
      stores: result
    });
  } catch (error) {
    console.error('Error in getCrossStorePerformance:', error);
    res.status(500).json({ error: error.message });
  }
};

// 2. Temporal Analytics
exports.getTemporalAnalytics = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { timeRange = '30d' } = req.query;
    const dateFilter = getDateFilter(timeRange);
    
    // Daily trends
    const daily = await Order.aggregate([
      { $match: { 
        organizationId: new mongoose.Types.ObjectId(organizationId),
        date_created: dateFilter 
      }},
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date_created" } },
        orders: { $sum: 1 },
        revenue: { $sum: { $toDouble: "$total" } }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Hourly patterns
    const hourly = await Order.aggregate([
      { $match: { 
        organizationId: new mongoose.Types.ObjectId(organizationId),
        date_created: dateFilter 
      }},
      { $group: {
        _id: { $hour: "$date_created" },
        orders: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({ dailyTrends: daily, hourlyPatterns: hourly });
  } catch (error) {
    console.error('Error in getTemporalAnalytics:', error);
    res.status(500).json({ error: error.message });
  }
};

// 3. Customer Insights
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { limit = 10 } = req.query;
    
    const data = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: {
        _id: "$customer_id",
        totalSpent: { $sum: { $toDouble: "$total" } },
        orderCount: { $sum: 1 },
        firstOrderDate: { $min: "$date_created" },
        lastOrderDate: { $max: "$date_created" },
        storesUsed: { $addToSet: "$storeId" }
      }},
      { $project: {
        customerId: "$_id",
        totalSpent: 1,
        orderCount: 1,
        storesUsed: 1,
        avgDaysBetweenOrders: {
          $divide: [
            { $divide: [
              { $subtract: ["$lastOrderDate", "$firstOrderDate"] },
              1000 * 60 * 60 * 24
            ]},
            { $max: [1, { $subtract: ["$orderCount", 1] }] }
          ]
        }
      }},
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(data);
  } catch (error) {
    console.error('Error in getCustomerAnalytics:', error);
    res.status(500).json({ error: error.message });
  }
};

// 4. Product Performance
exports.getProductPerformance = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { timeRange = '30d' } = req.query;
    const dateFilter = getDateFilter(timeRange);
    
    const data = await Order.aggregate([
      { $match: { 
        organizationId: new mongoose.Types.ObjectId(organizationId),
        date_created: dateFilter 
      }},
      { $unwind: "$line_items" },
      { $group: {
        _id: "$line_items.product_id",
        name: { $first: "$line_items.name" },
        totalSold: { $sum: "$line_items.quantity" },
        totalRevenue: { $sum: { $multiply: [
          { $toDouble: "$line_items.price" },
          "$line_items.quantity"
        ]}},
        storesSoldIn: { $addToSet: "$storeId" }
      }},
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json(data);
  } catch (error) {
    console.error('Error in getProductPerformance:', error);
    res.status(500).json({ error: error.message });
  }
};

// 5. Financial Analytics
exports.getFinancialAnalytics = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const result = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: {
        _id: null,
        totalRevenue: { $sum: { $toDouble: "$total" } },
        totalTax: { $sum: { $toDouble: "$total_tax" } },
        totalShipping: { $sum: { $toDouble: "$shipping_total" } },
        totalDiscounts: { $sum: { $toDouble: "$discount_total" } },
        paymentMethods: { $push: "$payment_method" }
      }}
    ]);

    const paymentMethodDistribution = result[0]?.paymentMethods?.reduce((acc, method) => {
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      ...result[0],
      paymentMethodDistribution,
      discountEffectiveness: result[0]?.totalDiscounts > 0 ? 
        (result[0].totalDiscounts / result[0].totalRevenue) * 100 : 0
    });
  } catch (error) {
    console.error('Error in getFinancialAnalytics:', error);
    res.status(500).json({ error: error.message });
  }
};

// 6. Operational Metrics
exports.getOperationalMetrics = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const data = await Order.aggregate([
      { $match: { 
        organizationId: new mongoose.Types.ObjectId(organizationId),
        date_completed: { $exists: true },
        date_created: { $exists: true }
      }},
      { $project: {
        storeId: 1,
        processingTime: {
          $divide: [
            { $subtract: ["$date_completed", "$date_created"] },
            1000 * 60 * 60 // Convert to hours
          ]
        }
      }},
      { $group: {
        _id: "$storeId",
        avgProcessingTime: { $avg: "$processingTime" }
      }}
    ]);

    res.json(data);
  } catch (error) {
    console.error('Error in getOperationalMetrics:', error);
    res.status(500).json({ error: error.message });
  }
};

// 7. Geospatial Analysis
exports.getGeospatialAnalytics = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const data = await Order.aggregate([
      { $match: { 
        organizationId: new mongoose.Types.ObjectId(organizationId),
        "shipping.country": { $exists: true }
      }},
      { $group: {
        _id: "$shipping.country",
        orderCount: { $sum: 1 },
        avgShippingCost: { $avg: { $toDouble: "$shipping_total" } }
      }},
      { $sort: { orderCount: -1 } }
    ]);

    res.json(data);
  } catch (error) {
    console.error('Error in getGeospatialAnalytics:', error);
    res.status(500).json({ error: error.message });
  }
};

// 8. Status Distribution Analytics
exports.getStatusDistribution = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const data = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: {
        _id: "$status",
        count: { $sum: 1 }
      }},
      { $project: {
        status: "$_id",
        count: 1,
        _id: 0
      }}
    ]);

    res.json(data);
  } catch (error) {
    console.error('Error in getStatusDistribution:', error);
    res.status(500).json({ error: error.message });
  }
};

// 9. Sales Funnel Analysis
exports.getSalesFunnel = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const data = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $facet: {
        totalVisitors: [
          { $group: { _id: null, count: { $sum: 1 } } }
        ],
        initiatedCheckout: [
          { $match: { status: { $in: ['pending', 'processing', 'on-hold'] } } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ],
        completedPurchases: [
          { $match: { status: 'completed' } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ]
      }},
      { $project: {
        totalVisitors: { $arrayElemAt: ["$totalVisitors.count", 0] },
        initiatedCheckout: { $arrayElemAt: ["$initiatedCheckout.count", 0] },
        completedPurchases: { $arrayElemAt: ["$completedPurchases.count", 0] }
      }}
    ]);

    res.json(data[0]);
  } catch (error) {
    console.error('Error in getSalesFunnel:', error);
    res.status(500).json({ error: error.message });
  }
};

// 10. Customer Lifetime Value
exports.getCustomerLTV = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const data = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: {
        _id: "$customer_id",
        totalSpent: { $sum: { $toDouble: "$total" } },
        firstPurchase: { $min: "$date_created" },
        lastPurchase: { $max: "$date_created" }
      }},
      { $group: {
        _id: null,
        avgLTV: { $avg: "$totalSpent" },
        medianLTV: { 
          $median: {
            input: "$totalSpent",
            method: 'approximate'
          }
        },
        avgCustomerLifespan: {
          $avg: {
            $divide: [
              { $subtract: ["$lastPurchase", "$firstPurchase"] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      }}
    ]);

    res.json(data[0]);
  } catch (error) {
    console.error('Error in getCustomerLTV:', error);
    res.status(500).json({ error: error.message });
  }
};

// In cancelOrder (after cancelling the order)
exports.cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = 'cancelled';
    await order.save();

    await logEvent({
      action: 'cancel_order',
      user: req.user._id,
      resource: 'Order',
      resourceId: order._id,
      details: { ...order.toObject() },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, order: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
};

// In refundOrder (after refunding the order)
exports.refundOrder = async (req, res) => {
  const { orderId, refundAmount, reason } = req.body;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = 'refunded';
    order.refund_amount = refundAmount;
    order.refund_reason = reason;
    await order.save();

    await logEvent({
      action: 'refund_order',
      user: req.user._id,
      resource: 'Order',
      resourceId: order._id,
      details: { refundAmount, reason },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, order: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to refund order" });
  }
};

// GET recent orders for dashboard
exports.getRecentOrders = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { limit = 5 } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const orders = await Order.find({ 
      organizationId: new mongoose.Types.ObjectId(organizationId) 
    })
    .populate("customer_id", "first_name last_name email")
    .populate("line_items.inventoryId", "name images")
    .sort({ date_created: -1 })
    .limit(parseInt(limit))
    .exec();

    // Format orders for dashboard display
    const formattedOrders = orders.map(order => ({
      id: order.order_id || order._id,
      customer: order.customer_id ? 
        `${order.customer_id.first_name || ''} ${order.customer_id.last_name || ''}`.trim() || 
        order.customer_id.email : 
        'Unknown Customer',
      product: order.line_items && order.line_items.length > 0 ? 
        order.line_items[0].inventoryId?.name || 'Unknown Product' : 
        'No Products',
      status: order.status,
      amount: order.total ? `$${parseFloat(order.total).toFixed(2)}` : '$0.00',
      date: order.date_created,
      status: order.status
    }));

      res.status(200).json({ 
        success: true, 
      orders: formattedOrders 
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch recent orders",
      error: error.message
    });
  }
};