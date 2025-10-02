const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const Store = require('../models/store');
const logEvent = require('./logEvent');
const https = require('https');

/**
 * Initialize WooCommerce API instance for a store
 * @param {Object} store - Store object with WooCommerce credentials
 * @returns {WooCommerceRestApi} WooCommerce API instance
 */
const initializeWooCommerceAPI = (store) => {
  if (!store || !store.url || !store.apiKey || !store.secretKey) {
    throw new Error('Invalid store configuration for WooCommerce API');
  }

  // Create HTTPS agent configuration for SSL bypass (if needed)
  let httpsAgent = null;
  if (process.env.WOOCOMMERCE_BYPASS_SSL === 'true' || process.env.NODE_ENV === 'development') {
    httpsAgent = new https.Agent({
      rejectUnauthorized: false // WARNING: This bypasses SSL certificate validation
    });
  }

  return new WooCommerceRestApi({
    url: store.url,
    consumerKey: store.apiKey,
    consumerSecret: store.secretKey,
    version: 'wc/v3',
    queryStringAuth: true, // Force Basic Authentication as query string
    ...(httpsAgent && { httpsAgent }) // Only add httpsAgent if it's configured
  });
};

/**
 * Handle WooCommerce API errors with standardized format
 * @param {Error} error - The error object
 * @param {string} operation - Operation being performed
 * @param {string} entityType - Type of entity (product, customer, order)
 * @returns {Object} Standardized error object
 */
const handleWooCommerceError = (error, operation, entityType) => {
  console.error(`WooCommerce ${operation} error for ${entityType}:`, error);
  
  let errorMessage = 'WooCommerce sync failed';
  let statusCode = 500;

  if (error.response) {
    // API response error
    statusCode = error.response.status;
    const errorData = error.response.data;
    
    if (errorData && errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData && errorData.code) {
      errorMessage = `WooCommerce API Error: ${errorData.code}`;
    } else {
      errorMessage = `WooCommerce API Error: ${statusCode}`;
    }
  } else if (error.request) {
    // Network error
    errorMessage = 'Network error connecting to WooCommerce store';
    statusCode = 503;
  } else {
    // Other error
    errorMessage = error.message || 'Unknown WooCommerce error';
  }

  return {
    success: false,
    error: errorMessage,
    statusCode,
    details: {
      operation,
      entityType,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Validate WooCommerce API response
 * @param {Object} response - WooCommerce API response
 * @param {string} operation - Operation being performed
 * @returns {Object} Validation result
 */
const validateWooCommerceResponse = (response, operation) => {
  if (!response || !response.data) {
    return {
      valid: false,
      error: `Invalid response from WooCommerce ${operation}`
    };
  }

  // Check for required fields based on operation
  const data = response.data;
  
  switch (operation) {
    case 'createProduct':
    case 'updateProduct':
      if (!data.id || !data.name) {
        return {
          valid: false,
          error: 'Invalid product response from WooCommerce'
        };
      }
      break;
    case 'createCustomer':
    case 'updateCustomer':
      if (!data.id || !data.email) {
        return {
          valid: false,
          error: 'Invalid customer response from WooCommerce'
        };
      }
      break;
    case 'createOrder':
    case 'updateOrder':
      if (!data.id || !data.number) {
        return {
          valid: false,
          error: 'Invalid order response from WooCommerce'
        };
      }
      break;
  }

  return {
    valid: true,
    data: data
  };
};

/**
 * Log WooCommerce sync operation
 * @param {string} operation - Operation type (create, update)
 * @param {string} entityType - Entity type (product, customer, order)
 * @param {string} entityId - Local entity ID
 * @param {string} storeId - Store ID
 * @param {string} status - Sync status (success, failed, skipped)
 * @param {Object} userId - User performing the operation
 * @param {string} organizationId - Organization ID
 * @param {Object} error - Error details if failed
 * @param {number} wooCommerceId - WooCommerce ID if successful
 */
const logWooCommerceSync = async ({
  operation,
  entityType,
  entityId,
  storeId,
  status,
  userId,
  organizationId,
  error = null,
  wooCommerceId = null
}) => {
  try {
    await logEvent({
      action: `woocommerce_${operation}_${entityType}`,
      user: userId,
      resource: entityType.charAt(0).toUpperCase() + entityType.slice(1),
      resourceId: entityId,
      details: {
        operation,
        entityType,
        storeId,
        status,
        wooCommerceId,
        error: error?.message || error,
        timestamp: new Date().toISOString()
      },
      organization: organizationId
    });
  } catch (logError) {
    console.error('Failed to log WooCommerce sync event:', logError);
  }
};

/**
 * Get store by ID with validation
 * @param {string} storeId - Store ID
 * @returns {Object} Store object
 */
const getStoreById = async (storeId) => {
  if (!storeId) {
    throw new Error('Store ID is required for WooCommerce sync');
  }

  const store = await Store.findById(storeId);
  if (!store) {
    throw new Error('Store not found');
  }

  if (!store.isActive) {
    throw new Error('Store is not active');
  }

  if (!store.url || !store.apiKey || !store.secretKey) {
    throw new Error('Store WooCommerce configuration is incomplete');
  }

  return store;
};

/**
 * Rate limiting utility for WooCommerce API calls
 * @param {Function} apiCall - API call function to execute
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise} API call result
 */
const executeWithRateLimit = async (apiCall, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Check if it's a rate limit error (429)
      if (error.response && error.response.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 60;
        const delay = Math.min(retryAfter * 1000, 60000); // Max 60 seconds
        
        console.log(`Rate limited, waiting ${delay}ms before retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors, don't retry
      break;
    }
  }
  
  throw lastError;
};

module.exports = {
  initializeWooCommerceAPI,
  handleWooCommerceError,
  validateWooCommerceResponse,
  logWooCommerceSync,
  getStoreById,
  executeWithRateLimit
}; 