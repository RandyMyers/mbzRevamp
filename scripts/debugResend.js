/**
 * Debug Resend Verification Issue
 * 
 * This script directly tests the controller and service to find the issue
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function debugResend() {
  try {
    console.log('🔍 [DEBUG] Starting debug session...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ [DEBUG] Connected to MongoDB');
    
    // Import the service and controller
    const EmailVerificationService = require('../services/emailVerificationService');
    const emailVerificationController = require('../controllers/emailVerificationController');
    
    console.log('✅ [DEBUG] Imported services and controller');
    
    // Test email
    const testEmail = 'maleo@mail.com';
    console.log('📧 [DEBUG] Testing with email:', testEmail);
    
    // Mock request object
    const mockReq = {
      ip: '127.0.0.1',
      get: () => 'Test User Agent',
      body: { email: testEmail }
    };
    
    // Mock response object
    let responseData = null;
    let responseStatus = null;
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          responseStatus = code;
          responseData = data;
          console.log(`📤 [DEBUG] Response: ${code} -`, JSON.stringify(data, null, 2));
        }
      })
    };
    
    console.log('🧪 [DEBUG] Testing controller directly...');
    
    // Test the controller directly
    await emailVerificationController.resendVerificationCode(mockReq, mockRes);
    
    console.log('📋 [DEBUG] Final result:');
    console.log('📋 [DEBUG] Status:', responseStatus);
    console.log('📋 [DEBUG] Data:', JSON.stringify(responseData, null, 2));
    
  } catch (error) {
    console.error('❌ [DEBUG] Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📋 [DEBUG] Disconnected from MongoDB');
  }
}

debugResend().catch(console.error);
