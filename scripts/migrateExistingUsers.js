/**
 * Database Migration Script: Update Existing Users for Email Verification
 * 
 * This script updates all existing users to have emailVerified: true and status: 'active'
 * so they can continue using their accounts without needing to verify emails.
 * 
 * Run this script once after implementing the email verification system.
 */

const mongoose = require('mongoose');
const User = require('../models/users');

// Database connection
const connectDB = async () => {
  try {
    // Load environment variables
    require('dotenv').config();
    
    if (!process.env.MONGO_URL) {
      console.error('❌ MONGO_URL environment variable is not set');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function
const migrateExistingUsers = async () => {
  try {
    console.log('🔄 Starting migration of existing users...');
    
    // Find all users that don't have emailVerified field or have it as false
    const usersToUpdate = await User.find({
      $or: [
        { emailVerified: { $exists: false } }, // Field doesn't exist
        { emailVerified: false }, // Field exists but is false
        { status: 'pending-verification' } // Status is pending verification
      ]
    });
    
    console.log(`📊 Found ${usersToUpdate.length} users to update`);
    
    if (usersToUpdate.length === 0) {
      console.log('✅ No users need to be migrated. All users are already verified.');
      return;
    }
    
    // Show users that will be updated
    console.log('\n📋 Users to be updated:');
    usersToUpdate.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName || user.email} (${user.email}) - Status: ${user.status || 'unknown'}`);
    });
    
    // Update all users
    const updateResult = await User.updateMany(
      {
        $or: [
          { emailVerified: { $exists: false } },
          { emailVerified: false },
          { status: 'pending-verification' }
        ]
      },
      {
        $set: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          status: 'active'
        }
      }
    );
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`📈 Updated ${updateResult.modifiedCount} users`);
    
    // Verify the update
    const verifiedUsers = await User.find({ emailVerified: true });
    const pendingUsers = await User.find({ status: 'pending-verification' });
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Total verified users: ${verifiedUsers.length}`);
    console.log(`⏳ Users still pending verification: ${pendingUsers.length}`);
    
    // Show some examples of updated users
    console.log('\n🎯 Sample of updated users:');
    const sampleUsers = await User.find({ emailVerified: true })
      .select('fullName email emailVerified status emailVerifiedAt')
      .limit(5);
    
    sampleUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName || 'N/A'} (${user.email})`);
      console.log(`   - Email Verified: ${user.emailVerified}`);
      console.log(`   - Status: ${user.status}`);
      console.log(`   - Verified At: ${user.emailVerifiedAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

// Rollback function (in case you need to undo the migration)
const rollbackMigration = async () => {
  try {
    console.log('🔄 Starting rollback of user migration...');
    
    const rollbackResult = await User.updateMany(
      { emailVerified: true },
      {
        $unset: {
          emailVerified: "",
          emailVerifiedAt: "",
        },
        $set: {
          status: 'pending-verification'
        }
      }
    );
    
    console.log(`✅ Rollback completed. Updated ${rollbackResult.modifiedCount} users back to pending verification.`);
    
  } catch (error) {
    console.error('❌ Rollback error:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (command === 'rollback') {
      console.log('⚠️  WARNING: This will rollback all users to pending verification status!');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      
      // Wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await rollbackMigration();
    } else {
      await migrateExistingUsers();
    }
    
    console.log('\n🎉 Migration script completed successfully!');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  migrateExistingUsers,
  rollbackMigration
};
