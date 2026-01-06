/**
 * Script to fix paymentStatus for active paid subscriptions
 * Sets paymentStatus to 'Paid' for all active subscriptions that have status='active'
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/users');
const SubscriptionPlan = require('../models/subscriptionPlans');
const Subscription = require('../models/subscriptions');

async function fixPaymentStatus() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Find all active subscriptions with paymentStatus not 'Paid'
    const subscriptionsToFix = await Subscription.find({
      status: 'active',
      isActive: true,
      paymentStatus: { $ne: 'Paid' }
    }).populate('user', 'email fullName').populate('plan', 'name');

    console.log(`Found ${subscriptionsToFix.length} active subscriptions with incorrect paymentStatus`);

    for (const sub of subscriptionsToFix) {
      console.log(`Fixing: ${sub.user?.email || 'Unknown'} - ${sub.plan?.name || 'Unknown'} (${sub._id})`);
      console.log(`  Current paymentStatus: ${sub.paymentStatus}`);

      sub.paymentStatus = 'Paid';
      await sub.save();

      console.log(`  Updated to: Paid`);
    }

    console.log(`\nFixed ${subscriptionsToFix.length} subscriptions`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixPaymentStatus();
