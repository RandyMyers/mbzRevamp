/**
 * Rate Sync Service
 * 
 * Handles background synchronization of exchange rates
 * Manages API quota, scheduled updates, and rate monitoring
 */

const cron = require('node-cron');
const ExchangeRate = require('../models/exchangeRate');
const exchangeRateApiService = require('./exchangeRateApiService');
const mongoose = require('mongoose');

class RateSyncService {
  constructor() {
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncInterval = process.env.EXCHANGE_RATE_SYNC_INTERVAL || 86400; // 24 hours default
    this.quotaThreshold = 0.1; // 10% of quota remaining triggers warning
  }

  /**
   * Initialize the sync service
   */
  async initialize() {
    try {
      console.log('🔄 Initializing Rate Sync Service...');
      
      // Check if we have API key
      if (!process.env.EXCHANGE_RATE_API_KEY) {
        console.warn('⚠️  No API key configured, sync service will be limited');
        return;
      }

      // Schedule daily sync at 2 AM UTC
      this.scheduleDailySync();
      
      // Schedule quota check every 6 hours
      this.scheduleQuotaCheck();
      
      // Schedule cache cleanup every 12 hours
      this.scheduleCacheCleanup();
      
      console.log('✅ Rate Sync Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Rate Sync Service:', error);
    }
  }

  /**
   * Schedule daily exchange rate synchronization
   */
  scheduleDailySync() {
    // Run at 2 AM UTC every day
    cron.schedule('0 2 * * *', async () => {
      console.log('🕐 Daily exchange rate sync triggered');
      await this.syncAllRates();
    }, {
      timezone: 'UTC'
    });
    
    console.log('📅 Daily sync scheduled for 2:00 AM UTC');
  }

  /**
   * Schedule API quota monitoring
   */
  scheduleQuotaCheck() {
    // Check every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('📊 Checking API quota...');
      await this.checkApiQuota();
    }, {
      timezone: 'UTC'
    });
    
    console.log('📅 Quota check scheduled every 6 hours');
  }

  /**
   * Schedule cache cleanup
   */
  scheduleCacheCleanup() {
    // Clean up every 12 hours
    cron.schedule('0 */12 * * *', async () => {
      console.log('🧹 Cleaning up expired cache...');
      await this.cleanupExpiredCache();
    }, {
      timezone: 'UTC'
    });
    
    console.log('📅 Cache cleanup scheduled every 12 hours');
  }

  /**
   * Sync all exchange rates from API
   */
  async syncAllRates() {
    if (this.isRunning) {
      console.log('⏭️  Sync already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      console.log('🔄 Starting full exchange rate sync...');
      
      // Check API quota first
      const quota = await this.checkApiQuota();
      if (quota && quota.requests_remaining < 10) {
        console.warn('⚠️  Low API quota, skipping sync');
        return;
      }

      // Get list of currencies that need updating
      const currenciesToUpdate = await this.getCurrenciesNeedingUpdate();
      
      if (currenciesToUpdate.length === 0) {
        console.log('✅ All rates are up to date');
        return;
      }

      console.log(`🔄 Syncing rates for ${currenciesToUpdate.length} currencies...`);
      
      let successCount = 0;
      let errorCount = 0;

      for (const baseCurrency of currenciesToUpdate) {
        try {
          console.log(`🔄 Syncing rates for ${baseCurrency}...`);
          
          const apiResponse = await exchangeRateApiService.fetchLatestRates(baseCurrency);
          await exchangeRateApiService.cacheRates(apiResponse, 'api_cached');
          
          successCount++;
          console.log(`✅ Successfully synced ${baseCurrency}`);
          
          // Small delay to avoid overwhelming the API
          await this.delay(1000);
          
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed to sync ${baseCurrency}:`, error.message);
        }
      }

      this.lastSyncTime = new Date();
      
      console.log(`✅ Sync completed: ${successCount} successful, ${errorCount} failed`);
      
      // Log sync summary
      await this.logSyncSummary(successCount, errorCount);
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get currencies that need updating
   */
  async getCurrenciesNeedingUpdate() {
    try {
      // Get expired or missing rates
      const expiredRates = await ExchangeRate.findExpiredRates();
      
      // Get unique base currencies from expired rates
      const baseCurrencies = [...new Set(expiredRates.map(rate => rate.baseCurrency))];
      
      // Add common currencies that might not have rates
      const commonCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'NGN'];
      
      const allCurrencies = [...new Set([...baseCurrencies, ...commonCurrencies])];
      
      return allCurrencies;
    } catch (error) {
      console.error('❌ Error getting currencies needing update:', error);
      return ['USD']; // Fallback to USD
    }
  }

  /**
   * Check API quota and log warnings if low
   */
  async checkApiQuota() {
    try {
      const quota = await exchangeRateApiService.checkApiQuota();
      
      const usagePercentage = (quota.requests_remaining / quota.plan_quota) * 100;
      
      if (usagePercentage < this.quotaThreshold * 100) {
        console.warn(`⚠️  Low API quota: ${quota.requests_remaining}/${quota.plan_quota} remaining (${usagePercentage.toFixed(1)}%)`);
      } else {
        console.log(`📊 API quota: ${quota.requests_remaining}/${quota.plan_quota} remaining (${usagePercentage.toFixed(1)}%)`);
      }
      
      return quota;
    } catch (error) {
      console.error('❌ Error checking API quota:', error);
      return null;
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache() {
    try {
      console.log('🧹 Cleaning up expired cache entries...');
      
      const expiredRates = await ExchangeRate.findExpiredRates();
      
      if (expiredRates.length === 0) {
        console.log('✅ No expired cache entries found');
        return;
      }

      // Mark expired rates as inactive (don't delete to preserve history)
      const updateResult = await ExchangeRate.updateMany(
        { _id: { $in: expiredRates.map(rate => rate._id) } },
        { $set: { isActive: false } }
      );

      console.log(`✅ Cleaned up ${updateResult.modifiedCount} expired cache entries`);
      
    } catch (error) {
      console.error('❌ Error cleaning up cache:', error);
    }
  }

  /**
   * Log sync summary for monitoring
   */
  async logSyncSummary(successCount, errorCount) {
    try {
      const summary = {
        timestamp: new Date(),
        successCount,
        errorCount,
        totalRates: await ExchangeRate.countDocuments({ isActive: true }),
        globalRates: await ExchangeRate.countDocuments({ isActive: true, isGlobal: true }),
        orgRates: await ExchangeRate.countDocuments({ isActive: true, isGlobal: false })
      };

      console.log('📊 Sync Summary:', summary);
      
      // You could save this to a separate collection for monitoring
      // await SyncLog.create(summary);
      
    } catch (error) {
      console.error('❌ Error logging sync summary:', error);
    }
  }

  /**
   * Manual sync trigger
   */
  async manualSync(baseCurrency = 'USD') {
    try {
      console.log(`🔄 Manual sync triggered for ${baseCurrency}...`);
      
      const apiResponse = await exchangeRateApiService.fetchLatestRates(baseCurrency);
      await exchangeRateApiService.cacheRates(apiResponse, 'api_cached');
      
      console.log(`✅ Manual sync completed for ${baseCurrency}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Manual sync failed for ${baseCurrency}:`, error);
      return false;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    try {
      const totalRates = await ExchangeRate.countDocuments({ isActive: true });
      const expiredRates = await ExchangeRate.findExpiredRates();
      const quota = await this.checkApiQuota();
      
      return {
        isRunning: this.isRunning,
        lastSyncTime: this.lastSyncTime,
        totalRates,
        expiredRates: expiredRates.length,
        quota: quota ? {
          remaining: quota.requests_remaining,
          total: quota.plan_quota,
          percentage: (quota.requests_remaining / quota.plan_quota) * 100
        } : null
      };
    } catch (error) {
      console.error('❌ Error getting sync status:', error);
      return null;
    }
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Stop the sync service
   */
  stop() {
    console.log('🛑 Stopping Rate Sync Service...');
    this.isRunning = false;
  }
}

// Create singleton instance
const rateSyncService = new RateSyncService();

module.exports = rateSyncService; 
 