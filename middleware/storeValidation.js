const Store = require('../models/store');
const Organization = require('../models/organization');

/**
 * Middleware to validate store access and ensure store belongs to user's organization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateStoreAccess = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { storeId: bodyStoreId } = req.body;
    const { storeId: queryStoreId } = req.query;
    
    // Get storeId from params, body, or query
    const targetStoreId = storeId || bodyStoreId || queryStoreId;
    
    if (!targetStoreId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Get user's organization from the authenticated user
    const userOrganizationId = req.user?.organization;
    
    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: 'User organization not found'
      });
    }

    // Find the store and verify it belongs to the user's organization
    const store = await Store.findById(targetStoreId)
      .populate('organizationId', 'name organizationCode');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if store belongs to user's organization
    if (store.organizationId._id.toString() !== userOrganizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only access stores from your organization'
      });
    }

    // Check if store is active
    if (!store.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Store is not active'
      });
    }

    // Add store info to request for use in controllers
    req.store = store;
    req.storeId = targetStoreId;
    
    next();
  } catch (error) {
    console.error('❌ [STORE VALIDATION] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Store validation error'
    });
  }
};

/**
 * Middleware to validate store access for multiple stores
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateMultipleStoreAccess = async (req, res, next) => {
  try {
    const { storeIds } = req.body;
    const userOrganizationId = req.user?.organization;
    
    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: 'User organization not found'
      });
    }

    if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Store IDs array is required'
      });
    }

    // Find all stores and verify they belong to the user's organization
    const stores = await Store.find({ 
      _id: { $in: storeIds },
      organizationId: userOrganizationId,
      isActive: true
    });

    if (stores.length !== storeIds.length) {
      return res.status(403).json({
        success: false,
        message: 'One or more stores not found or not accessible'
      });
    }

    // Add stores info to request
    req.stores = stores;
    req.storeIds = storeIds;
    
    next();
  } catch (error) {
    console.error('❌ [STORE VALIDATION] Multiple stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Store validation error'
    });
  }
};

/**
 * Middleware to get user's stores for dropdown/selection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getUserStores = async (req, res, next) => {
  try {
    const userOrganizationId = req.user?.organization;
    
    if (!userOrganizationId) {
      return res.status(401).json({
        success: false,
        message: 'User organization not found'
      });
    }

    // Get all active stores for the user's organization
    const stores = await Store.find({ 
      organizationId: userOrganizationId,
      isActive: true
    }).select('name platformType url description isActive lastSyncDate');

    // Add stores to request
    req.userStores = stores;
    
    next();
  } catch (error) {
    console.error('❌ [STORE VALIDATION] Get user stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user stores'
    });
  }
};

module.exports = {
  validateStoreAccess,
  validateMultipleStoreAccess,
  getUserStores
};
