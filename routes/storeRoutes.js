const express = require("express");
const router = express.Router();
const { authenticateUser } = require('../middlewares/authMiddleware');
const storeController = require("../controllers/storeControllers");

// CREATE a new store
/**
 * @swagger
 * /api/stores/create:
 *   post:
 *     summary: Create a new store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - organization
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Online Store"
 *               description:
 *                 type: string
 *                 example: "A great online store"
 *               organization:
 *                 type: string
 *                 format: ObjectId
 *                 example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *               storeType:
 *                 type: string
 *                 enum: ["woocommerce", "shopify", "custom"]
 *                 example: "woocommerce"
 *               storeUrl:
 *                 type: string
 *                 example: "https://mystore.com"
 *     responses:
 *       201:
 *         description: Store created successfully
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
 *                   example: "Store created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Store'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/create", authenticateUser, storeController.createStore);

// GET all stores by organization
router.get("/organization/:organizationId", authenticateUser, storeController.getStoresByOrganization);

// GET a specific store by ID
router.get("/get/:storeId", authenticateUser, storeController.getStoreById);

// UPDATE a store by ID
router.patch("/update/:storeId", authenticateUser, storeController.updateStore);

// DELETE a store by ID
router.delete("/delete/:storeId", authenticateUser, storeController.deleteStore);

// Sync store with WooCommerce
router.patch("/sync/:storeId", authenticateUser, storeController.syncStoreWithWooCommerce);

// Webhook management for stores
router.post("/:storeId/webhooks", authenticateUser, storeController.createStoreWebhooks);
router.get("/:storeId/webhooks/status", authenticateUser, storeController.getStoreWebhookStatus);

// Store error notifications
router.get("/:storeId/error-notifications", authenticateUser, storeController.getStoreErrorNotifications);

module.exports = router; 
