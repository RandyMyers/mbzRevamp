const Inventory = require('../models/inventory');
const Store = require('../models/store');
const Organization = require('../models/organization');
const mongoose = require('mongoose');
const { Worker } = require('worker_threads');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { createAuditLog } = require('../helpers/auditLogHelper');
const { createProductInWooCommerce } = require('../helper/wooCommerceCreateHelper');
const { updateWooCommerceProduct } = require('../helper/wooCommerceUpdateHelper');
const { notifyProductCreated, notifyLowInventory, notifyOutOfStock } = require('../helpers/notificationHelper');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - sku
 *         - name
 *         - regular_price
 *         - slug
 *         - type
 *         - categories
 *         - images
 *         - permalink
 *         - storeId
 *         - userId
 *         - organizationId
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique product ID
 *         product_Id:
 *           type: number
 *           description: WooCommerce product ID
 *         sku:
 *           type: string
 *           description: Stock Keeping Unit (unique identifier)
 *         name:
 *           type: string
 *           description: Product name
 *         description:
 *           type: string
 *           description: Product description
 *         short_description:
 *           type: string
 *           description: Short product description
 *         price:
 *           type: string
 *           description: Current product price
 *         sale_price:
 *           type: string
 *           description: Sale price
 *         regular_price:
 *           type: string
 *           description: Regular product price
 *         date_on_sale_from:
 *           type: string
 *           format: date-time
 *           description: Sale start date
 *         date_on_sale_to:
 *           type: string
 *           format: date-time
 *           description: Sale end date
 *         on_sale:
 *           type: boolean
 *           description: Whether product is on sale
 *         purchasable:
 *           type: boolean
 *           description: Whether product can be purchased
 *         total_sales:
 *           type: number
 *           description: Total units sold
 *         status:
 *           type: string
 *           enum: [draft, pending, private, publish]
 *           description: Product status
 *         featured:
 *           type: boolean
 *           description: Whether product is featured
 *         catalog_visibility:
 *           type: string
 *           enum: [visible, catalog, search, hidden]
 *           description: Product visibility in catalog
 *         virtual:
 *           type: boolean
 *           description: Whether product is virtual
 *         downloadable:
 *           type: boolean
 *           description: Whether product is downloadable
 *         download_limit:
 *           type: number
 *           description: Download limit
 *         download_expiry:
 *           type: number
 *           description: Download expiry in days
 *         external_url:
 *           type: string
 *           description: External product URL
 *         button_text:
 *           type: string
 *           description: Button text for external products
 *         tax_status:
 *           type: string
 *           enum: [taxable, shipping, none]
 *           description: Tax status
 *         tax_class:
 *           type: string
 *           description: Tax class
 *         manage_stock:
 *           type: boolean
 *           description: Whether to manage stock
 *         stock_quantity:
 *           type: number
 *           description: Stock quantity
 *         stock_status:
 *           type: string
 *           enum: [instock, outofstock, onbackorder]
 *           description: Stock status
 *         backorders:
 *           type: string
 *           enum: [no, notify, yes]
 *           description: Backorder policy
 *         backorders_allowed:
 *           type: boolean
 *           description: Whether backorders are allowed
 *         backordered:
 *           type: boolean
 *           description: Whether product is backordered
 *         sold_individually:
 *           type: boolean
 *           description: Whether product is sold individually
 *         weight:
 *           type: string
 *           description: Product weight
 *         dimensions:
 *           type: object
 *           properties:
 *             length:
 *               type: string
 *               description: Product length
 *             width:
 *               type: string
 *               description: Product width
 *             height:
 *               type: string
 *               description: Product height
 *         shipping_required:
 *           type: boolean
 *           description: Whether shipping is required
 *         shipping_taxable:
 *           type: boolean
 *           description: Whether shipping is taxable
 *         shipping_class:
 *           type: string
 *           description: Shipping class
 *         shipping_class_id:
 *           type: number
 *           description: Shipping class ID
 *         reviews_allowed:
 *           type: boolean
 *           description: Whether reviews are allowed
 *         average_rating:
 *           type: string
 *           description: Average product rating
 *         rating_count:
 *           type: number
 *           description: Number of ratings
 *         related_ids:
 *           type: array
 *           items:
 *             type: number
 *           description: Related product IDs
 *         upsell_ids:
 *           type: array
 *           items:
 *             type: number
 *           description: Upsell product IDs
 *         cross_sell_ids:
 *           type: array
 *           items:
 *             type: number
 *           description: Cross-sell product IDs
 *         parent_id:
 *           type: number
 *           description: Parent product ID
 *         purchase_note:
 *           type: string
 *           description: Purchase note
 *         categories:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id
 *               - name
 *               - slug
 *             properties:
 *               id:
 *                 type: number
 *                 description: Category ID
 *               name:
 *                 type: string
 *                 description: Category name
 *               slug:
 *                 type: string
 *                 description: Category slug
 *         tags:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *                 description: Tag ID
 *               name:
 *                 type: string
 *                 description: Tag name
 *               slug:
 *                 type: string
 *                 description: Tag slug
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id
 *               - date_created
 *               - src
 *             properties:
 *               id:
 *                 type: number
 *                 description: Image ID
 *               date_created:
 *                 type: string
 *                 format: date-time
 *                 description: Image creation date
 *               date_created_gmt:
 *                 type: string
 *                 format: date-time
 *                 description: Image creation date GMT
 *               date_modified:
 *                 type: string
 *                 format: date-time
 *                 description: Image modification date
 *               date_modified_gmt:
 *                 type: string
 *                 format: date-time
 *                 description: Image modification date GMT
 *               src:
 *                 type: string
 *                 format: uri
 *                 description: Image URL
 *               name:
 *                 type: string
 *                 description: Image name
 *               alt:
 *                 type: string
 *                 description: Image alt text
 *               position:
 *                 type: number
 *                 description: Image position
 *         attributes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *                 description: Attribute ID
 *               name:
 *                 type: string
 *                 description: Attribute name
 *               position:
 *                 type: number
 *                 description: Attribute position
 *               visible:
 *                 type: boolean
 *                 description: Whether attribute is visible
 *               variation:
 *                 type: boolean
 *                 description: Whether attribute varies
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Attribute options
 *         default_attributes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *                 description: Default attribute ID
 *               name:
 *                 type: string
 *                 description: Default attribute name
 *               option:
 *                 type: string
 *                 description: Default attribute option
 *         variations:
 *           type: array
 *           items:
 *             type: number
 *             description: Product variation IDs
 *         menu_order:
 *           type: number
 *           description: Menu order
 *         meta_data:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *                 description: Meta data ID
 *               key:
 *                 type: string
 *                 description: Meta data key
 *               value:
 *                 type: string
 *                 description: Meta data value
 *         slug:
 *           type: string
 *           description: Product slug
 *         type:
 *           type: string
 *           description: Product type
 *         permalink:
 *           type: string
 *           format: uri
 *           description: Product permalink
 *         storeId:
 *           type: string
 *           format: ObjectId
 *           description: Store ID
 *         userId:
 *           type: string
 *           format: ObjectId
 *           description: User ID who created the product
 *         organizationId:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID
 *         wooCommerceId:
 *           type: number
 *           description: WooCommerce product ID
 *         lastWooCommerceSync:
 *           type: string
 *           format: date-time
 *           description: Last WooCommerce sync timestamp
 *         syncStatus:
 *           type: string
 *           enum: [pending, synced, failed]
 *           description: WooCommerce sync status
 *         syncError:
 *           type: string
 *           description: WooCommerce sync error message
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Product creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Product last update timestamp
 */

//const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;



/**
 * @swagger
 * /api/inventory/sync/{storeId}/{organizationId}:
 *   post:
 *     summary: Synchronize products with WooCommerce API
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID initiating the sync
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Product synchronization started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product synchronization started in the background"
 *       404:
 *         description: Store or organization not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Store not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
// Synchronize products with WooCommerce API
exports.syncProducts = async (req, res) => {
  try {
    const { storeId, organizationId } = req.params;
    const { userId } = req.body;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const organization = await Organization.findById(organizationId);
    if (!organization) return res.status(404).json({ error: 'Organization not found' });

    // Extract only serializable properties from the store document
    const storeData = {
      _id: store._id,
      name: store.name,
      url: store.url,
      apiKey: store.apiKey,
      secretKey: store.secretKey,
      platformType: store.platformType,
      isActive: store.isActive
    };

    const worker = new Worker(path.resolve(__dirname, '../helper/syncProductWorker.js'), {
      workerData: { storeId, store: storeData, organizationId, userId },
    });

    console.log('Worker Path:', path.resolve(__dirname, '../helper/syncProductWorker.js'));

    worker.on('message', (message) => {
      if (message.status === 'success') {
        console.log(message.message);
      } else if (message.status === 'error') {
        console.error(`Error in worker thread: ${message.message}`);
      }
    });

    worker.on('error', (error) => {
      console.error(`Worker thread error: ${error.message}`);
    });

    worker.on('exit', (code) => {
      if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
    });

    res.json({ message: 'Product synchronization started in the background' });
  } catch (error) {
    console.error('Error in syncProducts:', error.message);
    res.status(500).json({ error: error.message });
  }
};
  

/**
 * @swagger
 * /api/inventory/create:
 *   post:
 *     summary: Create a new product in the inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - sku
 *               - name
 *               - regular_price
 *               - slug
 *               - type
 *               - categories
 *               - images
 *               - permalink
 *               - storeId
 *               - userId
 *               - organizationId
 *             properties:
 *               sku:
 *                 type: string
 *                 description: Stock Keeping Unit (unique identifier)
 *                 example: "PROD-001"
 *               name:
 *                 type: string
 *                 description: Product name
 *                 example: "Premium Widget"
 *               description:
 *                 type: string
 *                 description: Product description
 *                 example: "A high-quality widget for all your needs"
 *               short_description:
 *                 type: string
 *                 description: Short product description
 *                 example: "Premium quality widget"
 *               price:
 *                 type: string
 *                 description: Current product price
 *                 example: "29.99"
 *               sale_price:
 *                 type: string
 *                 description: Sale price
 *                 example: "24.99"
 *               regular_price:
 *                 type: string
 *                 description: Regular product price
 *                 example: "29.99"
 *               status:
 *                 type: string
 *                 enum: [draft, pending, private, publish]
 *                 default: publish
 *                 description: Product status
 *                 example: "publish"
 *               featured:
 *                 type: boolean
 *                 description: Whether product is featured
 *                 example: false
 *               catalog_visibility:
 *                 type: string
 *                 enum: [visible, catalog, search, hidden]
 *                 default: visible
 *                 description: Product visibility in catalog
 *                 example: "visible"
 *               virtual:
 *                 type: boolean
 *                 description: Whether product is virtual
 *                 example: false
 *               downloadable:
 *                 type: boolean
 *                 description: Whether product is downloadable
 *                 example: false
 *               manage_stock:
 *                 type: boolean
 *                 description: Whether to manage stock
 *                 example: true
 *               stock_quantity:
 *                 type: number
 *                 description: Stock quantity
 *                 example: 100
 *               stock_status:
 *                 type: string
 *                 enum: [instock, outofstock, onbackorder]
 *                 default: instock
 *                 description: Stock status
 *                 example: "instock"
 *               weight:
 *                 type: string
 *                 description: Product weight
 *                 example: "0.5"
 *               dimensions:
 *                 type: object
 *                 properties:
 *                   length:
 *                     type: string
 *                     description: Product length
 *                     example: "10"
 *                   width:
 *                     type: string
 *                     description: Product width
 *                     example: "5"
 *                   height:
 *                     type: string
 *                     description: Product height
 *                     example: "2"
 *               slug:
 *                 type: string
 *                 description: Product slug
 *                 example: "premium-widget"
 *               type:
 *                 type: string
 *                 description: Product type
 *                 example: "simple"
 *               permalink:
 *                 type: string
 *                 format: uri
 *                 description: Product permalink
 *                 example: "https://store.com/product/premium-widget"
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - name
 *                     - slug
 *                   properties:
 *                     id:
 *                       type: number
 *                       description: Category ID
 *                       example: 15
 *                     name:
 *                       type: string
 *                       description: Category name
 *                       example: "Widgets"
 *                     slug:
 *                       type: string
 *                       description: Category slug
 *                       example: "widgets"
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - date_created
 *                     - src
 *                   properties:
 *                     id:
 *                       type: number
 *                       description: Image ID
 *                       example: 123
 *                     date_created:
 *                       type: string
 *                       format: date-time
 *                       description: Image creation date
 *                       example: "2024-01-01T00:00:00.000Z"
 *                     src:
 *                       type: string
 *                       format: uri
 *                       description: Image URL
 *                       example: "https://example.com/image.jpg"
 *               storeId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Store ID
 *                 example: "507f1f77bcf86cd799439011"
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID who created the product
 *                 example: "507f1f77bcf86cd799439011"
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
 *               syncToWooCommerce:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to sync product to WooCommerce
 *                 example: true
 *     responses:
 *       201:
 *         description: Product created successfully
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
 *                   example: "Product created successfully"
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Missing required fields"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to create product"
 */
// CREATE a new product in the inventory
exports.createProduct = async (req, res) => {
  try {
    console.log('🚀 CREATE PRODUCT - Starting product creation process');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    // ✅ VALIDATION 1: Check user authentication
    if (!req.user || !req.user._id) {
      console.log('❌ User not authenticated');
      return res.status(401).json({ 
        success: false, 
        message: "User not authenticated" 
      });
    }
    
    // ✅ VALIDATION 2: Check required fields
    const requiredFields = ['sku', 'name', 'status', 'slug', 'type', 'storeId', 'userId', 'organizationId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields 
      });
    }
    console.log('✅ All required fields present');

    const {
      product_Id,  // Optional - will be set after WooCommerce sync
      sku,         // Required
      name,        // Required
      description,
      short_description,
      price,
      sale_price,
      regular_price,
      date_on_sale_from,
      date_on_sale_to,
      on_sale,
      purchasable,
      total_sales,
      status,      // Required
      featured,
      catalog_visibility,
      virtual,
      downloadable,
      download_limit,
      download_expiry,
      external_url,
      button_text,
      tax_status,
      tax_class,
      manage_stock,
      stock_quantity,
      stock_status,
      backorders,
      backorders_allowed,
      backordered,
      sold_individually,
      weight,
      dimensions,
      shipping_required,
      shipping_taxable,
      shipping_class,
      shipping_class_id,
      reviews_allowed,
      average_rating,
      rating_count,
      related_ids,
      upsell_ids,
      cross_sell_ids,
      parent_id,
      purchase_note,
      categories,
      tags,
      images,
      attributes,
      default_attributes,
      variations,
      grouped_products,
      menu_order,
      meta_data,
      permalink,   // Required
      slug,        // Required
      type,        // Required
      storeId,     // Required
      userId,      // Required
      organizationId, // Required
      syncToWooCommerce = false, // NEW: Option to sync to WooCommerce
    } = req.body;

    console.log('images received from front',req.files);

    // ✅ VALIDATION 3: Validate store exists
    console.log('🏪 Fetching store information...');
    const store = await Store.findById(storeId);
    if (!store) {
      console.log('❌ Store not found for ID:', storeId);
      return res.status(404).json({ 
        success: false, 
        message: 'Store not found' 
      });
    }
    console.log('✅ Store found:', store.name, 'URL:', store.url);

    // ✅ VALIDATION 4: Check for duplicate SKU
    const existingProduct = await Inventory.findOne({ 
      sku: sku, 
      storeId: storeId,
      organizationId: organizationId 
    });
    
    if (existingProduct) {
      console.log('❌ Product with SKU already exists:', sku);
      return res.status(400).json({
        success: false,
        message: `Product with SKU '${sku}' already exists in this store`
      });
    }

    console.log('🔍 Validating required fields...');
    // Validate required fields (removed product_Id and permalink from required fields)
    // const requiredFields = ['sku', 'name', 'status', 'slug', 'type', 'storeId', 'userId', 'organizationId'];
    // const missingFields = requiredFields.filter(field => !req.body[field]);
    
    // if (missingFields.length > 0) {
    //   console.log('❌ Missing required fields:', missingFields);
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: `Missing required fields: ${missingFields.join(', ')}` 
    //   });
    // }
    // console.log('✅ All required fields present');

    // Store information already fetched above, no need to fetch again
    console.log('🏪 Using store information for permalink generation...');
    // const store = await Store.findById(storeId); // Remove duplicate - store already fetched above
    // if (!store) {
    //   console.log('❌ Store not found for ID:', storeId);
    //   return res.status(404).json({ 
    //     success: false, 
    //     message: 'Store not found' 
    //   });
    // }
    // console.log('✅ Store found:', store.name, 'URL:', store.url);

    // Auto-generate permalink using store URL and product slug
    const generatedPermalink = `${store.url}/product/${slug}/`;
    console.log('🔗 Generated permalink:', generatedPermalink);

    // Validate data types and convert if necessary
    const now = new Date();
    console.log('📅 Processing timestamp:', now);
    
    // Convert average_rating to string if provided
    const processedAverageRating = average_rating ? average_rating.toString() : "0.00";
    console.log('⭐ Average rating processed:', processedAverageRating);
    
    // Validate and process categories
    let processedCategories = [];
    if (categories) {
      try {
        // Handle both string and object formats
        const categoriesData = typeof categories === 'string' ? JSON.parse(categories) : categories;
        processedCategories = categoriesData.map(cat => ({
          id: Number(cat.id) || 0, // This should be the WooCommerce ID
          name: cat.name || '',
          slug: cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-') || '',
          wooCommerceId: Number(cat.id) || 0 // Ensure WooCommerce ID is available
        }));
      } catch (parseError) {
        console.error('❌ Error parsing categories:', parseError);
        processedCategories = [];
      }
    }
    console.log('📂 Categories processed:', processedCategories.length, 'categories');

    // Handle image uploads if files are provided
    let processedImages = []; // For MongoDB (with id and date_created)
    let wooCommerceImages = []; // For WooCommerce (only src and alt)
    
    if (req.files && req.files.images) {
      console.log('📸 Images received in req.files.images');
      console.log('📁 Number of files received:', Array.isArray(req.files.images) ? req.files.images.length : 1);
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        try {
          console.log(`☁️ Uploading image ${i + 1}/${imageFiles.length} to Cloudinary:`, file.name);
          console.log(`📊 File details: Size: ${file.size}, Type: ${file.mimetype}, Temp path: ${file.tempFilePath}`);
          const result = await cloudinary.uploader.upload(file.tempFilePath, { folder: 'product_images' });
          
          // For MongoDB (with id and date_created)
          processedImages.push({
            id: Date.now() + i, // Generate a unique ID
            date_created: new Date().toISOString(),
            src: result.secure_url,
            alt: file.name || ''
          });
          
          // For WooCommerce (only src and alt)
          wooCommerceImages.push({
            src: result.secure_url,
            alt: file.name || ''
          });
          
          console.log(`✅ Image ${i + 1} uploaded to Cloudinary:`, result.secure_url);
        } catch (uploadError) {
          console.error(`❌ Cloudinary upload error for image ${i + 1}:`, uploadError);
          return res.status(500).json({ success: false, message: `Failed to upload image ${file.name} to Cloudinary`, error: uploadError.message });
        }
      }
    } else {
      console.log('⚠️ No images received in req.files.images');
      console.log('🔍 req.files:', req.files);
      console.log('🔍 req.files.images:', req.files?.images);
    }
    
    console.log('📸 Final processedImages array (for MongoDB):', processedImages);
    console.log('📸 Final wooCommerceImages array (for WooCommerce):', wooCommerceImages);
    console.log('📸 Number of processed images:', processedImages.length);

    // Validate and process tags
    let processedTags = [];
    if (tags) {
      try {
        // Handle both string and object formats
        const tagsData = typeof tags === 'string' ? JSON.parse(tags) : tags;
        processedTags = tagsData.map(tag => ({
          name: tag.name || ''
        }));
      } catch (parseError) {
        console.error('❌ Error parsing tags:', parseError);
        processedTags = [];
      }
    }
    console.log('🏷️ Tags processed:', processedTags.length, 'tags');

    // Validate numeric fields
    const processedPrice = price ? Number(price) : null;
    const processedSalePrice = sale_price ? Number(sale_price) : null;
    const processedRegularPrice = regular_price ? Number(regular_price) : null;
    const processedStockQuantity = stock_quantity ? Number(stock_quantity) : null;
    const processedRatingCount = rating_count ? Number(rating_count) : 0;
    
    console.log('💰 Price data processed:', {
      price: processedPrice,
      sale_price: processedSalePrice,
      regular_price: processedRegularPrice,
      stock_quantity: processedStockQuantity
    });

    // Process dimensions - ensure all values are strings for WooCommerce
    let processedDimensions = null;
    if (dimensions) {
      try {
        const dimensionsData = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
        processedDimensions = {
          length: dimensionsData.length ? String(dimensionsData.length) : "",
          width: dimensionsData.width ? String(dimensionsData.width) : "",
          height: dimensionsData.height ? String(dimensionsData.height) : ""
        };
        console.log('📏 Dimensions processed:', processedDimensions);
      } catch (parseError) {
        console.error('❌ Error parsing dimensions:', parseError);
        processedDimensions = { length: "", width: "", height: "" };
      }
    } else {
      processedDimensions = { length: "", width: "", height: "" };
    }

    // Process other complex fields
    let processedRelatedIds = [];
    let processedUpsellIds = [];
    let processedCrossSellIds = [];
    let processedGroupedProducts = [];
    let processedAttributes = [];
    let processedDefaultAttributes = [];
    let processedVariations = [];
    let processedMetaData = [];

    if (related_ids) {
      try {
        processedRelatedIds = typeof related_ids === 'string' ? JSON.parse(related_ids) : related_ids;
      } catch (parseError) {
        console.error('❌ Error parsing related_ids:', parseError);
      }
    }

    if (upsell_ids) {
      try {
        processedUpsellIds = typeof upsell_ids === 'string' ? JSON.parse(upsell_ids) : upsell_ids;
      } catch (parseError) {
        console.error('❌ Error parsing upsell_ids:', parseError);
      }
    }

    if (cross_sell_ids) {
      try {
        processedCrossSellIds = typeof cross_sell_ids === 'string' ? JSON.parse(cross_sell_ids) : cross_sell_ids;
      } catch (parseError) {
        console.error('❌ Error parsing cross_sell_ids:', parseError);
      }
    }

    if (grouped_products) {
      try {
        processedGroupedProducts = typeof grouped_products === 'string' ? JSON.parse(grouped_products) : grouped_products;
      } catch (parseError) {
        console.error('❌ Error parsing grouped_products:', parseError);
      }
    }

    if (attributes) {
      try {
        processedAttributes = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;
      } catch (parseError) {
        console.error('❌ Error parsing attributes:', parseError);
      }
    }

    if (default_attributes) {
      try {
        processedDefaultAttributes = typeof default_attributes === 'string' ? JSON.parse(default_attributes) : default_attributes;
      } catch (parseError) {
        console.error('❌ Error parsing default_attributes:', parseError);
      }
    }

    if (variations) {
      try {
        processedVariations = typeof variations === 'string' ? JSON.parse(variations) : variations;
      } catch (parseError) {
        console.error('❌ Error parsing variations:', parseError);
      }
    }

    if (meta_data) {
      try {
        processedMetaData = typeof meta_data === 'string' ? JSON.parse(meta_data) : meta_data;
      } catch (parseError) {
        console.error('❌ Error parsing meta_data:', parseError);
      }
    }

    // PHASE 1: Create product in local database first
    console.log('💾 PHASE 1: Creating product in local database...');
    
    // Check for existing product with same SKU in the same store
    // This check is already done above in VALIDATION 4, no need to repeat
    // const existingProduct = await Inventory.findOne({ 
    //   sku: sku, 
    //   storeId: storeId,
    //   organizationId: organizationId 
    // });
    
    // if (existingProduct) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Product with SKU '${sku}' already exists in this store`
    //   });
    // }
    
    const newProduct = new Inventory({
      product_Id: product_Id ? Number(product_Id) : null, // Optional now
      sku,
      name,
      description,
      short_description,
      price: processedPrice,
      sale_price: processedSalePrice,
      regular_price: processedRegularPrice,
      date_on_sale_from: date_on_sale_from ? new Date(date_on_sale_from) : null,
      date_on_sale_to: date_on_sale_to ? new Date(date_on_sale_to) : null,
      on_sale: Boolean(on_sale),
      purchasable: Boolean(purchasable),
      total_sales: total_sales ? Number(total_sales) : 0,
      status,
      featured: Boolean(featured),
      catalog_visibility: catalog_visibility || "visible",
      manage_stock: Boolean(manage_stock),
      stock_quantity: processedStockQuantity,
      stock_status: stock_status || "instock",
      backorders: backorders || "no",
      backorders_allowed: Boolean(backorders_allowed),
      weight,
      dimensions: processedDimensions,
      shipping_required: Boolean(shipping_required !== false), // Default to true
      shipping_taxable: Boolean(shipping_taxable),
      shipping_class,
      shipping_class_id: shipping_class_id ? Number(shipping_class_id) : null,
      categories: processedCategories,
      tags: processedTags,
      images: processedImages,
      average_rating: processedAverageRating,
      rating_count: processedRatingCount,
      reviews_allowed: Boolean(reviews_allowed),
      permalink: generatedPermalink, // Use auto-generated permalink
      slug,
      type,
      external_url: external_url || "",
      button_text: button_text || "",
      upsell_ids: processedUpsellIds,
      cross_sell_ids: processedCrossSellIds,
      related_ids: processedRelatedIds,
      purchase_note: purchase_note || "",
      sold_individually: Boolean(sold_individually),
      grouped_products: processedGroupedProducts,
      menu_order: menu_order ? Number(menu_order) : 0,
      attributes: processedAttributes,
      default_attributes: processedDefaultAttributes,
      variations: processedVariations,
      meta_data: processedMetaData,
      date_created: now,
      date_modified: now,
      storeId,
      userId,
      organizationId,
      wooCommerceId: null, // Explicitly set to null initially
      syncStatus: syncToWooCommerce ? 'pending' : 'not_synced',
      syncError: null,
    });

    console.log('💾 Saving product to database...');
    const savedProduct = await newProduct.save();
    console.log('✅ Product saved to database with ID:', savedProduct._id);

    // ✅ AUDIT LOG: Product Created
    await createAuditLog({
      action: 'Product Created',
      user: userId,
      resource: 'product',
      resourceId: savedProduct._id,
      details: {
        productName: name,
        sku: sku,
        price: price,
        storeId: storeId,
        organizationId: organizationId,
        syncToWooCommerce: syncToWooCommerce,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: organizationId,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    let wooCommerceId = null;
    let syncStatus = savedProduct.syncStatus;
    let syncError = null;

    console.log(processedImages);

    // PHASE 2: Sync to WooCommerce if requested
    if (syncToWooCommerce && storeId) {
      console.log('🔄 PHASE 2: Starting WooCommerce synchronization...');
      console.log('🏪 Sync requested for store ID:', storeId);
      
      try {
        // Get store information
        const store = await Store.findById(storeId);
        if (!store) {
          console.log('❌ Store not found for WooCommerce sync');
          syncStatus = 'failed';
          syncError = 'Store not found for WooCommerce sync';
        } else {
          console.log('✅ Store found for WooCommerce sync:', store.name);
          console.log('🔗 Store URL:', store.url);
          
          // Prepare product data for WooCommerce
          const productData = {
            name,
            description: short_description || description,
            short_description,
            regular_price: processedRegularPrice ? processedRegularPrice.toString() : '0',
            sale_price: processedSalePrice ? processedSalePrice.toString() : null,
            status,
            type,
            sku,
            manage_stock: Boolean(manage_stock),
            stock_quantity: processedStockQuantity,
            stock_status: stock_status || "instock",
            weight: weight ? weight.toString() : null,
            dimensions: processedDimensions, // Use processedDimensions here
            categories: processedCategories,
            tags: processedTags,
            images: wooCommerceImages, // Use wooCommerceImages here
            featured: Boolean(featured),
            catalog_visibility: catalog_visibility || "visible",
            storeId,
            organizationId
          };
          
          console.log('📦 Product data prepared for WooCommerce:', JSON.stringify(productData, null, 2));

          // Create product in WooCommerce
          console.log('🚀 Calling WooCommerce API to create product...');
          const wooCommerceResult = await createProductInWooCommerce(store, productData);
          console.log('📡 WooCommerce API response:', JSON.stringify(wooCommerceResult, null, 2));
          
          if (wooCommerceResult.success) {
            wooCommerceId = wooCommerceResult.data.id;
            syncStatus = 'synced';
            console.log('✅ WooCommerce product created successfully!');
            console.log('🆔 WooCommerce Product ID:', wooCommerceId);
            
            // Update local record with WooCommerce ID
            console.log('💾 Updating local record with WooCommerce ID...');
            await Inventory.findByIdAndUpdate(savedProduct._id, {
              product_Id: wooCommerceId,
              wooCommerceId: wooCommerceId,
              lastWooCommerceSync: new Date(),
              syncStatus: 'synced',
              syncError: null
            });
            console.log('✅ Local record updated with WooCommerce ID');
          } else {
            syncStatus = 'failed';
            syncError = wooCommerceResult.error?.message || 'WooCommerce sync failed';
            console.error('❌ WooCommerce sync failed:', wooCommerceResult.error);
            
            // Update local record with sync failure
            console.log('💾 Updating local record with sync failure...');
            await Inventory.findByIdAndUpdate(savedProduct._id, {
              syncStatus: 'failed',
              syncError: syncError
            });
            console.log('✅ Local record updated with sync failure');
          }
        }
      } catch (wooCommerceError) {
        syncStatus = 'failed';
        syncError = wooCommerceError.message;
        console.error('❌ WooCommerce sync error:', wooCommerceError);
        
        // Update local record with sync failure
        console.log('💾 Updating local record with sync error...');
        await Inventory.findByIdAndUpdate(savedProduct._id, {
          syncStatus: 'failed',
          syncError: syncError
        });
        console.log('✅ Local record updated with sync error');
      }
    } else {
      console.log('⏭️ WooCommerce sync not requested (syncToWooCommerce:', syncToWooCommerce, ')');
    }

    // Get updated product record
    console.log('📋 Fetching final product record...');
    const updatedProduct = await Inventory.findById(savedProduct._id);
    console.log('✅ Final product record retrieved');

    // Log the event
    console.log('📝 Logging event...');
    await createAuditLog({
      action: 'create_inventory_product',
      user: userId,
      resource: 'Inventory',
      resourceId: updatedProduct._id,
      details: { 
        name: updatedProduct.name, 
        sku: updatedProduct.sku,
        syncToWooCommerce,
        syncStatus,
        wooCommerceId 
      },
      organization: organizationId
    });
    console.log('✅ Event logged successfully');

    // Send notification to organization admins
    try {
      await notifyProductCreated(updatedProduct, organizationId);
    } catch (notificationError) {
      console.error('Error sending product creation notification:', notificationError);
      // Don't fail the request if notification fails
    }

    console.log('🎉 PRODUCT CREATION COMPLETE!');
    console.log('📊 Final Summary:', {
      productId: updatedProduct._id,
      name: updatedProduct.name,
      sku: updatedProduct.sku,
      syncToWooCommerce,
      syncStatus,
      wooCommerceId,
      syncError
    });

    res.status(201).json({ 
      success: true, 
      product: updatedProduct,
      wooCommerceSync: {
        synced: syncStatus === 'synced',
        wooCommerceId,
        status: syncStatus,
        error: syncError
      }
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    
    // ✅ BETTER ERROR HANDLING
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      console.log('❌ Validation errors:', validationErrors);
      return res.status(400).json({ 
        success: false, 
        message: "Validation error", 
        details: validationErrors 
      });
    }
    
    if (error.code === 11000) {
      console.log('❌ Duplicate key error:', error.message);
      return res.status(400).json({ 
        success: false, 
        message: "Product with this SKU already exists" 
      });
    }
    
    if (error.name === 'CastError') {
      console.log('❌ Cast error:', error.message);
      return res.status(400).json({ 
        success: false, 
        message: "Invalid data format provided" 
      });
    }
    
    // For other errors, provide the actual error message
    res.status(500).json({ 
      success: false, 
      message: "Failed to create product",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @swagger
 * /api/inventory/organization/{organizationId}:
 *   get:
 *     summary: Get all products for a specific organization
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve products"
 */
/**
 * @swagger
 * /api/inventory/organization/{organizationId}:
 *   get:
 *     summary: Get all products for a specific organization
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve products"
 */
// GET all products for a specific organization
exports.getAllProductsByOrganization = async (req, res) => {
  const { organizationId } = req.params;
  console.log('🔍 Backend: getAllProductsByOrganization called with organizationId:', organizationId);
  console.log('🔍 Backend: organizationId type:', typeof organizationId);
  
  try {
    // Convert organizationId to ObjectId if it's a valid ObjectId string
    let query = { organizationId };
    if (mongoose.Types.ObjectId.isValid(organizationId)) {
      query.organizationId = new mongoose.Types.ObjectId(organizationId);
      console.log('🔍 Backend: Converted to ObjectId:', query.organizationId);
    } else {
      console.log('🔍 Backend: organizationId is not a valid ObjectId, using as string');
    }
    
    const products = await Inventory.find(query)
      .populate("storeId userId organizationId", "name") // Populate relevant fields
      .exec();
    console.log('📦 Backend: Found products:', products.length);
    console.log('📦 Backend: Products:', products);
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('❌ Backend: Error in getAllProductsByOrganization:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve products" });
  }
};

/**
 * @swagger
 * /api/inventory/store/{storeId}:
 *   get:
 *     summary: Get all products for a specific store
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve products"
 */
// GET all products for a specific store
exports.getAllProductsByStore = async (req, res) => {
  const { storeId } = req.params;
  try {
    const products = await Inventory.find({ storeId })
      .populate("storeId userId organizationId", "name") // Populate relevant fields
      .exec();
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve products" });
  }
};

/**
 * @swagger
 * /api/inventory/all:
 *   get:
 *     summary: Get all products in the system
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve products"
 */
/**
 * @swagger
 * /api/inventory/all:
 *   get:
 *     summary: Get all products in the system
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve products"
 */
// GET all products in the system
exports.getAllProducts = async (req, res) => {
  try {
    console.log('🔍 Backend: getAllProducts called');
    const products = await Inventory.find()
      .populate("storeId userId organizationId", "name") // Populate relevant fields
      .exec();
    console.log('📦 Backend: Total products in system:', products.length);
    console.log('📦 Backend: Sample products:', products.slice(0, 3));
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('❌ Backend: Error in getAllProducts:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve products" });
  }
};

/**
 * @swagger
 * /api/inventory/{productId}:
 *   get:
 *     summary: Get a specific product by its ID
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
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
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve product"
 */
// GET a specific product by its ID
exports.getProductById = async (req, res) => {
  const { productId } = req.params;
  try {
    const product = await Inventory.findById(productId)
      .populate("storeId userId organizationId", "name")
      .exec();
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve product" });
  }
};

/**
 * @swagger
 * /api/inventory/{productId}:
 *   put:
 *     summary: Update product details
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Product ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *                 example: "Updated Product Name"
 *               description:
 *                 type: string
 *                 description: Product description
 *                 example: "Updated product description"
 *               short_description:
 *                 type: string
 *                 description: Short product description
 *               price:
 *                 type: string
 *                 description: Current product price
 *                 example: "39.99"
 *               sale_price:
 *                 type: string
 *                 description: Sale price
 *                 example: "34.99"
 *               regular_price:
 *                 type: string
 *                 description: Regular product price
 *                 example: "39.99"
 *               status:
 *                 type: string
 *                 enum: [draft, pending, private, publish]
 *                 description: Product status
 *               featured:
 *                 type: boolean
 *                 description: Whether product is featured
 *               catalog_visibility:
 *                 type: string
 *                 enum: [visible, catalog, search, hidden]
 *                 description: Product visibility in catalog
 *               manage_stock:
 *                 type: boolean
 *                 description: Whether to manage stock
 *               stock_quantity:
 *                 type: number
 *                 description: Stock quantity
 *                 example: 150
 *               stock_status:
 *                 type: string
 *                 enum: [instock, outofstock, onbackorder]
 *                 description: Stock status
 *               weight:
 *                 type: string
 *                 description: Product weight
 *                 example: "0.75"
 *               dimensions:
 *                 type: object
 *                 properties:
 *                   length:
 *                     type: string
 *                     description: Product length
 *                   width:
 *                     type: string
 *                     description: Product width
 *                   height:
 *                     type: string
 *                     description: Product height
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                       description: Category ID
 *                     name:
 *                       type: string
 *                       description: Category name
 *                     slug:
 *                       type: string
 *                       description: Category slug
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                       description: Image ID
 *                     src:
 *                       type: string
 *                       description: Image URL
 *                     alt:
 *                       type: string
 *                       description: Image alt text
 *               syncToWooCommerce:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to sync changes to WooCommerce
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *                   example: "Product updated successfully"
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request - Validation error
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
// UPDATE product details (e.g., price, description, stock quantity)
exports.updateProduct = async (req, res) => {
  const { productId } = req.params;
  const { syncToWooCommerce = false, ...updateData } = req.body;

  try {
    // Define allowed fields that can be updated
    const allowedFields = [
      'name',
      'description', 
      'short_description',
      'price',
      'sale_price',
      'regular_price',
      'date_on_sale_from',
      'date_on_sale_to',
      'on_sale',
      'purchasable',
      'total_sales',
      'status',
      'featured',
      'catalog_visibility',
      'manage_stock',
      'stock_quantity',
      'stock_status',
      'backorders',
      'backorders_allowed',
      'weight',
      'dimensions',
      'shipping_required',
      'shipping_taxable',
      'shipping_class',
      'shipping_class_id',
      'categories',
      'tags',
      'images',
      'average_rating',
      'rating_count',
      'reviews_allowed',
      'permalink',
      'slug',
      'type',
      'external_url',
      'button_text',
      'upsell_ids',
      'cross_sell_ids',
      'related_ids',
      'purchase_note',
      'sold_individually',
      'grouped_products',
      'menu_order',
      'wooCommerceId',
      'lastWooCommerceSync',
      'syncStatus',
      'syncError'
    ];

    // Sanitize update data - only allow specified fields
    const sanitizedData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        sanitizedData[field] = updateData[field];
      }
    });

    // Validate and process specific fields
    if (sanitizedData.price !== undefined) {
      sanitizedData.price = sanitizedData.price ? Number(sanitizedData.price) : null;
    }
    
    if (sanitizedData.sale_price !== undefined) {
      sanitizedData.sale_price = sanitizedData.sale_price ? Number(sanitizedData.sale_price) : null;
    }
    
    if (sanitizedData.regular_price !== undefined) {
      sanitizedData.regular_price = sanitizedData.regular_price ? Number(sanitizedData.regular_price) : null;
    }
    
    if (sanitizedData.stock_quantity !== undefined) {
      sanitizedData.stock_quantity = sanitizedData.stock_quantity ? Number(sanitizedData.stock_quantity) : null;
    }
    
    if (sanitizedData.rating_count !== undefined) {
      sanitizedData.rating_count = sanitizedData.rating_count ? Number(sanitizedData.rating_count) : 0;
    }
    
    if (sanitizedData.average_rating !== undefined) {
      sanitizedData.average_rating = sanitizedData.average_rating ? sanitizedData.average_rating.toString() : "0.00";
    }
    
    if (sanitizedData.featured !== undefined) {
      sanitizedData.featured = Boolean(sanitizedData.featured);
    }
    
    if (sanitizedData.manage_stock !== undefined) {
      sanitizedData.manage_stock = Boolean(sanitizedData.manage_stock);
    }
    
    if (sanitizedData.shipping_required !== undefined) {
      sanitizedData.shipping_required = Boolean(sanitizedData.shipping_required);
    }
    
    if (sanitizedData.sold_individually !== undefined) {
      sanitizedData.sold_individually = Boolean(sanitizedData.sold_individually);
    }
    
    if (sanitizedData.shipping_class_id !== undefined) {
      sanitizedData.shipping_class_id = sanitizedData.shipping_class_id ? Number(sanitizedData.shipping_class_id) : null;
    }
    
    if (sanitizedData.menu_order !== undefined) {
      sanitizedData.menu_order = sanitizedData.menu_order ? Number(sanitizedData.menu_order) : 0;
    }
    
    // Validate dimensions structure if provided
    if (sanitizedData.dimensions) {
      if (typeof sanitizedData.dimensions === 'object') {
        sanitizedData.dimensions = {
          length: sanitizedData.dimensions.length || null,
          width: sanitizedData.dimensions.width || null,
          height: sanitizedData.dimensions.height || null
        };
      } else {
        // If dimensions is not an object, remove it
        delete sanitizedData.dimensions;
      }
    }

    // Validate and process date fields
    if (sanitizedData.date_on_sale_from !== undefined) {
      sanitizedData.date_on_sale_from = sanitizedData.date_on_sale_from ? new Date(sanitizedData.date_on_sale_from) : null;
    }
    
    if (sanitizedData.date_on_sale_to !== undefined) {
      sanitizedData.date_on_sale_to = sanitizedData.date_on_sale_to ? new Date(sanitizedData.date_on_sale_to) : null;
    }

    // Validate and process boolean fields
    if (sanitizedData.on_sale !== undefined) {
      sanitizedData.on_sale = Boolean(sanitizedData.on_sale);
    }
    
    if (sanitizedData.purchasable !== undefined) {
      sanitizedData.purchasable = Boolean(sanitizedData.purchasable);
    }
    
    if (sanitizedData.backorders_allowed !== undefined) {
      sanitizedData.backorders_allowed = Boolean(sanitizedData.backorders_allowed);
    }
    
    if (sanitizedData.shipping_taxable !== undefined) {
      sanitizedData.shipping_taxable = Boolean(sanitizedData.shipping_taxable);
    }
    
    if (sanitizedData.reviews_allowed !== undefined) {
      sanitizedData.reviews_allowed = Boolean(sanitizedData.reviews_allowed);
    }

    // Validate and process string fields with defaults
    if (sanitizedData.total_sales !== undefined) {
      sanitizedData.total_sales = sanitizedData.total_sales ? Number(sanitizedData.total_sales) : 0;
    }
    
    if (sanitizedData.catalog_visibility !== undefined) {
      sanitizedData.catalog_visibility = sanitizedData.catalog_visibility || "visible";
    }
    
    if (sanitizedData.stock_status !== undefined) {
      sanitizedData.stock_status = sanitizedData.stock_status || "instock";
    }
    
    if (sanitizedData.backorders !== undefined) {
      sanitizedData.backorders = sanitizedData.backorders || "no";
    }

    // Process categories if provided
    if (sanitizedData.categories) {
      sanitizedData.categories = sanitizedData.categories.map(cat => ({
        id: Number(cat.id) || 0,
        name: cat.name || '',
        slug: cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-') || ''
      }));
      
      // Validate required fields for categories
      const invalidCategories = sanitizedData.categories.filter(cat => !cat.id || !cat.name || !cat.slug);
      if (invalidCategories.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid category data. All categories must have id, name, and slug."
        });
      }
    }

    // Process images if provided
    if (sanitizedData.images) {
      const now = new Date();
      sanitizedData.images = sanitizedData.images.map(img => ({
        id: Number(img.id) || 0,
        date_created: img.date_created || now,
        src: img.src || '',
        alt: img.alt || ''
      }));
      
      // Validate required fields for images
      const invalidImages = sanitizedData.images.filter(img => !img.id || !img.src);
      if (invalidImages.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid image data. All images must have id and src."
        });
      }
    }

    // Handle image uploads if files are provided
    if (req.files && req.files.images) {
      const now = new Date();
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      const uploadedImages = [];
      
      for (const file of imageFiles) {
        try {
          // Upload the image to Cloudinary
          const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: 'product_images',
          });

          uploadedImages.push({
            src: result.secure_url,
            alt: file.name || ''
          });
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          // Don't fail the entire update if image upload fails
          console.warn(`⚠️ Image upload failed for ${file.name}, continuing with update`);
          // Continue with other images
        }
      }
      
      // Replace or append images based on update strategy
      if (sanitizedData.images) {
        sanitizedData.images = [...sanitizedData.images, ...uploadedImages];
      } else {
        sanitizedData.images = uploadedImages;
      }
      
      // If no images were successfully uploaded and images were requested, log a warning
      if (uploadedImages.length === 0 && req.files && req.files.images) {
        console.warn('⚠️ No images were successfully uploaded, but images were provided');
      }
    }

    // Process tags if provided
    if (sanitizedData.tags) {
      sanitizedData.tags = sanitizedData.tags.map(tag => ({
        name: tag.name || ''
      }));
    }

    // Add timestamp
    sanitizedData.date_modified = new Date();

    // Check if product exists first
    const existingProduct = await Inventory.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    // Verify user belongs to the same organization as the product
    if (existingProduct.organizationId.toString() !== req.user.organization.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only update products from your organization" 
      });
    }

    let wooCommerceSync = null;

    // If sync to WooCommerce is requested
    if (syncToWooCommerce && existingProduct.storeId) {
      try {
        // Get store information
        const store = await Store.findById(existingProduct.storeId);
        if (!store) {
          return res.status(404).json({ 
            success: false, 
            message: "Store not found for WooCommerce sync" 
          });
        }

        // Prepare product data for WooCommerce (merge existing data with updates)
        const productData = {
          ...existingProduct.toObject(),
          ...sanitizedData
        };

        let wooCommerceResult;

        // If product already exists in WooCommerce, update it
        if (existingProduct.wooCommerceId) {
          wooCommerceResult = await updateWooCommerceProduct(store, existingProduct.wooCommerceId, productData);
        } else {
          // If product doesn't exist in WooCommerce, create it
          wooCommerceResult = await createProductInWooCommerce(store, productData);
        }
        
        if (wooCommerceResult.success) {
          // Update the WooCommerce ID if it's a new product
          if (!existingProduct.wooCommerceId && wooCommerceResult.data.id) {
            sanitizedData.wooCommerceId = wooCommerceResult.data.id;
          }
          
          sanitizedData.lastWooCommerceSync = new Date();
          sanitizedData.syncStatus = 'synced';
          sanitizedData.syncError = null;
          
          wooCommerceSync = {
            synced: true,
            wooCommerceId: sanitizedData.wooCommerceId || existingProduct.wooCommerceId,
            status: 'synced',
            error: null
          };
        } else {
          sanitizedData.syncStatus = 'failed';
          sanitizedData.syncError = wooCommerceResult.error?.message || 'WooCommerce sync failed';
          
          wooCommerceSync = {
            synced: false,
            wooCommerceId: existingProduct.wooCommerceId,
            status: 'failed',
            error: sanitizedData.syncError
          };
          
          console.error('WooCommerce sync error:', wooCommerceResult.error);
        }
      } catch (wooCommerceError) {
        sanitizedData.syncStatus = 'failed';
        sanitizedData.syncError = wooCommerceError.message;
        
        wooCommerceSync = {
          synced: false,
          wooCommerceId: existingProduct.wooCommerceId,
          status: 'failed',
          error: wooCommerceError.message
        };
        
        console.error('WooCommerce sync error:', wooCommerceError);
      }
    }

    const updatedProduct = await Inventory.findByIdAndUpdate(
      productId,
      { $set: sanitizedData },
      { new: true, runValidators: true } // return the updated product and run validators
    );

    // ✅ AUDIT LOG: Product Updated
    await createAuditLog({
      action: 'Product Updated',
      user: req.user?._id || existingProduct.userId,
      resource: 'product',
      resourceId: updatedProduct._id,
      details: {
        productName: updatedProduct.name,
        sku: updatedProduct.sku,
        updatedFields: Object.keys(sanitizedData),
        syncToWooCommerce,
        syncStatus: sanitizedData.syncStatus,
        wooCommerceId: sanitizedData.wooCommerceId || existingProduct.wooCommerceId,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization || existingProduct.organizationId,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Log the event
    await createAuditLog({
      action: 'update_inventory_product',
      user: req.user?._id || existingProduct.userId,
      resource: 'Inventory',
      resourceId: updatedProduct._id,
      details: { 
        name: updatedProduct.name, 
        sku: updatedProduct.sku,
        syncToWooCommerce,
        syncStatus: sanitizedData.syncStatus,
        wooCommerceId: sanitizedData.wooCommerceId || existingProduct.wooCommerceId
      },
      organization: req.user?.organization || existingProduct.organizationId
    });

    // Check for inventory alerts
    try {
      const currentQuantity = updatedProduct.stock_quantity || 0;
      const threshold = 10; // Low inventory threshold
      
      if (currentQuantity === 0) {
        await notifyOutOfStock(updatedProduct, existingProduct.organizationId);
      } else if (currentQuantity <= threshold) {
        await notifyLowInventory(updatedProduct, currentQuantity, threshold, existingProduct.organizationId);
      }
    } catch (notificationError) {
      console.error('Error sending inventory notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({ 
      success: true, 
      product: updatedProduct,
      wooCommerceSync
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update product",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/inventory/{productId}:
 *   delete:
 *     summary: Delete a product from the inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *               syncToWooCommerce:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to also delete product from WooCommerce
 *                 example: true
 *     responses:
 *       200:
 *         description: Product deleted successfully
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
 *                   example: "Product deleted successfully"
 *                 wooCommerceSync:
 *                   type: object
 *                   description: WooCommerce synchronization result
 *                   properties:
 *                     synced:
 *                       type: boolean
 *                       description: Whether WooCommerce sync was successful
 *                     wooCommerceId:
 *                       type: number
 *                       description: WooCommerce product ID
 *                     status:
 *                       type: string
 *                       enum: [deleted, failed, skipped]
 *                       description: WooCommerce sync status
 *                     error:
 *                       type: string
 *                       description: Error message if sync failed
 *       400:
 *         description: Bad request - Product ID required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Product ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User can only delete products from their organization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You can only delete products from your organization"
 *       404:
 *         description: Product or store not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
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
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to delete product"
 */
// DELETE a product from the inventory
exports.deleteProduct = async (req, res) => {
  const { productId } = req.params;
  const { syncToWooCommerce = false } = req.body;
  const userId = req.user._id;

  try {
    // Validate product ID
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    // Get the product before deletion for audit logging
    const productToDelete = await Inventory.findById(productId);
    if (!productToDelete) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Verify user belongs to the same organization as the product
    if (productToDelete.organizationId.toString() !== req.user.organization.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only delete products from your organization" 
      });
    }

    let wooCommerceSync = null;

    // If sync to WooCommerce is requested and product exists in WooCommerce
    if (syncToWooCommerce && productToDelete.wooCommerceId && productToDelete.storeId) {
      try {
        // Get store information
        const store = await Store.findById(productToDelete.storeId);
        if (!store) {
          return res.status(404).json({ 
            success: false, 
            message: "Store not found for WooCommerce sync" 
          });
        }

        // Import and use WooCommerce delete helper
        const { deleteProductInWooCommerce } = require('../helper/wooCommerceDeleteHelper');
        
        // Prepare product data for the helper
        const productDataForSync = {
          _id: productToDelete._id,
          userId: userId,
          organizationId: productToDelete.organizationId
        };

        // Delete product from WooCommerce
        const wooCommerceResult = await deleteProductInWooCommerce(
          store, 
          productToDelete.wooCommerceId, 
          productDataForSync
        );
        
        if (wooCommerceResult.success) {
          wooCommerceSync = {
            synced: true,
            wooCommerceId: productToDelete.wooCommerceId,
            status: 'deleted',
            error: null
          };
          console.log(`✅ WooCommerce product deleted: ${productToDelete.name} (ID: ${productToDelete.wooCommerceId})`);
        } else {
          wooCommerceSync = {
            synced: false,
            wooCommerceId: productToDelete.wooCommerceId,
            status: 'failed',
            error: wooCommerceResult.error?.message || 'WooCommerce delete failed'
          };
          console.error('WooCommerce delete error:', wooCommerceResult.error);
        }
      } catch (wooCommerceError) {
        wooCommerceSync = {
          synced: false,
          wooCommerceId: productToDelete.wooCommerceId,
          status: 'failed',
          error: wooCommerceError.message
        };
        console.error('WooCommerce delete error:', wooCommerceError);
      }
    } else if (syncToWooCommerce && !productToDelete.wooCommerceId) {
      console.log(`⚠️ Product ${productToDelete.name} has no WooCommerce ID, skipping WooCommerce deletion`);
      wooCommerceSync = {
        synced: false,
        wooCommerceId: null,
        status: 'skipped',
        error: 'Product not synced to WooCommerce'
      };
    }

    // Log the product deletion
    await createAuditLog({
      action: 'delete_product',
      user: userId,
      resource: 'Product',
      resourceId: productId,
      details: {
        productName: productToDelete.name,
        sku: productToDelete.sku,
        price: productToDelete.price,
        storeId: productToDelete.storeId,
        organizationId: productToDelete.organizationId,
        wooCommerceSync: wooCommerceSync
      },
      organization: req.user.organization
    });

    // Delete from local database
    const deletedProduct = await Inventory.findByIdAndDelete(productId);
    
    res.status(200).json({ 
      success: true, 
      message: "Product deleted successfully",
      wooCommerceSync
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete product",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/inventory/store/{storeId}:
 *   delete:
 *     summary: Delete all products for a specific store
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Store ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: All products deleted successfully
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
 *                   example: "All products deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: No products found for this store
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No products found for this store"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to delete products"
 */
// DELETE all products for a specific store
exports.deleteAllProductsByStore = async (req, res) => {
  const { storeId } = req.params;
  try {
    // Get products before deletion for audit logging
    const productsToDelete = await Inventory.find({ storeId });
    if (productsToDelete.length === 0) {
      return res.status(404).json({ success: false, message: "No products found for this store" });
    }

    // ✅ AUDIT LOG: All Products Deleted for Store
    await createAuditLog({
      action: 'All Products Deleted for Store',
      user: req.user?._id,
      resource: 'product',
      resourceId: storeId,
      details: {
        storeId: storeId,
        numberOfProducts: productsToDelete.length,
        productNames: productsToDelete.map(p => p.name),
        organizationId: productsToDelete[0]?.organizationId,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization || productsToDelete[0]?.organizationId,
      severity: 'critical', // Bulk deletion is very critical
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    const result = await Inventory.deleteMany({ storeId });
    res.status(200).json({ success: true, message: "All products deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete products" });
  }
};


/**
 * @swagger
 * /api/inventory/metrics/total-products/{organizationId}:
 *   get:
 *     summary: Get total products count for an organization
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Total products count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   description: Total number of products
 *                   example: 150
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get total products"
 */
// Get total products count for organization
exports.getTotalProducts = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const count = await Inventory.countDocuments({ organizationId });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get total products" });
  }
};

/**
 * @swagger
 * /api/inventory/metrics/in-stock/{organizationId}:
 *   get:
 *     summary: Get in-stock items count for an organization
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: In-stock items count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   description: Number of in-stock items
 *                   example: 120
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get in-stock items"
 */
// Get in-stock items count for organization
exports.getInStockItems = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const count = await Inventory.countDocuments({ 
      organizationId,
      stock_status: "instock" 
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get in-stock items" });
  }
};

/**
 * @swagger
 * /api/inventory/metrics/low-stock/{organizationId}:
 *   get:
 *     summary: Get low-stock items count for an organization
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Low-stock items count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   description: Number of low-stock items
 *                   example: 15
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get low-stock items"
 */
// Get low-stock items count for organization
exports.getLowStockItems = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const count = await Inventory.countDocuments({ 
      organizationId,
      stock_status: "low-stock" 
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get low-stock items" });
  }
};

/**
 * @swagger
 * /api/inventory/metrics/out-of-stock/{organizationId}:
 *   get:
 *     summary: Get out-of-stock items count for an organization
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Out-of-stock items count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   description: Number of out-of-stock items
 *                   example: 8
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get out-of-stock items"
 */
// Get out-of-stock items count for organization
exports.getOutOfStockItems = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const count = await Inventory.countDocuments({ 
      organizationId,
      stock_status: "outofstock" 
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get out-of-stock items" });
  }
};

/**
 * @swagger
 * /api/inventory/metrics/category-count/{organizationId}:
 *   get:
 *     summary: Get unique category count for an organization
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Category count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   description: Number of unique categories
 *                   example: 25
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get category count"
 */
// Get category count for organization
exports.getCategoryCount = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const products = await Inventory.find({ organizationId }, { categories: 1 });
    const uniqueCategories = [...new Set(products.flatMap(p => p.categories?.map(c => c.name)))];
    res.status(200).json({ success: true, count: uniqueCategories.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get category count" });
  }
};

/**
 * @swagger
 * /api/inventory/metrics/store-count/{organizationId}:
 *   get:
 *     summary: Get unique store count for an organization
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Store count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   description: Number of unique stores
 *                   example: 5
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get store count"
 */
// Get store count for organization (unchanged)
exports.getStoreCount = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const stores = await Inventory.distinct("storeId", { organizationId });
    res.status(200).json({ success: true, count: stores.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get store count" });
  }
};

/**
 * @swagger
 * /api/inventory/metrics/total-value/{organizationId}:
 *   get:
 *     summary: Get total inventory value for an organization
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Total inventory value retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalValue:
 *                   type: number
 *                   description: Total inventory value (price * stock quantity)
 *                   example: 15499.50
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get total inventory value"
 */
// Get total inventory value for organization
exports.getTotalInventoryValue = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const products = await Inventory.find({ organizationId }, { price: 1, stock_quantity: 1 });
    const totalValue = products.reduce((sum, product) => {
      const price = parseFloat(product.price) || 0;
      const stock = parseInt(product.stock_quantity) || 0;
      return sum + (price * stock);
    }, 0);
    
    res.status(200).json({ success: true, totalValue });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get total inventory value" });
  }
};

/**
 * @swagger
 * /api/inventory/metrics/avg-price/{organizationId}:
 *   get:
 *     summary: Get average product price for an organization
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Average price retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 avgPrice:
 *                   type: number
 *                   description: Average product price
 *                   example: 29.99
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get average price"
 */
// Get average product price for organization
exports.getAveragePrice = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const products = await Inventory.find({ organizationId }, { price: 1 });
    const totalProducts = products.length;
    const avgPrice = totalProducts > 0 
      ? products.reduce((sum, product) => sum + (parseFloat(product.price) || 0), 0) / totalProducts 
      : 0;
    
    res.status(200).json({ success: true, avgPrice });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get average price" });
  }
};

/**
 * @swagger
 * /api/inventory/metrics/on-sale/{organizationId}:
 *   get:
 *     summary: Get on-sale products count for an organization
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: On-sale products count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   description: Number of on-sale products
 *                   example: 12
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get on-sale products"
 */
// Get on-sale products count for organization
exports.getOnSaleCount = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const count = await Inventory.countDocuments({ 
      organizationId,
      on_sale: true 
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get on-sale products" });
  }
};

/**
 * @swagger
 * /api/inventory/metrics/avg-rating/{organizationId}:
 *   get:
 *     summary: Get average product rating for an organization
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Average rating retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 avgRating:
 *                   type: number
 *                   description: Average product rating
 *                   example: 4.2
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to get average rating"
 */
// Get average product rating for organization
exports.getAverageRating = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const products = await Inventory.find({ 
      organizationId,
      average_rating: { $gt: 0 } 
    }, { average_rating: 1 });
    
    const avgRating = products.length > 0
      ? products.reduce((sum, p) => sum + parseFloat(p.average_rating || "0"), 0) / products.length
      : 0;
    
    res.status(200).json({ success: true, avgRating });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get average rating" });
  }
};

/**
 * @swagger
 * /api/inventory/woocommerce/retry-sync/{productId}:
 *   post:
 *     summary: Retry WooCommerce sync for a failed product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Product ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Product sync retry successful
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
 *                   example: "Product created in WooCommerce successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *                 wooCommerceSync:
 *                   type: object
 *                   description: WooCommerce sync status
 *       400:
 *         description: Product is not in failed sync status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Product is not in failed sync status"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Product not found"
 *       500:
 *         description: WooCommerce sync retry failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error retrying product WooCommerce sync"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
// RETRY SYNC: Retry WooCommerce sync for failed products
exports.retryProductWooCommerceSync = async (req, res) => {
  const { productId } = req.params;
  
  try {
    const product = await Inventory.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.syncStatus !== 'failed') {
      return res.status(400).json({ 
        success: false, 
        message: "Product is not in failed sync status" 
      });
    }

    // Call the sync function
    return await exports.syncProductToWooCommerce(req, res);
  } catch (error) {
    console.error('Error retrying product WooCommerce sync:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error retrying product WooCommerce sync",
      error: error.message 
    });
  }
};

// MANUAL SYNC: Sync a product to WooCommerce
exports.syncProductToWooCommerce = async (req, res) => {
  const { productId } = req.params;
  
  try {
    const product = await Inventory.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (!product.storeId) {
      return res.status(400).json({ 
        success: false, 
        message: "Product is not associated with a store" 
      });
    }

    // Get store information
    const store = await Store.findById(product.storeId);
    if (!store) {
      return res.status(404).json({ 
        success: false, 
        message: "Store not found" 
      });
    }

    let wooCommerceResult;
    let syncAction = '';

    // Prepare product data for WooCommerce
    const productData = product.toObject();

    // If product already exists in WooCommerce, update it
    if (product.wooCommerceId) {
      wooCommerceResult = await updateWooCommerceProduct(store, existingProduct.wooCommerceId, productData);
      syncAction = 'updated';
    } else {
      // If product doesn't exist in WooCommerce, create it
      wooCommerceResult = await createProductInWooCommerce(store, productData);
      syncAction = 'created';
    }

    if (wooCommerceResult.success) {
      // Update local record with WooCommerce sync results
      const updateData = {
        product_Id: wooCommerceResult.data.id,
        wooCommerceId: wooCommerceResult.data.id,
        lastWooCommerceSync: new Date(),
        syncStatus: 'synced',
        syncError: null
      };

      const updatedProduct = await Inventory.findByIdAndUpdate(
        productId, 
        updateData, 
        { new: true }
      );

      // Log the event
      await createAuditLog({
        action: 'sync_product_to_woocommerce',
        user: req.user?._id || product.userId,
        resource: 'Inventory',
        resourceId: product._id,
        details: { 
          name: product.name, 
          action: syncAction,
          wooCommerceId: wooCommerceResult.data.id 
        },
        organization: req.user?.organization || product.organizationId
      });

      res.json({ 
        success: true, 
        message: `Product ${syncAction} in WooCommerce successfully`,
        data: updatedProduct,
        wooCommerceSync: {
          synced: true,
          action: syncAction,
          wooCommerceId: wooCommerceResult.data.id,
          status: 'synced',
          error: null
        }
      });
    } else {
      // Update local record with sync failure
      await Inventory.findByIdAndUpdate(productId, {
        syncStatus: 'failed',
        syncError: wooCommerceResult.error?.message || 'WooCommerce sync failed'
      });

      res.status(500).json({ 
        success: false, 
        message: "Failed to sync product to WooCommerce",
        wooCommerceSync: {
          synced: false,
          action: syncAction,
          wooCommerceId: null,
          status: 'failed',
          error: wooCommerceResult.error?.message || 'WooCommerce sync failed'
        }
      });
    }
  } catch (error) {
    console.error('Error syncing product to WooCommerce:', error);
    
    // Update local record with sync failure
    await Inventory.findByIdAndUpdate(productId, {
      syncStatus: 'failed',
      syncError: error.message
    });

    res.status(500).json({ 
      success: false, 
      message: "Error syncing product to WooCommerce",
      error: error.message 
    });
  }
};