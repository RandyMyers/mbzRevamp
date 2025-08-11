const {
  initializeWooCommerceAPI,
  handleWooCommerceError,
  validateWooCommerceResponse,
  logWooCommerceSync,
  executeWithRateLimit
} = require('./wooCommerceSyncHelper');

/**
 * Delete product from WooCommerce store
 * @param {Object} store - Store configuration object
 * @param {number} wooCommerceId - WooCommerce product ID
 * @param {Object} productData - Local product data for logging
 * @returns {Object} Sync result
 */
const deleteProductInWooCommerce = async (store, wooCommerceId, productData) => {
  try {
    if (!wooCommerceId) {
      throw new Error('WooCommerce product ID is required for deletion');
    }

    if (!store) {
      throw new Error('Store configuration is required');
    }

    console.log('🗑️ Deleting product from WooCommerce, ID:', wooCommerceId);
    
    // Initialize WooCommerce API with store configuration
    const api = initializeWooCommerceAPI(store);

    // Execute API call with rate limiting
    const response = await executeWithRateLimit(() => 
      api.delete(`products/${wooCommerceId}`, { force: true })
    );

    // Validate response
    const validation = validateWooCommerceResponse(response, 'deleteProduct');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Log successful sync
    await logWooCommerceSync({
      operation: 'delete',
      entityType: 'product',
      entityId: productData._id || productData.id,
      storeId: store._id || store.id,
      status: 'success',
      userId: productData.userId || 'system',
      organizationId: productData.organizationId || 'system',
      wooCommerceId: wooCommerceId
    });

    console.log('✅ Product deleted from WooCommerce:', wooCommerceId);

    return {
      success: true,
      wooCommerceId: wooCommerceId,
      status: 'success'
    };

  } catch (error) {
    console.error('❌ WooCommerce delete error for product:', error);
    const errorResult = handleWooCommerceError(error, 'delete', 'product');
    
    // Log failed sync
    await logWooCommerceSync({
      operation: 'delete',
      entityType: 'product',
      entityId: productData._id || productData.id,
      storeId: store._id || store.id,
      status: 'failed',
      userId: productData.userId || 'system',
      organizationId: productData.organizationId || 'system',
      wooCommerceId: wooCommerceId,
      error: errorResult
    });

    return errorResult;
  }
};

/**
 * Delete customer from WooCommerce store
 * @param {Object} store - Store configuration object
 * @param {number} wooCommerceId - WooCommerce customer ID
 * @param {Object} customerData - Local customer data for logging
 * @returns {Object} Sync result
 */
const deleteCustomerInWooCommerce = async (store, wooCommerceId, customerData) => {
  try {
    if (!wooCommerceId) {
      throw new Error('WooCommerce customer ID is required for deletion');
    }

    if (!store) {
      throw new Error('Store configuration is required');
    }

    console.log('🗑️ Deleting customer from WooCommerce, ID:', wooCommerceId);
    
    // Initialize WooCommerce API with store configuration
    const api = initializeWooCommerceAPI(store);

    // Execute API call with rate limiting
    const response = await executeWithRateLimit(() => 
      api.delete(`customers/${wooCommerceId}`, { force: true })
    );

    // Validate response
    const validation = validateWooCommerceResponse(response, 'deleteCustomer');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Log successful sync
    await logWooCommerceSync({
      operation: 'delete',
      entityType: 'customer',
      entityId: customerData._id || customerData.id,
      storeId: store._id || store.id,
      status: 'success',
      userId: customerData.userId || 'system',
      organizationId: customerData.organizationId || 'system',
      wooCommerceId: wooCommerceId
    });

    console.log('✅ Customer deleted from WooCommerce:', wooCommerceId);

    return {
      success: true,
      wooCommerceId: wooCommerceId,
      status: 'success'
    };

  } catch (error) {
    console.error('❌ WooCommerce delete error for customer:', error);
    const errorResult = handleWooCommerceError(error, 'delete', 'customer');
    
    // Log failed sync
    await logWooCommerceSync({
      operation: 'delete',
      entityType: 'customer',
      entityId: customerData._id || customerData.id,
      storeId: store._id || store.id,
      status: 'failed',
      userId: customerData.userId || 'system',
      organizationId: customerData.organizationId || 'system',
      wooCommerceId: wooCommerceId,
      error: errorResult
    });

    return errorResult;
  }
};

/**
 * Delete order from WooCommerce store
 * @param {Object} store - Store configuration object
 * @param {number} wooCommerceId - WooCommerce order ID
 * @param {Object} orderData - Local order data for logging
 * @returns {Object} Sync result
 */
const deleteOrderInWooCommerce = async (store, wooCommerceId, orderData) => {
  try {
    if (!wooCommerceId) {
      throw new Error('WooCommerce order ID is required for deletion');
    }

    if (!store) {
      throw new Error('Store configuration is required');
    }

    console.log('🗑️ Deleting order from WooCommerce, ID:', wooCommerceId);
    
    // Initialize WooCommerce API with store configuration
    const api = initializeWooCommerceAPI(store);

    // Execute API call with rate limiting
    const response = await executeWithRateLimit(() => 
      api.delete(`orders/${wooCommerceId}`, { force: true })
    );

    // Validate response
    const validation = validateWooCommerceResponse(response, 'deleteOrder');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Log successful sync
    await logWooCommerceSync({
      operation: 'delete',
      entityType: 'order',
      entityId: orderData._id || orderData.id,
      storeId: store._id || store.id,
      status: 'success',
      userId: orderData.userId || 'system',
      organizationId: orderData.organizationId || 'system',
      wooCommerceId: wooCommerceId
    });

    console.log('✅ Order deleted from WooCommerce:', wooCommerceId);

    return {
      success: true,
      wooCommerceId: wooCommerceId,
      status: 'success'
    };

  } catch (error) {
    console.error('❌ WooCommerce delete error for order:', error);
    const errorResult = handleWooCommerceError(error, 'delete', 'order');
    
    // Log failed sync
    await logWooCommerceSync({
      operation: 'delete',
      entityType: 'order',
      entityId: orderData._id || orderData.id,
      storeId: store._id || store.id,
      status: 'failed',
      userId: orderData.userId || 'system',
      organizationId: orderData.organizationId || 'system',
      wooCommerceId: wooCommerceId,
      error: errorResult
    });

    return errorResult;
  }
};

module.exports = {
  deleteProductInWooCommerce,
  deleteCustomerInWooCommerce,
  deleteOrderInWooCommerce
};
