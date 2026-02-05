const mongoose = require('mongoose');
const Subscription = require('../models/subscriptions');
const SubscriptionPlan = require('../models/subscriptionPlans');
const Organization = require('../models/organization');
require('dotenv').config();

/**
 * Script to add a 14-day Premium trial to an existing organization
 * Usage: node scripts/addTrialToOrganization.js <organizationId>
 */

const addTrialToOrganization = async (organizationId) => {
  try {
    console.log('🚀 Starting trial subscription creation...');
    console.log(`📋 Organization ID: ${organizationId}`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');

    // Find the organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      console.error('❌ Organization not found');
      process.exit(1);
    }
    console.log(`✅ Found organization: ${organization.name}`);

    // Check if organization already has an active subscription
    const existingSubscription = await Subscription.findOne({
      organization: organizationId,
      isActive: true
    });

    if (existingSubscription) {
      console.log('⚠️  Organization already has an active subscription');
      console.log(`   Plan: ${existingSubscription.plan}`);
      console.log(`   Is Trial: ${existingSubscription.isTrial}`);
      console.log('   You may want to deactivate it first or update it instead.');
      process.exit(0);
    }

    // Find the Premium plan
    const premiumPlan = await SubscriptionPlan.findOne({ slug: 'premium' });
    if (!premiumPlan) {
      console.error('❌ Premium plan not found in database');
      console.log('   Please ensure subscription plans are seeded');
      process.exit(1);
    }
    console.log(`✅ Found Premium plan: ${premiumPlan.name}`);

    // Get organization owner (first user in the org)
    const User = require('../models/users');
    const orgOwner = await User.findOne({ organization: organizationId }).sort({ createdAt: 1 });
    if (!orgOwner) {
      console.error('❌ No users found in organization');
      process.exit(1);
    }
    console.log(`✅ Found organization owner: ${orgOwner.email}`);

    // Calculate trial dates (14 days)
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14); // 14 days from now

    console.log(`📅 Trial period: ${trialStart.toLocaleDateString()} - ${trialEnd.toLocaleDateString()}`);

    // Create Premium trial subscription
    const trialSubscription = new Subscription({
      user: orgOwner._id,
      plan: premiumPlan._id,
      organization: organizationId,
      status: 'active',
      isActive: true,
      startDate: trialStart,
      endDate: trialEnd,
      isTrial: true,
      trialStart: trialStart,
      trialEnd: trialEnd,
      trialConverted: false,
      billingInterval: 'monthly',
      autoRenew: false,
      paymentStatus: 'Paid',
      paymentMethod: 'trial'
    });

    await trialSubscription.save();
    console.log('✅ Trial subscription created successfully!');
    console.log(`   Subscription ID: ${trialSubscription._id}`);

    // Update organization hasUsedTrial flag
    organization.hasUsedTrial = true;
    await organization.save();
    console.log('✅ Organization marked as having used trial');

    console.log('\n🎉 SUCCESS! 14-day Premium trial has been added to the organization');
    console.log('   All users in this organization now have access to all premium features');
    console.log('\n💡 Next steps:');
    console.log('   1. Refresh the frontend application');
    console.log('   2. Log in as any user in the organization');
    console.log('   3. You should now have access to all features!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding trial subscription:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Get organization ID from command line argument
const organizationId = process.argv[2];

if (!organizationId) {
  console.error('❌ Usage: node scripts/addTrialToOrganization.js <organizationId>');
  console.log('\nExample:');
  console.log('  node scripts/addTrialToOrganization.js 689e0abff0773bdf70c3d41f');
  process.exit(1);
}

// Validate organization ID format
if (!mongoose.Types.ObjectId.isValid(organizationId)) {
  console.error('❌ Invalid organization ID format');
  process.exit(1);
}

// Run the script
addTrialToOrganization(organizationId);
