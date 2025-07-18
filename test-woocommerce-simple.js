// Test 1: Check if WooCommerceRestApi import works
console.log('=== Test 1: WooCommerceRestApi Import ===');
try {
  const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
  console.log('✅ WooCommerceRestApi imported successfully');
  console.log('Type:', typeof WooCommerceRestApi);
} catch (error) {
  console.error('❌ WooCommerceRestApi import failed:', error.message);
}

// Test 2: Check if we can create a simple class with makeRequest
console.log('\n=== Test 2: Simple Class Test ===');
class SimpleWooCommerceService {
  constructor(store) {
    this.store = store;
  }
  
  async makeRequest(method, endpoint, params = {}) {
    console.log('makeRequest called with:', method, endpoint, params);
    return { success: true, data: [] };
  }
}

const simpleWc = new SimpleWooCommerceService({ name: 'test' });
console.log('✅ SimpleWooCommerceService created');
console.log('makeRequest exists:', typeof simpleWc.makeRequest);
console.log('makeRequest is function:', typeof simpleWc.makeRequest === 'function');

// Test 3: Check the actual WooCommerceService
console.log('\n=== Test 3: Actual WooCommerceService ===');
try {
  const WooCommerceService = require('./services/wooCommerceService');
  console.log('✅ WooCommerceService imported');
  
  const testStore = {
    _id: 'test',
    name: 'test',
    url: 'https://test.com',
    apiKey: 'test',
    secretKey: 'test'
  };
  
  const wc = new WooCommerceService(testStore);
  console.log('✅ WooCommerceService instance created');
  console.log('makeRequest exists:', typeof wc.makeRequest);
  console.log('makeRequest is function:', typeof wc.makeRequest === 'function');
  
  // List all methods
  console.log('All methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(wc)));
  
} catch (error) {
  console.error('❌ WooCommerceService test failed:', error.message);
} 