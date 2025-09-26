const express = require('express');
const router = express.Router();
const wooCommerceReportsController = require('../controllers/wooCommerceReportsController');

// Sales report (totals, grouped)
router.get('/reports/sales', wooCommerceReportsController.getMultiStoreSales);
// Orders report (counts, grouped)
router.get('/reports/orders', wooCommerceReportsController.getMultiStoreOrdersReport);
// Products report (sales, inventory, top sellers)
router.get('/reports/products', wooCommerceReportsController.getMultiStoreProductsReport);

// Customers report (new, returning, totals)
router.get('/reports/customers', wooCommerceReportsController.getMultiStoreCustomersReport);
// Coupons report
router.get('/reports/coupons', wooCommerceReportsController.getMultiStoreCouponsReport);
// Reviews report
router.get('/reports/reviews', wooCommerceReportsController.getMultiStoreReviewsReport);
// Categories report
router.get('/reports/categories', wooCommerceReportsController.getMultiStoreCategoriesReport);
// Tags report
router.get('/reports/tags', wooCommerceReportsController.getMultiStoreTagsReport);
// Attributes report
router.get('/reports/attributes', wooCommerceReportsController.getMultiStoreAttributesReport);
// Top Sellers report
router.get('/reports/top-sellers', wooCommerceReportsController.getMultiStoreTopSellersReport);
// Taxes report
router.get('/reports/taxes', wooCommerceReportsController.getMultiStoreTaxesReport);
// Downloads report
router.get('/reports/downloads', wooCommerceReportsController.getMultiStoreDownloadsReport);
// Stock report
router.get('/reports/stock', wooCommerceReportsController.getMultiStoreStockReport);

module.exports = router; 
