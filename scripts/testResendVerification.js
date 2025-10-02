/**
 * Test Resend Verification Code Flow
 * 
 * This script tests the resend verification code functionality
 * to debug the 400 error issue.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EmailVerificationService = require('../services/emailVerificationService');
const User = require('../models/users');

async function testResendVerification() {
  try {
    console.log('🧪 [RESEND TEST] Starting resend verification test...\n');
    
    // Connect to MongoDB
    console.log('📋 [RESEND TEST] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ [RESEND TEST] Connected to MongoDB');
    
    // Test email
    const testEmail = process.argv[2];
    if (!testEmail) {
      console.error('❌ [RESEND TEST] Please provide a test email address');
      console.log('Usage: node scripts/testResendVerification.js your-email@example.com');
      process.exit(1);
    }
    
    console.log('📧 [RESEND TEST] Testing with email:', testEmail);
    
    // Check if user exists
    console.log('📋 [RESEND TEST] Checking if user exists...');
    const user = await User.findOne({ email: testEmail.toLowerCase() });
    
    if (!user) {
      console.log('❌ [RESEND TEST] User not found for email:', testEmail);
      console.log('📋 [RESEND TEST] This should return success: true (to prevent email enumeration)');
    } else {
      console.log('✅ [RESEND TEST] User found:', {
        id: user._id,
        email: user.email,
        emailVerified: user.emailVerified,
        status: user.status
      });
    }
    
    // Mock request object
    const mockReq = {
      ip: '127.0.0.1',
      get: () => 'Test User Agent',
      body: { email: testEmail }
    };
    
    console.log('📋 [RESEND TEST] Calling EmailVerificationService.resendVerificationCode...');
    const result = await EmailVerificationService.resendVerificationCode(testEmail, mockReq);
    
    console.log('📋 [RESEND TEST] Service result:', result);
    
    if (result.success) {
      console.log('✅ [RESEND TEST] Resend verification successful!');
      console.log('✅ [RESEND TEST] Message:', result.message);
      if (result.expiresAt) {
        console.log('✅ [RESEND TEST] Expires at:', result.expiresAt);
      }
    } else {
      console.log('❌ [RESEND TEST] Resend verification failed!');
      console.log('❌ [RESEND TEST] Error:', result.error || result.message);
    }
    
  } catch (error) {
    console.error('❌ [RESEND TEST] Test failed with error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('📋 [RESEND TEST] Disconnected from MongoDB');
    console.log('🧪 [RESEND TEST] Test completed!');
  }
}

// Run the test
testResendVerification().catch(console.error);
