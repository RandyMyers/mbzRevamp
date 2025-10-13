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
router.post("/create", protect, inventoryController.createProduct);

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
router.get("/all", protect, inventoryController.getAllProducts);

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
router.get("/organization/:organizationId", protect, inventoryController.getAllProductsByOrganization);

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
router.get("/:productId", protect, inventoryController.getProductById);

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
router.patch("/:productId", protect, inventoryController.updateProduct);

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
router.delete("/:productId", protect, inventoryController.deleteProduct);

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
router.delete("/store/:storeId", protect, inventoryController.deleteAllProductsByStore);

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
router.post("/woocommerce/sync-products/:storeId/:organizationId", protect, inventoryController.syncProducts);

/**
 * @swagger
 * /api/inventory/woocommerce/sync/:productId:
 *   post:
 *     summary: Create Sync
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
router.post("/woocommerce/sync/:productId", protect, inventoryController.syncProductToWooCommerce);

/**
 * @swagger
 * /api/inventory/woocommerce/retry-sync/:productId:
 *   post:
 *     summary: Create Retry-sync
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
router.post("/woocommerce/retry-sync/:productId", protect, inventoryController.retryProductWooCommerceSync);

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
router.get("/metrics/total-products/:organizationId", protect, inventoryController.getTotalProducts);

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
router.get("/metrics/in-stock/:organizationId", protect, inventoryController.getInStockItems);

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
router.get("/metrics/low-stock/:organizationId", protect, inventoryController.getLowStockItems);

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
router.get("/metrics/out-of-stock/:organizationId", protect, inventoryController.getOutOfStockItems);

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
router.get("/metrics/category-count/:organizationId", protect, inventoryController.getCategoryCount);

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
router.get("/metrics/store-count/:organizationId", protect, inventoryController.getStoreCount);

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
router.get("/metrics/total-value/:organizationId", protect, inventoryController.getTotalInventoryValue);

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
router.get("/metrics/avg-price/:organizationId", protect, inventoryController.getAveragePrice);

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
router.get("/metrics/on-sale/:organizationId", protect, inventoryController.getOnSaleCount);

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
router.get("/metrics/avg-rating/:organizationId", protect, inventoryController.getAverageRating);

module.exports = router;
