const { Worker } = require('worker_threads');
const path = require('path');
const Store = require('../models/store');
const Organization = require('../models/organization');
const Order = require('../models/order');
const mongoose = require('mongoose');
const logEvent = require('../helper/logEvent');
const WooCommerceService = require('../services/wooCommerceService.js');
const currencyUtils = require('../utils/currencyUtils');
const { createAuditLog, logCRUDOperation, logStatusChange } = require('../helpers/auditLogHelper');
const { notifyOrderCreated, notifyOrderStatusUpdated, notifyOrderCancelled } = require('../helpers/notificationHelper');

// Utility function to find order by WooCommerce ID (checks both wooCommerceId and number fields)
const findOrderByWooCommerceId = async (wooCommerceId, storeId = null) => {
  const query = {
    $or: [
      { wooCommerceId: Number(wooCommerceId) },
      { number: wooCommerceId.toString() }
    ]
  };
  
  if (storeId) {
    query.storeId = storeId;
  }
  
  return await Order.findOne(query);
};

// Utility function to calculate order total from line items
const calculateOrderTotal = (lineItems, totalTax = 0, shippingTotal = 0, discountTotal = 0) => {
  const lineItemsTotal = lineItems.reduce((sum, item) => {
    return sum + (Number(item.total) || Number(item.subtotal) || 0);
  }, 0);
  
  return lineItemsTotal + Number(totalTax) + Number(shippingTotal) - Number(discountTotal);
};

/**
 * @swagger
 * /api/orders/sync/{storeId}/{organizationId}:
 *   post:
 *     summary: Synchronize orders with WooCommerce API
 *     tags: [Orders]
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
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
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
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID initiating the sync
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Order synchronization started in the background
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order synchronization started in the background"
 *       404:
 *         description: Store or organization not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Store not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
exports.syncOrders = async (req, res) => {
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

    const worker = new Worker(path.resolve(__dirname, '../helper/syncOrderWorker.js'), {
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

    res.json({ message: 'Order synchronization started in the background' });
  } catch (error) {
    console.error('Error in syncOrders:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/orders/create:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *               - userId
 *               - organizationId
 *               - billing
 *               - shipping
 *               - line_items
 *               - total
 *             properties:
 *               storeId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Store ID where order belongs
 *                 example: "507f1f77bcf86cd799439011"
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID who created the order
 *                 example: "507f1f77bcf86cd799439011"
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
 *               customer_id:
 *                 type: string
 *                 format: ObjectId
 *                 description: Customer ID (optional)
 *                 example: "507f1f77bcf86cd799439011"
 *               billing:
 *                 type: object
 *                 required:
 *                   - first_name
 *                   - last_name
 *                   - email
 *                 properties:
 *                   first_name:
 *                     type: string
 *                     example: "John"
 *                   last_name:
 *                     type: string
 *                     example: "Doe"
 *                   company:
 *                     type: string
 *                     example: "ACME Corp"
 *                   address_1:
 *                     type: string
 *                     example: "123 Main St"
 *                   address_2:
 *                     type: string
 *                     example: "Apt 4B"
 *                   city:
 *                     type: string
 *                     example: "New York"
 *                   state:
 *                     type: string
 *                     example: "NY"
 *                   postcode:
 *                     type: string
 *                     example: "10001"
 *                   country:
 *                     type: string
 *                     example: "US"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "john@example.com"
 *                   phone:
 *                     type: string
 *                     example: "+1-555-123-4567"
 *               shipping:
 *                 type: object
 *                 required:
 *                   - first_name
 *                   - last_name
 *                 properties:
 *                   first_name:
 *                     type: string
 *                     example: "John"
 *                   last_name:
 *                     type: string
 *                     example: "Doe"
 *                   company:
 *                     type: string
 *                     example: "ACME Corp"
 *                   address_1:
 *                     type: string
 *                     example: "123 Main St"
 *                   address_2:
 *                     type: string
 *                     example: "Apt 4B"
 *                   city:
 *                     type: string
 *                     example: "New York"
 *                   state:
 *                     type: string
 *                     example: "NY"
 *                   postcode:
 *                     type: string
 *                     example: "10001"
 *                   country:
 *                     type: string
 *                     example: "US"
 *               line_items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - name
 *                     - quantity
 *                     - total
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       description: Product ID
 *                       example: "507f1f77bcf86cd799439011"
 *                     name:
 *                       type: string
 *                       description: Product name
 *                       example: "Sample Product"
 *                     quantity:
 *                       type: number
 *                       description: Product quantity
 *                       example: 2
 *                     total:
 *                       type: string
 *                       description: Line item total
 *                       example: "29.98"
 *                     subtotal:
 *                       type: string
 *                       description: Line item subtotal
 *                       example: "29.98"
 *               total:
 *                 type: string
 *                 description: Order total amount
 *                 example: "29.98"
 *               currency:
 *                 type: string
 *                 description: Order currency
 *                 example: "USD"
 *               status:
 *                 type: string
 *                 description: Order status
 *                 example: "pending"
 *               payment_method:
 *                 type: string
 *                 description: Payment method
 *                 example: "credit_card"
 *               syncToWooCommerce:
 *                 type: boolean
 *                 description: Whether to sync order to WooCommerce
 *                 default: false
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *                   example: "Order created successfully"
 *                 order:
 *                   type: object
 *                   description: Created order data
 *                 wooCommerceSync:
 *                   type: object
 *                   description: WooCommerce sync results (if applicable)
 *       400:
 *         description: Bad request - Missing required fields
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
 *                   example: "Missing required fields"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */
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
      subtotal: (Number(item.subtotal) || 0).toFixed(2), // Convert to string for WooCommerce
      total: (Number(item.total) || 0).toFixed(2), // Convert to string for WooCommerce
      total_tax: (Number(item.total_tax) || 0).toFixed(2), // Convert to string for WooCommerce
      taxes: item.taxes || [],
      meta_data: item.meta_data || [],
      sku: item.sku || '',
      price: (Number(item.price) || 0).toFixed(2) // Convert to string for WooCommerce
    })) : [];

    // Process shipping_lines if provided
    const processedShippingLines = shipping_lines ? shipping_lines.map(line => ({
      id: Number(line.id) || 0,
      method_title: line.method_title || '',
      method_id: line.method_id || '',
      total: (Number(line.total) || 0).toFixed(2), // Convert to string for WooCommerce
      total_tax: (Number(line.total_tax) || 0).toFixed(2), // Convert to string for WooCommerce
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

    // Validate customer_id - ensure it's a valid number
    const processedCustomerId = customer_id && !isNaN(Number(customer_id)) ? Number(customer_id) : null;
    if (!processedCustomerId) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or missing customer_id" 
      });
    }

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
          customer_id: processedCustomerId, // Use the validated customer_id
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
          // Set both wooCommerceId and number to the WooCommerce order ID for consistency
          number = wooCommerceResult.data.id.toString();
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

    // Calculate order total from line items
    const calculatedTotal = calculateOrderTotal(processedLineItems, processedTotalTax, processedShippingTotal, processedDiscountTotal);

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
      number: wooCommerceId ? wooCommerceId.toString() : number, // Use WooCommerce ID if available
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
      total: calculatedTotal, // Use calculated total instead of request body total
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
    
    // ✅ AUDIT LOG: Order Created
    await createAuditLog({
      action: 'Order Created',
      user: req.user?._id || userId,
      resource: 'order',
      resourceId: savedOrder._id,
      details: {
        orderId: savedOrder.order_id,
        orderNumber: savedOrder.number,
        status: savedOrder.status,
        total: savedOrder.total,
        currency: savedOrder.currency,
        customerId: savedOrder.customer_id,
        storeId: savedOrder.storeId,
        organizationId: savedOrder.organizationId,
        syncToWooCommerce,
        syncStatus,
        wooCommerceId,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization || organizationId,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
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

    // Send notification to organization admins
    try {
      // Get customer information for notification
      const Customer = require('../models/customers');
      const customer = await Customer.findOne({ customer_id: savedOrder.customer_id });
      await notifyOrderCreated(savedOrder, customer, organizationId);
    } catch (notificationError) {
      console.error('Error sending order creation notification:', notificationError);
      // Don't fail the request if notification fails
    }

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

/**
 * @swagger
 * /api/orders/all:
 *   get:
 *     summary: Get all orders in the system
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
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
 *                   example: "Failed to retrieve orders"
 */
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

/**
 * @swagger
 * /api/orders/organization/{organizationId}:
 *   get:
 *     summary: Get all orders for a specific organization
 *     tags: [Orders]
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
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID for currency preferences
 *       - in: query
 *         name: displayCurrency
 *         schema:
 *           type: string
 *         description: Display currency (e.g., USD, EUR)
 *         example: "USD"
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: number
 *                       description: Number of valid orders
 *                     totalRevenue:
 *                       type: number
 *                       description: Total revenue in target currency
 *                     currency:
 *                       type: string
 *                       description: Display currency
 *                     totalAllOrders:
 *                       type: number
 *                       description: Total orders including cancelled/refunded
 *                     cancelledOrders:
 *                       type: number
 *                       description: Number of cancelled orders
 *                     refundedOrders:
 *                       type: number
 *                       description: Number of refunded orders
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
 *                   example: "Failed to retrieve orders"
 */
exports.getAllOrdersByOrganization = async (req, res) => {
  const { organizationId } = req.params;
  const { userId, displayCurrency } = req.query;
  
  try {
    console.log('🔄 Fetching orders for organization:', organizationId);
    
    // Get display currency for the user/organization
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);
    console.log('💰 Target Currency:', targetCurrency);
    
    // Fetch ALL orders (including cancelled and refunded) for the table display
    const orders = await Order.find({ 
      organizationId: new mongoose.Types.ObjectId(organizationId)
    })
      .populate("storeId userId organizationId customer_id", "name email")
      .exec();
    
    console.log(`📦 Found ${orders.length} total orders (including cancelled/refunded)`);
    
    // Calculate accurate totals using multi-currency conversion (only for valid orders)
    let totalRevenue = 0;
    let totalOrders = 0;
    
    // Count only valid orders (excluding cancelled and refunded) for stats
    const validOrders = orders.filter(order => !['cancelled', 'refunded'].includes(order.status));
    totalOrders = validOrders.length;
    
    console.log(`📊 Valid orders for stats: ${totalOrders} (excluded ${orders.length - totalOrders} cancelled/refunded orders)`);
    
    try {
      console.log('🔄 Calculating multi-currency revenue...');
      
      const revenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(
        organizationId,
        targetCurrency
        // No date filter - gets all orders
      );
      
      const revenueResults = await Order.aggregate(revenuePipeline);
      const revenueSummary = await currencyUtils.processMultiCurrencyResults(
        revenueResults, 
        targetCurrency, 
        organizationId
      );
      
      totalRevenue = revenueSummary.totalConverted;
      console.log(`✅ Total Revenue: ${totalRevenue} ${targetCurrency}`);
      
    } catch (error) {
      console.error('❌ Error calculating multi-currency revenue:', error);
      // Fallback to simple sum if currency conversion fails
      totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
      console.log(`⚠️ Using fallback revenue calculation: ${totalRevenue}`);
    }
    
    res.status(200).json({ 
      success: true, 
      orders, // All orders for table display
      summary: {
        totalOrders, // Only valid orders for stats
        totalRevenue, // Only valid orders for stats
        currency: targetCurrency,
        totalAllOrders: orders.length, // Total including cancelled/refunded
        cancelledOrders: orders.filter(order => order.status === 'cancelled').length,
        refundedOrders: orders.filter(order => order.status === 'refunded').length
      }
    });
  } catch (error) {
    console.error('❌ Error in getAllOrdersByOrganization:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve orders" });
  }
};

/**
 * @swagger
 * /api/orders/get/{orderId}:
 *   get:
 *     summary: Get a specific order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Order ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Order not found
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
 *                   example: "Order not found"
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
 *                   example: "Failed to retrieve order"
 */
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

/**
 * @swagger
 * /api/orders/store/{storeId}:
 *   get:
 *     summary: Get all orders for a specific store
 *     tags: [Orders]
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of orders per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter orders by status
 *         example: "completed"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *         example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalOrders:
 *                       type: integer
 *                       example: 50
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
 *                   example: "Failed to retrieve orders"
 */
// GET all orders for a specific store ID
exports.getOrdersByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;

    const query = { storeId };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date_created = {};
      if (startDate) query.date_created.$gte = new Date(startDate);
      if (endDate) query.date_created.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .populate('customerId', 'first_name last_name email')
      .sort({ date_created: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNextPage: skip + orders.length < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders by store ID:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
  }
};

/**
 * @swagger
 * /api/orders/store/{storeId}:
 *   delete:
 *     summary: Delete all orders for a specific store
 *     tags: [Orders]
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
 *               syncToWooCommerce:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to also delete orders from WooCommerce
 *                 example: false
 *     responses:
 *       200:
 *         description: Orders deleted successfully
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
 *                   example: "All orders deleted successfully"
 *                 deletedCount:
 *                   type: integer
 *                   example: 25
 *                 wooCommerceSyncResults:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     synced:
 *                       type: integer
 *                       example: 20
 *                     failed:
 *                       type: integer
 *                       example: 5
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           orderId:
 *                             type: string
 *                             format: ObjectId
 *                           orderKey:
 *                             type: string
 *                           wooCommerceId:
 *                             type: string
 *                           error:
 *                             type: string
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Store not found or no orders found
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
 *                   example: "Store not found for WooCommerce sync"
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
 *                   example: "Failed to delete orders"
 */
// DELETE all orders for a specific store
exports.deleteAllOrdersByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { syncToWooCommerce = false } = req.body;

    console.log(`🗑️ Starting bulk order deletion for store: ${storeId}`);
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

    // Get all orders for the store
    const orders = await Order.find({ storeId });
    console.log(`📊 Found ${orders.length} orders to delete`);

    if (orders.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No orders found for this store" 
      });
    }

    let wooCommerceSyncResults = {
      total: orders.length,
      synced: 0,
      failed: 0,
      errors: []
    };

    // Delete from WooCommerce if requested
    if (syncToWooCommerce && store) {
      console.log(`🔄 Starting WooCommerce deletion for ${orders.length} orders`);
      
      const WooCommerceService = require('../services/wooCommerceService');
      const wooCommerceService = new WooCommerceService(store);

      for (const order of orders) {
        if (order.wooCommerceId) {
          try {
            const wooCommerceResult = await wooCommerceService.deleteOrder(order.wooCommerceId);
            
            if (wooCommerceResult.success) {
              wooCommerceSyncResults.synced++;
              console.log(`✅ WooCommerce order deleted: ${order.order_id} (ID: ${order.wooCommerceId})`);
            } else {
              wooCommerceSyncResults.failed++;
              wooCommerceSyncResults.errors.push({
                orderId: order._id,
                orderKey: order.order_key,
                wooCommerceId: order.wooCommerceId,
                error: wooCommerceResult.error?.message || 'WooCommerce delete failed'
              });
              console.error(`❌ WooCommerce delete failed for order ${order.order_id}:`, wooCommerceResult.error);
            }
          } catch (wooCommerceError) {
            wooCommerceSyncResults.failed++;
            wooCommerceSyncResults.errors.push({
              orderId: order._id,
              orderKey: order.order_key,
              wooCommerceId: order.wooCommerceId,
              error: wooCommerceError.message
            });
            console.error(`❌ WooCommerce delete error for order ${order.order_id}:`, wooCommerceError);
          }
        } else {
          console.log(`⚠️ Order ${order.order_id} has no WooCommerce ID, skipping WooCommerce deletion`);
        }
      }
    }

    // Delete from database
    const result = await Order.deleteMany({ storeId });
    console.log(`🗑️ Deleted ${result.deletedCount} orders from database`);

    // Log the event
    await logEvent({
      action: 'delete_all_orders_by_store',
      user: req.user?._id,
      resource: 'Order',
      resourceId: storeId,
      details: { 
        storeId, 
        deletedCount: result.deletedCount,
        totalOrders: orders.length,
        syncToWooCommerce,
        wooCommerceSyncResults
      },
      organization: req.user?.organization
    });

    const response = {
      success: true,
      message: `Successfully deleted ${result.deletedCount} orders from store`,
      data: {
        deletedCount: result.deletedCount,
        totalOrders: orders.length,
        storeId: storeId
      }
    };

    // Include WooCommerce sync results if sync was attempted
    if (syncToWooCommerce) {
      response.wooCommerceSync = wooCommerceSyncResults;
    }

    console.log(`✅ Bulk order deletion completed for store ${storeId}`);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error in bulk order deletion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting orders from store', 
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/orders/update/{orderId}:
 *   patch:
 *     summary: Update order details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Order ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               syncToWooCommerce:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to sync changes to WooCommerce
 *                 example: false
 *               status:
 *                 type: string
 *                 description: Order status
 *                 example: "completed"
 *               currency:
 *                 type: string
 *                 description: Order currency
 *                 example: "USD"
 *               version:
 *                 type: string
 *                 description: Order version
 *                 example: "1.0"
 *               prices_include_tax:
 *                 type: boolean
 *                 description: Whether prices include tax
 *                 example: false
 *               total:
 *                 type: number
 *                 description: Order total
 *                 example: 99.99
 *               discount_total:
 *                 type: number
 *                 description: Discount total
 *                 example: 10.00
 *               discount_tax:
 *                 type: number
 *                 description: Discount tax
 *                 example: 0.80
 *               shipping_total:
 *                 type: number
 *                 description: Shipping total
 *                 example: 5.00
 *               shipping_tax:
 *                 type: number
 *                 description: Shipping tax
 *                 example: 0.40
 *               cart_tax:
 *                 type: number
 *                 description: Cart tax
 *                 example: 8.00
 *               total_tax:
 *                 type: number
 *                 description: Total tax
 *                 example: 8.80
 *               order_key:
 *                 type: string
 *                 description: Order key
 *                 example: "wc_order_abc123"
 *               customer_note:
 *                 type: string
 *                 description: Customer note
 *                 example: "Please deliver after 6 PM"
 *               line_items:
 *                 type: array
 *                 description: Order line items
 *               shipping_lines:
 *                 type: array
 *                 description: Shipping lines
 *               billing:
 *                 type: object
 *                 description: Billing information
 *               shipping:
 *                 type: object
 *                 description: Shipping information
 *               payment_method:
 *                 type: string
 *                 description: Payment method
 *                 example: "stripe"
 *               payment_method_title:
 *                 type: string
 *                 description: Payment method title
 *                 example: "Credit Card"
 *               transaction_id:
 *                 type: string
 *                 description: Transaction ID
 *                 example: "txn_123456"
 *               customer_ip_address:
 *                 type: string
 *                 description: Customer IP address
 *                 example: "192.168.1.1"
 *               customer_user_agent:
 *                 type: string
 *                 description: Customer user agent
 *                 example: "Mozilla/5.0..."
 *               created_via:
 *                 type: string
 *                 description: How order was created
 *                 example: "checkout"
 *               date_completed:
 *                 type: string
 *                 format: date-time
 *                 description: Date when order was completed
 *                 example: "2024-01-15T10:30:00.000Z"
 *               date_paid:
 *                 type: string
 *                 format: date-time
 *                 description: Date when order was paid
 *                 example: "2024-01-15T10:30:00.000Z"
 *               cart_hash:
 *                 type: string
 *                 description: Cart hash
 *                 example: "abc123def456"
 *               number:
 *                 type: string
 *                 description: Order number
 *                 example: "1001"
 *               meta_data:
 *                 type: array
 *                 description: Order metadata
 *     responses:
 *       200:
 *         description: Order updated successfully
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
 *                   example: "Order updated successfully"
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *                 wooCommerceSync:
 *                   type: object
 *                   nullable: true
 *                   description: WooCommerce sync result if applicable
 *       400:
 *         description: Bad request - Invalid data
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
 *                   example: "Invalid update data"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Order not found
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
 *                   example: "Order not found"
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
 *                   example: "Failed to update order"
 */
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
      
      // Recalculate order total when line items are updated
      const currentTotalTax = sanitizedData.total_tax !== undefined ? sanitizedData.total_tax : currentOrder.total_tax;
      const currentShippingTotal = sanitizedData.shipping_total !== undefined ? sanitizedData.shipping_total : currentOrder.shipping_total;
      const currentDiscountTotal = sanitizedData.discount_total !== undefined ? sanitizedData.discount_total : currentOrder.discount_total;
      
      sanitizedData.total = calculateOrderTotal(
        sanitizedData.line_items, 
        currentTotalTax, 
        currentShippingTotal, 
        currentDiscountTotal
      );
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
            // Also update the number field for consistency
            sanitizedData.number = wooCommerceResult.data.id.toString();
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

    // ✅ AUDIT LOG: Order Updated
    await createAuditLog({
      action: 'Order Updated',
      user: req.user?._id,
      resource: 'order',
      resourceId: updatedOrder._id,
      details: {
        orderId: updatedOrder.order_id,
        orderNumber: updatedOrder.number,
        oldStatus: currentOrder.status,
        newStatus: updatedOrder.status,
        updatedFields: Object.keys(sanitizedData),
        syncToWooCommerce,
        syncStatus: sanitizedData.syncStatus,
        wooCommerceId: sanitizedData.wooCommerceId || currentOrder.wooCommerceId,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization || currentOrder.organizationId,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

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

    // Send notification for status changes
    try {
      if (sanitizedData.status && sanitizedData.status !== currentOrder.status) {
        // Get customer information for notification
        const Customer = require('../models/customers');
        const customer = await Customer.findOne({ customer_id: updatedOrder.customer_id });
        await notifyOrderStatusUpdated(updatedOrder, currentOrder.status, sanitizedData.status, currentOrder.organizationId);
      }
    } catch (notificationError) {
      console.error('Error sending order status update notification:', notificationError);
      // Don't fail the request if notification fails
    }

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

/**
 * @swagger
 * /api/orders/delete/{orderId}:
 *   delete:
 *     summary: Delete an order from the system
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Order ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               syncToWooCommerce:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to also delete order from WooCommerce
 *                 example: false
 *     responses:
 *       200:
 *         description: Order deleted successfully
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
 *                   example: "Order deleted successfully"
 *                 deletedOrder:
 *                   $ref: '#/components/schemas/Order'
 *                 wooCommerceSync:
 *                   type: object
 *                   nullable: true
 *                   description: WooCommerce sync result if applicable
 *                   properties:
 *                     synced:
 *                       type: boolean
 *                       description: Whether sync was successful
 *                       example: true
 *                     wooCommerceId:
 *                       type: string
 *                       description: WooCommerce order ID
 *                       example: "12345"
 *                     status:
 *                       type: string
 *                       description: Sync status
 *                       example: "deleted"
 *                     error:
 *                       type: string
 *                       nullable: true
 *                       description: Error message if sync failed
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Order or store not found
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
 *                   example: "Order not found"
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
 *                   example: "Failed to delete order"
 */
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

    // ✅ AUDIT LOG: Order Deleted
    await createAuditLog({
      action: 'Order Deleted',
      user: req.user?._id,
      resource: 'order',
      resourceId: orderToDelete._id,
      details: {
        orderId: orderToDelete.order_id,
        orderNumber: orderToDelete.number,
        status: orderToDelete.status,
        total: orderToDelete.total,
        currency: orderToDelete.currency,
        customerId: orderToDelete.customer_id,
        storeId: orderToDelete.storeId,
        organizationId: orderToDelete.organizationId,
        syncToWooCommerce,
        wooCommerceId: orderToDelete.wooCommerceId,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization || orderToDelete.organizationId,
      severity: 'warning', // Deletion is more critical
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

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

/**
 * @swagger
 * /api/orders/analytics/cross-store/{organizationId}:
 *   get:
 *     summary: Get cross-store performance analytics
 *     tags: [Orders]
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
 *         description: Cross-store performance analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: integer
 *                       description: Total orders across all stores
 *                       example: 150
 *                     totalRevenue:
 *                       type: number
 *                       description: Total revenue across all stores
 *                       example: 15000.00
 *                     avgOrderValue:
 *                       type: number
 *                       description: Average order value across all stores
 *                       example: 100.00
 *                 stores:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       storeId:
 *                         type: string
 *                         format: ObjectId
 *                         description: Store ID
 *                         example: "507f1f77bcf86cd799439011"
 *                       orderCount:
 *                         type: integer
 *                         description: Number of orders for this store
 *                         example: 75
 *                       totalRevenue:
 *                         type: number
 *                         description: Total revenue for this store
 *                         example: 7500.00
 *                       avgOrderValue:
 *                         type: number
 *                         description: Average order value for this store
 *                         example: 100.00
 *                       statusDistribution:
 *                         type: object
 *                         description: Distribution of order statuses
 *                         properties:
 *                           completed:
 *                             type: integer
 *                             example: 50
 *                           pending:
 *                             type: integer
 *                             example: 15
 *                           cancelled:
 *                             type: integer
 *                             example: 10
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/orders/analytics/temporal/{organizationId}:
 *   get:
 *     summary: Get temporal analytics for orders
 *     tags: [Orders]
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
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           default: "30d"
 *           enum: ["7d", "30d", "90d", "1y"]
 *         description: Time range for analytics
 *         example: "30d"
 *     responses:
 *       200:
 *         description: Temporal analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dailyTrends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         format: date
 *                         description: Date in YYYY-MM-DD format
 *                         example: "2024-01-15"
 *                       orders:
 *                         type: integer
 *                         description: Number of orders for this date
 *                         example: 25
 *                       revenue:
 *                         type: number
 *                         description: Total revenue for this date
 *                         example: 2500.00
 *                 hourlyPatterns:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: integer
 *                         description: Hour of day (0-23)
 *                         example: 14
 *                       orders:
 *                         type: integer
 *                         description: Number of orders for this hour
 *                         example: 8
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/orders/analytics/customers/{organizationId}:
 *   get:
 *     summary: Get customer analytics and insights
 *     tags: [Orders]
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top customers to return
 *         example: 10
 *     responses:
 *       200:
 *         description: Customer analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   customerId:
 *                     type: string
 *                     format: ObjectId
 *                     description: Customer ID
 *                     example: "507f1f77bcf86cd799439011"
 *                   totalSpent:
 *                     type: number
 *                     description: Total amount spent by customer
 *                     example: 1500.00
 *                   orderCount:
 *                     type: integer
 *                     description: Number of orders placed by customer
 *                     example: 15
 *                   storesUsed:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: ObjectId
 *                     description: Array of store IDs where customer has ordered
 *                     example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *                   avgDaysBetweenOrders:
 *                     type: number
 *                     description: Average days between orders
 *                     example: 30.5
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/orders/analytics/products/{organizationId}:
 *   get:
 *     summary: Get product performance analytics
 *     tags: [Orders]
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
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           default: "30d"
 *           enum: ["7d", "30d", "90d", "1y"]
 *         description: Time range for analytics
 *         example: "30d"
 *     responses:
 *       200:
 *         description: Product performance analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     format: ObjectId
 *                     description: Product ID
 *                     example: "507f1f77bcf86cd799439011"
 *                   name:
 *                     type: string
 *                     description: Product name
 *                     example: "Premium Widget"
 *                   totalSold:
 *                     type: integer
 *                     description: Total quantity sold
 *                     example: 150
 *                   totalRevenue:
 *                     type: number
 *                     description: Total revenue generated
 *                     example: 7500.00
 *                   storesSoldIn:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: ObjectId
 *                     description: Array of store IDs where product was sold
 *                     example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/orders/analytics/financial/{organizationId}:
 *   get:
 *     summary: Get financial analytics for orders
 *     tags: [Orders]
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
 *         description: Financial analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                   description: Total revenue across all orders
 *                   example: 50000.00
 *                 totalTax:
 *                   type: number
 *                   description: Total tax collected
 *                   example: 4000.00
 *                 totalShipping:
 *                   type: number
 *                   description: Total shipping charges
 *                   example: 2500.00
 *                 totalDiscounts:
 *                   type: number
 *                   description: Total discounts applied
 *                   example: 3000.00
 *                 paymentMethodDistribution:
 *                   type: object
 *                   description: Distribution of payment methods used
 *                   example:
 *                     stripe: 150
 *                     paypal: 75
 *                     cash: 25
 *                 netRevenue:
 *                   type: number
 *                   description: Net revenue after discounts
 *                   example: 47000.00
 *                 profitMargin:
 *                   type: number
 *                   description: Profit margin percentage
 *                   example: 85.5
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/orders/analytics/operations/{organizationId}:
 *   get:
 *     summary: Get operational metrics for orders
 *     tags: [Orders]
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
 *         description: Operational metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     format: ObjectId
 *                     description: Store ID
 *                     example: "507f1f77bcf86cd799439011"
 *                   avgProcessingTime:
 *                     type: number
 *                     description: Average order processing time in hours
 *                     example: 2.5
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/orders/analytics/geospatial/{organizationId}:
 *   get:
 *     summary: Get geospatial analytics for orders
 *     tags: [Orders]
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
 *         description: Geospatial analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Country code
 *                     example: "US"
 *                   orderCount:
 *                     type: integer
 *                     description: Number of orders from this country
 *                     example: 150
 *                   avgShippingCost:
 *                     type: number
 *                     description: Average shipping cost for this country
 *                     example: 8.50
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/orders/analytics/status/{organizationId}:
 *   get:
 *     summary: Get order status distribution analytics
 *     tags: [Orders]
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
 *         description: Status distribution analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     description: Order status
 *                     example: "completed"
 *                   count:
 *                     type: integer
 *                     description: Number of orders with this status
 *                     example: 150
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/orders/analytics/funnel/{organizationId}:
 *   get:
 *     summary: Get sales funnel analysis
 *     tags: [Orders]
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
 *         description: Sales funnel analysis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalVisitors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: integer
 *                         description: Total number of visitors
 *                         example: 1000
 *                 initiatedCheckout:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: integer
 *                         description: Number of visitors who initiated checkout
 *                         example: 500
 *                 completedOrders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: integer
 *                         description: Number of completed orders
 *                         example: 300
 *                 conversionRates:
 *                   type: object
 *                   properties:
 *                     checkoutToOrder:
 *                       type: number
 *                       description: Conversion rate from checkout to order
 *                       example: 60.0
 *                     visitorToOrder:
 *                       type: number
 *                       description: Conversion rate from visitor to order
 *                       example: 30.0
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/orders/analytics/ltv/{organizationId}:
 *   get:
 *     summary: Get customer lifetime value analytics
 *     tags: [Orders]
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
 *         description: Customer LTV analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avgLTV:
 *                   type: number
 *                   description: Average customer lifetime value
 *                   example: 250.00
 *                 medianLTV:
 *                   type: number
 *                   description: Median customer lifetime value
 *                   example: 180.00
 *                 avgCustomerLifespan:
 *                   type: number
 *                   description: Average customer lifespan in days
 *                   example: 365.5
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
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

/**
 * @swagger
 * /api/orders/recent:
 *   get:
 *     summary: Get recent orders for dashboard
 *     tags: [Orders]
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of recent orders to retrieve
 *         example: 5
 *     responses:
 *       200:
 *         description: Recent orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Order ID or order_id
 *                         example: "ORD-12345"
 *                       customer:
 *                         type: string
 *                         description: Customer name or email
 *                         example: "John Doe"
 *                       product:
 *                         type: string
 *                         description: Product name
 *                         example: "Premium Widget"
 *                       status:
 *                         type: string
 *                         description: Order status
 *                         example: "completed"
 *                       amount:
 *                         type: string
 *                         description: Formatted order total
 *                         example: "$99.99"
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         description: Order creation date
 *                         example: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - Missing organization ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Organization ID is required"
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
 *                   example: "Failed to fetch recent orders"
 */
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

/**
 * @swagger
 * /api/orders/with-shipping-label/{orderId}:
 *   get:
 *     summary: Get order with shipping label information
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Order ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Order with shipping label retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       $ref: '#/components/schemas/Order'
 *                     shippingLabel:
 *                       type: object
 *                       nullable: true
 *                       description: Shipping label information if exists
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Order not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
// GET order with shipping label information
exports.getOrderWithShippingLabel = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('customerId')
      .populate('storeId');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get shipping label if exists
    const ShippingLabel = require('../models/shippingLabel');
    const shippingLabel = await ShippingLabel.findOne({ orderId });
    
    res.json({
      success: true,
      data: {
        order,
        shippingLabel,
      },
    });
    
  } catch (error) {
    console.error('Error getting order with shipping label:', error);
    res.status(500).json({ error: error.message });
  }
};
