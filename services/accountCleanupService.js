const User = require('../models/users');
const Organization = require('../models/organization');
const Store = require('../models/store');
const Order = require('../models/order');
const Customer = require('../models/customer');
const Product = require('../models/product');
const Inventory = require('../models/inventory');
const { createAuditLog } = require('../helpers/auditLogHelper');

/**
 * Account Cleanup Service
 * Handles the actual deletion of user accounts after the grace period
 */
class AccountCleanupService {
  
  /**
   * Process accounts scheduled for deletion
   * This should be run as a cron job daily
   */
  static async processScheduledDeletions() {
    try {
      console.log('🧹 Starting scheduled account cleanup...');
      
      // Find users scheduled for deletion (past their deletion date)
      const usersToDelete = await User.find({
        isDeleted: true,
        deletionScheduledFor: { $lte: new Date() }
      });

      console.log(`📊 Found ${usersToDelete.length} accounts scheduled for deletion`);

      for (const user of usersToDelete) {
        try {
          await this.cleanupUserAccount(user);
          console.log(`✅ Successfully cleaned up account: ${user.email}`);
        } catch (error) {
          console.error(`❌ Failed to cleanup account ${user.email}:`, error);
          // Log the error but continue with other accounts
          await this.logCleanupError(user, error);
        }
      }

      console.log('✅ Account cleanup process completed');
      return { success: true, processed: usersToDelete.length };

    } catch (error) {
      console.error('❌ Account cleanup service error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up a specific user account and all related data
   */
  static async cleanupUserAccount(user) {
    const userId = user._id;
    const organizationId = user.organization;

    console.log(`🧹 Cleaning up account: ${user.email} (${userId})`);

    // 1. Clean up user's stores
    await this.cleanupUserStores(userId, organizationId);

    // 2. Clean up user's orders
    await this.cleanupUserOrders(userId, organizationId);

    // 3. Clean up user's customers
    await this.cleanupUserCustomers(userId, organizationId);

    // 4. Clean up user's products and inventory
    await this.cleanupUserProducts(userId, organizationId);

    // 5. Clean up user's analytics data
    await this.cleanupUserAnalytics(userId, organizationId);

    // 6. Check if organization should be deleted
    await this.checkOrganizationDeletion(organizationId);

    // 7. Finally, delete the user
    await User.findByIdAndDelete(userId);

    // 8. Log the final deletion
    await createAuditLog({
      action: 'account_permanently_deleted',
      user: userId,
      resource: 'User',
      resourceId: userId,
      details: {
        email: user.email,
        organization: organizationId,
        deletionReason: user.deletionReason,
        deletedAt: user.deletedAt
      },
      organization: organizationId,
      severity: 'critical'
    });

    console.log(`✅ Account ${user.email} permanently deleted`);
  }

  /**
   * Clean up user's stores
   */
  static async cleanupUserStores(userId, organizationId) {
    try {
      const stores = await Store.find({ userId, organizationId });
      console.log(`🗑️ Deleting ${stores.length} stores for user ${userId}`);
      
      for (const store of stores) {
        // Delete store-related data
        await Order.deleteMany({ storeId: store._id });
        await Customer.deleteMany({ storeId: store._id });
        await Product.deleteMany({ storeId: store._id });
        await Inventory.deleteMany({ storeId: store._id });
      }

      await Store.deleteMany({ userId, organizationId });
      console.log(`✅ Cleaned up stores for user ${userId}`);
    } catch (error) {
      console.error(`❌ Error cleaning up stores for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up user's orders
   */
  static async cleanupUserOrders(userId, organizationId) {
    try {
      const orderCount = await Order.countDocuments({ userId, organizationId });
      console.log(`🗑️ Deleting ${orderCount} orders for user ${userId}`);
      
      await Order.deleteMany({ userId, organizationId });
      console.log(`✅ Cleaned up orders for user ${userId}`);
    } catch (error) {
      console.error(`❌ Error cleaning up orders for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up user's customers
   */
  static async cleanupUserCustomers(userId, organizationId) {
    try {
      const customerCount = await Customer.countDocuments({ userId, organizationId });
      console.log(`🗑️ Deleting ${customerCount} customers for user ${userId}`);
      
      await Customer.deleteMany({ userId, organizationId });
      console.log(`✅ Cleaned up customers for user ${userId}`);
    } catch (error) {
      console.error(`❌ Error cleaning up customers for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up user's products and inventory
   */
  static async cleanupUserProducts(userId, organizationId) {
    try {
      const productCount = await Product.countDocuments({ userId, organizationId });
      const inventoryCount = await Inventory.countDocuments({ userId, organizationId });
      
      console.log(`🗑️ Deleting ${productCount} products and ${inventoryCount} inventory items for user ${userId}`);
      
      await Product.deleteMany({ userId, organizationId });
      await Inventory.deleteMany({ userId, organizationId });
      
      console.log(`✅ Cleaned up products and inventory for user ${userId}`);
    } catch (error) {
      console.error(`❌ Error cleaning up products for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up user's analytics data
   */
  static async cleanupUserAnalytics(userId, organizationId) {
    try {
      // Clean up analytics data (implement based on your analytics structure)
      console.log(`🗑️ Cleaning up analytics data for user ${userId}`);
      
      // Add specific analytics cleanup here based on your analytics implementation
      // This might include deleting analytics records, reports, etc.
      
      console.log(`✅ Cleaned up analytics data for user ${userId}`);
    } catch (error) {
      console.error(`❌ Error cleaning up analytics for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if organization should be deleted (if no active users remain)
   */
  static async checkOrganizationDeletion(organizationId) {
    try {
      const activeUsers = await User.countDocuments({ 
        organization: organizationId, 
        isDeleted: false 
      });

      if (activeUsers === 0) {
        console.log(`🗑️ No active users in organization ${organizationId}, marking for deletion`);
        
        // Mark organization for deletion (don't delete immediately)
        await Organization.findByIdAndUpdate(organizationId, {
          isDeleted: true,
          deletedAt: new Date(),
          deletionReason: 'no-active-users'
        });

        console.log(`✅ Organization ${organizationId} marked for deletion`);
      }
    } catch (error) {
      console.error(`❌ Error checking organization deletion for ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Log cleanup errors
   */
  static async logCleanupError(user, error) {
    try {
      await createAuditLog({
        action: 'account_cleanup_failed',
        user: user._id,
        resource: 'User',
        resourceId: user._id,
        details: {
          email: user.email,
          error: error.message,
          organization: user.organization
        },
        organization: user.organization,
        severity: 'error'
      });
    } catch (logError) {
      console.error('❌ Failed to log cleanup error:', logError);
    }
  }

  /**
   * Get cleanup statistics
   */
  static async getCleanupStats() {
    try {
      const scheduledForDeletion = await User.countDocuments({
        isDeleted: true,
        deletionScheduledFor: { $lte: new Date() }
      });

      const pendingDeletion = await User.countDocuments({
        isDeleted: true,
        deletionScheduledFor: { $gt: new Date() }
      });

      return {
        scheduledForDeletion,
        pendingDeletion,
        totalPending: scheduledForDeletion + pendingDeletion
      };
    } catch (error) {
      console.error('❌ Error getting cleanup stats:', error);
      return { error: error.message };
    }
  }
}

module.exports = AccountCleanupService;
