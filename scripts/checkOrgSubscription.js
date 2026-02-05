// Check all users and subscriptions for a specific organization
const mongoose = require('mongoose');
const User = require('../models/users');
const Subscription = require('../models/subscriptions');
const Organization = require('../models/organization');
const Role = require('../models/role'); // Required for population
const SubscriptionPlan = require('../models/subscriptionPlans'); // Required for population
require('dotenv').config();

const checkOrganization = async (orgId) => {
  try {
    console.log('🔍 Checking organization:', orgId);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB\n');

    // Find the organization
    const org = await Organization.findById(orgId);
    if (!org) {
      console.error('❌ Organization not found');
      process.exit(1);
    }

    console.log('🏢 Organization Details:');
    console.log(`   ID: ${org._id}`);
    console.log(`   Name: ${org.name}`);
    console.log(`   Code: ${org.organizationCode}`);
    console.log(`   Has Used Trial: ${org.hasUsedTrial}`);
    console.log('');

    // Find all users in this organization
    const users = await User.find({
      $or: [
        { organization: orgId },
        { organizationId: orgId }
      ]
    }).populate('roleId');

    console.log(`👥 Users in Organization: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`\n   User ${index + 1}:`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Name: ${user.name}`);
      console.log(`   - Status: ${user.status}`);
      console.log(`   - Role: ${user.roleId?.name || 'N/A'}`);
      console.log(`   - Email Verified: ${user.emailVerified}`);
      console.log(`   - Organization field: ${user.organization}`);
      console.log(`   - OrganizationId field: ${user.organizationId}`);
    });

    // Find subscriptions for this organization
    const subscriptions = await Subscription.find({
      organization: orgId
    }).populate('plan user');

    console.log(`\n\n📊 Active Subscriptions: ${subscriptions.length}`);

    if (subscriptions.length === 0) {
      console.log('⚠️  No subscriptions found for this organization!');
      console.log('   This means users will default to FREE plan.');
    } else {
      subscriptions.forEach((sub, index) => {
        console.log(`\n   Subscription ${index + 1}:`);
        console.log(`   - ID: ${sub._id}`);
        console.log(`   - Plan: ${sub.plan?.name} (${sub.plan?.slug})`);
        console.log(`   - Status: ${sub.status}`);
        console.log(`   - Active: ${sub.isActive}`);
        console.log(`   - Is Trial: ${sub.isTrial}`);
        console.log(`   - Payment Status: ${sub.paymentStatus}`);
        console.log(`   - Start Date: ${sub.startDate?.toLocaleString()}`);
        console.log(`   - End Date: ${sub.endDate?.toLocaleString()}`);
        console.log(`   - Created By: ${sub.user?.email}`);
        console.log(`   - Auto Renew: ${sub.autoRenew}`);
      });
    }

    console.log('\n\n✅ Check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Get org ID from command line
const orgId = process.argv[2];

if (!orgId) {
  console.error('❌ Usage: node scripts/checkOrgSubscription.js <organizationId>');
  console.log('\nExample:');
  console.log('  node scripts/checkOrgSubscription.js 689e0abff0773bdf70c3d41f');
  process.exit(1);
}

checkOrganization(orgId);
