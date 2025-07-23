const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryControllers");

// Product CRUD Operations
router.post("/create", inventoryController.createProduct);
router.get("/organization/:organizationId", inventoryController.getAllProductsByOrganization);
router.get("/:productId", inventoryController.getProductById);
router.patch("/:productId", inventoryController.updateProduct);
router.delete("/:productId", inventoryController.deleteProduct);
router.delete("/store/:storeId", inventoryController.deleteAllProductsByStore);

// WooCommerce sync routes
router.post("/woocommerce/sync-products/:storeId/:organizationId", inventoryController.syncProducts);
router.post("/woocommerce/sync/:productId", inventoryController.syncProductToWooCommerce);
router.post("/woocommerce/retry-sync/:productId", inventoryController.retryProductWooCommerceSync);

// Analytics routes
router.get("/analytics/total/:organizationId", inventoryController.getTotalProducts);
router.get("/analytics/in-stock/:organizationId", inventoryController.getInStockItems);
router.get("/analytics/low-stock/:organizationId", inventoryController.getLowStockItems);
router.get("/analytics/out-of-stock/:organizationId", inventoryController.getOutOfStockItems);
router.get("/analytics/categories/:organizationId", inventoryController.getCategoryCount);
router.get("/analytics/stores/:organizationId", inventoryController.getStoreCount);
router.get("/analytics/value/:organizationId", inventoryController.getTotalInventoryValue);
router.get("/analytics/avg-price/:organizationId", inventoryController.getAveragePrice);
router.get("/analytics/on-sale/:organizationId", inventoryController.getOnSaleCount);
router.get("/analytics/avg-rating/:organizationId", inventoryController.getAverageRating);

module.exports = router;