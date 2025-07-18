// Test script to verify webhook URL generation
const crypto = require('crypto');

// Simulate webhook URL generation
function generateWebhookUrl(storeId, topic) {
  const webhookIdentifier = `${storeId}-${Date.now()}`;
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 8800}`;
  const deliveryUrl = `${baseUrl}/api/webhooks/woocommerce/${webhookIdentifier}/${topic}`;
  
  return {
    webhookIdentifier,
    deliveryUrl,
    secret: crypto.randomBytes(32).toString('hex')
  };
}

// Test the URL generation
const storeId = '507f1f77bcf86cd799439011'; // Example MongoDB ObjectId
const topics = ['order.created', 'customer.updated', 'product.deleted'];

console.log('Testing webhook URL generation:\n');

topics.forEach(topic => {
  const result = generateWebhookUrl(storeId, topic);
  console.log(`Topic: ${topic}`);
  console.log(`Identifier: ${result.webhookIdentifier}`);
  console.log(`URL: ${result.deliveryUrl}`);
  console.log(`Secret: ${result.secret.substring(0, 16)}...`);
  console.log('---');
});

console.log('\nExpected URL pattern:');
console.log('http://localhost:8800/api/webhooks/woocommerce/{storeId-timestamp}/{topic}');
console.log('\nThis URL can be copied to WooCommerce webhook settings.'); 