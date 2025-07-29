/**
 * Test Currency Integration
 * 
 * This script tests the integration of currency.txt with the application
 * to ensure all supported currencies are properly loaded and available
 */

const currencyList = require('./utils/currencyList');

async function testCurrencyIntegration() {
  console.log('🧪 Testing Currency Integration...\n');

  try {
    // Test 1: Get all supported currencies
    console.log('📋 Test 1: Getting all supported currencies...');
    const allCurrencies = currencyList.getSupportedCurrencies();
    console.log(`✅ Found ${allCurrencies.length} supported currencies`);
    
    // Show first 10 currencies as sample
    console.log('📝 Sample currencies:');
    allCurrencies.slice(0, 10).forEach(currency => {
      console.log(`   ${currency.code} - ${currency.name} (${currency.country})`);
    });
    console.log(`   ... and ${allCurrencies.length - 10} more currencies\n`);

    // Test 2: Get currency codes only
    console.log('📋 Test 2: Getting currency codes...');
    const currencyCodes = currencyList.getCurrencyCodes();
    console.log(`✅ Found ${currencyCodes.length} currency codes`);
    console.log(`📝 First 10 codes: ${currencyCodes.slice(0, 10).join(', ')}\n`);

    // Test 3: Validate specific currencies
    console.log('📋 Test 3: Validating specific currencies...');
    const testCurrencies = ['USD', 'EUR', 'NGN', 'INVALID', 'XYZ', 'JPY', 'GBP'];
    
    testCurrencies.forEach(code => {
      const isValid = currencyList.isValidCurrencyCode(code);
      const currency = currencyList.getCurrencyByCode(code);
      console.log(`   ${code}: ${isValid ? '✅ Valid' : '❌ Invalid'} ${currency ? `(${currency.name})` : ''}`);
    });
    console.log('');

    // Test 4: Get popular currencies
    console.log('📋 Test 4: Getting popular currencies...');
    const popularCurrencies = currencyList.getPopularCurrencies();
    console.log(`✅ Found ${popularCurrencies.length} popular currencies:`);
    popularCurrencies.forEach(currency => {
      console.log(`   ${currency.code} - ${currency.name}`);
    });
    console.log('');

    // Test 5: Get currencies by region
    console.log('📋 Test 5: Getting currencies by region...');
    const regions = ['Europe', 'Asia', 'Africa', 'Americas', 'Oceania'];
    
    regions.forEach(region => {
      const regionalCurrencies = currencyList.getCurrenciesByRegion(region);
      console.log(`   ${region}: ${regionalCurrencies.length} currencies`);
      regionalCurrencies.slice(0, 5).forEach(currency => {
        console.log(`     ${currency.code} - ${currency.name}`);
      });
      if (regionalCurrencies.length > 5) {
        console.log(`     ... and ${regionalCurrencies.length - 5} more`);
      }
    });
    console.log('');

    // Test 6: Check specific important currencies
    console.log('📋 Test 6: Checking important currencies...');
    const importantCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR'];
    
    importantCurrencies.forEach(code => {
      const currency = currencyList.getCurrencyByCode(code);
      if (currency) {
        console.log(`   ✅ ${code} - ${currency.name} (${currency.country})`);
      } else {
        console.log(`   ❌ ${code} - Not found in currency list`);
      }
    });
    console.log('');

    // Test 7: Performance test
    console.log('📋 Test 7: Performance test...');
    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
      currencyList.isValidCurrencyCode('USD');
    }
    const endTime = Date.now();
    console.log(`✅ 1000 validation checks completed in ${endTime - startTime}ms`);
    console.log('');

    console.log('🎉 Currency Integration Test Completed Successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Total supported currencies: ${allCurrencies.length}`);
    console.log(`   - Popular currencies: ${popularCurrencies.length}`);
    console.log(`   - Validation performance: ${endTime - startTime}ms for 1000 checks`);

  } catch (error) {
    console.error('❌ Currency Integration Test Failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCurrencyIntegration()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = testCurrencyIntegration;