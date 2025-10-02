// syncProductWorker.js
const { parentPort, workerData } = require('worker_threads');
const Inventory = require('../models/inventory');
const Store = require('../models/store');
const Organization = require('../models/organization');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const https = require('https');
const connectDB = require('./connectDB');
const StoreErrorHandler = require('../services/storeErrorHandler');

const syncProductJob = async (jobData) => {
  try {
    const { storeId, store, organizationId, userId } = workerData;

    console.log('Starting product sync for store:', storeId);

    // Connect to MongoDB
    connectDB();

    // Create HTTPS agent configuration for SSL bypass (if needed)
    let httpsAgent = null;
    if (process.env.WOOCOMMERCE_BYPASS_SSL === 'true' || process.env.NODE_ENV === 'development') {
      httpsAgent = new https.Agent({
        rejectUnauthorized: false // WARNING: This bypasses SSL certificate validation
      });
    }

    // Initialize WooCommerce API
    const wooCommerce = new WooCommerceRestApi({
      url: store.url,
      consumerKey: store.apiKey,
      consumerSecret: store.secretKey,
      version: 'wc/v3',
      queryStringAuth: true, // Force Basic Authentication as query string
      ...(httpsAgent && { httpsAgent }) // Only add httpsAgent if it's configured
    });

    // Fetch all products from WooCommerce
    const getAllProducts = async (page = 1) => {
      try {
        const response = await wooCommerce.get('products', { per_page: 100, page });
        return response.data;
      } catch (error) {
        // Parse the error using our error handler
        const errorInfo = StoreErrorHandler.parseStoreError(error, store, 'product sync');
        StoreErrorHandler.logError(errorInfo, 'syncProductWorker.getAllProducts');
        
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

    let products = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const currentPageProducts = await getAllProducts(page);
      if (currentPageProducts.length === 0) hasMore = false;
      else {
        products = [...products, ...currentPageProducts];
        page++;
      }
    }

    console.log(`Total products to sync: ${products.length}`);

    // Sync statistics
    let created = 0;
    let updated = 0;
    let failed = 0;
    let skipped = 0;

    // Process and sync products to the Inventory
    for (const product of products) {
      try {
        const wooCommerceId = product.id;
        
        // Check for existing product by wooCommerceId first (primary check)
        let existingProduct = await Inventory.findOne({
          wooCommerceId: wooCommerceId,
          storeId: storeId
        });

        // Fallback check: if no wooCommerceId match, check by product_Id
        if (!existingProduct && product.id) {
          existingProduct = await Inventory.findOne({
            product_Id: product.id.toString(),
            storeId: storeId
          });
        }

        // Additional fallback: check by sku + storeId (for cases where wooCommerceId might be missing)
        if (!existingProduct && product.sku) {
          existingProduct = await Inventory.findOne({
            sku: product.sku,
            storeId: storeId
          });
        }

        const productData = {
          storeId,
          organizationId,
          userId,
          wooCommerceId: wooCommerceId, // Primary identifier
          product_Id: product.id.toString(),
          name: product.name || 'N/A',
          sku: product.sku || 'N/A',
          description: product.description || 'N/A',
          short_description: product.short_description || 'N/A',
          price: parseFloat(product.price) || 0,
          sale_price: parseFloat(product.sale_price) || 0,
          regular_price: parseFloat(product.regular_price) || 0,
          date_on_sale_from: product.date_on_sale_from ? new Date(product.date_on_sale_from) : null,
          date_on_sale_to: product.date_on_sale_to ? new Date(product.date_on_sale_to) : null,
          on_sale: product.on_sale || false,
          purchasable: product.purchasable || true,
          total_sales: product.total_sales || 0,
          status: product.status || 'N/A',
          featured: product.featured || false,
          catalog_visibility: product.catalog_visibility || 'visible',
          manage_stock: product.manage_stock || false,
          stock_quantity: product.stock_quantity || 0,
          stock_status: product.stock_status || 'N/A',
          backorders: product.backorders || 'no',
          backorders_allowed: product.backorders_allowed || false,
          weight: product.weight || null,
          dimensions: product.dimensions || { length: null, width: null, height: null },
          shipping_required: product.shipping_required || false,
          shipping_taxable: product.shipping_taxable || false,
          shipping_class: product.shipping_class || 'N/A',
          shipping_class_id: product.shipping_class_id || 0,
          categories: product.categories || [],
          tags: product.tags || [],
          images: product.images || [],
          average_rating: product.average_rating || '0.00',
          rating_count: product.rating_count || 0,
          reviews_allowed: product.reviews_allowed || true,
          permalink: product.permalink || 'N/A',
          slug: product.slug || 'N/A',
          type: product.type || 'N/A',
          external_url: product.external_url || '',
          button_text: product.button_text || '',
          upsell_ids: product.upsell_ids || [],
          cross_sell_ids: product.cross_sell_ids || [],
          related_ids: product.related_ids || [],
          purchase_note: product.purchase_note || '',
          sold_individually: product.sold_individually || false,
          grouped_products: product.grouped_products || [],
          menu_order: product.menu_order || 0,
          date_created: new Date(product.date_created),
          date_modified: new Date(product.date_modified),
          // Sync tracking fields
          lastSyncedAt: new Date(),
          syncStatus: 'synced',
          syncError: null
        };

        if (existingProduct) {
          // Update existing product
          await Inventory.findOneAndUpdate(
            { _id: existingProduct._id },
            { $set: productData },
            { new: true, runValidators: true }
          );
          updated++;
          console.log(`Updated product: ${product.name} (WooCommerce ID: ${wooCommerceId})`);
        } else {
          // Create new product
          await Inventory.create(productData);
          created++;
          console.log(`Created product: ${product.name} (WooCommerce ID: ${wooCommerceId})`);
        }
      } catch (error) {
        failed++;
        console.error(`Failed to sync product ${product.name} (WooCommerce ID: ${product.id}):`, error.message);
        
        // Log detailed error for debugging
        console.error('Product data:', {
          name: product.name,
          sku: product.sku,
          wooCommerceId: product.id,
          storeId: storeId,
          error: error.message
        });
      }
    }

    const syncSummary = {
      total: products.length,
      created,
      updated,
      failed,
      skipped
    };

    console.log('Product sync completed:', syncSummary);
    parentPort.postMessage({ 
      status: 'success', 
      message: 'Products synchronized successfully',
      data: syncSummary
    });
  } catch (error) {
    console.error('Error in product sync job:', error);
    
    // Parse the error using our error handler
    const errorInfo = StoreErrorHandler.parseStoreError(error, store, 'product sync');
    StoreErrorHandler.logError(errorInfo, 'syncProductWorker.main');
    
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

syncProductJob(workerData);
