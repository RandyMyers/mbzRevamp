const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Inventory
 *     description: inventory operations
 */

const inventoryController = require("../controllers/inventoryControllers");
const { protect } = require("../middleware/authMiddleware");
const { checkInventoryAccess } = require("../middleware/permissionMiddleware");

// Apply inventory access check to all routes
// Free plan: view_only (GET requests only)
// Basic, Standard, Premium: full access
router.use(protect, checkInventoryAccess);

// Product CRUD Operations

/**
 * @swagger
 * /api/inventory/create:
 *   post:
 *     summary: Create Create
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/create", inventoryController.createProduct);

/**
 * @swagger
 * /api/inventory/all:
 *   get:
 *     summary: Get All
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/all", inventoryController.getAllProducts);

/**
 * @swagger
 * /api/inventory/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/organization/:organizationId", inventoryController.getAllProductsByOrganization);

/**
 * @swagger
 * /api/inventory/:productId:
 *   get:
 *     summary: Get Item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/:productId", inventoryController.getProductById);

/**
 * @swagger
 * /api/inventory/:productId:
 *   patch:
 *     summary: Update Item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch("/:productId", inventoryController.updateProduct);

/**
 * @swagger
 * /api/inventory/:productId:
 *   delete:
 *     summary: Delete Item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete("/:productId", inventoryController.deleteProduct);

/**
 * @swagger
 * /api/inventory/store/:storeId:
 *   delete:
 *     summary: Delete Store
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete("/store/:storeId", inventoryController.deleteAllProductsByStore);

// WooCommerce sync routes

/**
 * @swagger
 * /api/inventory/woocommerce/sync-products/:storeId/:organizationId:
 *   post:
 *     summary: Create Sync-products
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/woocommerce/sync-products/:storeId/:organizationId", inventoryController.syncProducts);

// HIDDEN FROM SWAGGER - Not used by frontend
// /**
//  * @swagger
//  * /api/inventory/woocommerce/sync/:productId:
//  *   post:
//  *     summary: Create Sync
//  *     tags: [Inventory]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: "Operation completed successfully"
//  *       401:
//  *         description: Unauthorized
//  *       500:
//  *         description: Server error
//  */
router.post("/woocommerce/sync/:productId", inventoryController.syncProductToWooCommerce);

// HIDDEN FROM SWAGGER - Not used by frontend
// /**
//  * @swagger
//  * /api/inventory/woocommerce/retry-sync/:productId:
//  *   post:
//  *     summary: Create Retry-sync
//  *     tags: [Inventory]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: "Operation completed successfully"
//  *       401:
//  *         description: Unauthorized
//  *       500:
//  *         description: Server error
//  */
router.post("/woocommerce/retry-sync/:productId", inventoryController.retryProductWooCommerceSync);

// Metrics routes

/**
 * @swagger
 * /api/inventory/metrics/total-products/:organizationId:
 *   get:
 *     summary: Get Total-products
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/metrics/total-products/:organizationId", inventoryController.getTotalProducts);

/**
 * @swagger
 * /api/inventory/metrics/in-stock/:organizationId:
 *   get:
 *     summary: Get In-stock
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/metrics/in-stock/:organizationId", inventoryController.getInStockItems);

/**
 * @swagger
 * /api/inventory/metrics/low-stock/:organizationId:
 *   get:
 *     summary: Get Low-stock
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/metrics/low-stock/:organizationId", inventoryController.getLowStockItems);

/**
 * @swagger
 * /api/inventory/metrics/out-of-stock/:organizationId:
 *   get:
 *     summary: Get Out-of-stock
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/metrics/out-of-stock/:organizationId", inventoryController.getOutOfStockItems);

/**
 * @swagger
 * /api/inventory/metrics/category-count/:organizationId:
 *   get:
 *     summary: Get Category-count
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/metrics/category-count/:organizationId", inventoryController.getCategoryCount);

/**
 * @swagger
 * /api/inventory/metrics/store-count/:organizationId:
 *   get:
 *     summary: Get Store-count
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/metrics/store-count/:organizationId", inventoryController.getStoreCount);

/**
 * @swagger
 * /api/inventory/metrics/total-value/:organizationId:
 *   get:
 *     summary: Get Total-value
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/metrics/total-value/:organizationId", inventoryController.getTotalInventoryValue);

/**
 * @swagger
 * /api/inventory/metrics/avg-price/:organizationId:
 *   get:
 *     summary: Get Avg-price
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/metrics/avg-price/:organizationId", inventoryController.getAveragePrice);

/**
 * @swagger
 * /api/inventory/metrics/on-sale/:organizationId:
 *   get:
 *     summary: Get On-sale
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/metrics/on-sale/:organizationId", inventoryController.getOnSaleCount);

/**
 * @swagger
 * /api/inventory/metrics/avg-rating/:organizationId:
 *   get:
 *     summary: Get Avg-rating
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/metrics/avg-rating/:organizationId", inventoryController.getAverageRating);

/**
 * @swagger
 * /api/inventory/cleanup/orphaned/:organizationId:
 *   delete:
 *     summary: Clean up orphaned products (products from deleted stores)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dryRun
 *         schema:
 *           type: boolean
 *         description: If true, only returns count without deleting
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete("/cleanup/orphaned/:organizationId", inventoryController.cleanupOrphanedProducts);

module.exports = router;
