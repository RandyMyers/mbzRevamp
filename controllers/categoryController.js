/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Product category management
 *
 * /api/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, storeId, organizationId]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               image: { type: object }
 *               parent: { type: string }
 *               storeId: { type: string }
 *               organizationId: { type: string }
 *               menuOrder: { type: integer, default: 0 }
 *               syncToWooCommerce: { type: boolean, default: false }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 *       404: { description: Store or parent not found }
 *       500: { description: Server error }
 *   get:
 *     tags: [Categories]
 *     summary: Get categories (paginated)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: storeId
 *         schema: { type: string }
 *       - in: query
 *         name: organizationId
 *         schema: { type: string }
 *       - in: query
 *         name: parent
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean, default: true }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: name }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *     responses:
 *       200: { description: Categories list }
 *       500: { description: Server error }
 *
 * /api/categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Category }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *   put:
 *     tags: [Categories]
 *     summary: Update a category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       400: { description: Has dependencies }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *
 * /api/categories/store/{storeId}:
 *   get:
 *     tags: [Categories]
 *     summary: Get categories by store
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: tree
 *         schema: { type: boolean, default: false }
 *     responses:
 *       200: { description: Categories list }
 *       500: { description: Server error }
 *
 * /api/categories/sync/{storeId}:
 *   post:
 *     tags: [Categories]
 *     summary: Sync categories with WooCommerce
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string }
 *               organizationId: { type: string }
 *     responses:
 *       200: { description: Sync result }
 *       404: { description: Store not found }
 *       500: { description: Server error }
 */
const Category = require('../models/Category');
const Store = require('../models/store');
const logEvent = require('../helper/logEvent');

/**
 * Create a new category
 */
exports.createCategory = async (req, res) => {
  try {
    console.log('🚀 CREATE CATEGORY - Starting category creation process');
    console.log('📋 Request body:', req.body);

    const {
      name,
      description,
      image,
      parent,
      storeId,
      organizationId,
      menuOrder = 0,
      syncToWooCommerce = false
    } = req.body;

    // Validate required fields
    if (!name || !storeId || !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Name, storeId, and organizationId are required'
      });
    }

    // Check if store exists
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if parent category exists (if provided)
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug, storeId });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists'
      });
    }

    // Create category data
    const categoryData = {
      name,
      slug,
      description: description || '',
      image: image || {},
      parent: parent || null,
      storeId,
      organizationId,
      menuOrder,
      syncStatus: syncToWooCommerce ? 'pending' : 'synced'
    };

    console.log('💾 Creating category in database...');
    const category = new Category(categoryData);
    await category.save();

    console.log('✅ Category created successfully:', category._id);

    // Sync to WooCommerce if requested
    if (syncToWooCommerce) {
      console.log('🔄 Starting WooCommerce sync...');
      try {
        const { createCategoryInWooCommerce } = require('../helper/wooCommerceCategoryHelper');
        const syncResult = await createCategoryInWooCommerce(category, storeId, req.user.id, organizationId);
        
        if (syncResult.success) {
          category.wooCommerceId = syncResult.wooCommerceId;
          category.syncStatus = 'synced';
          category.lastSyncedAt = new Date();
          await category.save();
          console.log('✅ Category synced to WooCommerce:', syncResult.wooCommerceId);
        } else {
          category.syncStatus = 'failed';
          await category.save();
          console.log('❌ WooCommerce sync failed:', syncResult.error);
        }
      } catch (syncError) {
        console.error('❌ WooCommerce sync error:', syncError);
        category.syncStatus = 'failed';
        await category.save();
      }
    }

    // Log event
    await logEvent({
      action: 'CREATE_CATEGORY',
      user: req.user.id,
      resource: 'Category',
      resourceId: category._id,
      details: {
        categoryName: name,
        storeId,
        syncStatus: category.syncStatus
      },
      organization: organizationId
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });

  } catch (error) {
    console.error('❌ Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

/**
 * Get all categories with pagination and filtering
 */
exports.getCategories = async (req, res) => {
  try {
    console.log('📋 GET CATEGORIES - Fetching categories');
    
    const {
      page = 1,
      limit = 10,
      search,
      storeId,
      organizationId,
      parent,
      isActive = true,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};
    
    if (storeId) query.storeId = storeId;
    if (organizationId) query.organizationId = organizationId;
    if (parent !== undefined) {
      query.parent = parent === 'null' ? null : parent;
    }
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Category.countDocuments(query);

    console.log(`✅ Found ${categories.length} categories out of ${total} total`);

    res.json({
      success: true,
      data: categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

/**
 * Get category by ID
 */
exports.getCategoryById = async (req, res) => {
  try {
    console.log('📋 GET CATEGORY BY ID - Fetching category:', req.params.id);

    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug')
      .populate('storeId', 'name url');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    console.log('✅ Category found:', category.name);

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('❌ Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

/**
 * Update category
 */
exports.updateCategory = async (req, res) => {
  try {
    console.log('🔄 UPDATE CATEGORY - Updating category:', req.params.id);
    console.log('📋 Update data:', req.body);

    const {
      name,
      description,
      image,
      parent,
      menuOrder,
      isActive,
      syncToWooCommerce = false
    } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if parent category exists (if provided)
    if (parent && parent !== category.parent?.toString()) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    // Update fields
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (parent !== undefined) category.parent = parent;
    if (menuOrder !== undefined) category.menuOrder = menuOrder;
    if (isActive !== undefined) category.isActive = isActive;

    // Regenerate slug if name changed
    if (name && name !== category.name) {
      const newSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Check if new slug already exists
      const existingCategory = await Category.findOne({ 
        slug: newSlug, 
        storeId: category.storeId,
        _id: { $ne: category._id }
      });
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'A category with this name already exists'
        });
      }
      
      category.slug = newSlug;
    }

    console.log('💾 Saving updated category...');
    await category.save();

    // Sync to WooCommerce if requested and category has WooCommerce ID
    if (syncToWooCommerce && category.wooCommerceId) {
      console.log('🔄 Starting WooCommerce sync...');
      try {
        const { updateCategoryInWooCommerce } = require('../helper/wooCommerceCategoryHelper');
        const syncResult = await updateCategoryInWooCommerce(category, category.storeId, req.user.id, category.organizationId);
        
        if (syncResult.success) {
          category.syncStatus = 'synced';
          category.lastSyncedAt = new Date();
          await category.save();
          console.log('✅ Category updated in WooCommerce');
        } else {
          category.syncStatus = 'failed';
          await category.save();
          console.log('❌ WooCommerce sync failed:', syncResult.error);
        }
      } catch (syncError) {
        console.error('❌ WooCommerce sync error:', syncError);
        category.syncStatus = 'failed';
        await category.save();
      }
    }

    // Log event
    await logEvent({
      action: 'UPDATE_CATEGORY',
      user: req.user.id,
      resource: 'Category',
      resourceId: category._id,
      details: {
        categoryName: category.name,
        changes: req.body
      },
      organization: category.organizationId
    });

    console.log('✅ Category updated successfully');

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });

  } catch (error) {
    console.error('❌ Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

/**
 * Delete category
 */
exports.deleteCategory = async (req, res) => {
  try {
    console.log('🗑️ DELETE CATEGORY - Deleting category:', req.params.id);

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has children
    const childCategories = await Category.countDocuments({ parent: category._id });
    if (childCategories > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Please delete subcategories first.'
      });
    }

    // Check if category has products
    const Product = require('../models/inventory');
    const productCount = await Product.countDocuments({ 
      categories: { $in: [category._id] },
      isActive: true 
    });
    
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount} products. Please remove products from this category first.`
      });
    }

    // Delete from WooCommerce if synced
    if (category.wooCommerceId) {
      console.log('🔄 Deleting from WooCommerce...');
      try {
        const { deleteCategoryInWooCommerce } = require('../helper/wooCommerceCategoryHelper');
        await deleteCategoryInWooCommerce(category.wooCommerceId, category.storeId, req.user.id, category.organizationId);
        console.log('✅ Category deleted from WooCommerce');
      } catch (syncError) {
        console.error('❌ WooCommerce delete error:', syncError);
        // Continue with local deletion even if WooCommerce fails
      }
    }

    // Delete category
    await Category.findByIdAndDelete(category._id);

    // Log event
    await logEvent({
      action: 'DELETE_CATEGORY',
      user: req.user.id,
      resource: 'Category',
      resourceId: category._id,
      details: {
        categoryName: category.name
      },
      organization: category.organizationId
    });

    console.log('✅ Category deleted successfully');

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

/**
 * Get categories by store
 */
exports.getCategoriesByStore = async (req, res) => {
  try {
    console.log('📋 GET CATEGORIES BY STORE - Store ID:', req.params.storeId);

    const { tree = false } = req.query;

    if (tree === 'true') {
      const categories = await Category.getCategoryTree(req.params.storeId);
      console.log(`✅ Found ${categories.length} root categories`);
      
      res.json({
        success: true,
        data: categories
      });
    } else {
      const categories = await Category.getByStore(req.params.storeId);
      console.log(`✅ Found ${categories.length} categories`);
      
      res.json({
        success: true,
        data: categories
      });
    }

  } catch (error) {
    console.error('❌ Error fetching store categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store categories',
      error: error.message
    });
  }
};

/**
 * Sync categories with WooCommerce
 */
exports.syncCategoriesWithWooCommerce = async (req, res) => {
  try {
    console.log('🔄 SYNC CATEGORIES - Starting WooCommerce sync for store:', req.params.storeId);

    const store = await Store.findById(req.params.storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const { syncCategories } = require('../helper/wooCommerceCategoryHelper');
    const userId = req.body.userId || req.user?.id;
    const organizationId = req.body.organizationId || store.organizationId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required for category sync'
      });
    }
    
    const syncResult = await syncCategories(req.params.storeId, userId, organizationId);

    // Log event
    try {
      await logEvent({
        action: 'SYNC_CATEGORIES',
        user: userId,
        resource: 'Category',
        resourceId: null,
        details: {
          storeId: req.params.storeId,
          syncResult
        },
        organization: organizationId
      });
    } catch (logError) {
      console.error('❌ Error logging sync event:', logError);
      // Continue with the response even if logging fails
    }

    console.log('✅ Category sync completed');

    res.json({
      success: true,
      message: 'Category sync completed',
      data: syncResult
    });

  } catch (error) {
    console.error('❌ Error syncing categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync categories',
      error: error.message
    });
  }
}; 