const crypto = require('crypto');
const Order = require('../models/order');
const Customer = require('../models/customers');
const Inventory = require('../models/inventory');
const Store = require('../models/store');
const Webhook = require('../models/webhook');
const WebhookDelivery = require('../models/webhookDelivery');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const logEvent = require('../helper/logEvent');

// Helper function to verify webhook signature
const verifyWebhookSignature = (payload, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('base64');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

// Helper function to get store by webhook URL
const getStoreByWebhookUrl = async (webhookUrl) => {
  try {
    // Extract webhook identifier from URL pattern: /api/webhooks/woocommerce/{webhookIdentifier}/{topic}
    const urlParts = webhookUrl.split('/');
    const webhookIdentifierIndex = urlParts.indexOf('woocommerce') + 1;
    
    if (webhookIdentifierIndex < urlParts.length) {
      const webhookIdentifier = urlParts[webhookIdentifierIndex];
      
      // Find webhook by identifier
      const webhook = await Webhook.findOne({ webhookIdentifier });
      if (!webhook) {
        console.error('Webhook not found for identifier:', webhookIdentifier);
        return null;
      }
      
      // Get store from webhook
      const store = await Store.findById(webhook.storeId);
      if (!store) {
        console.error('Store not found for webhook:', webhookIdentifier);
        return null;
      }
      
      return {
        storeId: store._id,
        organizationId: store.organizationId,
        userId: store.userId,
        webhookSecret: webhook.secret,
        name: store.name,
        url: store.url
      };
    }
    
    console.error('Invalid webhook URL format:', webhookUrl);
    return null;
  } catch (error) {
    console.error('Error getting store by webhook URL:', error);
    return null;
  }
};

// Helper function to process order data
const processOrderData = async (orderData, store) => {
  const { storeId, organizationId, userId } = store;
  
  // Get customer ID
  const customer = await Customer.findOne({
    customer_id: orderData.customer_id.toString(),
    storeId
  });
  
  // Process line items
  const lineItems = await Promise.all(
    orderData.line_items.map(async (item) => {
      const inventory = await Inventory.findOne({
        product_Id: item.product_id.toString(),
        storeId
      });
      return {
        ...item,
        inventoryId: inventory ? inventory._id : null
      };
    })
  );

  return {
    storeId,
    organizationId,
    userId,
    customerId: customer ? customer._id : null,
    customer_Id: orderData.customer_id,
    billing: orderData.billing,
    shipping: orderData.shipping,
    order_id: orderData.id.toString(),
    number: orderData.number,
    status: orderData.status,
    currency: orderData.currency,
    version: orderData.version,
    prices_include_tax: orderData.prices_include_tax,
    date_created: new Date(orderData.date_created),
    date_modified: new Date(orderData.date_modified),
    discount_total: orderData.discount_total,
    discount_tax: orderData.discount_tax,
    shipping_total: orderData.shipping_total,
    shipping_tax: orderData.shipping_tax,
    cart_tax: orderData.cart_tax,
    total: orderData.total,
    total_tax: orderData.total_tax,
    customer_note: orderData.customer_note,
    payment_method: orderData.payment_method,
    payment_method_title: orderData.payment_method_title,
    transaction_id: orderData.transaction_id,
    customer_ip_address: orderData.customer_ip_address,
    customer_user_agent: orderData.customer_user_agent,
    created_via: orderData.created_via,
    date_completed: orderData.date_completed,
    date_paid: orderData.date_paid,
    cart_hash: orderData.cart_hash,
    meta_data: orderData.meta_data,
    line_items: lineItems,
    shipping_lines: orderData.shipping_lines,
    fee_lines: orderData.fee_lines,
    coupon_lines: orderData.coupon_lines,
    refunds: orderData.refunds,
    payment_url: orderData.payment_url,
    is_editable: orderData.is_editable,
    needs_payment: orderData.needs_payment,
    needs_processing: orderData.needs_processing,
    date_created_gmt: orderData.date_created_gmt,
    date_modified_gmt: orderData.date_modified_gmt,
    date_completed_gmt: orderData.date_completed_gmt,
    date_paid_gmt: orderData.date_paid_gmt,
    currency_symbol: orderData.currency_symbol,
    _links: orderData._links
  };
};

// Helper function to process customer data
const processCustomerData = async (customerData, store) => {
  const { storeId, organizationId, userId } = store;
  
  return {
    storeId,
    organizationId,
    userId,
    customer_id: customerData.id.toString(),
    date_created: new Date(customerData.date_created),
    date_created_gmt: new Date(customerData.date_created_gmt),
    date_modified: new Date(customerData.date_modified),
    date_modified_gmt: new Date(customerData.date_modified_gmt),
    email: customerData.email,
    first_name: customerData.first_name,
    last_name: customerData.last_name,
    role: customerData.role,
    username: customerData.username,
    billing: customerData.billing,
    shipping: customerData.shipping,
    is_paying_customer: customerData.is_paying_customer,
    avatar_url: customerData.avatar_url,
    meta_data: customerData.meta_data,
    _links: customerData._links
  };
};

// Helper function to process product data
const processProductData = async (productData, store) => {
  const { storeId, organizationId, userId } = store;
  
  return {
    storeId,
    organizationId,
    userId,
    product_Id: productData.id.toString(),
    name: productData.name || 'N/A',
    sku: productData.sku || 'N/A',
    description: productData.description || 'N/A',
    short_description: productData.short_description || 'N/A',
    price: parseFloat(productData.price) || 0,
    sale_price: parseFloat(productData.sale_price) || 0,
    regular_price: parseFloat(productData.regular_price) || 0,
    date_on_sale_from: productData.date_on_sale_from ? new Date(productData.date_on_sale_from) : null,
    date_on_sale_to: productData.date_on_sale_to ? new Date(productData.date_on_sale_to) : null,
    on_sale: productData.on_sale || false,
    purchasable: productData.purchasable || true,
    total_sales: productData.total_sales || 0,
    status: productData.status || 'N/A',
    featured: productData.featured || false,
    catalog_visibility: productData.catalog_visibility || 'visible',
    manage_stock: productData.manage_stock || false,
    stock_quantity: productData.stock_quantity || 0,
    stock_status: productData.stock_status || 'N/A',
    backorders: productData.backorders || 'no',
    backorders_allowed: productData.backorders_allowed || false,
    weight: productData.weight || null,
    dimensions: productData.dimensions || { length: null, width: null, height: null },
    shipping_required: productData.shipping_required || false,
    shipping_taxable: productData.shipping_taxable || false,
    shipping_class: productData.shipping_class || 'N/A',
    shipping_class_id: productData.shipping_class_id || 0,
    categories: productData.categories || [],
    tags: productData.tags || [],
    images: productData.images || [],
    average_rating: productData.average_rating || '0.00',
    rating_count: productData.rating_count || 0,
    reviews_allowed: productData.reviews_allowed || true,
    permalink: productData.permalink || 'N/A',
    slug: productData.slug || 'N/A',
    type: productData.type || 'N/A',
    external_url: productData.external_url || '',
    button_text: productData.button_text || '',
    upsell_ids: productData.upsell_ids || [],
    cross_sell_ids: productData.cross_sell_ids || [],
    related_ids: productData.related_ids || [],
    purchase_note: productData.purchase_note || '',
    sold_individually: productData.sold_individually || false,
    grouped_products: productData.grouped_products || [],
    menu_order: productData.menu_order || 0,
    date_created: new Date(productData.date_created),
    date_modified: new Date(productData.date_modified)
  };
};

// Generic webhook handler
const handleWebhook = async (req, res, eventType, processData) => {
  try {
    const webhookSignature = req.headers['x-wc-webhook-signature'];
    const webhookTopic = req.headers['x-wc-webhook-topic'];
    const webhookResource = req.headers['x-wc-webhook-resource'];
    const webhookEvent = req.headers['x-wc-webhook-event'];
    const webhookId = req.headers['x-wc-webhook-id'];
    const webhookDeliveryId = req.headers['x-wc-webhook-delivery-id'];
    
    console.log(`Received webhook: ${webhookTopic} for ${webhookResource} (${webhookEvent})`);
    
    // Get store from webhook URL or headers
    const store = await getStoreByWebhookUrl(req.originalUrl);
    if (!store) {
      console.error('Store not found for webhook URL:', req.originalUrl);
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // Verify webhook signature if secret is configured
    if (store.webhookSecret && webhookSignature) {
      const rawBody = JSON.stringify(req.body);
      const isValid = verifyWebhookSignature(rawBody, webhookSignature, store.webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    // Process the webhook data
    const processedData = await processData(req.body, store);
    
    // Update database based on event type
    let result;
    switch (eventType) {
      case 'order.created':
        result = await Order.create(processedData);
        break;
      case 'order.updated':
        result = await Order.findOneAndUpdate(
          { order_id: processedData.order_id, storeId: store.storeId },
          { $set: processedData },
          { new: true, upsert: true }
        );
        break;
      case 'order.deleted':
        result = await Order.findOneAndDelete(
          { order_id: processedData.order_id, storeId: store.storeId }
        );
        break;
      case 'customer.created':
        result = await Customer.create(processedData);
        break;
      case 'customer.updated':
        result = await Customer.findOneAndUpdate(
          { customer_id: processedData.customer_id, storeId: store.storeId },
          { $set: processedData },
          { new: true, upsert: true }
        );
        break;
      case 'customer.deleted':
        result = await Customer.findOneAndDelete(
          { customer_id: processedData.customer_id, storeId: store.storeId }
        );
        break;
      case 'product.created':
        result = await Inventory.create(processedData);
        break;
      case 'product.updated':
        result = await Inventory.findOneAndUpdate(
          { product_Id: processedData.product_Id, storeId: store.storeId },
          { $set: processedData },
          { new: true, upsert: true }
        );
        break;
      case 'product.deleted':
        result = await Inventory.findOneAndDelete(
          { product_Id: processedData.product_Id, storeId: store.storeId }
        );
        break;
    }
    
    // Log webhook delivery
    await WebhookDelivery.create({
      webhookId,
      deliveryId: webhookDeliveryId,
      topic: webhookTopic,
      resource: webhookResource,
      event: webhookEvent,
      status: 'success',
      responseCode: 200,
      responseMessage: 'OK',
      requestHeaders: req.headers,
      requestBody: req.body,
      responseHeaders: {},
      responseBody: { success: true },
      duration: Date.now() - req.startTime,
      storeId: store.storeId,
      organizationId: store.organizationId
    });
    
    // Log event
    await logEvent({
      action: `webhook_${eventType}`,
      user: store.userId,
      resource: webhookResource,
      resourceId: result ? result._id : null,
      details: { 
        webhookTopic,
        webhookEvent,
        storeId: store.storeId
      },
      organization: store.organizationId
    });
    
    res.status(200).json({ success: true, message: `${webhookResource} ${webhookEvent} processed successfully` });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Log failed delivery
    if (req.headers['x-wc-webhook-id']) {
      await WebhookDelivery.create({
        webhookId: req.headers['x-wc-webhook-id'],
        deliveryId: req.headers['x-wc-webhook-delivery-id'],
        topic: req.headers['x-wc-webhook-topic'],
        resource: req.headers['x-wc-webhook-resource'],
        event: req.headers['x-wc-webhook-event'],
        status: 'failed',
        responseCode: 500,
        responseMessage: error.message,
        requestHeaders: req.headers,
        requestBody: req.body,
        responseHeaders: {},
        responseBody: { error: error.message },
        duration: Date.now() - req.startTime,
        storeId: store ? store.storeId : null,
        organizationId: store ? store.organizationId : null
      });
    }
    
    res.status(500).json({ error: 'Webhook processing failed', message: error.message });
  }
};

// Order webhook handlers
exports.handleOrderCreated = async (req, res) => {
  req.startTime = Date.now();
  await handleWebhook(req, res, 'order.created', processOrderData);
};

exports.handleOrderUpdated = async (req, res) => {
  req.startTime = Date.now();
  await handleWebhook(req, res, 'order.updated', processOrderData);
};

exports.handleOrderDeleted = async (req, res) => {
  req.startTime = Date.now();
  await handleWebhook(req, res, 'order.deleted', processOrderData);
};

// Customer webhook handlers
exports.handleCustomerCreated = async (req, res) => {
  req.startTime = Date.now();
  await handleWebhook(req, res, 'customer.created', processCustomerData);
};

exports.handleCustomerUpdated = async (req, res) => {
  req.startTime = Date.now();
  await handleWebhook(req, res, 'customer.updated', processCustomerData);
};

exports.handleCustomerDeleted = async (req, res) => {
  req.startTime = Date.now();
  await handleWebhook(req, res, 'customer.deleted', processCustomerData);
};

// Product webhook handlers
exports.handleProductCreated = async (req, res) => {
  req.startTime = Date.now();
  await handleWebhook(req, res, 'product.created', processProductData);
};

exports.handleProductUpdated = async (req, res) => {
  req.startTime = Date.now();
  await handleWebhook(req, res, 'product.updated', processProductData);
};

exports.handleProductDeleted = async (req, res) => {
  req.startTime = Date.now();
  await handleWebhook(req, res, 'product.deleted', processProductData);
};

// Webhook management functions
exports.createWebhook = async (req, res) => {
  try {
    const { storeId, topic, name } = req.body;
    
    // Validate store exists
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // Validate store has WooCommerce API credentials
    if (!store.apiKey || !store.secretKey || !store.url) {
      return res.status(400).json({ 
        error: 'Store missing WooCommerce API credentials', 
        message: 'Please configure the store with valid WooCommerce API keys and URL'
      });
    }
    
    // Generate unique webhook identifier for this store
    const webhookIdentifier = `${store._id.toString()}-${Date.now()}`;
    
    // Generate dynamic webhook URL that includes store identification
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 8800}`;
    const deliveryUrl = `${baseUrl}/api/webhooks/woocommerce/${webhookIdentifier}/${topic}`;
    
    // Generate a secure secret for webhook verification
    const secret = crypto.randomBytes(32).toString('hex');
    
    // Initialize WooCommerce API
    const wooCommerce = new WooCommerceRestApi({
      url: store.url,
      consumerKey: store.apiKey,
      consumerSecret: store.secretKey,
      version: 'wc/v3'
    });
    
    // Create webhook in WooCommerce
    const webhookData = {
      name: name || `${topic} webhook for ${store.name}`,
      topic: topic,
      delivery_url: deliveryUrl,
      secret: secret
    };
    
    let wooCommerceWebhook;
    try {
      const response = await wooCommerce.post('webhooks', webhookData);
      wooCommerceWebhook = response.data;
    } catch (wooCommerceError) {
      console.error('WooCommerce API error:', wooCommerceError);
      return res.status(400).json({ 
        error: 'Failed to create webhook in WooCommerce', 
        message: wooCommerceError.message || 'WooCommerce API error'
      });
    }
    
    // Save webhook to our database
    const webhook = await Webhook.create({
      storeId,
      organizationId: store.organizationId,
      wooCommerceId: wooCommerceWebhook.id,
      name: wooCommerceWebhook.name,
      topic: wooCommerceWebhook.topic,
      status: wooCommerceWebhook.status,
      deliveryUrl: wooCommerceWebhook.delivery_url,
      secret: secret, // Use our locally generated secret
      resource: wooCommerceWebhook.resource,
      event: wooCommerceWebhook.event,
      hooks: wooCommerceWebhook.hooks,
      webhookIdentifier: webhookIdentifier // Store the identifier for routing
    });
    
    res.status(201).json({
      success: true,
      message: 'Webhook created successfully',
      webhook: {
        ...webhook.toObject(),
        copyableUrl: deliveryUrl, // URL that user can copy to WooCommerce
        instructions: `Copy this URL to your WooCommerce webhook settings: ${deliveryUrl}`
      }
    });
    
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook', message: error.message });
  }
};

exports.listWebhooks = async (req, res) => {
  try {
    const { storeId, organizationId, status } = req.query;
    const filter = {};
    
    if (storeId) filter.storeId = storeId;
    if (organizationId) filter.organizationId = organizationId;
    if (status) filter.status = status;
    
    const webhooks = await Webhook.find(filter)
      .populate('storeId', 'name url platformType')
      .sort({ createdAt: -1 });
    
    // Add summary statistics
    const total = webhooks.length;
    const active = webhooks.filter(w => w.status === 'active').length;
    const paused = webhooks.filter(w => w.status === 'paused').length;
    const disabled = webhooks.filter(w => w.status === 'disabled').length;
    
    res.json({
      success: true,
      webhooks,
      summary: {
        total,
        active,
        paused,
        disabled
      }
    });
    
  } catch (error) {
    console.error('Error listing webhooks:', error);
    res.status(500).json({ error: 'Failed to list webhooks', message: error.message });
  }
};

exports.getWebhook = async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id).populate('storeId', 'name url');
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    res.json({
      success: true,
      webhook
    });
    
  } catch (error) {
    console.error('Error getting webhook:', error);
    res.status(500).json({ error: 'Failed to get webhook', message: error.message });
  }
};

exports.updateWebhook = async (req, res) => {
  try {
    const { name, status, deliveryUrl, secret } = req.body;
    
    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    // Get store for WooCommerce API
    const store = await Store.findById(webhook.storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // Initialize WooCommerce API
    const wooCommerce = new WooCommerceRestApi({
      url: store.url,
      consumerKey: store.apiKey,
      consumerSecret: store.secretKey,
      version: 'wc/v3'
    });
    
    // Update webhook in WooCommerce
    const updateData = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (deliveryUrl) updateData.delivery_url = deliveryUrl;
    if (secret) updateData.secret = secret;
    
    await wooCommerce.put(`webhooks/${webhook.wooCommerceId}`, updateData);
    
    // Update webhook in our database
    const updatedWebhook = await Webhook.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Webhook updated successfully',
      webhook: updatedWebhook
    });
    
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook', message: error.message });
  }
};

exports.deleteWebhook = async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    // Get store for WooCommerce API
    const store = await Store.findById(webhook.storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // Initialize WooCommerce API
    const wooCommerce = new WooCommerceRestApi({
      url: store.url,
      consumerKey: store.apiKey,
      consumerSecret: store.secretKey,
      version: 'wc/v3'
    });
    
    // Delete webhook in WooCommerce
    await wooCommerce.delete(`webhooks/${webhook.wooCommerceId}`);
    
    // Delete webhook from our database
    await Webhook.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook', message: error.message });
  }
};

exports.getWebhookDeliveries = async (req, res) => {
  try {
    const deliveries = await WebhookDelivery.find({ webhookId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      deliveries
    });
    
  } catch (error) {
    console.error('Error getting webhook deliveries:', error);
    res.status(500).json({ error: 'Failed to get webhook deliveries', message: error.message });
  }
};

exports.getWebhookDelivery = async (req, res) => {
  try {
    const delivery = await WebhookDelivery.findOne({
      webhookId: req.params.id,
      deliveryId: req.params.deliveryId
    });
    
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.json({
      success: true,
      delivery
    });
    
  } catch (error) {
    console.error('Error getting webhook delivery:', error);
    res.status(500).json({ error: 'Failed to get webhook delivery', message: error.message });
  }
};

exports.testWebhook = async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    // Get store for WooCommerce API
    const store = await Store.findById(webhook.storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // Initialize WooCommerce API
    const wooCommerce = new WooCommerceRestApi({
      url: store.url,
      consumerKey: store.apiKey,
      consumerSecret: store.secretKey,
      version: 'wc/v3'
    });
    
    // Send test webhook to WooCommerce
    await wooCommerce.post(`webhooks/${webhook.wooCommerceId}/deliveries`, {
      topic: webhook.topic,
      delivery_url: webhook.deliveryUrl
    });
    
    res.json({
      success: true,
      message: 'Webhook test initiated successfully'
    });
    
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ error: 'Failed to test webhook', message: error.message });
  }
};

// Bulk webhook management
exports.bulkUpdateWebhooks = async (req, res) => {
  try {
    const { webhookIds, status } = req.body;
    
    if (!webhookIds || !Array.isArray(webhookIds) || webhookIds.length === 0) {
      return res.status(400).json({ error: 'Webhook IDs array is required' });
    }
    
    if (!status || !['active', 'paused', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }
    
    const results = {
      total: webhookIds.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    // Process webhooks in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < webhookIds.length; i += batchSize) {
      const batch = webhookIds.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (webhookId) => {
        try {
          const webhook = await Webhook.findById(webhookId);
          if (!webhook) {
            results.failed++;
            results.errors.push({ webhookId, error: 'Webhook not found' });
            return;
          }
          
          // Get store for WooCommerce API
          const store = await Store.findById(webhook.storeId);
          if (!store) {
            results.failed++;
            results.errors.push({ webhookId, error: 'Store not found' });
            return;
          }
          
          // Initialize WooCommerce API
          const wooCommerce = new WooCommerceRestApi({
            url: store.url,
            consumerKey: store.apiKey,
            consumerSecret: store.secretKey,
            version: 'wc/v3'
          });
          
          // Update webhook in WooCommerce
          await wooCommerce.put(`webhooks/${webhook.wooCommerceId}`, { status });
          
          // Update webhook in our database
          await Webhook.findByIdAndUpdate(webhookId, { status });
          
          results.successful++;
          
        } catch (error) {
          results.failed++;
          results.errors.push({ webhookId, error: error.message });
        }
      }));
      
      // Small delay between batches
      if (i + batchSize < webhookIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    res.json({
      success: true,
      message: 'Bulk webhook update completed',
      results
    });
    
  } catch (error) {
    console.error('Error in bulk webhook update:', error);
    res.status(500).json({ error: 'Failed to update webhooks', message: error.message });
  }
};

// Get webhook statistics
exports.getWebhookStats = async (req, res) => {
  try {
    const { storeId, organizationId, days = 30 } = req.query;
    const filter = {};
    
    if (storeId) filter.storeId = storeId;
    if (organizationId) filter.organizationId = organizationId;
    
    // Get webhook counts by status
    const statusStats = await Webhook.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Get webhook counts by topic
    const topicStats = await Webhook.aggregate([
      { $match: filter },
      { $group: { _id: '$topic', count: { $sum: 1 } } }
    ]);
    
    // Get recent webhook deliveries
    const recentDeliveries = await WebhookDelivery.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      stats: {
        statusStats,
        topicStats,
        recentDeliveries
      }
    });
    
  } catch (error) {
    console.error('Error getting webhook stats:', error);
    res.status(500).json({ error: 'Failed to get webhook stats', message: error.message });
  }
}; 