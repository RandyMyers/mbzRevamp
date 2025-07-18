const crypto = require('crypto');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const Webhook = require('../models/webhook');
const logEvent = require('../helper/logEvent');

/**
 * Default webhook topics to create for new stores
 */
const DEFAULT_WEBHOOK_TOPICS = [
  'order.created',
  'order.updated',
  'customer.created',
  'customer.updated',
  'product.created',
  'product.updated'
];

/**
 * Webhook topic configuration with friendly names
 */
const WEBHOOK_TOPIC_CONFIG = {
  'order.created': {
    name: 'Order Created',
    description: 'Triggers when a new order is created in WooCommerce'
  },
  'order.updated': {
    name: 'Order Updated',
    description: 'Triggers when an existing order is updated in WooCommerce'
  },
  'customer.created': {
    name: 'Customer Created',
    description: 'Triggers when a new customer is created in WooCommerce'
  },
  'customer.updated': {
    name: 'Customer Updated',
    description: 'Triggers when an existing customer is updated in WooCommerce'
  },
  'product.created': {
    name: 'Product Created',
    description: 'Triggers when a new product is created in WooCommerce'
  },
  'product.updated': {
    name: 'Product Updated',
    description: 'Triggers when an existing product is updated in WooCommerce'
  }
};

/**
 * Initialize WooCommerce API for a store
 * @param {Object} store - Store object with WooCommerce credentials
 * @returns {WooCommerceRestApi} WooCommerce API instance
 */
const initializeWooCommerceAPI = (store) => {
  if (!store || !store.url || !store.apiKey || !store.secretKey) {
    throw new Error('Invalid store configuration for WooCommerce API');
  }

  return new WooCommerceRestApi({
    url: store.url,
    consumerKey: store.apiKey,
    consumerSecret: store.secretKey,
    version: 'wc/v3',
    queryStringAuth: true
  });
};

/**
 * Create a single webhook for a store
 * @param {Object} store - Store object
 * @param {string} topic - Webhook topic
 * @param {string} userId - User ID for logging
 * @returns {Object} Created webhook data
 */
const createSingleWebhook = async (store, topic, userId) => {
  try {
    // Generate unique webhook identifier
    const webhookIdentifier = `${store._id.toString()}-${topic.replace('.', '-')}-${Date.now()}`;
    
    // Generate dynamic webhook URL
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 8800}`;
    const deliveryUrl = `${baseUrl}/api/webhooks/woocommerce/${webhookIdentifier}/${topic}`;
    
    // Generate secure secret
    const secret = crypto.randomBytes(32).toString('hex');
    
    // Initialize WooCommerce API
    const wooCommerce = initializeWooCommerceAPI(store);
    
    // Prepare webhook data for WooCommerce
    const webhookConfig = WEBHOOK_TOPIC_CONFIG[topic];
    const webhookData = {
      name: `${webhookConfig.name} - ${store.name}`,
      topic: topic,
      delivery_url: deliveryUrl,
      secret: secret
    };
    
    // Create webhook in WooCommerce
    const response = await wooCommerce.post('webhooks', webhookData);
    const wooCommerceWebhook = response.data;
    
    // Save webhook to our database
    const webhook = await Webhook.create({
      storeId: store._id,
      organizationId: store.organizationId,
      wooCommerceId: wooCommerceWebhook.id,
      name: wooCommerceWebhook.name,
      topic: wooCommerceWebhook.topic,
      status: wooCommerceWebhook.status,
      deliveryUrl: wooCommerceWebhook.delivery_url,
      secret: secret,
      resource: wooCommerceWebhook.resource,
      event: wooCommerceWebhook.event,
      hooks: wooCommerceWebhook.hooks,
      webhookIdentifier: webhookIdentifier
    });
    
    // Log successful webhook creation
    await logEvent({
      action: 'webhook_auto_created',
      user: userId,
      resource: 'Webhook',
      resourceId: webhook._id,
      details: {
        storeId: store._id,
        storeName: store.name,
        topic: topic,
        wooCommerceId: wooCommerceWebhook.id,
        deliveryUrl: deliveryUrl
      },
      organization: store.organizationId
    });
    
    return {
      success: true,
      webhook: webhook,
      wooCommerceId: wooCommerceWebhook.id,
      deliveryUrl: deliveryUrl
    };
    
  } catch (error) {
    console.error(`Error creating webhook for topic ${topic}:`, error);
    
    // Log failed webhook creation
    await logEvent({
      action: 'webhook_auto_creation_failed',
      user: userId,
      resource: 'Webhook',
      details: {
        storeId: store._id,
        storeName: store.name,
        topic: topic,
        error: error.message
      },
      organization: store.organizationId
    });
    
    return {
      success: false,
      error: error.message,
      topic: topic
    };
  }
};

/**
 * Create default webhooks for a new store
 * @param {Object} store - Store object
 * @param {string} userId - User ID for logging
 * @param {Array} topics - Optional array of topics to create (defaults to DEFAULT_WEBHOOK_TOPICS)
 * @returns {Object} Results of webhook creation
 */
const createDefaultWebhooks = async (store, userId, topics = DEFAULT_WEBHOOK_TOPICS) => {
  const results = {
    total: topics.length,
    successful: 0,
    failed: 0,
    webhooks: [],
    errors: []
  };
  
  console.log(`Creating ${topics.length} default webhooks for store: ${store.name}`);
  
  // Create webhooks sequentially to avoid rate limiting
  for (const topic of topics) {
    try {
      const result = await createSingleWebhook(store, topic, userId);
      
      if (result.success) {
        results.successful++;
        results.webhooks.push({
          topic: topic,
          webhookId: result.webhook._id,
          wooCommerceId: result.wooCommerceId,
          deliveryUrl: result.deliveryUrl
        });
      } else {
        results.failed++;
        results.errors.push({
          topic: topic,
          error: result.error
        });
      }
      
      // Small delay between webhook creations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      results.failed++;
      results.errors.push({
        topic: topic,
        error: error.message
      });
    }
  }
  
  // Log overall results
  await logEvent({
    action: 'webhook_auto_creation_completed',
    user: userId,
    resource: 'Webhook',
    details: {
      storeId: store._id,
      storeName: store.name,
      total: results.total,
      successful: results.successful,
      failed: results.failed,
      topics: topics
    },
    organization: store.organizationId
  });
  
  return results;
};

/**
 * Validate store for webhook creation
 * @param {Object} store - Store object
 * @returns {Object} Validation result
 */
const validateStoreForWebhooks = (store) => {
  if (!store) {
    return { valid: false, error: 'Store is required' };
  }
  
  if (!store.url) {
    return { valid: false, error: 'Store URL is required' };
  }
  
  if (!store.apiKey) {
    return { valid: false, error: 'Store API key is required' };
  }
  
  if (!store.secretKey) {
    return { valid: false, error: 'Store secret key is required' };
  }
  
  if (!store.isActive) {
    return { valid: false, error: 'Store must be active' };
  }
  
  return { valid: true };
};

/**
 * Get webhook creation status for a store
 * @param {string} storeId - Store ID
 * @returns {Object} Webhook status information
 */
const getWebhookStatus = async (storeId) => {
  try {
    const webhooks = await Webhook.find({ storeId }).select('topic status lastDelivery failureCount');
    
    const status = {
      total: webhooks.length,
      active: webhooks.filter(w => w.status === 'active').length,
      paused: webhooks.filter(w => w.status === 'paused').length,
      disabled: webhooks.filter(w => w.status === 'disabled').length,
      topics: webhooks.map(w => ({
        topic: w.topic,
        status: w.status,
        lastDelivery: w.lastDelivery,
        failureCount: w.failureCount
      }))
    };
    
    return { success: true, status };
    
  } catch (error) {
    console.error('Error getting webhook status:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createDefaultWebhooks,
  createSingleWebhook,
  validateStoreForWebhooks,
  getWebhookStatus,
  DEFAULT_WEBHOOK_TOPICS,
  WEBHOOK_TOPIC_CONFIG
}; 