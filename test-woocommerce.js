const WooCommerceService = require('./services/wooCommerceService');

// Test store object
const testStore = {
  _id: '67f5d8ce41caa78595f08fb8',
  name: 'trendykool',
  url: 'https://trendykool.com',
  apiKey: 'ck_b6c0faee6adb94702023fcb3b3fd66656a256759',
  secretKey: 'cs_bb993b55c3adb0b2cb412bc825c99da3f3afe0a0',
  platformType: 'woocommerce'
};

console.log('Testing WooCommerceService...');
console.log('WooCommerceService type:', typeof WooCommerceService);
console.log('WooCommerceService constructor:', typeof WooCommerceService);

try {
  const wc = new WooCommerceService(testStore);
  console.log('WooCommerceService instance created:', typeof wc);
  console.log('makeRequest method exists:', typeof wc.makeRequest);
  console.log('makeRequest is function:', typeof wc.makeRequest === 'function');
  
  // List all available methods
  console.log('Available methods on wc instance:');
  console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(wc)));
  
  // Check if makeRequest is in the prototype
  console.log('makeRequest in prototype:', 'makeRequest' in Object.getPrototypeOf(wc));
  
  if (typeof wc.makeRequest === 'function') {
    console.log('✅ WooCommerceService is working correctly');
  } else {
    console.log('❌ WooCommerceService makeRequest is not a function');
  }
} catch (error) {
  console.error('❌ Error creating WooCommerceService:', error);
} 