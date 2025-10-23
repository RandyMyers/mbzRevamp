require('dotenv').config();
const axios = require('axios');

async function testAnalyticsDebug() {
  const baseURL = 'http://localhost:8800';
  const organizationId = '689e0abff0773bdf70c3d41f';
  
  console.log('🔍 Testing Analytics Endpoints with Debug Information');
  console.log('='.repeat(60));
  
  const endpoints = [
    { name: 'Total Revenue', url: `/api/analytics/total-revenue?organizationId=${organizationId}&timeRange=30d` },
    { name: 'Total Orders', url: `/api/analytics/total-orders?organizationId=${organizationId}&timeRange=30d` },
    { name: 'New Customers', url: `/api/analytics/new-customers?organizationId=${organizationId}&timeRange=30d` },
    { name: 'Average Order Value', url: `/api/analytics/average-order-value?organizationId=${organizationId}&timeRange=30d` }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📊 Testing ${endpoint.name}:`);
      console.log(`   URL: ${endpoint.url}`);
      
      const response = await axios.get(`${baseURL}${endpoint.url}`);
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📈 Data:`, JSON.stringify(response.data.data, null, 2));
      
      if (response.data.debug) {
        console.log(`   🔍 Debug Info:`);
        console.log(`      Organization ID: ${response.data.debug.organizationId}`);
        console.log(`      Total in DB: ${response.data.debug.totalOrdersInDB || response.data.debug.totalCustomersInDB || 'N/A'}`);
        console.log(`      For this Org: ${response.data.debug.ordersForOrg || response.data.debug.customersForOrg || 'N/A'}`);
        console.log(`      Has Data: ${response.data.debug.hasData}`);
        if (response.data.debug.issue) {
          console.log(`      ⚠️  Issue: ${response.data.debug.issue}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   📄 Response:`, error.response.data);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Analytics Debug Test Complete');
}

testAnalyticsDebug().catch(console.error);


