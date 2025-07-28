const axios = require('axios');

const BASE_URL = 'http://localhost:8800';

async function testOrdersAPI() {
  try {
    console.log('🧪 Testing Orders API with new summary data...');
    
    // Test the getAllOrdersByOrganization endpoint
    const organizationId = '507f1f77bcf86cd799439011'; // Example organization ID
    const userId = '507f1f77bcf86cd799439012'; // Example user ID
    const displayCurrency = 'USD';
    
    const url = `${BASE_URL}/api/orders/organization/${organizationId}?userId=${userId}&displayCurrency=${displayCurrency}`;
    
    console.log('📡 Making request to:', url);
    
    const response = await axios.get(url);
    
    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Orders count:', response.data.orders?.length || 0);
    console.log('Summary data:', response.data.summary);
    
    if (response.data.summary) {
      console.log('📊 Summary Stats:');
      console.log('  Total Orders:', response.data.summary.totalOrders);
      console.log('  Total Revenue:', response.data.summary.totalRevenue);
      console.log('  Currency:', response.data.summary.currency);
    } else {
      console.log('⚠️ No summary data found in response');
    }
    
  } catch (error) {
    console.error('❌ Error testing Orders API:', error.response?.data || error.message);
  }
}

// Run the test
testOrdersAPI(); 

const BASE_URL = 'http://localhost:8800';

async function testOrdersAPI() {
  try {
    console.log('🧪 Testing Orders API with new summary data...');
    
    // Test the getAllOrdersByOrganization endpoint
    const organizationId = '507f1f77bcf86cd799439011'; // Example organization ID
    const userId = '507f1f77bcf86cd799439012'; // Example user ID
    const displayCurrency = 'USD';
    
    const url = `${BASE_URL}/api/orders/organization/${organizationId}?userId=${userId}&displayCurrency=${displayCurrency}`;
    
    console.log('📡 Making request to:', url);
    
    const response = await axios.get(url);
    
    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Orders count:', response.data.orders?.length || 0);
    console.log('Summary data:', response.data.summary);
    
    if (response.data.summary) {
      console.log('📊 Summary Stats:');
      console.log('  Total Orders:', response.data.summary.totalOrders);
      console.log('  Total Revenue:', response.data.summary.totalRevenue);
      console.log('  Currency:', response.data.summary.currency);
    } else {
      console.log('⚠️ No summary data found in response');
    }
    
  } catch (error) {
    console.error('❌ Error testing Orders API:', error.response?.data || error.message);
  }
}

// Run the test
testOrdersAPI(); 
 