const {
  initializeWooCommerceAPI,
  handleWooCommerceError,
  validateWooCommerceResponse,
  logWooCommerceSync,
  getStoreById,
  executeWithRateLimit
} = require('./wooCommerceSyncHelper');

/**
 * Create category in WooCommerce store
 * @param {Object} categoryData - Local category data
 * @param {string} storeId - Store ID
 * @param {Object} userId - User performing the operation
 * @param {string} organizationId - Organization ID
 * @returns {Object} Sync result
 */
const createCategoryInWooCommerce = async (categoryData, storeId, userId, organizationId) => {
  try {
    console.log('🚀 Creating category in WooCommerce:', categoryData.name);
    
    // Get store configuration
    const store = await getStoreById(storeId);
    const api = initializeWooCommerceAPI(store);

    // Map local category data to WooCommerce format
    const wooCommerceData = mapCategoryToWooCommerce(categoryData);

    console.log('📦 Category data for WooCommerce:', wooCommerceData);

    // Execute API call with rate limiting
    const response = await executeWithRateLimit(() => 
      api.post('products/categories', wooCommerceData)
    );

    // Validate response
    const validation = validateWooCommerceResponse(response, 'createCategory');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const wooCommerceCategory = validation.data;

    // Log successful sync
    await logWooCommerceSync({
      operation: 'create',
      entityType: 'category',
      entityId: categoryData._id || categoryData.id,
      storeId,
      status: 'success',
      userId,
      organizationId,
      wooCommerceId: wooCommerceCategory.id
    });

    console.log('✅ Category created in WooCommerce:', wooCommerceCategory.id);

    return {
      success: true,
      wooCommerceId: wooCommerceCategory.id,
      data: wooCommerceCategory,
      status: 'success'
    };

  } catch (error) {
    console.error('❌ WooCommerce create error for category:', error);
    const errorResult = handleWooCommerceError(error, 'create', 'category');
    
    // Log failed sync
    await logWooCommerceSync({
      operation: 'create',
      entityType: 'category',
      entityId: categoryData._id || categoryData.id,
      storeId,
      status: 'failed',
      userId,
      organizationId,
      error: errorResult
    });

    return errorResult;
  }
};

/**
 * Update category in WooCommerce store
 * @param {Object} categoryData - Local category data
 * @param {string} storeId - Store ID
 * @param {Object} userId - User performing the operation
 * @param {string} organizationId - Organization ID
 * @returns {Object} Sync result
 */
const updateCategoryInWooCommerce = async (categoryData, storeId, userId, organizationId) => {
  try {
    console.log('🔄 Updating category in WooCommerce:', categoryData.name, 'ID:', categoryData.wooCommerceId);
    
    if (!categoryData.wooCommerceId) {
      throw new Error('Category does not have a WooCommerce ID');
    }

    // Get store configuration
    const store = await getStoreById(storeId);
    const api = initializeWooCommerceAPI(store);

    // Map local category data to WooCommerce format
    const wooCommerceData = mapCategoryToWooCommerce(categoryData);

    console.log('📦 Category update data for WooCommerce:', wooCommerceData);

    // Execute API call with rate limiting
    const response = await executeWithRateLimit(() => 
      api.put(`products/categories/${categoryData.wooCommerceId}`, wooCommerceData)
    );

    // Validate response
    const validation = validateWooCommerceResponse(response, 'updateCategory');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const wooCommerceCategory = validation.data;

    // Log successful sync
    await logWooCommerceSync({
      operation: 'update',
      entityType: 'category',
      entityId: categoryData._id || categoryData.id,
      storeId,
      status: 'success',
      userId,
      organizationId,
      wooCommerceId: wooCommerceCategory.id
    });

    console.log('✅ Category updated in WooCommerce:', wooCommerceCategory.id);

    return {
      success: true,
      wooCommerceId: wooCommerceCategory.id,
      data: wooCommerceCategory,
      status: 'success'
    };

  } catch (error) {
    console.error('❌ WooCommerce update error for category:', error);
    const errorResult = handleWooCommerceError(error, 'update', 'category');
    
    // Log failed sync
    await logWooCommerceSync({
      operation: 'update',
      entityType: 'category',
      entityId: categoryData._id || categoryData.id,
      storeId,
      status: 'failed',
      userId,
      organizationId,
      error: errorResult
    });

    return errorResult;
  }
};

/**
 * Delete category from WooCommerce store
 * @param {number} wooCommerceId - WooCommerce category ID
 * @param {string} storeId - Store ID
 * @param {Object} userId - User performing the operation
 * @param {string} organizationId - Organization ID
 * @returns {Object} Sync result
 */
const deleteCategoryInWooCommerce = async (wooCommerceId, storeId, userId, organizationId) => {
  try {
    console.log('🗑️ Deleting category from WooCommerce, ID:', wooCommerceId);
    
    // Get store configuration
    const store = await getStoreById(storeId);
    const api = initializeWooCommerceAPI(store);

    // Execute API call with rate limiting
    const response = await executeWithRateLimit(() => 
      api.delete(`products/categories/${wooCommerceId}`, { force: true })
    );

    // Validate response
    const validation = validateWooCommerceResponse(response, 'deleteCategory');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Log successful sync
    await logWooCommerceSync({
      operation: 'delete',
      entityType: 'category',
      entityId: null,
      storeId,
      status: 'success',
      userId,
      organizationId,
      wooCommerceId: wooCommerceId
    });

    console.log('✅ Category deleted from WooCommerce:', wooCommerceId);

    return {
      success: true,
      wooCommerceId: wooCommerceId,
      status: 'success'
    };

  } catch (error) {
    console.error('❌ WooCommerce delete error for category:', error);
    const errorResult = handleWooCommerceError(error, 'delete', 'category');
    
    // Log failed sync
    await logWooCommerceSync({
      operation: 'delete',
      entityType: 'category',
      entityId: null,
      storeId,
      status: 'failed',
      userId,
      organizationId,
      wooCommerceId: wooCommerceId,
      error: errorResult
    });

    return errorResult;
  }
};

/**
 * Get categories from WooCommerce store
 * @param {string} storeId - Store ID
 * @returns {Array} WooCommerce categories
 */
const getWooCommerceCategories = async (storeId) => {
  try {
    console.log('📋 Fetching categories from WooCommerce for store:', storeId);
    
    // Get store configuration
    const store = await getStoreById(storeId);
    const api = initializeWooCommerceAPI(store);

    // Execute API call with rate limiting
    const response = await executeWithRateLimit(() => 
      api.get('products/categories', { per_page: 100 })
    );

    // For getCategories, the response.data is an array, not a single object
    const categories = response.data || [];
    console.log(`✅ Fetched ${categories.length} categories from WooCommerce`);

    return {
      success: true,
      data: categories,
      count: categories.length
    };

  } catch (error) {
    console.error('❌ WooCommerce fetch error for categories:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Sync local categories with WooCommerce
 * @param {string} storeId - Store ID
 * @param {Object} userId - User performing the operation
 * @param {string} organizationId - Organization ID
 * @returns {Object} Sync result
 */
const syncCategories = async (storeId, userId, organizationId) => {
  try {
    console.log('🔄 Starting category sync for store:', storeId);
    console.log('📋 Sync parameters - userId:', userId, 'organizationId:', organizationId);
    
    // Validate required parameters
    if (!storeId) {
      throw new Error('Store ID is required for category sync');
    }
    
    const Category = require('../models/Category');
    
    // Get WooCommerce categories
    const wooCommerceResult = await getWooCommerceCategories(storeId);
    if (!wooCommerceResult.success) {
      throw new Error('Failed to fetch WooCommerce categories');
    }

    const wooCommerceCategories = wooCommerceResult.data || [];
    const localCategories = await Category.find({ storeId, isActive: true });
    
    console.log(`📊 Found ${localCategories.length} local categories and ${wooCommerceCategories.length} WooCommerce categories`);

    const syncResults = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    // Create a map of WooCommerce categories by name for easy lookup
    const wooCommerceMap = {};
    wooCommerceCategories.forEach(cat => {
      if (cat && cat.name) {
        wooCommerceMap[cat.name.toLowerCase()] = cat;
      }
    });

    // Sync local categories to WooCommerce
    for (const localCategory of localCategories) {
      try {
        if (!localCategory.wooCommerceId) {
          // Category doesn't exist in WooCommerce, create it
          console.log(`➕ Creating category in WooCommerce: ${localCategory.name}`);
          const createResult = await createCategoryInWooCommerce(localCategory, storeId, userId, organizationId);
          
          if (createResult.success) {
            localCategory.wooCommerceId = createResult.wooCommerceId;
            localCategory.syncStatus = 'synced';
            localCategory.lastSyncedAt = new Date();
            await localCategory.save();
            syncResults.created++;
            console.log(`✅ Created category: ${localCategory.name}`);
          } else {
            localCategory.syncStatus = 'failed';
            await localCategory.save();
            syncResults.failed++;
            syncResults.errors.push(`Failed to create ${localCategory.name}: ${createResult.error}`);
            console.log(`❌ Failed to create category: ${localCategory.name}`);
          }
        } else {
          // Category exists, check if it needs updating
          const wooCommerceCategory = wooCommerceCategories.find(cat => cat && cat.id === localCategory.wooCommerceId);
          if (wooCommerceCategory) {
            // Check if local category is newer
            const localUpdated = new Date(localCategory.updatedAt);
            const wooCommerceUpdated = new Date(wooCommerceCategory.date_modified_gmt);
            
            if (localUpdated > wooCommerceUpdated) {
              console.log(`🔄 Updating category in WooCommerce: ${localCategory.name}`);
              const updateResult = await updateCategoryInWooCommerce(localCategory, storeId, userId, organizationId);
              
              if (updateResult.success) {
                localCategory.syncStatus = 'synced';
                localCategory.lastSyncedAt = new Date();
                await localCategory.save();
                syncResults.updated++;
                console.log(`✅ Updated category: ${localCategory.name}`);
              } else {
                localCategory.syncStatus = 'failed';
                await localCategory.save();
                syncResults.failed++;
                syncResults.errors.push(`Failed to update ${localCategory.name}: ${updateResult.error}`);
                console.log(`❌ Failed to update category: ${localCategory.name}`);
              }
            } else {
              // WooCommerce is newer, update local
              console.log(`📥 Updating local category from WooCommerce: ${localCategory.name}`);
              localCategory.name = wooCommerceCategory.name;
              localCategory.description = wooCommerceCategory.description || '';
              localCategory.syncStatus = 'synced';
              localCategory.lastSyncedAt = new Date();
              await localCategory.save();
              syncResults.updated++;
              console.log(`✅ Updated local category: ${localCategory.name}`);
            }
          } else {
            // WooCommerce ID exists but category not found, reset it
            console.log(`🔄 WooCommerce category not found, resetting ID for: ${localCategory.name}`);
            localCategory.wooCommerceId = null;
            localCategory.syncStatus = 'pending';
            await localCategory.save();
          }
        }
      } catch (error) {
        console.error(`❌ Error syncing category ${localCategory.name}:`, error);
        syncResults.failed++;
        syncResults.errors.push(`Error syncing ${localCategory.name}: ${error.message}`);
      }
    }

    // Import WooCommerce categories that don't exist locally
    console.log('📥 Importing WooCommerce categories to local database...');
    for (const wooCommerceCategory of wooCommerceCategories) {
      try {
        // Check if category already exists locally by WooCommerce ID
        const existingCategory = await Category.findOne({ 
          wooCommerceId: wooCommerceCategory.id,
          storeId: storeId 
        });

        if (!existingCategory) {
          // Create new local category from WooCommerce data
          console.log(`➕ Importing category from WooCommerce: ${wooCommerceCategory.name}`);
          
          const categoryData = {
            name: wooCommerceCategory.name,
            slug: wooCommerceCategory.slug || wooCommerceCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: wooCommerceCategory.description || '',
            image: wooCommerceCategory.image ? {
              src: wooCommerceCategory.image.src,
              alt: wooCommerceCategory.image.alt || wooCommerceCategory.name
            } : {},
            parent: null, // Will need to handle parent relationships later
            wooCommerceId: wooCommerceCategory.id,
            storeId: storeId,
            organizationId: organizationId,
            isActive: true,
            menuOrder: wooCommerceCategory.menu_order || 0,
            productCount: wooCommerceCategory.count || 0,
            syncStatus: 'synced',
            lastSyncedAt: new Date()
          };

          const newCategory = new Category(categoryData);
          await newCategory.save();
          
          syncResults.created++;
          console.log(`✅ Imported category: ${wooCommerceCategory.name}`);
        }
      } catch (error) {
        console.error(`❌ Error importing category ${wooCommerceCategory.name}:`, error);
        syncResults.failed++;
        syncResults.errors.push(`Error importing ${wooCommerceCategory.name}: ${error.message}`);
      }
    }

    console.log('✅ Category sync completed:', syncResults);

    return {
      success: true,
      message: 'Category sync completed',
      data: syncResults
    };

  } catch (error) {
    console.error('❌ Error during category sync:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Map local category data to WooCommerce format
 * @param {Object} category - Local category data
 * @returns {Object} WooCommerce category data
 */
const mapCategoryToWooCommerce = (category) => {
  return {
    name: category.name,
    description: category.description || '',
    image: category.image && category.image.src ? {
      src: category.image.src,
      alt: category.image.alt || category.name
    } : null,
    parent: category.parent || 0,
    display: 'default',
    menu_order: category.menuOrder || 0
  };
};

module.exports = {
  createCategoryInWooCommerce,
  updateCategoryInWooCommerce,
  deleteCategoryInWooCommerce,
  getWooCommerceCategories,
  syncCategories,
  mapCategoryToWooCommerce
}; 