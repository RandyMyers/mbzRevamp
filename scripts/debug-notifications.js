#!/usr/bin/env node

/**
 * Debug Notification System Script
 * 
 * This script helps debug notification issues by:
 * 1. Testing notification creation
 * 2. Checking notification delivery
 * 3. Verifying notification storage
 * 4. Testing email configuration
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { createAndSendNotification } = require('../services/notificationService');
const User = require('../models/users');
const Notification = require('../models/notification');

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

// Test notification creation
const testNotificationCreation = async (userId, organizationId) => {
  console.log('\n🧪 Testing notification creation...');
  
  try {
    const result = await createAndSendNotification({
      userId,
      organization: organizationId,
      type: 'system',
      subject: 'Debug Test Notification',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">🔧 Debug Test Notification</h2>
          <p><strong>Purpose:</strong> Testing notification system functionality</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Organization ID:</strong> ${organizationId}</p>
          <hr>
          <p style="color: #6c757d; font-size: 12px;">
            This is a debug notification to test the notification system.
          </p>
        </div>
      `
    });
    
    if (result.success) {
      console.log('✅ Notification created successfully');
      console.log('📧 Notification ID:', result.notificationId);
      return result.notificationId;
    } else {
      console.error('❌ Notification creation failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating notification:', error.message);
    return null;
  }
};

// Check notification in database
const checkNotificationInDB = async (notificationId) => {
  console.log('\n🔍 Checking notification in database...');
  
  try {
    const notification = await Notification.findById(notificationId);
    if (notification) {
      console.log('✅ Notification found in database');
      console.log('📋 Status:', notification.status);
      console.log('📋 Type:', notification.type);
      console.log('📋 Subject:', notification.subject);
      console.log('📋 Created At:', notification.createdAt);
      console.log('📋 Sent At:', notification.sentAt);
      console.log('📋 Delivery Status:', notification.deliveryStatus);
      console.log('📋 Error Message:', notification.errorMessage);
      return notification;
    } else {
      console.error('❌ Notification not found in database');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking notification:', error.message);
    return null;
  }
};

// Check user notification settings
const checkUserNotificationSettings = async (userId) => {
  console.log('\n👤 Checking user notification settings...');
  
  try {
    const user = await User.findById(userId).select('notificationSettings email');
    if (user) {
      console.log('✅ User found');
      console.log('📧 Email:', user.email);
      console.log('⚙️ Notification Settings:', JSON.stringify(user.notificationSettings, null, 2));
      return user;
    } else {
      console.error('❌ User not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking user settings:', error.message);
    return null;
  }
};

// Check recent notifications for user
const checkRecentNotifications = async (userId, limit = 10) => {
  console.log(`\n📬 Checking recent notifications for user (last ${limit})...`);
  
  try {
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id subject type status createdAt sentAt deliveryStatus errorMessage');
    
    if (notifications.length > 0) {
      console.log(`✅ Found ${notifications.length} recent notifications:`);
      notifications.forEach((notification, index) => {
        console.log(`\n📧 Notification ${index + 1}:`);
        console.log(`   ID: ${notification._id}`);
        console.log(`   Subject: ${notification.subject}`);
        console.log(`   Type: ${notification.type}`);
        console.log(`   Status: ${notification.status}`);
        console.log(`   Created: ${notification.createdAt}`);
        console.log(`   Sent: ${notification.sentAt || 'Not sent'}`);
        console.log(`   Delivery: ${notification.deliveryStatus}`);
        if (notification.errorMessage) {
          console.log(`   Error: ${notification.errorMessage}`);
        }
      });
    } else {
      console.log('⚠️ No recent notifications found for user');
    }
    
    return notifications;
  } catch (error) {
    console.error('❌ Error checking recent notifications:', error.message);
    return [];
  }
};

// Test email configuration
const testEmailConfiguration = () => {
  console.log('\n📧 Checking email configuration...');
  
  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT', 
    'SMTP_USER',
    'SMTP_PASS'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    console.log('✅ All email environment variables are set');
    console.log('📧 SMTP Host:', process.env.SMTP_HOST);
    console.log('📧 SMTP Port:', process.env.SMTP_PORT);
    console.log('📧 SMTP User:', process.env.SMTP_USER);
    console.log('📧 SMTP Pass:', process.env.SMTP_PASS ? '***hidden***' : 'Not set');
  } else {
    console.error('❌ Missing email environment variables:', missingVars);
    console.log('💡 Please set the following environment variables:');
    missingVars.forEach(varName => {
      console.log(`   ${varName}=your_value_here`);
    });
  }
  
  return missingVars.length === 0;
};

// Main debug function
const debugNotifications = async () => {
  console.log('🔧 Starting notification system debug...\n');
  
  // Check email configuration
  const emailConfigOk = testEmailConfiguration();
  
  if (!emailConfigOk) {
    console.log('\n❌ Email configuration is incomplete. Please fix environment variables first.');
    process.exit(1);
  }
  
  // Get user ID from command line arguments
  const userId = process.argv[2];
  if (!userId) {
    console.log('❌ Please provide a user ID as an argument');
    console.log('Usage: node debug-notifications.js <userId>');
    process.exit(1);
  }
  
  console.log(`👤 Debugging notifications for user: ${userId}`);
  
  // Check user settings
  const user = await checkUserNotificationSettings(userId);
  if (!user) {
    console.log('\n❌ User not found. Please check the user ID.');
    process.exit(1);
  }
  
  // Check recent notifications
  await checkRecentNotifications(userId);
  
  // Test notification creation
  const organizationId = user.organization || user.organizationId;
  const notificationId = await testNotificationCreation(userId, organizationId);
  
  if (notificationId) {
    // Check notification in database
    await checkNotificationInDB(notificationId);
  }
  
  console.log('\n✅ Debug complete!');
  console.log('\n💡 Next steps:');
  console.log('1. Check if the notification appears in your application');
  console.log('2. If using email notifications, check your email inbox');
  console.log('3. Check server logs for any error messages');
  console.log('4. Use the API endpoints to check notification status');
};

// Run the debug script
const main = async () => {
  try {
    await connectDB();
    await debugNotifications();
  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
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
  testNotificationCreation,
  checkNotificationInDB,
  checkUserNotificationSettings,
  checkRecentNotifications,
  testEmailConfiguration
};
