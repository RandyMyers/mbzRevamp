require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/users');
const Order = require('./models/order');
const Product = require('./models/inventory');
const currencyUtils = require('./utils/currencyUtils');

async function testCurrencyAnalytics() {
  try {
    console.log('🧪 TESTING CURRENCY ANALYTICS ISSUE');
    console.log('='.repeat(60));
    
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');
    
    // Test with the organization that has data
    const orgWithData = '67f504af91eae487185de080';
    const targetOrg = '689e0abff0773bdf70c3d41f';
    
    console.log(`\n🎯 TESTING ORGANIZATION: ${orgWithData}`);
    console.log('📊 This organization has multi-currency orders');
    
    // Test 1: Check User Currency Settings
    console.log('\n👤 TESTING USER CURRENCY SETTINGS:');
    console.log('='.repeat(40));
    
    const users = await User.find({ organizationId: orgWithData }).select('displayCurrency email');
    console.log(`👥 Users in organization: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      Display Currency: ${user.displayCurrency || 'Not set'}`);
    });
    
    // Test 2: Check Organization Currency Settings
    console.log('\n🏢 TESTING ORGANIZATION CURRENCY SETTINGS:');
    console.log('='.repeat(40));
    
    const Organization = require('./models/organization');
    const organization = await Organization.findById(orgWithData).select('analyticsCurrency defaultCurrency name');
    
    if (organization) {
      console.log(`🏢 Organization: ${organization.name}`);
      console.log(`   Analytics Currency: ${organization.analyticsCurrency || 'Not set'}`);
      console.log(`   Default Currency: ${organization.defaultCurrency || 'Not set'}`);
    } else {
      console.log('❌ Organization not found');
    }
    
    // Test 3: Check Orders Currency Distribution
    console.log('\n💱 TESTING ORDERS CURRENCY DISTRIBUTION:');
    console.log('='.repeat(40));
    
    const currencyPipeline = [
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
    
    const currencyResult = await Order.aggregate(currencyPipeline);
    console.log('💱 Orders by Currency:');
    currencyResult.forEach(currency => {
      console.log(`   ${currency._id || 'Unknown'}: ${currency.count} orders, $${currency.totalRevenue.toFixed(2)} revenue`);
    });
    
    // Test 4: Test Currency Conversion
    console.log('\n🔄 TESTING CURRENCY CONVERSION:');
    console.log('='.repeat(40));
    
    // Get user's display currency
    const userDisplayCurrency = users.length > 0 ? users[0].displayCurrency : 'USD';
    const orgAnalyticsCurrency = organization?.analyticsCurrency || 'USD';
    const targetCurrency = userDisplayCurrency || orgAnalyticsCurrency || 'USD';
    
    console.log(`🎯 Target Currency: ${targetCurrency}`);
    console.log(`👤 User Display Currency: ${userDisplayCurrency || 'Not set'}`);
    console.log(`🏢 Org Analytics Currency: ${orgAnalyticsCurrency || 'Not set'}`);
    
    // Test currency conversion for each currency
    for (const currencyData of currencyResult) {
      const fromCurrency = currencyData._id;
      const amount = currencyData.totalRevenue;
      
      if (fromCurrency && fromCurrency !== targetCurrency) {
        try {
          console.log(`\n🔄 Converting ${fromCurrency} ${amount.toFixed(2)} to ${targetCurrency}:`);
          
          // Test exchange rate lookup
          const exchangeRate = await currencyUtils.getExchangeRate(orgWithData, fromCurrency, targetCurrency);
          console.log(`   Exchange Rate: ${exchangeRate || 'Not available'}`);
          
          if (exchangeRate) {
            const convertedAmount = amount * exchangeRate;
            console.log(`   Converted Amount: ${targetCurrency} ${convertedAmount.toFixed(2)}`);
          } else {
            console.log(`   ❌ Exchange rate not available for ${fromCurrency} → ${targetCurrency}`);
          }
        } catch (error) {
          console.log(`   ❌ Error converting ${fromCurrency}: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${fromCurrency} ${amount.toFixed(2)} (already in target currency)`);
      }
    }
    
    // Test 5: Test Multi-Currency Revenue Pipeline
    console.log('\n📊 TESTING MULTI-CURRENCY REVENUE PIPELINE:');
    console.log('='.repeat(40));
    
    try {
      const revenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(
        orgWithData,
        targetCurrency,
        { status: { $nin: ['cancelled', 'refunded'] } }
      );
      
      console.log('📊 Revenue Pipeline Created');
      console.log(`   Target Currency: ${targetCurrency}`);
      console.log(`   Organization: ${orgWithData}`);
      
      const revenueResults = await Order.aggregate(revenuePipeline);
      console.log(`   Pipeline Results: ${revenueResults.length} currency groups`);
      
      if (revenueResults.length > 0) {
        const revenueSummary = await currencyUtils.processMultiCurrencyResults(
          revenueResults, 
          targetCurrency, 
          orgWithData
        );
        
        console.log('📊 Revenue Summary:');
        console.log(`   Total Converted: ${targetCurrency} ${revenueSummary.totalConverted.toFixed(2)}`);
        console.log(`   Currency Breakdown:`);
        
        Object.entries(revenueSummary.currencyBreakdown).forEach(([currency, data]) => {
          console.log(`     ${currency}: ${data.originalAmount.toFixed(2)} → ${data.convertedAmount.toFixed(2)} (${data.orderCount} orders)`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error testing revenue pipeline: ${error.message}`);
    }
    
    // Test 6: Check Product Currency
    console.log('\n📦 TESTING PRODUCT CURRENCY:');
    console.log('='.repeat(40));
    
    const productCurrencyPipeline = [
      {
        $match: { organizationId: new mongoose.Types.ObjectId(orgWithData) }
      },
      {
        $group: {
          _id: '$currency',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ];
    
    const productCurrencyResult = await Product.aggregate(productCurrencyPipeline);
    console.log('📦 Products by Currency:');
    productCurrencyResult.forEach(currency => {
      console.log(`   ${currency._id || 'Unknown'}: ${currency.count} products`);
    });
    
    // Test 7: Sample Orders with Currency
    console.log('\n📋 SAMPLE ORDERS WITH CURRENCY:');
    console.log('='.repeat(40));
    
    const sampleOrders = await Order.find({ 
      organizationId: orgWithData 
    }).limit(3).select('total currency date_created status').lean();
    
    if (sampleOrders.length > 0) {
      sampleOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. Order ${order._id}`);
        console.log(`   Total: ${order.currency} ${order.total}`);
        console.log(`   Currency: ${order.currency}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Date: ${order.date_created}`);
      });
    } else {
      console.log('❌ No orders found for this organization');
    }
    
    // Test 8: Currency Issue Analysis
    console.log('\n🚨 CURRENCY ISSUE ANALYSIS:');
    console.log('='.repeat(40));
    
    const issues = [];
    
    if (!userDisplayCurrency && !orgAnalyticsCurrency) {
      issues.push('❌ No user or organization currency preference set');
    }
    
    if (currencyResult.length > 1) {
      issues.push(`❌ Multiple currencies found: ${currencyResult.length} different currencies`);
    }
    
    if (currencyResult.some(c => c._id !== targetCurrency)) {
      issues.push('❌ Orders exist in currencies other than target currency');
    }
    
    if (issues.length === 0) {
      console.log('✅ No currency issues found');
    } else {
      console.log('Issues found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    // Test 9: Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('='.repeat(40));
    
    console.log('1. Set user display currency:');
    if (users.length > 0) {
      console.log(`   Update user ${users[0].email} displayCurrency to preferred currency`);
    }
    
    console.log('2. Set organization analytics currency:');
    if (organization) {
      console.log(`   Update organization ${organization.name} analyticsCurrency`);
    }
    
    console.log('3. Frontend should pass displayCurrency parameter:');
    console.log('   /analytics/total-revenue?organizationId=...&displayCurrency=USD');
    
    console.log('4. Test currency conversion with different base currencies');
    
    console.log('\n🎯 CURRENCY ANALYTICS TEST COMPLETE!');
    console.log('='.repeat(60));
    console.log('✅ Currency analytics issue identified and analyzed');
    console.log('✅ Recommendations provided for fixing currency conversion');
    console.log('✅ Multi-currency support needs frontend parameter passing');
    
  } catch (error) {
    console.error('❌ Error testing currency analytics:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testCurrencyAnalytics();
