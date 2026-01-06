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

      // Get store currency
      let storeCurrency = 'USD';
      try {
        const currencyResult = await wc.getStoreCurrency();
        if (currencyResult.success) {
          storeCurrency = currencyResult.currency || 'USD';
        }
      } catch (currencyError) {
        console.warn(`[WooCommerceReports] Could not get currency for store ${store.name}:`, currencyError.message);
      }

      if (response.success) {
        results.push({
          store: store._id,
          storeName: store.name,
          currency: storeCurrency,
          data: response.data
        });
        console.log(`[WooCommerceReports] Success for store ${store.name} (${storeCurrency}):`, response.data);
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
    const { orgId, limit = 20 } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreCouponsReport called with:`, { orgId, limit });

    // Fetch actual coupons
    const { results, errors } = await fetchMultiStoreReport(orgId, 'coupons', {
      per_page: parseInt(limit),
      orderby: 'date_created',
      order: 'desc'
    });

    let allCoupons = [];
    let totalUsage = 0;
    let totalDiscount = 0;
    let activeCoupons = 0;

    const now = new Date();

    results.forEach(result => {
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach(coupon => {
          const usageCount = parseInt(coupon.usage_count) || 0;
          const amount = parseFloat(coupon.amount) || 0;
          totalUsage += usageCount;
          totalDiscount += amount * usageCount;

          // Check if coupon is active (not expired and usage limit not reached)
          const expires = coupon.date_expires ? new Date(coupon.date_expires) : null;
          const usageLimit = coupon.usage_limit ? parseInt(coupon.usage_limit) : null;
          const isActive = (!expires || expires > now) && (!usageLimit || usageCount < usageLimit);

          if (isActive) activeCoupons++;

          allCoupons.push({
            id: coupon.id,
            code: coupon.code,
            description: coupon.description || '',
            discountType: coupon.discount_type,
            amount: coupon.amount,
            usageCount: usageCount,
            usageLimit: coupon.usage_limit ? parseInt(coupon.usage_limit) : null,
            dateExpires: coupon.date_expires,
            dateCreated: coupon.date_created,
            store: result.storeName,
            currency: result.currency || 'USD'
          });
        });
      }
    });

    // Sort by usage count (most used first)
    allCoupons.sort((a, b) => b.usageCount - a.usageCount);

    // Determine primary currency (from first store or USD)
    const primaryCurrency = results.length > 0 ? results[0].currency || 'USD' : 'USD';

    res.json({
      success: true,
      coupons: allCoupons.slice(0, parseInt(limit)),
      totalCoupons: allCoupons.length,
      activeCoupons,
      totalUsage,
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      currency: primaryCurrency,
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
    const { orgId, limit = 20 } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreReviewsReport called with:`, { orgId, limit });

    // Fetch actual product reviews
    const { results, errors } = await fetchMultiStoreReport(orgId, 'products/reviews', {
      per_page: parseInt(limit),
      orderby: 'date_created',
      order: 'desc'
    });

    let allReviews = [];
    let totalRating = 0;
    let positiveCount = 0;
    let negativeCount = 0;

    results.forEach(result => {
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach(review => {
          const rating = parseInt(review.rating) || 0;
          totalRating += rating;

          if (rating >= 4) positiveCount++;
          if (rating <= 2) negativeCount++;

          allReviews.push({
            id: review.id,
            productId: review.product_id,
            productName: review.product_name || `Product #${review.product_id}`,
            reviewer: review.reviewer || 'Anonymous',
            reviewerEmail: review.reviewer_email || '',
            rating: rating,
            review: review.review || '',
            status: review.status || 'approved',
            dateCreated: review.date_created,
            store: result.storeName
          });
        });
      }
    });

    // Sort by date (newest first)
    allReviews.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

    const totalReviews = allReviews.length;
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    res.json({
      success: true,
      reviews: allReviews.slice(0, parseInt(limit)),
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      positiveReviews: positiveCount,
      negativeReviews: negativeCount,
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

// Refunds report
exports.getMultiStoreRefundsReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreRefundsReport called with:`, { orgId, period, after, before });

    const params = {};
    if (period) params.period = period;
    if (after) params.after = after;
    if (before) params.before = before;

    // Fetch refunds from orders endpoint with refund status
    const { results, errors } = await fetchMultiStoreReport(orgId, 'orders', { ...params, status: 'refunded' });

    let totalRefunds = 0;
    let totalRefundAmount = 0;
    let refundedOrders = [];

    results.forEach(result => {
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach(order => {
          totalRefunds++;
          totalRefundAmount += parseFloat(order.total) || 0;
          refundedOrders.push({
            orderId: order.id,
            store: result.storeName,
            amount: order.total,
            date: order.date_created,
            customer: order.billing?.first_name + ' ' + order.billing?.last_name
          });
        });
      }
    });

    res.json({
      success: true,
      totalRefunds,
      totalRefundAmount: totalRefundAmount.toFixed(2),
      refundedOrders: refundedOrders.slice(0, 50), // Limit to 50 most recent
      perStore: results,
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreRefundsReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Low Stock report
exports.getMultiStoreLowStockReport = async (req, res) => {
  try {
    const { orgId, threshold = 10 } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreLowStockReport called with:`, { orgId, threshold });

    // Fetch products with stock management enabled
    const { results, errors } = await fetchMultiStoreReport(orgId, 'products', {
      stock_status: 'instock',
      per_page: 100
    });

    let lowStockProducts = [];
    let outOfStockProducts = [];

    results.forEach(result => {
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach(product => {
          if (product.manage_stock) {
            const stockQty = parseInt(product.stock_quantity) || 0;
            const productInfo = {
              id: product.id,
              name: product.name,
              sku: product.sku,
              stockQuantity: stockQty,
              store: result.storeName,
              currency: result.currency || 'USD',
              price: product.price,
              image: product.images?.[0]?.src || null
            };

            if (stockQty === 0) {
              outOfStockProducts.push(productInfo);
            } else if (stockQty <= parseInt(threshold)) {
              lowStockProducts.push(productInfo);
            }
          }
        });
      }
    });

    // Sort by stock quantity (lowest first)
    lowStockProducts.sort((a, b) => a.stockQuantity - b.stockQuantity);

    // Determine primary currency (from first store or USD)
    const primaryCurrency = results.length > 0 ? results[0].currency || 'USD' : 'USD';

    res.json({
      success: true,
      lowStockProducts,
      outOfStockProducts,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      threshold: parseInt(threshold),
      currency: primaryCurrency,
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreLowStockReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Shipping report
exports.getMultiStoreShippingReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreShippingReport called with:`, { orgId, period, after, before });

    const params = { status: 'completed' };
    if (after) params.after = after;
    if (before) params.before = before;

    const { results, errors } = await fetchMultiStoreReport(orgId, 'orders', params);

    let totalShippingCost = 0;
    let shippingMethods = {};
    let orderCount = 0;

    results.forEach(result => {
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach(order => {
          orderCount++;
          totalShippingCost += parseFloat(order.shipping_total) || 0;

          // Aggregate shipping methods
          if (order.shipping_lines && order.shipping_lines.length > 0) {
            order.shipping_lines.forEach(line => {
              const method = line.method_title || 'Unknown';
              if (!shippingMethods[method]) {
                shippingMethods[method] = { count: 0, total: 0 };
              }
              shippingMethods[method].count++;
              shippingMethods[method].total += parseFloat(line.total) || 0;
            });
          }
        });
      }
    });

    // Convert shipping methods to array
    const shippingMethodsArray = Object.entries(shippingMethods).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total.toFixed(2),
      percentage: orderCount > 0 ? ((data.count / orderCount) * 100).toFixed(1) : 0
    })).sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      totalShippingCost: totalShippingCost.toFixed(2),
      averageShippingCost: orderCount > 0 ? (totalShippingCost / orderCount).toFixed(2) : '0.00',
      orderCount,
      shippingMethods: shippingMethodsArray,
      perStore: results,
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreShippingReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Revenue breakdown report (detailed)
exports.getMultiStoreRevenueBreakdown = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStoreRevenueBreakdown called with:`, { orgId, period, after, before });

    const params = { status: 'completed' };
    if (after) params.after = after;
    if (before) params.before = before;

    const { results, errors } = await fetchMultiStoreReport(orgId, 'orders', params);

    let grossRevenue = 0;
    let totalDiscounts = 0;
    let totalTax = 0;
    let totalShipping = 0;
    let totalRefunds = 0;
    let orderCount = 0;

    results.forEach(result => {
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach(order => {
          orderCount++;
          grossRevenue += parseFloat(order.total) || 0;
          totalDiscounts += parseFloat(order.discount_total) || 0;
          totalTax += parseFloat(order.total_tax) || 0;
          totalShipping += parseFloat(order.shipping_total) || 0;

          // Sum refunds if any
          if (order.refunds && order.refunds.length > 0) {
            order.refunds.forEach(refund => {
              totalRefunds += Math.abs(parseFloat(refund.total) || 0);
            });
          }
        });
      }
    });

    const netRevenue = grossRevenue - totalRefunds;

    res.json({
      success: true,
      grossRevenue: grossRevenue.toFixed(2),
      netRevenue: netRevenue.toFixed(2),
      totalDiscounts: totalDiscounts.toFixed(2),
      totalTax: totalTax.toFixed(2),
      totalShipping: totalShipping.toFixed(2),
      totalRefunds: totalRefunds.toFixed(2),
      orderCount,
      averageOrderValue: orderCount > 0 ? (grossRevenue / orderCount).toFixed(2) : '0.00',
      perStore: results,
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStoreRevenueBreakdown error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Payment methods report
exports.getMultiStorePaymentMethodsReport = async (req, res) => {
  try {
    const { orgId, period, after, before } = req.query;
    console.log(`[WooCommerceReports] getMultiStorePaymentMethodsReport called with:`, { orgId, period, after, before });

    const params = {};
    if (after) params.after = after;
    if (before) params.before = before;

    const { results, errors } = await fetchMultiStoreReport(orgId, 'orders', params);

    let paymentMethods = {};
    let orderCount = 0;

    results.forEach(result => {
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach(order => {
          orderCount++;
          const method = order.payment_method_title || order.payment_method || 'Unknown';

          if (!paymentMethods[method]) {
            paymentMethods[method] = { count: 0, total: 0 };
          }
          paymentMethods[method].count++;
          paymentMethods[method].total += parseFloat(order.total) || 0;
        });
      }
    });

    // Convert to array and sort
    const paymentMethodsArray = Object.entries(paymentMethods).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total.toFixed(2),
      percentage: orderCount > 0 ? ((data.count / orderCount) * 100).toFixed(1) : 0
    })).sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      paymentMethods: paymentMethodsArray,
      orderCount,
      perStore: results,
      errors,
      totalStores: results.length
    });
  } catch (error) {
    console.error('[WooCommerceReports] getMultiStorePaymentMethodsReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}; 