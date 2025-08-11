const {
  initializeWooCommerceAPI,
  handleWooCommerceError,
  validateWooCommerceResponse,
  logWooCommerceSync,
  getStoreById,
  executeWithRateLimit
} = require('./wooCommerceSyncHelper');

/**
 * Update product in WooCommerce store
 * @param {Object} store - Store configuration object
 * @param {number} wooCommerceId - WooCommerce product ID
 * @param {Object} productData - Local product data
 * @returns {Object} Sync result
 */
const updateProductInWooCommerce = async (store, wooCommerceId, productData) => {
  try {
    if (!wooCommerceId) {
      throw new Error('WooCommerce product ID is required for update');
    }

    if (!store) {
      throw new Error('Store configuration is required');
    }

    // Initialize WooCommerce API with store configuration
    const api = initializeWooCommerceAPI(store);

    // Map local product data to WooCommerce format
    const wooCommerceData = mapProductToWooCommerce(productData);

    // Execute API call with rate limiting
    const response = await executeWithRateLimit(() => 
      api.put(`products/${wooCommerceId}`, wooCommerceData)
    );

    // Validate response
    const validation = validateWooCommerceResponse(response, 'updateProduct');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const wooCommerceProduct = validation.data;

    // Log successful sync
    await logWooCommerceSync({
      operation: 'update',
      entityType: 'product',
      entityId: productData._id || productData.id,
      storeId: store._id || store.id,
      status: 'success',
      userId: productData.userId || 'system',
      organizationId: productData.organizationId || 'system',
      wooCommerceId: wooCommerceProduct.id
    });

    return {
      success: true,
      wooCommerceId: wooCommerceProduct.id,
      data: wooCommerceProduct,
      status: 'success'
    };

  } catch (error) {
    const errorResult = handleWooCommerceError(error, 'update', 'product');
    
    // Log failed sync
    await logWooCommerceSync({
      operation: 'update',
      entityType: 'product',
      entityId: productData._id || productData.id,
      storeId: store._id || store.id,
      status: 'failed',
      userId: productData.userId || 'system',
      organizationId: productData.organizationId || 'system',
      error: errorResult
    });

    return errorResult;
  }
};

/**
 * Update customer in WooCommerce store
 * @param {Object} store - Store configuration object
 * @param {number} wooCommerceId - WooCommerce customer ID
 * @param {Object} customerData - Local customer data
 * @returns {Object} Sync result
 */
const updateCustomerInWooCommerce = async (store, wooCommerceId, customerData) => {
  try {
    if (!wooCommerceId) {
      throw new Error('WooCommerce customer ID is required for update');
    }

    if (!store) {
      throw new Error('Store configuration is required');
    }

    // Initialize WooCommerce API with store configuration
    const api = initializeWooCommerceAPI(store);

    // Map local customer data to WooCommerce format
    const wooCommerceData = mapCustomerToWooCommerce(customerData);

    // Execute API call with rate limiting
    const response = await executeWithRateLimit(() => 
      api.put(`customers/${wooCommerceId}`, wooCommerceData)
    );

    // Validate response
    const validation = validateWooCommerceResponse(response, 'updateCustomer');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const wooCommerceCustomer = validation.data;

    // Log successful sync
    await logWooCommerceSync({
      operation: 'update',
      entityType: 'customer',
      entityId: customerData._id || customerData.id,
      storeId: store._id || store.id,
      status: 'success',
      userId: customerData.userId || 'system',
      organizationId: customerData.organizationId || 'system',
      wooCommerceId: wooCommerceCustomer.id
    });

    return {
      success: true,
      wooCommerceId: wooCommerceCustomer.id,
      data: wooCommerceCustomer,
      status: 'success'
    };

  } catch (error) {
    const errorResult = handleWooCommerceError(error, 'update', 'customer');
    
    // Log failed sync
    await logWooCommerceSync({
      operation: 'update',
      entityType: 'customer',
      entityId: customerData._id || customerData.id,
      storeId: store._id || store.id,
      status: 'failed',
      userId: customerData.userId || 'system',
      organizationId: customerData.organizationId || 'system',
      error: errorResult
    });

    return errorResult;
  }
};

/**
 * Update order in WooCommerce store
 * @param {Object} store - Store configuration object
 * @param {number} wooCommerceId - WooCommerce order ID
 * @param {Object} orderData - Local order data
 * @returns {Object} Sync result
 */
const updateOrderInWooCommerce = async (store, wooCommerceId, orderData) => {
  try {
    if (!wooCommerceId) {
      throw new Error('WooCommerce order ID is required for update');
    }

    if (!store) {
      throw new Error('Store configuration is required');
    }

    // Initialize WooCommerce API with store configuration
    const api = initializeWooCommerceAPI(store);

    // Map local order data to WooCommerce format
    const wooCommerceData = mapOrderToWooCommerce(orderData);

    // Execute API call with rate limiting
    const response = await executeWithRateLimit(() => 
      api.put(`orders/${wooCommerceId}`, wooCommerceData)
    );

    // Validate response
    const validation = validateWooCommerceResponse(response, 'updateOrder');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const wooCommerceOrder = validation.data;

    // Log successful sync
    await logWooCommerceSync({
      operation: 'update',
      entityType: 'order',
      entityId: orderData._id || orderData.id,
      storeId: store._id || store.id,
      status: 'success',
      userId: orderData.userId || 'system',
      organizationId: orderData.organizationId || 'system',
      wooCommerceId: wooCommerceOrder.id
    });

    return {
      success: true,
      wooCommerceId: wooCommerceOrder.id,
      data: wooCommerceOrder,
      status: 'success'
    };

  } catch (error) {
    const errorResult = handleWooCommerceError(error, 'update', 'order');
    
    // Log failed sync
    await logWooCommerceSync({
      operation: 'update',
      entityType: 'order',
      entityId: orderData._id || orderData.id,
      storeId: store._id || store.id,
      status: 'failed',
      userId: orderData.userId || 'system',
      organizationId: orderData.organizationId || 'system',
      error: errorResult
    });

    return errorResult;
  }
};

/**
 * Map local product data to WooCommerce format for updates
 * @param {Object} product - Local product data
 * @returns {Object} WooCommerce product data
 */
const mapProductToWooCommerce = (product) => {
  return {
    name: product.name,
    type: product.type || 'simple',
    regular_price: product.price ? product.price.toString() : '',
    sale_price: product.sale_price ? product.sale_price.toString() : '',
    description: product.description || '',
    short_description: product.short_description || '',
    sku: product.sku || '',
    manage_stock: product.manage_stock || false,
    stock_quantity: product.stock_quantity || null,
    stock_status: product.stock_status || 'instock',
    status: product.status || 'publish',
    featured: product.featured || false,
    catalog_visibility: product.catalog_visibility || 'visible',
    virtual: product.virtual || false,
    downloadable: product.downloadable || false,
    weight: product.weight || '',
    dimensions: {
      length: product.dimensions?.length || '',
      width: product.dimensions?.width || '',
      height: product.dimensions?.height || ''
    },
    shipping_class: product.shipping_class || '',
    shipping_class_id: product.shipping_class_id || 0,
    categories: product.categories || [],
    tags: product.tags || [],
    images: product.images || [],
    attributes: product.attributes || [],
    upsell_ids: product.upsell_ids || [],
    cross_sell_ids: product.cross_sell_ids || [],
    purchase_note: product.purchase_note || '',
    reviews_allowed: product.reviews_allowed !== false,
    meta_data: product.meta_data || [],
    // Additional fields from our model
    date_on_sale_from: product.date_on_sale_from,
    date_on_sale_to: product.date_on_sale_to,
    on_sale: product.on_sale || false,
    purchasable: product.purchasable !== false,
    total_sales: product.total_sales || 0,
    backorders: product.backorders || 'no',
    backorders_allowed: product.backorders_allowed || false,
    sold_individually: product.sold_individually || false,
    grouped_products: product.grouped_products || [],
    menu_order: product.menu_order || 0,
    external_url: product.external_url || '',
    button_text: product.button_text || ''
  };
};

/**
 * Map local customer data to WooCommerce format for updates
 * @param {Object} customer - Local customer data
 * @returns {Object} WooCommerce customer data
 */
const mapCustomerToWooCommerce = (customer) => {
  return {
    email: customer.email,
    first_name: customer.first_name || '',
    last_name: customer.last_name || '',
    username: customer.username || '',
    role: customer.role || 'customer',
    billing: customer.billing || {},
    shipping: customer.shipping || {},
    is_paying_customer: customer.is_paying_customer || false,
    avatar_url: customer.avatar_url || '',
    meta_data: customer.meta_data || []
  };
};

/**
 * Map local order data to WooCommerce format for updates
 * @param {Object} order - Local order data
 * @returns {Object} WooCommerce order data
 */
const mapOrderToWooCommerce = (order) => {
  return {
    customer_id: order.customer_id || null,
    status: order.status || 'pending',
    currency: order.currency || 'USD',
    prices_include_tax: order.prices_include_tax || false,
    discount_total: order.discount_total ? order.discount_total.toString() : '0',
    discount_tax: order.discount_tax ? order.discount_tax.toString() : '0',
    shipping_total: order.shipping_total ? order.shipping_total.toString() : '0',
    shipping_tax: order.shipping_tax ? order.shipping_tax.toString() : '0',
    cart_tax: order.cart_tax ? order.cart_tax.toString() : '0',
    total: order.total ? order.total.toString() : '0',
    total_tax: order.total_tax ? order.total_tax.toString() : '0',
    customer_note: order.customer_note || '',
    billing: order.billing || {},
    shipping: order.shipping || {},
    payment_method: order.payment_method || '',
    payment_method_title: order.payment_method_title || '',
    transaction_id: order.transaction_id || '',
    customer_ip_address: order.customer_ip_address || '',
    customer_user_agent: order.customer_user_agent || '',
    created_via: order.created_via || 'rest-api',
    line_items: order.line_items || [],
    shipping_lines: order.shipping_lines || [],
    meta_data: order.meta_data || [],
    // Additional fields from our model
    order_key: order.order_key || '',
    cart_hash: order.cart_hash || '',
    version: order.version || '3.0.0'
  };
};

module.exports = {
  updateProductInWooCommerce,
  updateCustomerInWooCommerce,
  updateOrderInWooCommerce,
  mapProductToWooCommerce,
  mapCustomerToWooCommerce,
  mapOrderToWooCommerce
}; 