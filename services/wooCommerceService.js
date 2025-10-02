const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const https = require('https');

class WooCommerceService {
  constructor(store) {
    this.store = store;
    
    // Create HTTPS agent configuration
    let httpsAgent = null;
    
    // Check if SSL verification should be bypassed (DEVELOPMENT/TESTING ONLY)
    if (process.env.WOOCOMMERCE_BYPASS_SSL === 'true' || process.env.NODE_ENV === 'development') {
      console.warn('⚠️  [WARNING] SSL certificate verification is DISABLED for WooCommerce API calls');
      console.warn('⚠️  [WARNING] This should ONLY be used for development/testing purposes');
      console.warn('⚠️  [WARNING] For production, please renew your SSL certificate instead');
      
      httpsAgent = new https.Agent({
        rejectUnauthorized: false // WARNING: This bypasses SSL certificate validation
      });
    }
    
    this.api = new WooCommerceRestApi({
      url: store.url,
      consumerKey: store.apiKey,
      consumerSecret: store.secretKey,
      version: 'wc/v3',
      queryStringAuth: true, // Force Basic Authentication as query string
      ...(httpsAgent && { httpsAgent }) // Only add httpsAgent if it's configured
    });
  }

  // Generic method to make API requests
  async makeRequest(method, endpoint, params = {}) {
    console.log('🔍 [WooCommerceAPI] Starting makeRequest');
    console.log('📋 [WooCommerceAPI] Method:', method);
    console.log('📋 [WooCommerceAPI] Endpoint:', endpoint);
    console.log('📋 [WooCommerceAPI] Store URL:', this.store.url);
    console.log('📋 [WooCommerceAPI] Params:', params);
    try {
      let response;
      switch (method.toUpperCase()) {
        case 'GET':
          response = await this.api.get(endpoint, params);
          break;
        case 'POST':
          response = await this.api.post(endpoint, params);
          break;
        case 'PUT':
          response = await this.api.put(endpoint, params);
          break;
        case 'DELETE':
          response = await this.api.delete(endpoint, params);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      return { success: true, data: response.data };
    } catch (error) {
      // Enhanced error logging for SSL and connection issues
      if (error.code === 'CERT_HAS_EXPIRED') {
        console.error('❌ [SSL Error] Certificate has expired for:', this.store.url);
        console.error('🔧 [Solution] Please renew the SSL certificate for your WooCommerce store');
      } else if (error.code === 'ENOTFOUND') {
        console.error('❌ [DNS Error] Cannot resolve hostname:', this.store.url);
      } else if (error.code === 'ECONNREFUSED') {
        console.error('❌ [Connection Error] Connection refused to:', this.store.url);
      } else if (error.code === 'ETIMEDOUT') {
        console.error('❌ [Timeout Error] Connection timeout to:', this.store.url);
      }
      
      return {
        success: false,
        error: error.response?.data || error.message,
        statusCode: error.response?.status,
        errorCode: error.code,
        isSSLError: error.code === 'CERT_HAS_EXPIRED'
      };
    }
  }

  // Helper method to handle API errors
  async handleApiCall(apiCall) {
    try {
      const response = await apiCall();
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        statusCode: error.response?.status
      };
    }
  }

  // Product methods
  async createProduct(productData) {
    const wooCommerceData = this.mapProductToWooCommerce(productData);
    return await this.handleApiCall(() => this.api.post('products', wooCommerceData));
  }
  async updateProduct(wooCommerceId, productData) {
    const wooCommerceData = this.mapProductToWooCommerce(productData);
    return await this.handleApiCall(() => this.api.put(`products/${wooCommerceId}`, wooCommerceData));
  }
  async deleteProduct(wooCommerceId) {
    return await this.handleApiCall(() => this.api.delete(`products/${wooCommerceId}`, { force: true }));
  }
  async getProduct(wooCommerceId) {
    return await this.handleApiCall(() => this.api.get(`products/${wooCommerceId}`));
  }

  // Customer methods
  async createCustomer(customerData) {
    const wooCommerceData = this.mapCustomerToWooCommerce(customerData);
    return await this.handleApiCall(() => this.api.post('customers', wooCommerceData));
  }
  async updateCustomer(wooCommerceId, customerData) {
    const wooCommerceData = this.mapCustomerToWooCommerce(customerData);
    return await this.handleApiCall(() => this.api.put(`customers/${wooCommerceId}`, wooCommerceData));
  }
  async deleteCustomer(wooCommerceId) {
    return await this.handleApiCall(() => this.api.delete(`customers/${wooCommerceId}`, { force: true }));
  }
  async getCustomer(wooCommerceId) {
    return await this.handleApiCall(() => this.api.get(`customers/${wooCommerceId}`));
  }

  // Order methods
  async createOrder(orderData) {
    const wooCommerceData = this.mapOrderToWooCommerce(orderData);
    return await this.handleApiCall(() => this.api.post('orders', wooCommerceData));
  }
  async updateOrder(wooCommerceId, orderData) {
    const wooCommerceData = this.mapOrderToWooCommerce(orderData);
    return await this.handleApiCall(() => this.api.put(`orders/${wooCommerceId}`, wooCommerceData));
  }
  async deleteOrder(wooCommerceId) {
    return await this.handleApiCall(() => this.api.delete(`orders/${wooCommerceId}`, { force: true }));
  }
  async getOrder(wooCommerceId) {
    return await this.handleApiCall(() => this.api.get(`orders/${wooCommerceId}`));
  }

  // Data mapping methods - Local to WooCommerce
  mapProductToWooCommerce(localProduct) {
    return {
      name: localProduct.name,
      type: localProduct.type || 'simple',
      regular_price: localProduct.price ? localProduct.price.toString() : '',
      sale_price: localProduct.sale_price ? localProduct.sale_price.toString() : '',
      description: localProduct.description || '',
      short_description: localProduct.short_description || '',
      sku: localProduct.sku || '',
      manage_stock: localProduct.manage_stock || false,
      stock_quantity: localProduct.stock_quantity || null,
      stock_status: localProduct.stock_status || 'instock',
      status: localProduct.status || 'publish',
      featured: localProduct.featured || false,
      catalog_visibility: localProduct.catalog_visibility || 'visible',
      virtual: localProduct.virtual || false,
      downloadable: localProduct.downloadable || false,
      weight: localProduct.weight || '',
      dimensions: {
        length: localProduct.dimensions?.length || '',
        width: localProduct.dimensions?.width || '',
        height: localProduct.dimensions?.height || ''
      },
      shipping_class: localProduct.shipping_class || '',
      categories: localProduct.categories || [],
      tags: localProduct.tags || [],
      images: localProduct.images || [],
      attributes: localProduct.attributes || [],
      upsell_ids: localProduct.upsell_ids || [],
      cross_sell_ids: localProduct.cross_sell_ids || [],
      purchase_note: localProduct.purchase_note || '',
      reviews_allowed: localProduct.reviews_allowed !== false,
      meta_data: localProduct.meta_data || []
    };
  }
  mapCustomerToWooCommerce(localCustomer) {
    return {
      email: localCustomer.email,
      first_name: localCustomer.first_name || '',
      last_name: localCustomer.last_name || '',
      username: localCustomer.username || '',
      password: localCustomer.password || '',
      billing: localCustomer.billing || {},
      shipping: localCustomer.shipping || {},
      is_paying_customer: localCustomer.is_paying_customer || false,
      meta_data: localCustomer.meta_data || []
    };
  }
  mapOrderToWooCommerce(localOrder) {
    return {
      customer_id: localOrder.customer_id || null,
      status: localOrder.status || 'pending',
      currency: localOrder.currency || 'USD',
      prices_include_tax: localOrder.prices_include_tax || false,
      discount_total: (Number(localOrder.discount_total) || 0).toFixed(2),
      discount_tax: (Number(localOrder.discount_tax) || 0).toFixed(2),
      shipping_total: (Number(localOrder.shipping_total) || 0).toFixed(2),
      shipping_tax: (Number(localOrder.shipping_tax) || 0).toFixed(2),
      cart_tax: (Number(localOrder.cart_tax) || 0).toFixed(2),
      total: (Number(localOrder.total) || 0).toFixed(2),
      total_tax: (Number(localOrder.total_tax) || 0).toFixed(2),
      customer_note: localOrder.customer_note || '',
      billing: localOrder.billing || {},
      shipping: localOrder.shipping || {},
      payment_method: localOrder.payment_method || '',
      payment_method_title: localOrder.payment_method_title || '',
      transaction_id: localOrder.transaction_id || '',
      line_items: localOrder.line_items || [],
      shipping_lines: localOrder.shipping_lines || [],
      meta_data: localOrder.meta_data || []
    };
  }
  // Data mapping methods - WooCommerce to Local
  mapWooCommerceToProduct(wooProduct) {
    return {
      product_Id: wooProduct.id.toString(),
      name: wooProduct.name,
      slug: wooProduct.slug,
      permalink: wooProduct.permalink,
      date_created: wooProduct.date_created,
      date_modified: wooProduct.date_modified,
      type: wooProduct.type,
      status: wooProduct.status,
      featured: wooProduct.featured,
      catalog_visibility: wooProduct.catalog_visibility,
      description: wooProduct.description,
      short_description: wooProduct.short_description,
      sku: wooProduct.sku,
      price: wooProduct.price,
      regular_price: wooProduct.regular_price,
      sale_price: wooProduct.sale_price,
      date_on_sale_from: wooProduct.date_on_sale_from,
      date_on_sale_to: wooProduct.date_on_sale_to,
      on_sale: wooProduct.on_sale,
      purchasable: wooProduct.purchasable,
      total_sales: wooProduct.total_sales,
      virtual: wooProduct.virtual,
      downloadable: wooProduct.downloadable,
      downloads: wooProduct.downloads,
      download_limit: wooProduct.download_limit,
      download_expiry: wooProduct.download_expiry,
      external_url: wooProduct.external_url,
      button_text: wooProduct.button_text,
      tax_status: wooProduct.tax_status,
      tax_class: wooProduct.tax_class,
      manage_stock: wooProduct.manage_stock,
      stock_quantity: wooProduct.stock_quantity,
      stock_status: wooProduct.stock_status,
      backorders: wooProduct.backorders,
      backorders_allowed: wooProduct.backorders_allowed,
      backordered: wooProduct.backordered,
      sold_individually: wooProduct.sold_individually,
      weight: wooProduct.weight,
      dimensions: wooProduct.dimensions,
      shipping_required: wooProduct.shipping_required,
      shipping_taxable: wooProduct.shipping_taxable,
      shipping_class: wooProduct.shipping_class,
      shipping_class_id: wooProduct.shipping_class_id,
      reviews_allowed: wooProduct.reviews_allowed,
      average_rating: wooProduct.average_rating,
      rating_count: wooProduct.rating_count,
      related_ids: wooProduct.related_ids,
      upsell_ids: wooProduct.upsell_ids,
      cross_sell_ids: wooProduct.cross_sell_ids,
      parent_id: wooProduct.parent_id,
      purchase_note: wooProduct.purchase_note,
      categories: wooProduct.categories,
      tags: wooProduct.tags,
      images: wooProduct.images,
      attributes: wooProduct.attributes,
      default_attributes: wooProduct.default_attributes,
      variations: wooProduct.variations,
      grouped_products: wooProduct.grouped_products,
      menu_order: wooProduct.menu_order,
      meta_data: wooProduct.meta_data,
      wooCommerceId: wooProduct.id
    };
  }
  mapWooCommerceToCustomer(wooCustomer) {
    return {
      customer_id: wooCustomer.id.toString(),
      customer_ip_address: wooCustomer.customer_ip_address,
      date_created: wooCustomer.date_created,
      date_created_gmt: wooCustomer.date_created_gmt,
      date_modified: wooCustomer.date_modified,
      date_modified_gmt: wooCustomer.date_modified_gmt,
      email: wooCustomer.email,
      first_name: wooCustomer.first_name,
      last_name: wooCustomer.last_name,
      role: wooCustomer.role,
      username: wooCustomer.username,
      billing: wooCustomer.billing,
      shipping: wooCustomer.shipping,
      is_paying_customer: wooCustomer.is_paying_customer,
      avatar_url: wooCustomer.avatar_url,
      meta_data: wooCustomer.meta_data,
      _links: wooCustomer._links,
      wooCommerceId: wooCustomer.id
    };
  }
  mapWooCommerceToOrder(wooOrder) {
    return {
      order_id: wooOrder.id.toString(),
      parent_id: wooOrder.parent_id,
      number: wooOrder.number,
      order_key: wooOrder.order_key,
      status: wooOrder.status,
      currency: wooOrder.currency,
      version: wooOrder.version,
      prices_include_tax: wooOrder.prices_include_tax,
      date_created: wooOrder.date_created,
      date_modified: wooOrder.date_modified,
      discount_total: wooOrder.discount_total,
      discount_tax: wooOrder.discount_tax,
      shipping_total: wooOrder.shipping_total,
      shipping_tax: wooOrder.shipping_tax,
      cart_tax: wooOrder.cart_tax,
      total: wooOrder.total,
      total_tax: wooOrder.total_tax,
      customer_id: wooOrder.customer_id,
      billing: wooOrder.billing,
      shipping: wooOrder.shipping,
      payment_method: wooOrder.payment_method,
      payment_method_title: wooOrder.payment_method_title,
      transaction_id: wooOrder.transaction_id,
      customer_ip_address: wooOrder.customer_ip_address,
      customer_user_agent: wooOrder.customer_user_agent,
      created_via: wooOrder.created_via,
      customer_note: wooOrder.customer_note,
      date_completed: wooOrder.date_completed,
      date_paid: wooOrder.date_paid,
      cart_hash: wooOrder.cart_hash,
      line_items: wooOrder.line_items,
      shipping_lines: wooOrder.shipping_lines,
      meta_data: wooOrder.meta_data,
      wooCommerceId: wooOrder.id
    };
  }
}

module.exports = WooCommerceService; 