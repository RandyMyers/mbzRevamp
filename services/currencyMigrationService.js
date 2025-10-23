const Product = require('../models/inventory');
const Order = require('../models/order');
const User = require('../models/users');
const Organization = require('../models/organization');
const currencyUtils = require('../utils/currencyUtils');

/**
 * Currency Migration Service
 * Handles conversion of existing data when user changes currency preferences
 */
class CurrencyMigrationService {
  
  /**
   * Convert all products for a user to a new currency
   * @param {string} userId - User ID
   * @param {string} newCurrency - New target currency
   * @returns {Object} Migration results
   */
  static async convertUserProducts(userId, newCurrency) {
    try {
      console.log(`🔄 Starting product currency migration for user ${userId} to ${newCurrency}`);
      
      // Get user's organization
      const user = await User.findById(userId).select('organizationId');
      if (!user) {
        throw new Error('User not found');
      }
      
      // Find all products for this user's organization
      const products = await Product.find({ 
        organizationId: user.organizationId,
        price: { $gt: 0 } // Only products with prices
      });
      
      console.log(`📦 Found ${products.length} products to convert`);
      
      let converted = 0;
      let failed = 0;
      
      for (const product of products) {
        try {
          // Skip if already in target currency
          if (product.currency === newCurrency) {
            continue;
          }
          
          const originalPrice = product.originalPrice || product.price;
          const originalSalePrice = product.originalSalePrice || product.sale_price;
          const originalRegularPrice = product.originalRegularPrice || product.regular_price;
          const originalCurrency = product.originalCurrency || product.currency || 'USD';
          
          // Convert prices
          let convertedPrice = originalPrice;
          let convertedSalePrice = originalSalePrice;
          let convertedRegularPrice = originalRegularPrice;
          
          if (originalCurrency !== newCurrency && originalPrice > 0) {
            convertedPrice = await currencyUtils.convertCurrency(originalPrice, originalCurrency, newCurrency);
            
            if (originalSalePrice > 0) {
              convertedSalePrice = await currencyUtils.convertCurrency(originalSalePrice, originalCurrency, newCurrency);
            }
            
            if (originalRegularPrice > 0) {
              convertedRegularPrice = await currencyUtils.convertCurrency(originalRegularPrice, originalCurrency, newCurrency);
            }
          }
          
          // Update product with converted prices
          await Product.findByIdAndUpdate(product._id, {
            price: convertedPrice,
            sale_price: convertedSalePrice,
            regular_price: convertedRegularPrice,
            currency: newCurrency,
            displayCurrency: newCurrency,
            // Keep original values if not already set
            originalPrice: product.originalPrice || originalPrice,
            originalSalePrice: product.originalSalePrice || originalSalePrice,
            originalRegularPrice: product.originalRegularPrice || originalRegularPrice,
            originalCurrency: product.originalCurrency || originalCurrency
          });
          
          converted++;
          console.log(`✅ Converted product: ${product.name} (${originalPrice} ${originalCurrency} → ${convertedPrice} ${newCurrency})`);
          
        } catch (error) {
          failed++;
          console.error(`❌ Failed to convert product ${product.name}:`, error.message);
        }
      }
      
      console.log(`✅ Product migration complete: ${converted} converted, ${failed} failed`);
      
      return {
        success: true,
        converted,
        failed,
        total: products.length
      };
      
    } catch (error) {
      console.error('❌ Product currency migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Convert all orders for a user to a new currency
   * @param {string} userId - User ID
   * @param {string} newCurrency - New target currency
   * @returns {Object} Migration results
   */
  static async convertUserOrders(userId, newCurrency) {
    try {
      console.log(`🔄 Starting order currency migration for user ${userId} to ${newCurrency}`);
      
      // Get user's organization
      const user = await User.findById(userId).select('organizationId');
      if (!user) {
        throw new Error('User not found');
      }
      
      // Find all orders for this user's organization
      const orders = await Order.find({ 
        organizationId: user.organizationId,
        total: { $exists: true, $ne: null, $ne: '' } // Only orders with totals
      });
      
      console.log(`📦 Found ${orders.length} orders to convert`);
      
      let converted = 0;
      let failed = 0;
      
      for (const order of orders) {
        try {
          // Skip if already in target currency
          if (order.currency === newCurrency) {
            continue;
          }
          
          const originalTotal = parseFloat(order.originalTotal || order.total) || 0;
          const originalCurrency = order.originalCurrency || order.currency || 'USD';
          
          // Convert order total
          let convertedTotal = originalTotal;
          
          if (originalCurrency !== newCurrency && originalTotal > 0) {
            convertedTotal = await currencyUtils.convertCurrency(originalTotal, originalCurrency, newCurrency);
          }
          
          // Update order with converted total
          await Order.findByIdAndUpdate(order._id, {
            total: convertedTotal.toString(),
            currency: newCurrency,
            displayCurrency: newCurrency,
            convertedTotal: convertedTotal,
            // Keep original values if not already set
            originalTotal: order.originalTotal || originalTotal.toString(),
            originalCurrency: order.originalCurrency || originalCurrency
          });
          
          converted++;
          console.log(`✅ Converted order: ${order.order_id} (${originalTotal} ${originalCurrency} → ${convertedTotal} ${newCurrency})`);
          
        } catch (error) {
          failed++;
          console.error(`❌ Failed to convert order ${order.order_id}:`, error.message);
        }
      }
      
      console.log(`✅ Order migration complete: ${converted} converted, ${failed} failed`);
      
      return {
        success: true,
        converted,
        failed,
        total: orders.length
      };
      
    } catch (error) {
      console.error('❌ Order currency migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Convert all data for a user to a new currency
   * @param {string} userId - User ID
   * @param {string} newCurrency - New target currency
   * @returns {Object} Complete migration results
   */
  static async convertUserData(userId, newCurrency) {
    try {
      console.log(`🚀 Starting complete currency migration for user ${userId} to ${newCurrency}`);
      
      // Convert products
      const productResults = await this.convertUserProducts(userId, newCurrency);
      
      // Convert orders
      const orderResults = await this.convertUserOrders(userId, newCurrency);
      
      // Update user's display currency
      await User.findByIdAndUpdate(userId, { displayCurrency: newCurrency });
      
      const totalConverted = productResults.converted + orderResults.converted;
      const totalFailed = productResults.failed + orderResults.failed;
      
      console.log(`🎯 Complete migration finished: ${totalConverted} items converted, ${totalFailed} failed`);
      
      return {
        success: true,
        products: productResults,
        orders: orderResults,
        totalConverted,
        totalFailed
      };
      
    } catch (error) {
      console.error('❌ Complete currency migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Convert all data for an organization to a new currency
   * @param {string} organizationId - Organization ID
   * @param {string} newCurrency - New target currency
   * @returns {Object} Complete migration results
   */
  static async convertOrganizationData(organizationId, newCurrency) {
    try {
      console.log(`🏢 Starting organization currency migration for ${organizationId} to ${newCurrency}`);
      
      // Get all users in the organization
      const users = await User.find({ organizationId }).select('_id email');
      console.log(`👥 Found ${users.length} users in organization`);
      
      let totalConverted = 0;
      let totalFailed = 0;
      const userResults = [];
      
      // Convert data for each user
      for (const user of users) {
        try {
          const results = await this.convertUserData(user._id, newCurrency);
          totalConverted += results.totalConverted;
          totalFailed += results.totalFailed;
          userResults.push({
            userId: user._id,
            email: user.email,
            ...results
          });
        } catch (error) {
          console.error(`❌ Failed to convert data for user ${user.email}:`, error.message);
          userResults.push({
            userId: user._id,
            email: user.email,
            success: false,
            error: error.message
          });
        }
      }
      
      // Update organization's analytics currency
      await Organization.findByIdAndUpdate(organizationId, { analyticsCurrency: newCurrency });
      
      console.log(`🎯 Organization migration finished: ${totalConverted} items converted, ${totalFailed} failed`);
      
      return {
        success: true,
        totalConverted,
        totalFailed,
        userResults
      };
      
    } catch (error) {
      console.error('❌ Organization currency migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Get migration preview for a user
   * @param {string} userId - User ID
   * @param {string} newCurrency - New target currency
   * @returns {Object} Migration preview
   */
  static async getMigrationPreview(userId, newCurrency) {
    try {
      const user = await User.findById(userId).select('organizationId');
      if (!user) {
        throw new Error('User not found');
      }
      
      // Count products that need conversion
      const productsToConvert = await Product.countDocuments({
        organizationId: user.organizationId,
        price: { $gt: 0 },
        $or: [
          { currency: { $ne: newCurrency } },
          { currency: { $exists: false } }
        ]
      });
      
      // Count orders that need conversion
      const ordersToConvert = await Order.countDocuments({
        organizationId: user.organizationId,
        total: { $exists: true, $ne: null, $ne: '' },
        $or: [
          { currency: { $ne: newCurrency } },
          { currency: { $exists: false } }
        ]
      });
      
      return {
        success: true,
        productsToConvert,
        ordersToConvert,
        totalItems: productsToConvert + ordersToConvert
      };
      
    } catch (error) {
      console.error('❌ Migration preview failed:', error);
      throw error;
    }
  }
}

module.exports = CurrencyMigrationService;


