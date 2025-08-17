const Product = require('../models/product'); // Import Product model
const SubscriptionPlan = require('../models/subscriptionPlans'); // Import SubscriptionPlan model (assuming it exists)
const logEvent = require('../helper/logEvent');

/**
 * @swagger
 * /api/products/create:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
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
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *                 example: "Premium Plan"
 *               description:
 *                 type: string
 *                 description: Product description
 *                 example: "Our most comprehensive plan with all features included"
 *               isActive:
 *                 type: boolean
 *                 description: Whether the product is active
 *                 default: true
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product created successfully"
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Product already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product already exists"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
  // Create a new product
  exports.createProduct = async (req, res) => {
    try {
      const { name, description, isActive } = req.body;

      console.log(req.body);

      // Check if product already exists
      const existingProduct = await Product.findOne({ name });
      if (existingProduct) {
        return res.status(400).json({ message: "Product already exists" });
      }

      const newProduct = new Product({
        name,
        description,
        isActive
      });

      await newProduct.save();
      await logEvent({
        action: 'create_product',
        user: req.user._id,
        resource: 'Product',
        resourceId: newProduct._id,
        details: { name: newProduct.name, price: newProduct.price },
        organization: req.user.organization
      });
      res.status(201).json({ message: "Product created successfully", product: newProduct });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },

  /**
   * @swagger
   * /api/products/all:
   *   get:
   *     summary: Get all products
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all products retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Product'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
  // Get all products
  exports.getAllProducts = async (req, res) => {
    try {
      const products = await Product.find();
      res.status(200).json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },

  /**
   * @swagger
   * /api/products/get/{id}:
   *   get:
   *     summary: Get product by ID
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: ObjectId
   *         description: Product ID
   *         example: "507f1f77bcf86cd799439011"
   *     responses:
   *       200:
   *         description: Product retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Product'
   *       404:
   *         description: Product not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
  // Get product by ID
  exports.getProductById = async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },

  /**
   * @swagger
   * /api/products/update/{id}:
   *   patch:
   *     summary: Update a product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: ObjectId
   *         description: Product ID
   *         example: "507f1f77bcf86cd799439011"
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Product name
   *                 example: "Updated Premium Plan"
   *               description:
   *                 type: string
   *                 description: Product description
   *                 example: "Updated description with new features"
   *               isActive:
   *                 type: boolean
   *                 description: Whether the product is active
   *                 example: true
   *     responses:
   *       200:
   *         description: Product updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product updated successfully"
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
  // Update a product
  exports.updateProduct = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Update product fields
      const oldProduct = { ...product };
      product.name = name || product.name;
      product.description = description || product.description;
      product.isActive = isActive !== undefined ? isActive : product.isActive;
      product.updatedAt = Date.now();

      await product.save();
      await logEvent({
        action: 'update_product',
        user: req.user._id,
        resource: 'Product',
        resourceId: product._id,
        details: { before: oldProduct, after: product },
        organization: req.user.organization
      });
      res.status(200).json({ message: "Product updated successfully", product });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },

  /**
   * @swagger
   * /api/products/delete/{id}:
   *   delete:
   *     summary: Delete a product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: ObjectId
   *         description: Product ID
   *         example: "507f1f77bcf86cd799439011"
   *     responses:
   *       200:
   *         description: Product deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Product deleted successfully"
   *       404:
   *         description: Product not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Product not found"
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Server error"
   */
  // Delete a product
  exports.deleteProduct = async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      await product.remove();
      await logEvent({
        action: 'delete_product',
        user: req.user._id,
        resource: 'Product',
        resourceId: product._id,
        details: { name: product.name },
        organization: req.user.organization
      });
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },

  /**
   * @swagger
   * /api/products/add-subscription:
   *   post:
   *     summary: Add subscription plan to product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - productId
   *               - subscriptionPlanId
   *             properties:
   *               productId:
   *                 type: string
   *                 format: ObjectId
   *                 description: Product ID
   *                 example: "507f1f77bcf86cd799439011"
   *               subscriptionPlanId:
   *                 type: string
   *                 format: ObjectId
   *                 description: Subscription Plan ID
   *                 example: "507f1f77bcf86cd799439012"
   *     responses:
   *       200:
   *         description: Subscription plan added to product successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Subscription plan added to product"
   *                 product:
   *                   $ref: '#/components/schemas/Product'
   *       404:
   *         description: Product or subscription plan not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Product not found"
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Server error"
   */
  // Add subscription plan to product
  exports.addSubscriptionPlanToProduct = async (req, res) => {
    try {
      const { productId, subscriptionPlanId } = req.body;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const subscriptionPlan = await SubscriptionPlan.findById(subscriptionPlanId);
      if (!subscriptionPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }

      // Add the subscription plan to the product's subscriptionPlans array
      product.subscriptionPlans.push(subscriptionPlanId);
      await product.save();

      res.status(200).json({ message: "Subscription plan added to product", product });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }

