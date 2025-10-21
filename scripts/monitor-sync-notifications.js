#!/usr/bin/env node

/**
 * Monitor Sync Notifications Script
 * 
 * This script monitors sync notifications and provides detailed reporting
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notification = require('../models/notification');
const Store = require('../models/store');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Monitor sync notifications for a specific store
const monitorStoreSyncNotifications = async (storeId) => {
  console.log(`\n🏪 Monitoring sync notifications for store: ${storeId}`);
  
  try {
    // Get store information
    const store = await Store.findById(storeId).select('name syncStatus lastSyncDate');
    if (!store) {
      console.error('❌ Store not found');
      return;
    }
    
    console.log(`📦 Store: ${store.name}`);
    console.log(`📅 Last Sync: ${store.lastSyncDate}`);
    console.log(`🔄 Sync Status:`, JSON.stringify(store.syncStatus, null, 2));
    
    // Get all users associated with this store (through organization)
    // This is a simplified approach - in practice, you'd need to join through organization
    console.log('\n📊 Note: To get store-specific notifications, you need to query by organization');
    
  } catch (error) {
    console.error('❌ Error monitoring store sync notifications:', error.message);
  }
};

// Monitor sync notifications for a specific user
const monitorUserSyncNotifications = async (userId) => {
  console.log(`\n👤 Monitoring sync notifications for user: ${userId}`);
  
  try {
    // Get recent sync-related notifications
    const syncNotifications = await Notification.find({
      user: userId,
      $or: [
        { subject: { $regex: /sync/i } },
        { subject: { $regex: /woocommerce/i } },
        { subject: { $regex: /store/i } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(20);
    
    if (syncNotifications.length > 0) {
      console.log(`✅ Found ${syncNotifications.length} sync-related notifications:`);
      
      // Group by type
      const groupedNotifications = syncNotifications.reduce((acc, notification) => {
        const type = notification.subject.includes('Error') ? 'error' : 
                    notification.subject.includes('Succeeded') ? 'success' : 'other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(notification);
        return acc;
      }, {});
      
      // Display by type
      Object.entries(groupedNotifications).forEach(([type, notifications]) => {
        console.log(`\n📧 ${type.toUpperCase()} Notifications (${notifications.length}):`);
        notifications.forEach((notification, index) => {
          console.log(`   ${index + 1}. ${notification.subject}`);
          console.log(`      Status: ${notification.status} | Created: ${notification.createdAt}`);
          if (notification.errorMessage) {
            console.log(`      Error: ${notification.errorMessage}`);
          }
        });
      });
      
      // Summary statistics
      const successCount = groupedNotifications.success?.length || 0;
      const errorCount = groupedNotifications.error?.length || 0;
      const otherCount = groupedNotifications.other?.length || 0;
      
      console.log(`\n📊 Summary:`);
      console.log(`   ✅ Success: ${successCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`   ℹ️  Other: ${otherCount}`);
      
    } else {
      console.log('⚠️ No sync-related notifications found for user');
    }
    
  } catch (error) {
    console.error('❌ Error monitoring user sync notifications:', error.message);
  }
};

// Monitor all sync notifications (system-wide)
const monitorAllSyncNotifications = async () => {
  console.log('\n🌐 Monitoring all sync notifications (system-wide)');
  
  try {
    // Get all sync-related notifications from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const syncNotifications = await Notification.find({
      createdAt: { $gte: yesterday },
      $or: [
        { subject: { $regex: /sync/i } },
        { subject: { $regex: /woocommerce/i } },
        { subject: { $regex: /store/i } }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('user', 'email fullName');
    
    if (syncNotifications.length > 0) {
      console.log(`✅ Found ${syncNotifications.length} sync notifications in the last 24 hours:`);
      
      // Group by status
      const statusGroups = syncNotifications.reduce((acc, notification) => {
        if (!acc[notification.status]) acc[notification.status] = [];
        acc[notification.status].push(notification);
        return acc;
      }, {});
      
      Object.entries(statusGroups).forEach(([status, notifications]) => {
        console.log(`\n📧 ${status.toUpperCase()} (${notifications.length}):`);
        notifications.forEach((notification, index) => {
          const userInfo = notification.user ? 
            `${notification.user.email} (${notification.user.fullName})` : 
            'Unknown User';
          console.log(`   ${index + 1}. ${notification.subject}`);
          console.log(`      User: ${userInfo}`);
          console.log(`      Created: ${notification.createdAt}`);
        });
      });
      
    } else {
      console.log('⚠️ No sync notifications found in the last 24 hours');
    }
    
  } catch (error) {
    console.error('❌ Error monitoring all sync notifications:', error.message);
  }
};

// Check notification delivery issues
const checkDeliveryIssues = async () => {
  console.log('\n🚨 Checking notification delivery issues...');
  
  try {
    // Find failed notifications
    const failedNotifications = await Notification.find({
      status: 'failed',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
    .populate('user', 'email fullName');
    
    if (failedNotifications.length > 0) {
      console.log(`❌ Found ${failedNotifications.length} failed notifications:`);
      failedNotifications.forEach((notification, index) => {
        const userInfo = notification.user ? 
          `${notification.user.email} (${notification.user.fullName})` : 
          'Unknown User';
        console.log(`   ${index + 1}. ${notification.subject}`);
        console.log(`      User: ${userInfo}`);
        console.log(`      Error: ${notification.errorMessage}`);
        console.log(`      Created: ${notification.createdAt}`);
      });
    } else {
      console.log('✅ No failed notifications found in the last 24 hours');
    }
    
    // Find pending notifications (might be stuck)
    const pendingNotifications = await Notification.find({
      status: 'pending',
      createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } // Older than 5 minutes
    })
    .populate('user', 'email fullName');
    
    if (pendingNotifications.length > 0) {
      console.log(`⚠️ Found ${pendingNotifications.length} stuck pending notifications:`);
      pendingNotifications.forEach((notification, index) => {
        const userInfo = notification.user ? 
          `${notification.user.email} (${notification.user.fullName})` : 
          'Unknown User';
        console.log(`   ${index + 1}. ${notification.subject}`);
        console.log(`      User: ${userInfo}`);
        console.log(`      Created: ${notification.createdAt}`);
      });
    } else {
      console.log('✅ No stuck pending notifications found');
    }
    
  } catch (error) {
    console.error('❌ Error checking delivery issues:', error.message);
  }
};

// Main monitoring function
const monitorNotifications = async () => {
  console.log('🔍 Starting notification monitoring...\n');
  
  const args = process.argv.slice(2);
  const command = args[0];
  const targetId = args[1];
  
  switch (command) {
    case 'store':
      if (!targetId) {
        console.log('❌ Please provide a store ID');
        console.log('Usage: node monitor-sync-notifications.js store <storeId>');
        process.exit(1);
      }
      await monitorStoreSyncNotifications(targetId);
      break;
      
    case 'user':
      if (!targetId) {
        console.log('❌ Please provide a user ID');
        console.log('Usage: node monitor-sync-notifications.js user <userId>');
        process.exit(1);
      }
      await monitorUserSyncNotifications(targetId);
      break;
      
    case 'all':
      await monitorAllSyncNotifications();
      break;
      
    case 'issues':
      await checkDeliveryIssues();
      break;
      
    default:
      console.log('🔍 Notification Monitoring Tool');
      console.log('\nUsage:');
      console.log('  node monitor-sync-notifications.js store <storeId>  - Monitor store notifications');
      console.log('  node monitor-sync-notifications.js user <userId>    - Monitor user notifications');
      console.log('  node monitor-sync-notifications.js all               - Monitor all notifications');
      console.log('  node monitor-sync-notifications.js issues           - Check delivery issues');
      break;
  }
};

// Run the monitoring script
const main = async () => {
  try {
    await connectDB();
    await monitorNotifications();
  } catch (error) {
    console.error('❌ Monitoring script failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  monitorStoreSyncNotifications,
  monitorUserSyncNotifications,
  monitorAllSyncNotifications,
  checkDeliveryIssues
};
