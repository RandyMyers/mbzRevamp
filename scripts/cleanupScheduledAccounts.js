#!/usr/bin/env node

/**
 * Account Cleanup Script
 * This script should be run as a cron job daily to process scheduled account deletions
 * 
 * Usage:
 * node scripts/cleanupScheduledAccounts.js
 * 
 * Cron job example (runs daily at 2 AM):
 * 0 2 * * * cd /path/to/server && node scripts/cleanupScheduledAccounts.js
 */

const mongoose = require('mongoose');
const AccountCleanupService = require('../services/accountCleanupService');
require('dotenv').config();

async function runCleanup() {
  try {
    console.log('🚀 Starting account cleanup process...');
    console.log(`📅 Started at: ${new Date().toISOString()}`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Get cleanup statistics before processing
    const statsBefore = await AccountCleanupService.getCleanupStats();
    console.log('📊 Cleanup Statistics (Before):', statsBefore);

    // Process scheduled deletions
    const result = await AccountCleanupService.processScheduledDeletions();
    
    if (result.success) {
      console.log(`✅ Cleanup completed successfully. Processed ${result.processed} accounts.`);
    } else {
      console.error('❌ Cleanup failed:', result.error);
      process.exit(1);
    }

    // Get cleanup statistics after processing
    const statsAfter = await AccountCleanupService.getCleanupStats();
    console.log('📊 Cleanup Statistics (After):', statsAfter);

    console.log(`📅 Completed at: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('❌ Cleanup script error:', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  runCleanup();
}

module.exports = { runCleanup };
