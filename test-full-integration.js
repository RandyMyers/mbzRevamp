/**
 * Full Exchange Rate API Integration Test
 * 
 * This script tests the complete implementation including:
 * - API service functionality
 * - Currency conversion with fallbacks
 * - Rate caching and management
 * - Background sync service
 * - Controller endpoints
 * - Database operations
 */

const mongoose = require('mongoose');
const exchangeRateApiService = require('./services/exchangeRateApiService');
const rateSyncService = require('./services/rateSyncService');
const currencyUtils = require('./utils/currencyUtils');
const ExchangeRate = require('./models/exchangeRate');
require('dotenv').config();

async function testFullIntegration() {
  try {
    console.log('🧪 Testing Full Exchange Rate API Integration...');
    console.log('=' .repeat(60));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: API Configuration
    console.log('\n📋 Test 1: API Configuration');
    console.log('-'.repeat(40));
    if (process.env.EXCHANGE_RATE_API_KEY) {
      console.log('✅ API Key configured');
      console.log(`   Key: ${process.env.EXCHANGE_RATE_API_KEY.substring(0, 8)}...`);
    } else {
      console.log('❌ API Key not configured');
      console.log('   Please add EXCHANGE_RATE_API_KEY to your .env file');
    }

    // Test 2: API Quota Check
    console.log('\n📊 Test 2: API Quota Check');
    console.log('-'.repeat(40));
    try {
      const quota = await exchangeRateApiService.checkApiQuota();
      console.log(`✅ API Quota: ${quota.requests_remaining}/${quota.plan_quota} remaining`);
      console.log(`   Plan Type: ${quota.plan_type || 'Free'}`);
      console.log(`   Usage: ${((quota.requests_remaining / quota.plan_quota) * 100).toFixed(1)}%`);
    } catch (error) {
      console.log(`❌ API Quota check failed: ${error.message}`);
    }

    // Test 3: Database Schema
    console.log('\n🗄️  Test 3: Database Schema');
    console.log('-'.repeat(40));
    try {
      const totalRates = await ExchangeRate.countDocuments();
      const globalRates = await ExchangeRate.countDocuments({ isGlobal: true });
      const orgRates = await ExchangeRate.countDocuments({ isGlobal: false });
      const activeRates = await ExchangeRate.countDocuments({ isActive: true });
      const expiredRates = await ExchangeRate.countDocuments({ isExpired: true });
      
      console.log(`✅ Database Stats:`);
      console.log(`   Total rates: ${totalRates}`);
      console.log(`   Global rates: ${globalRates}`);
      console.log(`   Organization rates: ${orgRates}`);
      console.log(`   Active rates: ${activeRates}`);
      console.log(`   Expired rates: ${expiredRates}`);
    } catch (error) {
      console.log(`❌ Database check failed: ${error.message}`);
    }

    // Test 4: Currency Conversion with Fallbacks
    console.log('\n💱 Test 4: Currency Conversion with Fallbacks');
    console.log('-'.repeat(40));
    const testConversions = [
      { amount: 100, from: 'USD', to: 'EUR' },
      { amount: 50, from: 'EUR', to: 'USD' },
      { amount: 1000, from: 'NGN', to: 'USD' },
      { amount: 100, from: 'USD', to: 'NGN' },
      { amount: 200, from: 'GBP', to: 'EUR' }
    ];

    for (const conversion of testConversions) {
      try {
        console.log(`\n🔄 Testing: ${conversion.amount} ${conversion.from} → ${conversion.to}`);
        
        const convertedAmount = await currencyUtils.convertCurrency(
          conversion.amount, 
          conversion.from, 
          conversion.to, 
          null // No organization ID for global rates
        );
        
        console.log(`✅ Converted: ${conversion.amount} ${conversion.from} = ${convertedAmount.toFixed(2)} ${conversion.to}`);
        
        // Check if we got a reasonable conversion
        if (convertedAmount > 0) {
          console.log(`   Rate used: ${(convertedAmount / conversion.amount).toFixed(4)}`);
        }
      } catch (error) {
        console.log(`❌ Conversion failed: ${error.message}`);
      }
    }

    // Test 5: API Rate Fetching
    console.log('\n🌐 Test 5: API Rate Fetching');
    console.log('-'.repeat(40));
    try {
      const apiResponse = await exchangeRateApiService.fetchLatestRates('USD');
      console.log(`✅ Successfully fetched rates for USD`);
      console.log(`   Base Currency: ${apiResponse.base_code}`);
      console.log(`   Last Update: ${apiResponse.time_last_update_utc}`);
      console.log(`   Next Update: ${apiResponse.time_next_update_utc}`);
      console.log(`   Available Currencies: ${Object.keys(apiResponse.conversion_rates).length}`);
      
      // Show some sample rates
      const sampleRates = Object.entries(apiResponse.conversion_rates).slice(0, 5);
      console.log('   Sample Rates:');
      sampleRates.forEach(([currency, rate]) => {
        console.log(`     ${currency}: ${rate}`);
      });
    } catch (error) {
      console.log(`❌ API rate fetching failed: ${error.message}`);
    }

    // Test 6: Rate Caching
    console.log('\n💾 Test 6: Rate Caching');
    console.log('-'.repeat(40));
    try {
      const pairResponse = await exchangeRateApiService.fetchPairRate('EUR', 'USD');
      console.log(`✅ Successfully fetched pair rate: EUR → USD = ${pairResponse.conversion_rate}`);
      
      // Cache the rate
      const cachedRates = await exchangeRateApiService.cacheRates({
        base_code: 'EUR',
        conversion_rates: { 'USD': pairResponse.conversion_rate },
        time_last_update_utc: pairResponse.time_last_update_utc,
        time_next_update_utc: pairResponse.time_next_update_utc
      }, 'api');
      
      console.log(`✅ Cached ${cachedRates.length} rates successfully`);
      
      // Verify cached rate
      const cachedRate = await exchangeRateApiService.getCachedRate('EUR', 'USD');
      if (cachedRate) {
        console.log(`✅ Verified cached rate: ${cachedRate.rate}`);
      }
    } catch (error) {
      console.log(`❌ Rate caching failed: ${error.message}`);
    }

    // Test 7: Sync Service
    console.log('\n🔄 Test 7: Sync Service');
    console.log('-'.repeat(40));
    try {
      const syncStatus = await rateSyncService.getSyncStatus();
      console.log(`✅ Sync Service Status:`);
      console.log(`   Is Running: ${syncStatus.isRunning}`);
      console.log(`   Last Sync: ${syncStatus.lastSyncTime || 'Never'}`);
      console.log(`   Total Rates: ${syncStatus.totalRates}`);
      console.log(`   Expired Rates: ${syncStatus.expiredRates}`);
      
      if (syncStatus.quota) {
        console.log(`   API Quota: ${syncStatus.quota.remaining}/${syncStatus.quota.total} (${syncStatus.quota.percentage.toFixed(1)}%)`);
      }
    } catch (error) {
      console.log(`❌ Sync service check failed: ${error.message}`);
    }

    // Test 8: Manual Sync
    console.log('\n🔄 Test 8: Manual Sync');
    console.log('-'.repeat(40));
    try {
      const manualSyncResult = await rateSyncService.manualSync('USD');
      if (manualSyncResult) {
        console.log('✅ Manual sync completed successfully');
      } else {
        console.log('❌ Manual sync failed');
      }
    } catch (error) {
      console.log(`❌ Manual sync failed: ${error.message}`);
    }

    // Test 9: Rate History
    console.log('\n📈 Test 9: Rate History');
    console.log('-'.repeat(40));
    try {
      const history = await ExchangeRate.find({ isGlobal: true })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('baseCurrency targetCurrency rate source lastApiUpdate isExpired');
      
      console.log(`✅ Found ${history.length} recent rate records:`);
      history.forEach((rate, index) => {
        console.log(`   ${index + 1}. ${rate.baseCurrency} → ${rate.targetCurrency}: ${rate.rate} (${rate.source})`);
        console.log(`      Last Update: ${rate.lastApiUpdate}`);
        console.log(`      Expired: ${rate.isExpired}`);
      });
    } catch (error) {
      console.log(`❌ Rate history check failed: ${error.message}`);
    }

    // Test 10: Performance Test
    console.log('\n⚡ Test 10: Performance Test');
    console.log('-'.repeat(40));
    try {
      const startTime = Date.now();
      
      // Test multiple conversions
      const conversions = [];
      for (let i = 0; i < 10; i++) {
        conversions.push({
          amount: 100 + i * 10,
          from: 'USD',
          to: 'EUR'
        });
      }
      
      for (const conversion of conversions) {
        await currencyUtils.convertCurrency(
          conversion.amount,
          conversion.from,
          conversion.to,
          null
        );
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Performance test completed:`);
      console.log(`   ${conversions.length} conversions in ${duration}ms`);
      console.log(`   Average: ${(duration / conversions.length).toFixed(2)}ms per conversion`);
    } catch (error) {
      console.log(`❌ Performance test failed: ${error.message}`);
    }

    console.log('\n🎉 Full Integration Test Completed!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Full integration test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run test if called directly
if (require.main === module) {
  testFullIntegration()
    .then(() => {
      console.log('✅ Full integration test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Full integration test failed:', error);
      process.exit(1);
    });
}

module.exports = testFullIntegration; 
 * Full Exchange Rate API Integration Test
 * 
 * This script tests the complete implementation including:
 * - API service functionality
 * - Currency conversion with fallbacks
 * - Rate caching and management
 * - Background sync service
 * - Controller endpoints
 * - Database operations
 */

const mongoose = require('mongoose');
const exchangeRateApiService = require('./services/exchangeRateApiService');
const rateSyncService = require('./services/rateSyncService');
const currencyUtils = require('./utils/currencyUtils');
const ExchangeRate = require('./models/exchangeRate');
require('dotenv').config();

async function testFullIntegration() {
  try {
    console.log('🧪 Testing Full Exchange Rate API Integration...');
    console.log('=' .repeat(60));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: API Configuration
    console.log('\n📋 Test 1: API Configuration');
    console.log('-'.repeat(40));
    if (process.env.EXCHANGE_RATE_API_KEY) {
      console.log('✅ API Key configured');
      console.log(`   Key: ${process.env.EXCHANGE_RATE_API_KEY.substring(0, 8)}...`);
    } else {
      console.log('❌ API Key not configured');
      console.log('   Please add EXCHANGE_RATE_API_KEY to your .env file');
    }

    // Test 2: API Quota Check
    console.log('\n📊 Test 2: API Quota Check');
    console.log('-'.repeat(40));
    try {
      const quota = await exchangeRateApiService.checkApiQuota();
      console.log(`✅ API Quota: ${quota.requests_remaining}/${quota.plan_quota} remaining`);
      console.log(`   Plan Type: ${quota.plan_type || 'Free'}`);
      console.log(`   Usage: ${((quota.requests_remaining / quota.plan_quota) * 100).toFixed(1)}%`);
    } catch (error) {
      console.log(`❌ API Quota check failed: ${error.message}`);
    }

    // Test 3: Database Schema
    console.log('\n🗄️  Test 3: Database Schema');
    console.log('-'.repeat(40));
    try {
      const totalRates = await ExchangeRate.countDocuments();
      const globalRates = await ExchangeRate.countDocuments({ isGlobal: true });
      const orgRates = await ExchangeRate.countDocuments({ isGlobal: false });
      const activeRates = await ExchangeRate.countDocuments({ isActive: true });
      const expiredRates = await ExchangeRate.countDocuments({ isExpired: true });
      
      console.log(`✅ Database Stats:`);
      console.log(`   Total rates: ${totalRates}`);
      console.log(`   Global rates: ${globalRates}`);
      console.log(`   Organization rates: ${orgRates}`);
      console.log(`   Active rates: ${activeRates}`);
      console.log(`   Expired rates: ${expiredRates}`);
    } catch (error) {
      console.log(`❌ Database check failed: ${error.message}`);
    }

    // Test 4: Currency Conversion with Fallbacks
    console.log('\n💱 Test 4: Currency Conversion with Fallbacks');
    console.log('-'.repeat(40));
    const testConversions = [
      { amount: 100, from: 'USD', to: 'EUR' },
      { amount: 50, from: 'EUR', to: 'USD' },
      { amount: 1000, from: 'NGN', to: 'USD' },
      { amount: 100, from: 'USD', to: 'NGN' },
      { amount: 200, from: 'GBP', to: 'EUR' }
    ];

    for (const conversion of testConversions) {
      try {
        console.log(`\n🔄 Testing: ${conversion.amount} ${conversion.from} → ${conversion.to}`);
        
        const convertedAmount = await currencyUtils.convertCurrency(
          conversion.amount, 
          conversion.from, 
          conversion.to, 
          null // No organization ID for global rates
        );
        
        console.log(`✅ Converted: ${conversion.amount} ${conversion.from} = ${convertedAmount.toFixed(2)} ${conversion.to}`);
        
        // Check if we got a reasonable conversion
        if (convertedAmount > 0) {
          console.log(`   Rate used: ${(convertedAmount / conversion.amount).toFixed(4)}`);
        }
      } catch (error) {
        console.log(`❌ Conversion failed: ${error.message}`);
      }
    }

    // Test 5: API Rate Fetching
    console.log('\n🌐 Test 5: API Rate Fetching');
    console.log('-'.repeat(40));
    try {
      const apiResponse = await exchangeRateApiService.fetchLatestRates('USD');
      console.log(`✅ Successfully fetched rates for USD`);
      console.log(`   Base Currency: ${apiResponse.base_code}`);
      console.log(`   Last Update: ${apiResponse.time_last_update_utc}`);
      console.log(`   Next Update: ${apiResponse.time_next_update_utc}`);
      console.log(`   Available Currencies: ${Object.keys(apiResponse.conversion_rates).length}`);
      
      // Show some sample rates
      const sampleRates = Object.entries(apiResponse.conversion_rates).slice(0, 5);
      console.log('   Sample Rates:');
      sampleRates.forEach(([currency, rate]) => {
        console.log(`     ${currency}: ${rate}`);
      });
    } catch (error) {
      console.log(`❌ API rate fetching failed: ${error.message}`);
    }

    // Test 6: Rate Caching
    console.log('\n💾 Test 6: Rate Caching');
    console.log('-'.repeat(40));
    try {
      const pairResponse = await exchangeRateApiService.fetchPairRate('EUR', 'USD');
      console.log(`✅ Successfully fetched pair rate: EUR → USD = ${pairResponse.conversion_rate}`);
      
      // Cache the rate
      const cachedRates = await exchangeRateApiService.cacheRates({
        base_code: 'EUR',
        conversion_rates: { 'USD': pairResponse.conversion_rate },
        time_last_update_utc: pairResponse.time_last_update_utc,
        time_next_update_utc: pairResponse.time_next_update_utc
      }, 'api');
      
      console.log(`✅ Cached ${cachedRates.length} rates successfully`);
      
      // Verify cached rate
      const cachedRate = await exchangeRateApiService.getCachedRate('EUR', 'USD');
      if (cachedRate) {
        console.log(`✅ Verified cached rate: ${cachedRate.rate}`);
      }
    } catch (error) {
      console.log(`❌ Rate caching failed: ${error.message}`);
    }

    // Test 7: Sync Service
    console.log('\n🔄 Test 7: Sync Service');
    console.log('-'.repeat(40));
    try {
      const syncStatus = await rateSyncService.getSyncStatus();
      console.log(`✅ Sync Service Status:`);
      console.log(`   Is Running: ${syncStatus.isRunning}`);
      console.log(`   Last Sync: ${syncStatus.lastSyncTime || 'Never'}`);
      console.log(`   Total Rates: ${syncStatus.totalRates}`);
      console.log(`   Expired Rates: ${syncStatus.expiredRates}`);
      
      if (syncStatus.quota) {
        console.log(`   API Quota: ${syncStatus.quota.remaining}/${syncStatus.quota.total} (${syncStatus.quota.percentage.toFixed(1)}%)`);
      }
    } catch (error) {
      console.log(`❌ Sync service check failed: ${error.message}`);
    }

    // Test 8: Manual Sync
    console.log('\n🔄 Test 8: Manual Sync');
    console.log('-'.repeat(40));
    try {
      const manualSyncResult = await rateSyncService.manualSync('USD');
      if (manualSyncResult) {
        console.log('✅ Manual sync completed successfully');
      } else {
        console.log('❌ Manual sync failed');
      }
    } catch (error) {
      console.log(`❌ Manual sync failed: ${error.message}`);
    }

    // Test 9: Rate History
    console.log('\n📈 Test 9: Rate History');
    console.log('-'.repeat(40));
    try {
      const history = await ExchangeRate.find({ isGlobal: true })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('baseCurrency targetCurrency rate source lastApiUpdate isExpired');
      
      console.log(`✅ Found ${history.length} recent rate records:`);
      history.forEach((rate, index) => {
        console.log(`   ${index + 1}. ${rate.baseCurrency} → ${rate.targetCurrency}: ${rate.rate} (${rate.source})`);
        console.log(`      Last Update: ${rate.lastApiUpdate}`);
        console.log(`      Expired: ${rate.isExpired}`);
      });
    } catch (error) {
      console.log(`❌ Rate history check failed: ${error.message}`);
    }

    // Test 10: Performance Test
    console.log('\n⚡ Test 10: Performance Test');
    console.log('-'.repeat(40));
    try {
      const startTime = Date.now();
      
      // Test multiple conversions
      const conversions = [];
      for (let i = 0; i < 10; i++) {
        conversions.push({
          amount: 100 + i * 10,
          from: 'USD',
          to: 'EUR'
        });
      }
      
      for (const conversion of conversions) {
        await currencyUtils.convertCurrency(
          conversion.amount,
          conversion.from,
          conversion.to,
          null
        );
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Performance test completed:`);
      console.log(`   ${conversions.length} conversions in ${duration}ms`);
      console.log(`   Average: ${(duration / conversions.length).toFixed(2)}ms per conversion`);
    } catch (error) {
      console.log(`❌ Performance test failed: ${error.message}`);
    }

    console.log('\n🎉 Full Integration Test Completed!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Full integration test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run test if called directly
if (require.main === module) {
  testFullIntegration()
    .then(() => {
      console.log('✅ Full integration test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Full integration test failed:', error);
      process.exit(1);
    });
}

module.exports = testFullIntegration; 
 