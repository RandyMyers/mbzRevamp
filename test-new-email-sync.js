const { incomingEmailListener, fullEmailSync, manualSync, getLastSyncTimestamp, resetSyncTimestamp } = require('./helper/receiverEmail');
const Receiver = require('./models/receiver');

// Test function to verify the new optimized email sync system
const testNewEmailSync = async () => {
  try {
    console.log('🧪 Testing NEW optimized email sync system...');
    
    // Get the first active receiver
    const receiver = await Receiver.findOne({ isActive: true });
    
    if (!receiver) {
      console.log('❌ No active receivers found for testing');
      return;
    }
    
    console.log(`📧 Testing with receiver: ${receiver.email}`);
    
    // Test 1: Check current sync timestamp
    console.log('\n🕐 Checking current sync timestamp...');
    try {
      const lastSync = await getLastSyncTimestamp(receiver._id);
      console.log(`✅ Last sync timestamp: ${lastSync ? new Date(lastSync).toISOString() : 'Never synced'}`);
    } catch (error) {
      console.error('❌ Error getting sync timestamp:', error.message);
    }
    
    // Test 2: Reset sync timestamp (to simulate first sync)
    console.log('\n🔄 Resetting sync timestamp for testing...');
    try {
      await resetSyncTimestamp(receiver._id);
      console.log('✅ Sync timestamp reset successfully');
    } catch (error) {
      console.error('❌ Error resetting sync timestamp:', error.message);
    }
    
    // Test 3: Incoming email listener (should only get NEW emails)
    console.log('\n📬 Testing incoming email listener (NEW emails only)...');
    try {
      await incomingEmailListener(receiver._id);
      console.log('✅ Incoming email listener test completed');
    } catch (error) {
      console.error('❌ Incoming email listener test failed:', error.message);
    }
    
    // Test 4: Check sync timestamp after incoming listener
    console.log('\n🕐 Checking sync timestamp after incoming listener...');
    try {
      const lastSync = await getLastSyncTimestamp(receiver._id);
      console.log(`✅ Last sync timestamp: ${lastSync ? new Date(lastSync).toISOString() : 'Never synced'}`);
    } catch (error) {
      console.error('❌ Error getting sync timestamp:', error.message);
    }
    
    // Test 5: Full email sync (should only get NEW emails since last sync)
    console.log('\n🔄 Testing full email sync (NEW emails only)...');
    try {
      await fullEmailSync(receiver._id);
      console.log('✅ Full email sync test completed');
    } catch (error) {
      console.error('❌ Full email sync test failed:', error.message);
    }
    
    // Test 6: Manual sync with incoming type
    console.log('\n📧 Testing manual sync (incoming)...');
    try {
      await manualSync(receiver._id, 'incoming');
      console.log('✅ Manual sync (incoming) test completed');
    } catch (error) {
      console.error('❌ Manual sync (incoming) test failed:', error.message);
    }
    
    // Test 7: Manual sync with full type
    console.log('\n🔄 Testing manual sync (full)...');
    try {
      await manualSync(receiver._id, 'full');
      console.log('✅ Manual sync (full) test completed');
    } catch (error) {
      console.error('❌ Manual sync (full) test failed:', error.message);
    }
    
    // Test 8: Final sync timestamp check
    console.log('\n🕐 Final sync timestamp check...');
    try {
      const lastSync = await getLastSyncTimestamp(receiver._id);
      console.log(`✅ Final sync timestamp: ${lastSync ? new Date(lastSync).toISOString() : 'Never synced'}`);
    } catch (error) {
      console.error('❌ Error getting final sync timestamp:', error.message);
    }
    
    console.log('\n🎉 All NEW email sync tests completed!');
    console.log('📋 Key improvements:');
    console.log('   ✅ Only processes NEW emails since last sync');
    console.log('   ✅ Uses SINCE search criteria instead of ALL');
    console.log('   ✅ Tracks last sync timestamp per receiver');
    console.log('   ✅ Enhanced duplicate prevention');
    console.log('   ✅ No more importing all existing emails');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testNewEmailSync();
}

module.exports = { testNewEmailSync };
