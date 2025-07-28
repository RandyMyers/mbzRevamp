const { incomingEmailListener, fullEmailSync, manualSync } = require('./helper/receiverEmail');
const Receiver = require('./models/receiver');

// Test function to verify the new email sync system
const testEmailSync = async () => {
  try {
    console.log('🧪 Testing new email sync system...');
    
    // Get the first active receiver
    const receiver = await Receiver.findOne({ isActive: true });
    
    if (!receiver) {
      console.log('❌ No active receivers found for testing');
      return;
    }
    
    console.log(`📧 Testing with receiver: ${receiver.email}`);
    
    // Test 1: Incoming email listener
    console.log('\n📬 Testing incoming email listener...');
    try {
      await incomingEmailListener(receiver._id);
      console.log('✅ Incoming email listener test completed');
    } catch (error) {
      console.error('❌ Incoming email listener test failed:', error.message);
    }
    
    // Test 2: Full email sync
    console.log('\n🔄 Testing full email sync...');
    try {
      await fullEmailSync(receiver._id);
      console.log('✅ Full email sync test completed');
    } catch (error) {
      console.error('❌ Full email sync test failed:', error.message);
    }
    
    // Test 3: Manual sync with incoming type
    console.log('\n📧 Testing manual sync (incoming)...');
    try {
      await manualSync(receiver._id, 'incoming');
      console.log('✅ Manual sync (incoming) test completed');
    } catch (error) {
      console.error('❌ Manual sync (incoming) test failed:', error.message);
    }
    
    // Test 4: Manual sync with full type
    console.log('\n🔄 Testing manual sync (full)...');
    try {
      await manualSync(receiver._id, 'full');
      console.log('✅ Manual sync (full) test completed');
    } catch (error) {
      console.error('❌ Manual sync (full) test failed:', error.message);
    }
    
    console.log('\n🎉 All email sync tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testEmailSync();
}

module.exports = { testEmailSync }; 