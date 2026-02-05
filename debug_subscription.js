// Debug script to check subscription for a specific user
const mongoose = require('mongoose');
const User = require('./models/users');
const Subscription = require('./models/subscriptions');
require('dotenv').config();

const debugUser = async (email) => {
  try {
    console.log('🔍 Debugging subscription for user:', email);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB\n');

    // Find the user
    const user = await User.findOne({ email }).populate('organization roleId');
    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log('👤 User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Organization ID: ${user.organization?._id || user.organizationId}`);
    console.log(`   Organization Name: ${user.organization?.name}`);
    console.log(`   Role: ${user.roleId?.name || 'N/A'}`);
    console.log('');

    // Get the user's organization ID
    const userOrgId = user.organization?._id || user.organizationId;

    if (!userOrgId) {
      console.error('❌ User has no organization!');
      process.exit(1);
    }

    // Find subscriptions for this organization
    const subscriptions = await Subscription.find({
      organization: userOrgId
    }).populate('plan user');

    console.log(`📊 Subscriptions for Organization (${userOrgId}):`);
    console.log(`   Total subscriptions found: ${subscriptions.length}\n`);

    if (subscriptions.length === 0) {
      console.log('⚠️  No subscriptions found for this organization!');
    } else {
      subscriptions.forEach((sub, index) => {
        console.log(`   Subscription ${index + 1}:`);
        console.log(`   - ID: ${sub._id}`);
        console.log(`   - Plan: ${sub.plan?.name}`);
        console.log(`   - Status: ${sub.status}`);
        console.log(`   - Active: ${sub.isActive}`);
        console.log(`   - Is Trial: ${sub.isTrial}`);
        console.log(`   - Payment Status: ${sub.paymentStatus}`);
        console.log(`   - Start Date: ${sub.startDate}`);
        console.log(`   - End Date: ${sub.endDate}`);
        console.log(`   - Created By: ${sub.user?.email}`);
        console.log('');
      });
    }

    console.log('✅ Debug complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node debug_subscription.js <user-email>');
  console.log('\nExample:');
  console.log('  node debug_subscription.js user@example.com');
  process.exit(1);
}

debugUser(email);
