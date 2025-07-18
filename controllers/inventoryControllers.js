const Inventory = require('../models/inventory');
const Store = require('../models/store');
const Organization = require('../models/organization');
const mongoose = require('mongoose');
const { Worker } = require('worker_threads');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const logEvent = require('../helper/logEvent');
const { createWooCommerceProduct } = require('../helper/wooCommerceCreateHelper');
const { updateWooCommerceProduct } = require('../helper/wooCommerceUpdateHelper');

//const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;



// Synchronize products with WooCommerce API
exports.syncProducts = async (req, res) => {
  try {
    const { storeId, organizationId } = req.params;
    const { userId } = req.body;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const organization = await Organization.findById(organizationId);
    if (!organization) return res.status(404).json({ error: 'Organization not found' });

    const worker = new Worker(path.resolve(__dirname, '../helper/syncProductWorker.js'), {
      workerData: { storeId, store, organizationId, userId },
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
  
// CREATE a new product in the inventory
exports.createProduct = async (req, res) => {
  try {
    const {
      product_Id,  // Required - WooCommerce Product ID
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
      manage_stock,
      stock_quantity,
      stock_status,
      backorders,
      backorders_allowed,
      weight,
      dimensions,
      shipping_required,
      shipping_taxable,
      shipping_class,
      shipping_class_id,
      categories,
      tags,
      images,
      average_rating,
      rating_count,
      reviews_allowed,
      permalink,   // Required
      slug,        // Required
      type,        // Required
      external_url,
      button_text,
      upsell_ids,
      cross_sell_ids,
      related_ids,
      purchase_note,
      sold_individually,
      grouped_products,
      menu_order,
      storeId,     // Required
      userId,      // Required
      organizationId, // Required
      syncToWooCommerce = false, // NEW: Option to sync to WooCommerce
    } = req.body;

    // Validate required fields
    const requiredFields = ['sku', 'name', 'status', 'permalink', 'slug', 'type', 'storeId', 'userId', 'organizationId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate data types and convert if necessary
    const now = new Date();
    
    // Convert average_rating to string if provided
    const processedAverageRating = average_rating ? average_rating.toString() : "0.00";
    
    // Validate and process categories
    const processedCategories = categories ? categories.map(cat => ({
      id: Number(cat.id) || 0,
      name: cat.name || '',
      slug: cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-') || ''
    })) : [];

    // Handle image uploads if files are provided
    let processedImages = [];
    
    if (req.files && req.files.images) {
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      
      for (const file of imageFiles) {
        try {
          // Upload the image to Cloudinary
          const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: 'product_images',
          });

          processedImages.push({
            id: 0, // Will be assigned by WooCommerce if synced
            date_created: now,
            src: result.secure_url,
            alt: file.name || ''
          });
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload image to Cloudinary',
            error: uploadError.message
          });
        }
      }
    } else if (images) {
      // If images are provided as URLs (from WooCommerce sync)
      processedImages = images.map(img => ({
        id: Number(img.id) || 0,
        date_created: img.date_created || now,
        src: img.src || '',
        alt: img.alt || ''
      }));
    }

    // Validate and process tags
    const processedTags = tags ? tags.map(tag => ({
      name: tag.name || ''
    })) : [];

    // Validate numeric fields
    const processedPrice = price ? Number(price) : null;
    const processedSalePrice = sale_price ? Number(sale_price) : null;
    const processedRegularPrice = regular_price ? Number(regular_price) : null;
    const processedStockQuantity = stock_quantity ? Number(stock_quantity) : null;
    const processedRatingCount = rating_count ? Number(rating_count) : 0;

    let wooCommerceId = product_Id ? Number(product_Id) : null;
    let syncStatus = 'pending';
    let syncError = null;

    // If sync to WooCommerce is requested
    if (syncToWooCommerce && storeId) {
      try {
        // Get store information
        const store = await Store.findById(storeId);
        if (!store) {
          return res.status(404).json({ 
            success: false, 
            message: "Store not found for WooCommerce sync" 
          });
        }

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
          dimensions,
          categories: processedCategories,
          tags: processedTags,
          images: processedImages,
          featured: Boolean(featured),
          catalog_visibility: catalog_visibility || "visible",
          storeId,
          organizationId
        };

        // Create product in WooCommerce
        const wooCommerceResult = await createWooCommerceProduct(store, productData);
        
        if (wooCommerceResult.success) {
          wooCommerceId = wooCommerceResult.data.id;
          syncStatus = 'synced';
        } else {
          syncStatus = 'failed';
          syncError = wooCommerceResult.error?.message || 'WooCommerce sync failed';
          console.error('WooCommerce sync error:', wooCommerceResult.error);
        }
      } catch (wooCommerceError) {
        syncStatus = 'failed';
        syncError = wooCommerceError.message;
        console.error('WooCommerce sync error:', wooCommerceError);
      }
    }

    const newProduct = new Inventory({
      product_Id: wooCommerceId,
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
      dimensions: dimensions || {
        length: null,
        width: null,
        height: null
      },
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
      permalink,
      slug,
      type,
      external_url: external_url || "",
      button_text: button_text || "",
      upsell_ids: upsell_ids || [],
      cross_sell_ids: cross_sell_ids || [],
      related_ids: related_ids || [],
      purchase_note: purchase_note || "",
      sold_individually: Boolean(sold_individually),
      grouped_products: grouped_products || [],
      menu_order: menu_order ? Number(menu_order) : 0,
      date_created: now,
      date_modified: now,
      storeId,
      userId,
      organizationId,
      lastWooCommerceSync: syncStatus === 'synced' ? new Date() : null,
      syncStatus,
      syncError,
    });

    const savedProduct = await newProduct.save();

    // Log the event
    await logEvent({
      action: 'create_inventory_product',
      user: userId,
      resource: 'Inventory',
      resourceId: savedProduct._id,
      details: { 
        name: savedProduct.name, 
        sku: savedProduct.sku,
        syncToWooCommerce,
        syncStatus,
        wooCommerceId 
      },
      organization: organizationId
    });

    res.status(201).json({ 
      success: true, 
      product: savedProduct,
      wooCommerceSync: {
        synced: syncStatus === 'synced',
        wooCommerceId,
        status: syncStatus,
        error: syncError
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create product",
      error: error.message 
    });
  }
};

// GET all products for a specific organization
exports.getAllProductsByOrganization = async (req, res) => {
  const { organizationId } = req.params;
  try {
    const products = await Inventory.find({ organizationId })
      .populate("storeId userId organizationId", "name") // Populate relevant fields
      .exec();
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve products" });
  }
};

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

// GET all products in the system
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Inventory.find()
      .populate("storeId userId organizationId", "name") // Populate relevant fields
      .exec();
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve products" });
  }
};

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
      'menu_order'
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
            id: 0, // Will be assigned by WooCommerce if synced
            date_created: now,
            src: result.secure_url,
            alt: file.name || ''
          });
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload image to Cloudinary',
            error: uploadError.message
          });
        }
      }
      
      // Replace or append images based on update strategy
      if (sanitizedData.images) {
        sanitizedData.images = [...sanitizedData.images, ...uploadedImages];
      } else {
        sanitizedData.images = uploadedImages;
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
        if (existingProduct.product_Id) {
          wooCommerceResult = await updateWooCommerceProduct(store, existingProduct.product_Id, productData);
        } else {
          // If product doesn't exist in WooCommerce, create it
          wooCommerceResult = await createWooCommerceProduct(store, productData);
        }
        
        if (wooCommerceResult.success) {
          // Update the WooCommerce ID if it's a new product
          if (!existingProduct.product_Id && wooCommerceResult.data.id) {
            sanitizedData.product_Id = wooCommerceResult.data.id;
          }
          
          sanitizedData.lastWooCommerceSync = new Date();
          sanitizedData.syncStatus = 'synced';
          sanitizedData.syncError = null;
          
          wooCommerceSync = {
            synced: true,
            wooCommerceId: sanitizedData.product_Id || existingProduct.product_Id,
            status: 'synced',
            error: null
          };
        } else {
          sanitizedData.syncStatus = 'failed';
          sanitizedData.syncError = wooCommerceResult.error?.message || 'WooCommerce sync failed';
          
          wooCommerceSync = {
            synced: false,
            wooCommerceId: existingProduct.product_Id,
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
          wooCommerceId: existingProduct.product_Id,
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

    // Log the event
    await logEvent({
      action: 'update_inventory_product',
      user: req.user?._id || existingProduct.userId,
      resource: 'Inventory',
      resourceId: updatedProduct._id,
      details: { 
        name: updatedProduct.name, 
        sku: updatedProduct.sku,
        syncToWooCommerce,
        syncStatus: sanitizedData.syncStatus,
        wooCommerceId: sanitizedData.product_Id || existingProduct.product_Id
      },
      organization: req.user?.organization || existingProduct.organizationId
    });

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

// DELETE a product from the inventory
exports.deleteProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    const deletedProduct = await Inventory.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
};

// DELETE all products for a specific store
exports.deleteAllProductsByStore = async (req, res) => {
  const { storeId } = req.params;
  try {
    const result = await Inventory.deleteMany({ storeId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "No products found for this store" });
    }
    res.status(200).json({ success: true, message: "All products deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete products" });
  }
};


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