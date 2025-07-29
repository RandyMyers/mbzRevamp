const mongoose = require('mongoose');
const { notifyCustomerRegistered, notifyProductCreated, notifyOrderCreated } = require('../helpers/notificationHelper');

// Test notification system
const testNotifications = async () => {
  try {
    console.log('🧪 Testing notification system...');
    
    // Test customer notification
    const testCustomer = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      customer_id: '12345'
    };
    
    console.log('📧 Testing customer registration notification...');
    const customerResult = await notifyCustomerRegistered(testCustomer, '507f1f77bcf86cd799439011');
    console.log('✅ Customer notification result:', customerResult);
    
    // Test product notification
    const testProduct = {
      name: 'Test Product',
      sku: 'TEST-001',
      price: 29.99
    };
    
    console.log('📦 Testing product creation notification...');
    const productResult = await notifyProductCreated(testProduct, '507f1f77bcf86cd799439011');
    console.log('✅ Product notification result:', productResult);
    
    // Test order notification
    const testOrder = {
      number: 'ORD-001',
      total: '299.99',
      currency: 'USD'
    };
    
    const testCustomerForOrder = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com'
    };
    
    console.log('🛒 Testing order creation notification...');
    const orderResult = await notifyOrderCreated(testOrder, testCustomerForOrder, '507f1f77bcf86cd799439011');
    console.log('✅ Order notification result:', orderResult);
    
    console.log('🎉 All notification tests completed!');
    
  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  }
};

module.exports = { testNotifications };