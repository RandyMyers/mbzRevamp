const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_STORE_ID = 'your-test-store-id'; // Replace with actual test store ID
const AUTH_TOKEN = 'your-auth-token'; // Replace with actual auth token

// Test function for delete all customers by store
async function testDeleteAllCustomersByStore() {
  try {
    console.log('🧪 Testing DELETE /api/customers/store/:storeId');
    
    const response = await axios.delete(`${BASE_URL}/customers/store/${TEST_STORE_ID}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        syncToWooCommerce: false // Set to true if you want to test WooCommerce sync
      }
    });
    
    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Test function for delete all orders by store
async function testDeleteAllOrdersByStore() {
  try {
    console.log('🧪 Testing DELETE /api/orders/store/:storeId');
    
    const response = await axios.delete(`${BASE_URL}/orders/store/${TEST_STORE_ID}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        syncToWooCommerce: false // Set to true if you want to test WooCommerce sync
      }
    });
    
    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Test function for delete all products by store (existing endpoint)
async function testDeleteAllProductsByStore() {
  try {
    console.log('🧪 Testing DELETE /api/inventory/store/:storeId');
    
    const response = await axios.delete(`${BASE_URL}/inventory/store/${TEST_STORE_ID}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API endpoint tests...\n');
  
  try {
    // Test delete all customers
    await testDeleteAllCustomersByStore();
    console.log('\n');
    
    // Test delete all orders
    await testDeleteAllOrdersByStore();
    console.log('\n');
    
    // Test delete all products
    await testDeleteAllProductsByStore();
    console.log('\n');
    
    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('⚠️  WARNING: This will delete ALL data for the specified store!');
  console.log('⚠️  Make sure you have set the correct TEST_STORE_ID and AUTH_TOKEN');
  console.log('⚠️  Only run this on test data!\n');
  
  // Uncomment the line below to run tests
  // runTests();
  
  console.log('🔒 Tests are disabled by default for safety.');
  console.log('🔓 To run tests, uncomment the runTests() call in this file.');
}

module.exports = {
  testDeleteAllCustomersByStore,
  testDeleteAllOrdersByStore,
  testDeleteAllProductsByStore,
  runTests
}; 