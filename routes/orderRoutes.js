const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderControllers");

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order management operations
 */

// CREATE a new order
/**
 * @swagger
 * /api/orders/create:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer
 *               - items
 *               - organization
 *             properties:
 *               customer:
 *                 type: string
 *                 format: ObjectId
 *                 example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       format: ObjectId
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                     quantity:
 *                       type: number
 *                       example: 2
 *                     price:
 *                       type: number
 *                       example: 99.99
 *               organization:
 *                 type: string
 *                 format: ObjectId
 *                 example: "60f7b3b3b3b3b3b3b3b3b3b5"
 *               store:
 *                 type: string
 *                 format: ObjectId
 *                 example: "60f7b3b3b3b3b3b3b3b3b3b6"
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *                   example: "Order created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/create", orderController.createOrder);

// GET all orders for a specific organization
router.get("/all", orderController.getAllOrders);

// GET all orders for a specific organization
router.get("/organization/:organizationId", orderController.getAllOrdersByOrganization);

// GET all orders for a specific store
router.get("/store/:storeId", orderController.getOrdersByStoreId);

// DELETE all orders for a specific store
router.delete("/store/:storeId", orderController.deleteAllOrdersByStore);

// GET a specific order by ID
router.get("/get/:orderId", orderController.getOrderById);

// GET order with shipping label information
router.get("/with-shipping-label/:orderId", orderController.getOrderWithShippingLabel);

// GET recent orders for dashboard
router.get("/recent", orderController.getRecentOrders);

// UPDATE a specific order by ID
router.patch("/update/:orderId", orderController.updateOrder);

// DELETE an order by ID
router.delete("/delete/:orderId", orderController.deleteOrder);

// SYNC orders for a specific store and organization
router.post("/sync/:storeId/:organizationId", orderController.syncOrders);

// Analytics Endpoints
router.get("/analytics/cross-store/:organizationId", orderController.getCrossStorePerformance);
router.get("/analytics/temporal/:organizationId", orderController.getTemporalAnalytics);
router.get("/analytics/customers/:organizationId", orderController.getCustomerAnalytics);
router.get("/analytics/products/:organizationId", orderController.getProductPerformance);
router.get("/analytics/financial/:organizationId", orderController.getFinancialAnalytics);
router.get("/analytics/operations/:organizationId", orderController.getOperationalMetrics);
router.get("/analytics/geospatial/:organizationId", orderController.getGeospatialAnalytics);
router.get("/analytics/status/:organizationId", orderController.getStatusDistribution);
router.get("/analytics/funnel/:organizationId", orderController.getSalesFunnel);
router.get("/analytics/ltv/:organizationId", orderController.getCustomerLTV);

module.exports = router;
