require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/inventory');
const Order = require('./models/order');
const User = require('./models/users');
const Organization = require('./models/organization');
const currencyUtils = require('./utils/currencyUtils');

async function testCurrencySyncConversion() {
  try {
    console.log('🧪 TESTING CURRENCY SYNC CONVERSION');
    console.log('='.repeat(60));
    
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');
    
    // Test with the organization that has data
    const orgWithData = '67f504af91eae487185de080';
    
    console.log(`\n🎯 TESTING ORGANIZATION: ${orgWithData}`);
    console.log('📊 Checking if currency conversion is happening during sync');
    
    // Test 1: Check User/Organization Currency Settings
    console.log('\n👤 TESTING USER/ORGANIZATION CURRENCY SETTINGS:');
    console.log('='.repeat(50));
    
    const users = await User.find({ organizationId: orgWithData }).select('displayCurrency email');
    const organization = await Organization.findById(orgWithData).select('analyticsCurrency defaultCurrency name');
    
    console.log(`👥 Users in organization: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - Display Currency: ${user.displayCurrency || 'Not set'}`);
    });
    
    console.log(`\n🏢 Organization: ${organization?.name || 'Unknown'}`);
    console.log(`   Analytics Currency: ${organization?.analyticsCurrency || 'Not set'}`);
    console.log(`   Default Currency: ${organization?.defaultCurrency || 'Not set'}`);
    
    const targetCurrency = users[0]?.displayCurrency || organization?.analyticsCurrency || organization?.defaultCurrency || 'USD';
    console.log(`\n🎯 Target Currency for Conversion: ${targetCurrency}`);
    
    // Test 2: Check Product Currency Conversion
    console.log('\n📦 TESTING PRODUCT CURRENCY CONVERSION:');
    console.log('='.repeat(50));
    
    // Check if products have currency field
    const productSample = await Product.findOne({ organizationId: orgWithData }).select('name price currency').lean();
    console.log('📦 Sample Product:');
    if (productSample) {
      console.log(`   Name: ${productSample.name}`);
      console.log(`   Price: ${productSample.price}`);
      console.log(`   Currency: ${productSample.currency || 'Not set'}`);
    } else {
      console.log('   ❌ No products found');
    }
    
    // Check if products are stored with original currency or converted
    const productCurrencyPipeline = [
      {
        $match: { organizationId: new mongoose.Types.ObjectId(orgWithData) }
      },
      {
        $group: {
          _id: '$currency',
          count: { $sum: 1 },
          avgPrice: { $avg: { $toDouble: '$price' } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ];
    
    const productCurrencyResult = await Product.aggregate(productCurrencyPipeline);
    console.log('\n📦 Products by Currency:');
    productCurrencyResult.forEach(currency => {
      console.log(`   ${currency._id || 'Unknown'}: ${currency.count} products, avg price: ${currency.avgPrice?.toFixed(2) || 'N/A'}`);
    });
    
    // Test 3: Check Order Currency Conversion
    console.log('\n📦 TESTING ORDER CURRENCY CONVERSION:');
    console.log('='.repeat(50));
    
    // Check if orders have currency field
    const orderSample = await Order.findOne({ organizationId: orgWithData }).select('total currency').lean();
    console.log('📦 Sample Order:');
    if (orderSample) {
      console.log(`   Total: ${orderSample.total}`);
      console.log(`   Currency: ${orderSample.currency}`);
    } else {
      console.log('   ❌ No orders found');
    }
    
    // Check if orders are stored with original currency or converted
    const orderCurrencyPipeline = [
      {
        $match: { organizationId: new mongoose.Types.ObjectId(orgWithData) }
      },
      {
        $group: {
          _id: '$currency',
          count: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: [{ $type: "$total" }, "string"] },
                { $toDouble: "$total" },
                "$total"
              ]
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ];
    
    const orderCurrencyResult = await Order.aggregate(orderCurrencyPipeline);
    console.log('\n📦 Orders by Currency:');
    orderCurrencyResult.forEach(currency => {
      console.log(`   ${currency._id || 'Unknown'}: ${currency.count} orders, total: ${currency.totalRevenue.toFixed(2)}`);
    });
    
    // Test 4: Check if Conversion is Happening
    console.log('\n🔄 TESTING CURRENCY CONVERSION DURING SYNC:');
    console.log('='.repeat(50));
    
    const hasMultipleCurrencies = orderCurrencyResult.length > 1 || productCurrencyResult.length > 1;
    const hasTargetCurrency = orderCurrencyResult.some(c => c._id === targetCurrency) || productCurrencyResult.some(c => c._id === targetCurrency);
    
    console.log(`🔍 Multiple currencies found: ${hasMultipleCurrencies ? 'YES' : 'NO'}`);
    console.log(`🔍 Target currency (${targetCurrency}) found: ${hasTargetCurrency ? 'YES' : 'NO'}`);
    
    if (hasMultipleCurrencies && !hasTargetCurrency) {
      console.log('❌ ISSUE: Multiple currencies found but target currency not present');
      console.log('   This suggests currency conversion is NOT happening during sync');
    } else if (hasMultipleCurrencies && hasTargetCurrency) {
      console.log('✅ Currency conversion appears to be working');
    } else {
      console.log('ℹ️  Only one currency found - no conversion needed');
    }
    
    // Test 5: Check WooCommerce Sync Process
    console.log('\n🛒 TESTING WOOCOMMERCE SYNC PROCESS:');
    console.log('='.repeat(50));
    
    // Check if we have WooCommerce-specific fields
    const wooCommerceProducts = await Product.find({ 
      organizationId: orgWithData,
      wooCommerceId: { $exists: true }
    }).limit(3).select('name price currency wooCommerceId').lean();
    
    console.log('🛒 WooCommerce Products:');
    wooCommerceProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      Price: ${product.price}`);
      console.log(`      Currency: ${product.currency || 'Not set'}`);
      console.log(`      WooCommerce ID: ${product.wooCommerceId || 'Not set'}`);
    });
    
    // Test 6: Check if Prices Should Be Converted
    console.log('\n💰 TESTING PRICE CONVERSION LOGIC:');
    console.log('='.repeat(50));
    
    if (orderCurrencyResult.length > 0) {
      const nonTargetCurrencies = orderCurrencyResult.filter(c => c._id !== targetCurrency);
      
      if (nonTargetCurrencies.length > 0) {
        console.log('❌ CURRENCY CONVERSION ISSUE IDENTIFIED:');
        console.log(`   Orders exist in currencies other than target currency (${targetCurrency})`);
        
        nonTargetCurrencies.forEach(currency => {
          console.log(`   - ${currency._id}: ${currency.count} orders, ${currency.totalRevenue.toFixed(2)} total`);
        });
        
        console.log('\n💡 EXPECTED BEHAVIOR:');
        console.log('   During WooCommerce sync, prices should be converted to user base currency');
        console.log('   Example: If user base currency is USD and WooCommerce has NGN prices:');
        console.log('   - NGN 1000 → USD 0.68 (using exchange rate)');
        console.log('   - Store converted price in database');
        
        console.log('\n🔧 REQUIRED FIXES:');
        console.log('   1. Update syncProductWorker.js to convert product prices');
        console.log('   2. Update syncOrderWorker.js to convert order amounts');
        console.log('   3. Get user/organization base currency during sync');
        console.log('   4. Use exchange rate API to convert prices');
        console.log('   5. Store converted prices in database');
      } else {
        console.log('✅ All orders are in target currency - no conversion needed');
      }
    }
    
    // Test 7: Check Product Price Conversion
    console.log('\n📦 TESTING PRODUCT PRICE CONVERSION:');
    console.log('='.repeat(50));
    
    if (productCurrencyResult.length > 0) {
      const nonTargetProductCurrencies = productCurrencyResult.filter(c => c._id !== targetCurrency);
      
      if (nonTargetProductCurrencies.length > 0) {
        console.log('❌ PRODUCT PRICE CONVERSION ISSUE IDENTIFIED:');
        console.log(`   Products exist in currencies other than target currency (${targetCurrency})`);
        
        nonTargetProductCurrencies.forEach(currency => {
          console.log(`   - ${currency._id}: ${currency.count} products, avg price: ${currency.avgPrice?.toFixed(2) || 'N/A'}`);
        });
        
        console.log('\n💡 EXPECTED BEHAVIOR:');
        console.log('   During WooCommerce sync, product prices should be converted to user base currency');
        console.log('   Example: If user base currency is USD and WooCommerce has NGN prices:');
        console.log('   - Product price NGN 5000 → USD 3.42 (using exchange rate)');
        console.log('   - Store converted price in database');
      } else {
        console.log('✅ All products are in target currency - no conversion needed');
      }
    }
    
    // Test 8: Summary and Recommendations
    console.log('\n📋 SUMMARY AND RECOMMENDATIONS:');
    console.log('='.repeat(50));
    
    const issues = [];
    
    if (hasMultipleCurrencies && !hasTargetCurrency) {
      issues.push('❌ Currency conversion not happening during sync');
    }
    
    if (orderCurrencyResult.some(c => c._id !== targetCurrency)) {
      issues.push('❌ Orders stored in original currencies instead of base currency');
    }
    
    if (productCurrencyResult.some(c => c._id !== targetCurrency)) {
      issues.push('❌ Products stored in original currencies instead of base currency');
    }
    
    if (issues.length === 0) {
      console.log('✅ Currency conversion appears to be working correctly');
    } else {
      console.log('🚨 CURRENCY CONVERSION ISSUES FOUND:');
      issues.forEach(issue => console.log(`   ${issue}`));
      
      console.log('\n🔧 REQUIRED FIXES:');
      console.log('   1. Update syncProductWorker.js to convert product prices during sync');
      console.log('   2. Update syncOrderWorker.js to convert order amounts during sync');
      console.log('   3. Get user/organization base currency in sync workers');
      console.log('   4. Use currencyUtils to convert prices during sync');
      console.log('   5. Store converted prices in database');
      console.log('   6. Add currency field to product model if missing');
    }
    
    console.log('\n🎯 CURRENCY SYNC CONVERSION TEST COMPLETE!');
    console.log('='.repeat(60));
    console.log('✅ Currency sync conversion analysis complete');
    console.log('✅ Issues identified and recommendations provided');
    
  } catch (error) {
    console.error('❌ Error testing currency sync conversion:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testCurrencySyncConversion();


