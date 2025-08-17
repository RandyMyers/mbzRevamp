/**
 * @swagger
 * tags:
 *   - name: WooCommerce Reports
 *     description: Aggregated WooCommerce reports across stores
 *
 * /api/woocommerce/reports/sales:
 *   get:
 *     tags: [WooCommerce Reports]
 *     summary: Get multi-store sales totals
 *     parameters:
 *       - in: query
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: period
 *         schema: { type: string }
 *       - in: query
 *         name: after
 *         schema: { type: string }
 *       - in: query
 *         name: before
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sales summary }
 *       500: { description: Server error }
 *
 * /api/woocommerce/reports/orders:
 *   get:
 *     tags: [WooCommerce Reports]
 *     summary: Get multi-store order totals
 *     parameters:
 *       - in: query
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: period
 *         schema: { type: string }
 *       - in: query
 *         name: after
 *         schema: { type: string }
 *       - in: query
 *         name: before
 *         schema: { type: string }
 *     responses:
 *       200: { description: Orders summary }
 *       500: { description: Server error }
 *
 * /api/woocommerce/reports/products:
 *   get:
 *     tags: [WooCommerce Reports]
 *     summary: Get multi-store product totals and types
 *     parameters:
 *       - in: query
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: period
 *         schema: { type: string }
 *       - in: query
 *         name: after
 *         schema: { type: string }
 *       - in: query
 *         name: before
 *         schema: { type: string }
 *     responses:
 *       200: { description: Products summary }
 *       500: { description: Server error }
 *
 * /api/woocommerce/reports/customers:
 *   get:
 *     tags: [WooCommerce Reports]
 *     summary: Get multi-store customer totals
 *     parameters:
 *       - in: query
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Customers summary }
 *       500: { description: Server error }
 *
 * /api/woocommerce/reports/coupons:
 *   get:
 *     tags: [WooCommerce Reports]
 *     summary: Get multi-store coupon totals
 *     parameters:
 *       - in: query
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Coupons summary }
 *       500: { description: Server error }
 *
 * /api/woocommerce/reports/reviews:
 *   get:
 *     tags: [WooCommerce Reports]
 *     summary: Get multi-store review totals
 *     parameters:
 *       - in: query
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Reviews summary }
 *       500: { description: Server error }
 *
 * /api/woocommerce/reports/categories:
 *   get:
 *     tags: [WooCommerce Reports]
 *     summary: Get multi-store category totals
 *     parameters:
 *       - in: query
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Categories summary }
 *       500: { description: Server error }
 *
 * /api/woocommerce/reports/tags:
 *   get:
 *     tags: [WooCommerce Reports]
 *     summary: Get multi-store tag totals
 *     parameters:
 *       - in: query
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Tags summary }
 *       500: { description: Server error }
 *
 * /api/woocommerce/reports/attributes:
 *   get:
 *     tags: [WooCommerce Reports]
 *     summary: Get multi-store attribute totals
 *     parameters:
 *       - in: query
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Attributes summary }
 *       500: { description: Server error }
 *
 * /api/woocommerce/reports/top-sellers:
 *   get:
 *     tags: [WooCommerce Reports]
 *     summary: Get multi-store top sellers
 *     parameters:
 *       - in: query
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Top sellers }
 *       500: { description: Server error }
 *
 * /api/woocommerce/reports/taxes:
 *   get:
 *     tags: [WooCommerce Reports]
 *     summary: Get multi-store tax totals
 *     parameters:
 *       - in: query
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Taxes summary }
 *       500: { description: Server error }
 *
 * /api/woocommerce/reports/downloads:
 *   get:
 *     tags: [WooCommerce Reports]
 *     summary: Get multi-store download totals
 *     parameters:
 *       - in: query
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Downloads summary }
 *       500: { description: Server error }
 *
 * /api/woocommerce/reports/stock:
 *   get:
 *     tags: [WooCommerce Reports]
 *     summary: Get multi-store stock totals
 *     parameters:
 *       - in: query
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Stock summary }
 *       500: { description: Server error }
 */
const mongoose = require('mongoose');
const Store = require('../models/store');
const WooCommerceService = require('../services/wooCommerceService');

console.log('[WooCommerceReports] WooCommerceService import:', typeof WooCommerceService);
console.log('[WooCommerceReports] WooCommerceService constructor:', typeof WooCommerceService);

// Helper functions
function mergeArrays(arrays) {
  return arrays.reduce((acc, arr) => acc.concat(arr || []), []);
}

function sumField(arrays, field) {
  return arrays.reduce((sum, arr) => {
    return sum + (arr || []).reduce((itemSum, item) => itemSum + (parseFloat(item[field]) || 0), 0);
  }, 0);
}

function aggregateTotals(results) {
  const aggregated = {};
  results.forEach(result => {
    if (result.data && Array.isArray(result.data)) {
      result.data.forEach(item => {
        const slug = item.slug || 'unknown';
        const name = item.name || 'Unknown';
        const total = parseInt(item.total) || 0;
        
        if (!aggregated[slug]) {
          aggregated[slug] = { slug, name, total: 0 };
        }
        aggregated[slug].total += total;
      });
    }
  });
  
  return Object.values(aggregated);
}

// Fetch and aggregate WooCommerce reports for all stores in an organization
async function fetchMultiStoreReport(orgId, endpoint, params = {}) {
  console.log(`[WooCommerceReports] Fetching ${endpoint} for org ${orgId} with params:`, params);
  console.log(`[WooCommerceReports] orgId type:`, typeof orgId);
  console.log(`[WooCommerceReports] orgId value:`, orgId);
  
  // Convert orgId to ObjectId if it's a string
  const organizationId = mongoose.Types.ObjectId.isValid(orgId) ? new mongoose.Types.ObjectId(orgId) : orgId;
  console.log(`[WooCommerceReports] Converted organizationId:`, organizationId);
  
  const stores = await Store.find({ organizationId: organizationId });
  console.log(`[WooCommerceReports] Query executed: Store.find({ organizationId: "${organizationId}" })`);
  console.log(`[WooCommerceReports] Stores found:`, stores);
  console.log(`[WooCommerceReports] Found ${stores.length} WooCommerce stores for org ${orgId}`);
  
  let results = [];
  let errors = [];

  for (const store of stores) {
    console.log(`[WooCommerceReports] Processing store: ${store.name} (${store._id})`);
    
    try {
      console.log(`[WooCommerceReports] Creating WooCommerceService for store:`, store.name);
      const wc = new WooCommerceService(store);
      console.log(`[WooCommerceReports] WooCommerceService created:`,  wc);
      console.log(`[WooCommerceReports] makeRequest method exists:`, wc.makeRequest);
      console.log(`[WooCommerceReports] Calling makeRequest with endpoint: ${endpoint} and params:`, params);
      
      const response = await wc.makeRequest('GET', endpoint, params);
      
      if (response.success) {
        results.push({ 
          store: store._id, 
          storeName: store.name,
          data: response.data 
        });
        console.log(`[WooCommerceReports] Success for store ${store.name}:`, response.data);
      } else {
        errors.push({ 
          store: store._id, 
          storeName: store.name,
          error: response.error 
        });
        console.error(`[WooCommerceReports] Error for store ${store.name}:`, response.error);
      }
    } catch (error) {
      errors.push({ 
        store: store._id, 
        storeName: store.name,
        error: error.message 
      });
      console.error(`[WooCommerceReports] Exception for store ${store.name}:`, error.message);
      console.error(`[WooCommerceReports] Full error:`, error);
    }
  }
  
  return { results, errors };
}

// Sales report (totals, grouped)
exports.getMultiStoreSales = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreSales called with:`, { orgId, period, after, before });
    
    const params = {};
    if (period) params.period = period;
    if (after) params.after = after;
    if (before) params.before = before;
    
    const { results, errors } = await fetchMultiStoreReport(orgId, 'reports/sales', params);
    
    // Aggregate sales data across stores
    let totalSales = 0;
    let totalOrders = 0;
    let totalItems = 0;
    let totalCustomers = 0;
    
    results.forEach(result => {
      if (result.data && result.data.length > 0) {
        const salesData = result.data[0]; // Sales report returns array with one object
        totalSales += parseFloat(salesData.total_sales) || 0;
        totalOrders += parseInt(salesData.total_orders) || 0;
        totalItems += parseInt(salesData.total_items) || 0;
        totalCustomers += parseInt(salesData.total_customers) || 0;
      }
    });
    
    res.json({ 
      success: true,
      totalSales: totalSales.toFixed(2),
      totalOrders,
      totalItems,
      totalCustomers,
      perStore: results, 
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreSales error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Orders report (counts, grouped by status)
exports.getMultiStoreOrdersReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreOrdersReport called with:`, { orgId, period, after, before });
    
    const params = {};
    if (period) params.period = period;
    if (after) params.after = after;
    if (before) params.before = before;
    
    const { results, errors } = await fetchMultiStoreReport(orgId, 'reports/orders/totals', params);
    const aggregatedTotals = aggregateTotals(results);
    
    // Calculate total orders by summing all totals
    const totalOrders = aggregatedTotals.reduce((sum, item) => sum + (parseInt(item.total) || 0), 0);
    
    res.json({ 
      success: true,
      orders: aggregatedTotals,
      totalOrders: totalOrders,
      perStore: results, 
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreOrdersReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}; 

// Products report (sales, inventory, top sellers)
exports.getMultiStoreProductsReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreProductsReport called with:`, { orgId, period, after, before });
    
    const params = {};
    if (period) params.period = period;
    if (after) params.after = after;
    if (before) params.before = before;
    
    const { results, errors } = await fetchMultiStoreReport(orgId, 'reports/products/totals', params);
    const aggregatedTotals = aggregateTotals(results);
    
    // Calculate total products by summing all totals
    const totalProducts = aggregatedTotals.reduce((sum, item) => sum + (parseInt(item.total) || 0), 0);
    
    // Also fetch product type breakdown data
    const { results: typeResults, errors: typeErrors } = await fetchMultiStoreReport(orgId, 'reports/products/totals', { ...params, type: 'product_type' });
    
    // Aggregate product type data across stores
    const productTypes = {};
    typeResults.forEach(result => {
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach(typeData => {
          const slug = typeData.slug || 'unknown';
          const name = typeData.name || 'Unknown';
          const total = parseInt(typeData.total) || 0;
          
          if (!productTypes[slug]) {
            productTypes[slug] = { slug, name, total: 0 };
          }
          productTypes[slug].total += total;
        });
      }
    });
    
    const productTypeBreakdown = Object.values(productTypes);
    
    res.json({ 
      success: true,
      products: aggregatedTotals,
      totalProducts: totalProducts,
      productTypes: productTypeBreakdown,
      perStore: results, 
      errors: [...errors, ...typeErrors],
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreProductsReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};











// Customers report (new, returning, totals)
exports.getMultiStoreCustomersReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreCustomersReport called with:`, { orgId, period, after, before });
    
    const params = {};
    if (period) params.period = period;
    if (after) params.after = after;
    if (before) params.before = before;
    
    const { results, errors } = await fetchMultiStoreReport(orgId, 'reports/customers/totals', params);
    const aggregatedTotals = aggregateTotals(results);
    
    // Calculate total customers by summing all totals
    const totalCustomers = aggregatedTotals.reduce((sum, item) => sum + (parseInt(item.total) || 0), 0);
    
    res.json({ 
      success: true,
      customers: aggregatedTotals,
      totalCustomers: totalCustomers,
      perStore: results, 
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreCustomersReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Coupons report
exports.getMultiStoreCouponsReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreCouponsReport called with:`, { orgId, period, after, before });
    
    const params = {};
    if (period) params.period = period;
    if (after) params.after = after;
    if (before) params.before = before;
    
    const { results, errors } = await fetchMultiStoreReport(orgId, 'reports/coupons/totals', params);
    const aggregatedTotals = aggregateTotals(results);
    
    res.json({ 
      success: true,
      coupons: aggregatedTotals,
      perStore: results, 
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreCouponsReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Taxes report
exports.getMultiStoreTaxesReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreTaxesReport called with:`, { orgId, period, after, before });
    
    const params = {};
    if (period) params.period = period;
    if (after) params.after = after;
    if (before) params.before = before;
    
    const { results, errors } = await fetchMultiStoreReport(orgId, 'reports/taxes/totals', params);
    const aggregatedTotals = aggregateTotals(results);
    
    res.json({ 
      success: true,
      taxes: aggregatedTotals,
      perStore: results, 
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreTaxesReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Downloads report
exports.getMultiStoreDownloadsReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreDownloadsReport called with:`, { orgId, period, after, before });
    
    const params = {};
    if (period) params.period = period;
    if (after) params.after = after;
    if (before) params.before = before;
    
    const { results, errors } = await fetchMultiStoreReport(orgId, 'reports/downloads/totals', params);
    const aggregatedTotals = aggregateTotals(results);
    
    res.json({ 
      success: true,
      downloads: aggregatedTotals,
      perStore: results, 
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreDownloadsReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Stock report
exports.getMultiStoreStockReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreStockReport called with:`, { orgId, period, after, before });
    
    const params = {};
    if (period) params.period = period;
    if (after) params.after = after;
    if (before) params.before = before;
    
    const { results, errors } = await fetchMultiStoreReport(orgId, 'reports/stock/totals', params);
    const aggregatedTotals = aggregateTotals(results);
    
    res.json({ 
      success: true,
      stock: aggregatedTotals,
      perStore: results, 
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreStockReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reviews report
exports.getMultiStoreReviewsReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreReviewsReport called with:`, { orgId, period, after, before });
    
    const params = {};
    if (period) params.period = period;
    if (after) params.after = after;
    if (before) params.before = before;
    
    const { results, errors } = await fetchMultiStoreReport(orgId, 'reports/reviews/totals', params);
    const aggregatedTotals = aggregateTotals(results);
    
    res.json({ 
      success: true,
      reviews: aggregatedTotals,
      perStore: results, 
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreReviewsReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Categories report
exports.getMultiStoreCategoriesReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreCategoriesReport called with:`, { orgId, period, after, before });
    
    const params = {};
    if (period) params.period = period;
    if (after) params.after = after;
    if (before) params.before = before;
    
    const { results, errors } = await fetchMultiStoreReport(orgId, 'reports/categories/totals', params);
    const aggregatedTotals = aggregateTotals(results);
    
    res.json({ 
      success: true,
      categories: aggregatedTotals,
      perStore: results, 
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreCategoriesReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Tags report
exports.getMultiStoreTagsReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreTagsReport called with:`, { orgId, period, after, before });
    
    const params = {};
    if (period) params.period = period;
    if (after) params.after = after;
    if (before) params.before = before;
    
    const { results, errors } = await fetchMultiStoreReport(orgId, 'reports/tags/totals', params);
    const aggregatedTotals = aggregateTotals(results);
    
    res.json({ 
      success: true,
      tags: aggregatedTotals,
      perStore: results, 
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreTagsReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Attributes report
exports.getMultiStoreAttributesReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreAttributesReport called with:`, { orgId, period, after, before });
    
    const params = {};
    if (period) params.period = period;
    if (after) params.after = after;
    if (before) params.before = before;
    
    const { results, errors } = await fetchMultiStoreReport(orgId, 'reports/attributes/totals', params);
    const aggregatedTotals = aggregateTotals(results);
    
    res.json({ 
      success: true,
      attributes: aggregatedTotals,
      perStore: results, 
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreAttributesReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Top Sellers report
exports.getMultiStoreTopSellersReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreTopSellersReport called with:`, { orgId, period, after, before });
    
    const params = {};
    if (period) params.period = period;
    if (after) params.after = after;
    if (before) params.before = before;
    
    const { results, errors } = await fetchMultiStoreReport(orgId, 'reports/top_sellers', params);
    const aggregatedTotals = aggregateTotals(results);
    
    res.json({ 
      success: true,
      topSellers: aggregatedTotals,
      perStore: results, 
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreTopSellersReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}; 