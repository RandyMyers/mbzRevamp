const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryControllers");
const { protect } = require("../middleware/authMiddleware");

// Product CRUD Operations
router.post("/create", protect, inventoryController.createProduct);
router.get("/all", protect, inventoryController.getAllProducts);
router.get("/organization/:organizationId", protect, inventoryController.getAllProductsByOrganization);
router.get("/:productId", protect, inventoryController.getProductById);
router.patch("/:productId", protect, inventoryController.updateProduct);
router.delete("/:productId", protect, inventoryController.deleteProduct);
router.delete("/store/:storeId", protect, inventoryController.deleteAllProductsByStore);

// WooCommerce sync routes
router.post("/woocommerce/sync-products/:storeId/:organizationId", protect, inventoryController.syncProducts);
router.post("/woocommerce/sync/:productId", protect, inventoryController.syncProductToWooCommerce);
router.post("/woocommerce/retry-sync/:productId", protect, inventoryController.retryProductWooCommerceSync);

// Metrics routes
router.get("/metrics/total-products/:organizationId", protect, inventoryController.getTotalProducts);
router.get("/metrics/in-stock/:organizationId", protect, inventoryController.getInStockItems);
router.get("/metrics/low-stock/:organizationId", protect, inventoryController.getLowStockItems);
router.get("/metrics/out-of-stock/:organizationId", protect, inventoryController.getOutOfStockItems);
router.get("/metrics/category-count/:organizationId", protect, inventoryController.getCategoryCount);
router.get("/metrics/store-count/:organizationId", protect, inventoryController.getStoreCount);
router.get("/metrics/total-value/:organizationId", protect, inventoryController.getTotalInventoryValue);
router.get("/metrics/avg-price/:organizationId", protect, inventoryController.getAveragePrice);
router.get("/metrics/on-sale/:organizationId", protect, inventoryController.getOnSaleCount);
router.get("/metrics/avg-rating/:organizationId", protect, inventoryController.getAverageRating);

module.exports = router;