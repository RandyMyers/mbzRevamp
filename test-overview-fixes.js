const axios = require('axios');

const BASE_URL = 'http://localhost:8800/api';

async function testOverviewFixes() {
  console.log('🧪 Testing Overview Endpoint Fixes...\n');

  try {
    // Test 1: Get overview stats with currency support
    console.log('1️⃣ Testing overview stats with multi-currency support...');
    const response = await axios.get(`${BASE_URL}/overview/stats/test-user-id`, {
      params: {
        displayCurrency: 'USD'
      }
    });

    if (response.data.success) {
      const { data } = response.data;
      console.log('✅ Overview stats retrieved successfully');
      console.log('📊 Stats:');
      console.log(`   - Total Revenue: ${data.currency}${data.totalRevenue?.toLocaleString()}`);
      console.log(`   - Total Orders: ${data.totalOrders?.toLocaleString()}`);
      console.log(`   - Total Customers: ${data.totalCustomers?.toLocaleString()}`);
      console.log(`   - Average Order Value: ${data.currency}${data.averageOrderValue?.toFixed(2)}`);
      console.log(`   - Currency: ${data.currency}`);
      console.log(`   - Revenue Breakdown:`, data.revenueBreakdown);
      
      // Check stock status distribution
      if (data.stockStatusDistribution && data.stockStatusDistribution.length > 0) {
        console.log('✅ Stock Status Distribution found:');
        data.stockStatusDistribution.forEach(status => {
          console.log(`   - ${status.name}: ${status.value} products (${status.percentage?.toFixed(1)}%)`);
        });
      } else {
        console.log('⚠️  No stock status distribution data');
      }

      // Check top products
      if (data.topProducts && data.topProducts.length > 0) {
        console.log('✅ Top Products found:');
        data.topProducts.slice(0, 3).forEach(product => {
          console.log(`   - ${product.name}: ${data.currency}${product.revenue?.toLocaleString()}`);
        });
      } else {
        console.log('⚠️  No top products data');
      }

    } else {
      console.log('❌ Failed to get overview stats:', response.data.error);
    }

    // Test 2: Test with different currency
    console.log('\n2️⃣ Testing with EUR currency...');
    const eurResponse = await axios.get(`${BASE_URL}/overview/stats/test-user-id`, {
      params: {
        displayCurrency: 'EUR'
      }
    });

    if (eurResponse.data.success) {
      console.log('✅ EUR currency test successful');
      console.log(`   - Currency: ${eurResponse.data.data.currency}`);
      console.log(`   - Total Revenue: ${eurResponse.data.data.currency}${eurResponse.data.data.totalRevenue?.toLocaleString()}`);
    } else {
      console.log('❌ EUR currency test failed:', eurResponse.data.error);
    }

    // Test 3: Test without currency parameter (should use default)
    console.log('\n3️⃣ Testing without currency parameter...');
    const defaultResponse = await axios.get(`${BASE_URL}/overview/stats/test-user-id`);

    if (defaultResponse.data.success) {
      console.log('✅ Default currency test successful');
      console.log(`   - Default Currency: ${defaultResponse.data.data.currency}`);
    } else {
      console.log('❌ Default currency test failed:', defaultResponse.data.error);
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testOverviewFixes(); 

const BASE_URL = 'http://localhost:8800/api';

async function testOverviewFixes() {
  console.log('🧪 Testing Overview Endpoint Fixes...\n');

  try {
    // Test 1: Get overview stats with currency support
    console.log('1️⃣ Testing overview stats with multi-currency support...');
    const response = await axios.get(`${BASE_URL}/overview/stats/test-user-id`, {
      params: {
        displayCurrency: 'USD'
      }
    });

    if (response.data.success) {
      const { data } = response.data;
      console.log('✅ Overview stats retrieved successfully');
      console.log('📊 Stats:');
      console.log(`   - Total Revenue: ${data.currency}${data.totalRevenue?.toLocaleString()}`);
      console.log(`   - Total Orders: ${data.totalOrders?.toLocaleString()}`);
      console.log(`   - Total Customers: ${data.totalCustomers?.toLocaleString()}`);
      console.log(`   - Average Order Value: ${data.currency}${data.averageOrderValue?.toFixed(2)}`);
      console.log(`   - Currency: ${data.currency}`);
      console.log(`   - Revenue Breakdown:`, data.revenueBreakdown);
      
      // Check stock status distribution
      if (data.stockStatusDistribution && data.stockStatusDistribution.length > 0) {
        console.log('✅ Stock Status Distribution found:');
        data.stockStatusDistribution.forEach(status => {
          console.log(`   - ${status.name}: ${status.value} products (${status.percentage?.toFixed(1)}%)`);
        });
      } else {
        console.log('⚠️  No stock status distribution data');
      }

      // Check top products
      if (data.topProducts && data.topProducts.length > 0) {
        console.log('✅ Top Products found:');
        data.topProducts.slice(0, 3).forEach(product => {
          console.log(`   - ${product.name}: ${data.currency}${product.revenue?.toLocaleString()}`);
        });
      } else {
        console.log('⚠️  No top products data');
      }

    } else {
      console.log('❌ Failed to get overview stats:', response.data.error);
    }

    // Test 2: Test with different currency
    console.log('\n2️⃣ Testing with EUR currency...');
    const eurResponse = await axios.get(`${BASE_URL}/overview/stats/test-user-id`, {
      params: {
        displayCurrency: 'EUR'
      }
    });

    if (eurResponse.data.success) {
      console.log('✅ EUR currency test successful');
      console.log(`   - Currency: ${eurResponse.data.data.currency}`);
      console.log(`   - Total Revenue: ${eurResponse.data.data.currency}${eurResponse.data.data.totalRevenue?.toLocaleString()}`);
    } else {
      console.log('❌ EUR currency test failed:', eurResponse.data.error);
    }

    // Test 3: Test without currency parameter (should use default)
    console.log('\n3️⃣ Testing without currency parameter...');
    const defaultResponse = await axios.get(`${BASE_URL}/overview/stats/test-user-id`);

    if (defaultResponse.data.success) {
      console.log('✅ Default currency test successful');
      console.log(`   - Default Currency: ${defaultResponse.data.data.currency}`);
    } else {
      console.log('❌ Default currency test failed:', defaultResponse.data.error);
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testOverviewFixes(); 
 