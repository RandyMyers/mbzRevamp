const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER_ID = '507f1f77bcf86cd799439011'; // Replace with actual test user ID
const TEST_ORG_ID = '507f1f77bcf86cd799439012'; // Replace with actual test org ID

// Test data for email creation
const testEmailData = {
  "recipient": "test@example.com",
  "subject": "Test Email Subject",
  "body": "<h1>Test Email</h1><p>This is a test email body.</p>",
  "variables": {
    "userName": "John Doe",
    "companyName": "Test Company"
  },
  "emailTemplate": null, // Optional
  "organization": TEST_ORG_ID,
  "user": TEST_USER_ID, // Using 'user' field as per Postman request
  "status": "drafts" // Using correct enum value
};

// Test data for email template creation
const testTemplateData = {
  "name": "Welcome Email Template",
  "subject": "Welcome to {{companyName}}",
  "body": "<h1>Welcome {{userName}}!</h1><p>Thank you for joining {{companyName}}. We're excited to have you on board.</p>",
  "variables": {
    "userName": "Customer Name",
    "companyName": "Company Name",
    "orderNumber": "Order Number"
  },
  "createdBy": TEST_USER_ID,
  "organization": TEST_ORG_ID
};

async function testEmailCreation() {
  try {
    console.log('🧪 Testing Email Creation...');
    
    const response = await axios.post(`${BASE_URL}/emails/create`, testEmailData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TEST_TOKEN' // Replace with actual test token
      }
    });
    
    console.log('✅ Email Creation Test PASSED');
    console.log('Response:', response.data);
    return response.data.email._id;
  } catch (error) {
    console.log('❌ Email Creation Test FAILED');
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testEmailTemplateCreation() {
  try {
    console.log('🧪 Testing Email Template Creation...');
    
    const response = await axios.post(`${BASE_URL}/emailTemplates/create`, testTemplateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TEST_TOKEN' // Replace with actual test token
      }
    });
    
    console.log('✅ Email Template Creation Test PASSED');
    console.log('Response:', response.data);
    return response.data.emailTemplate._id;
  } catch (error) {
    console.log('❌ Email Template Creation Test FAILED');
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testInvalidEmailCreation() {
  try {
    console.log('🧪 Testing Invalid Email Creation (should fail)...');
    
    const invalidData = {
      "recipient": "invalid-email",
      "subject": "",
      "body": "",
      "user": TEST_USER_ID,
      "organization": TEST_ORG_ID
    };
    
    const response = await axios.post(`${BASE_URL}/emails/create`, invalidData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TEST_TOKEN'
      }
    });
    
    console.log('❌ Invalid Email Test should have failed but passed');
  } catch (error) {
    console.log('✅ Invalid Email Test correctly FAILED');
    console.log('Expected error:', error.response?.data?.message);
  }
}

async function testInvalidTemplateCreation() {
  try {
    console.log('🧪 Testing Invalid Template Creation (should fail)...');
    
    const invalidData = {
      "name": "ab", // Too short
      "subject": "",
      "body": "",
      "createdBy": TEST_USER_ID,
      "organization": TEST_ORG_ID
    };
    
    const response = await axios.post(`${BASE_URL}/emailTemplates/create`, invalidData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TEST_TOKEN'
      }
    });
    
    console.log('❌ Invalid Template Test should have failed but passed');
  } catch (error) {
    console.log('✅ Invalid Template Test correctly FAILED');
    console.log('Expected error:', error.response?.data?.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Email Endpoint Tests...\n');
  
  // Test valid creations
  const emailId = await testEmailCreation();
  const templateId = await testEmailTemplateCreation();
  
  console.log('\n--- Validation Tests ---\n');
  
  // Test invalid creations
  await testInvalidEmailCreation();
  await testInvalidTemplateCreation();
  
  console.log('\n🎉 All tests completed!');
  console.log('📧 Email ID:', emailId);
  console.log('📝 Template ID:', templateId);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testEmailCreation,
  testEmailTemplateCreation,
  testInvalidEmailCreation,
  testInvalidTemplateCreation,
  runAllTests
}; 