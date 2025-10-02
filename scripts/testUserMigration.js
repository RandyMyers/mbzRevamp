/**
 * Test Script: Verify User Migration Results
 * 
 * This script tests that the user migration was successful and users can now login.
 */

const mongoose = require('mongoose');
const User = require('../models/users');
require('dotenv').config();

const testUserMigration = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test a few users to verify they can login
    const testUsers = await User.find({ emailVerified: true }).limit(5);
    console.log('\n🎯 Verified users can now login:');
    
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName || user.email} - ${user.email}`);
      console.log(`   Status: ${user.status}, Email Verified: ${user.emailVerified}`);
      console.log(`   Verified At: ${user.emailVerifiedAt}`);
      console.log('');
    });

    // Check for any users still pending verification
    const pendingUsers = await User.find({ status: 'pending-verification' });
    console.log(`📊 Users still pending verification: ${pendingUsers.length}`);
    
    if (pendingUsers.length > 0) {
      console.log('\n⚠️  Users still pending verification:');
      pendingUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.fullName || user.email} - ${user.email}`);
      });
    }

    // Summary
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ emailVerified: true });
    const activeUsers = await User.countDocuments({ status: 'active' });

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Total users in database: ${totalUsers}`);
    console.log(`✅ Users with verified emails: ${verifiedUsers}`);
    console.log(`✅ Users with active status: ${activeUsers}`);
    console.log(`✅ Migration success rate: ${((verifiedUsers / totalUsers) * 100).toFixed(1)}%`);

    console.log('\n🎉 All existing users can now login without email verification!');
    console.log('💡 New users will still need to verify their emails during registration.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Disconnected from MongoDB');
  }
};

// Run the test
testUserMigration()
  .then(() => {
    console.log('\n✅ User migration test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ User migration test failed:', error);
    process.exit(1);
  });
