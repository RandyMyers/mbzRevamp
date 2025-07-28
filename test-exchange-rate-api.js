/**
 * Test Exchange Rate API Integration
 * 
 * This script tests the Exchange Rate API integration to ensure it's working correctly
 */

const mongoose = require('mongoose');
const exchangeRateApiService = require('./services/exchangeRateApiService');
const currencyUtils = require('./utils/currencyUtils');
require('dotenv').config();

async function testExchangeRateApi() {
  try {
    console.log('🧪 Testing Exchange Rate API Integration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Check API quota
    console.log('\n📊 Test 1: Checking API Quota...');
    try {
      const quota = await exchangeRateApiService.checkApiQuota();
      console.log(`✅ API Quota: ${quota.requests_remaining}/${quota.plan_quota} remaining`);
    } catch (error) {
      console.log(`⚠️  API Quota check failed: ${error.message}`);
    }

    // Test 2: Test currency conversion
    console.log('\n💱 Test 2: Testing Currency Conversion...');
    const testConversions = [
      { amount: 100, from: 'USD', to: 'EUR' },
      { amount: 50, from: 'EUR', to: 'USD' },
      { amount: 1000, from: 'NGN', to: 'USD' },
      { amount: 100, from: 'USD', to: 'NGN' }
    ];

    for (const conversion of testConversions) {
      try {
        console.log(`\n🔄 Testing: ${conversion.amount} ${conversion.from} → ${conversion.to}`);
        
        // Test using currency utils
        const convertedAmount = await currencyUtils.convertCurrency(
          conversion.amount, 
          conversion.from, 
          conversion.to, 
          null // No organization ID for global rates
        );
        
        console.log(`✅ Converted: ${conversion.amount} ${conversion.from} = ${convertedAmount} ${conversion.to}`);
      } catch (error) {
        console.log(`❌ Conversion failed: ${error.message}`);
      }
    }

    // Test 3: Test API rate fetching
    console.log('\n🌐 Test 3: Testing API Rate Fetching...');
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

    // Test 4: Test caching
    console.log('\n💾 Test 4: Testing Rate Caching...');
    try {
      const pairResponse = await exchangeRateApiService.fetchPairRate('EUR', 'USD');
      console.log(`✅ Successfully fetched pair rate: EUR → USD = ${pairResponse.conversion_rate}`);
      
      // Cache the rate
      await exchangeRateApiService.cacheRates({
        base_code: 'EUR',
        conversion_rates: { 'USD': pairResponse.conversion_rate },
        time_last_update_utc: pairResponse.time_last_update_utc,
        time_next_update_utc: pairResponse.time_next_update_utc
      }, 'api');
      
      console.log('✅ Rate cached successfully');
    } catch (error) {
      console.log(`❌ Rate caching failed: ${error.message}`);
    }

    console.log('\n🎉 Exchange Rate API Integration Test Completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run test if called directly
if (require.main === module) {
  testExchangeRateApi()
    .then(() => {
      console.log('✅ Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

module.exports = testExchangeRateApi; 
 * Test Exchange Rate API Integration
 * 
 * This script tests the Exchange Rate API integration to ensure it's working correctly
 */

const mongoose = require('mongoose');
const exchangeRateApiService = require('./services/exchangeRateApiService');
const currencyUtils = require('./utils/currencyUtils');
require('dotenv').config();

async function testExchangeRateApi() {
  try {
    console.log('🧪 Testing Exchange Rate API Integration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Check API quota
    console.log('\n📊 Test 1: Checking API Quota...');
    try {
      const quota = await exchangeRateApiService.checkApiQuota();
      console.log(`✅ API Quota: ${quota.requests_remaining}/${quota.plan_quota} remaining`);
    } catch (error) {
      console.log(`⚠️  API Quota check failed: ${error.message}`);
    }

    // Test 2: Test currency conversion
    console.log('\n💱 Test 2: Testing Currency Conversion...');
    const testConversions = [
      { amount: 100, from: 'USD', to: 'EUR' },
      { amount: 50, from: 'EUR', to: 'USD' },
      { amount: 1000, from: 'NGN', to: 'USD' },
      { amount: 100, from: 'USD', to: 'NGN' }
    ];

    for (const conversion of testConversions) {
      try {
        console.log(`\n🔄 Testing: ${conversion.amount} ${conversion.from} → ${conversion.to}`);
        
        // Test using currency utils
        const convertedAmount = await currencyUtils.convertCurrency(
          conversion.amount, 
          conversion.from, 
          conversion.to, 
          null // No organization ID for global rates
        );
        
        console.log(`✅ Converted: ${conversion.amount} ${conversion.from} = ${convertedAmount} ${conversion.to}`);
      } catch (error) {
        console.log(`❌ Conversion failed: ${error.message}`);
      }
    }

    // Test 3: Test API rate fetching
    console.log('\n🌐 Test 3: Testing API Rate Fetching...');
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

    // Test 4: Test caching
    console.log('\n💾 Test 4: Testing Rate Caching...');
    try {
      const pairResponse = await exchangeRateApiService.fetchPairRate('EUR', 'USD');
      console.log(`✅ Successfully fetched pair rate: EUR → USD = ${pairResponse.conversion_rate}`);
      
      // Cache the rate
      await exchangeRateApiService.cacheRates({
        base_code: 'EUR',
        conversion_rates: { 'USD': pairResponse.conversion_rate },
        time_last_update_utc: pairResponse.time_last_update_utc,
        time_next_update_utc: pairResponse.time_next_update_utc
      }, 'api');
      
      console.log('✅ Rate cached successfully');
    } catch (error) {
      console.log(`❌ Rate caching failed: ${error.message}`);
    }

    console.log('\n🎉 Exchange Rate API Integration Test Completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run test if called directly
if (require.main === module) {
  testExchangeRateApi()
    .then(() => {
      console.log('✅ Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

module.exports = testExchangeRateApi; 
 