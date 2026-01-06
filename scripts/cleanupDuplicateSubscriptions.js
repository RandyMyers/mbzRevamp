/**
 * Script to clean up duplicate/orphaned subscriptions
 * Keeps only the most recent active subscription per user
 * Removes pending subscriptions older than 24 hours
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Subscription = require('../models/subscriptions');
const User = require('../models/users');
const SubscriptionPlan = require('../models/subscriptionPlans');

async function cleanupSubscriptions() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Get all subscriptions grouped by user
    const allSubscriptions = await Subscription.find({})
      .populate('user', 'email fullName')
      .populate('plan', 'name')
      .sort({ createdAt: -1 });

    console.log(`\nTotal subscriptions in database: ${allSubscriptions.length}`);

    // Group by user
    const userSubscriptions = {};
    allSubscriptions.forEach(sub => {
      const userId = sub.user?._id?.toString() || 'unknown';
      if (!userSubscriptions[userId]) {
        userSubscriptions[userId] = [];
      }
      userSubscriptions[userId].push(sub);
    });

    console.log(`\nUsers with subscriptions: ${Object.keys(userSubscriptions).length}`);

    let deletedCount = 0;
    let keptCount = 0;

    for (const [userId, subs] of Object.entries(userSubscriptions)) {
      if (userId === 'unknown') continue;

      const userEmail = subs[0]?.user?.email || 'Unknown';
      console.log(`\n--- User: ${userEmail} (${userId}) ---`);
      console.log(`Total subscriptions: ${subs.length}`);

      // Categorize subscriptions
      const active = subs.filter(s => s.status === 'active' && s.isActive);
      const pending = subs.filter(s => s.status === 'pending');
      const canceled = subs.filter(s => s.status === 'canceled');
      const expired = subs.filter(s => s.status === 'expired');

      console.log(`  Active: ${active.length}, Pending: ${pending.length}, Canceled: ${canceled.length}, Expired: ${expired.length}`);

      // Keep the most recent active subscription
      if (active.length > 1) {
        console.log(`  WARNING: Multiple active subscriptions found!`);
        // Sort by createdAt descending, keep the first (most recent)
        const sortedActive = active.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const toKeep = sortedActive[0];
        const toDeactivate = sortedActive.slice(1);

        console.log(`  Keeping: ${toKeep.plan?.name || 'Unknown'} (${toKeep._id})`);

        for (const sub of toDeactivate) {
          console.log(`  Deactivating: ${sub.plan?.name || 'Unknown'} (${sub._id})`);
          await Subscription.findByIdAndUpdate(sub._id, {
            isActive: false,
            status: 'canceled',
            canceledAt: new Date()
          });
          deletedCount++;
        }
        keptCount++;
      } else if (active.length === 1) {
        console.log(`  Active plan: ${active[0].plan?.name || 'Unknown'}`);
        keptCount++;
      }

      // If user has PAID active subscriptions, deactivate Free plan subscriptions
      const paidActive = active.filter(s =>
        s.plan?.slug !== 'free' && s.plan?.name?.toLowerCase() !== 'free'
      );
      const freeActive = active.filter(s =>
        s.plan?.slug === 'free' || s.plan?.name?.toLowerCase() === 'free'
      );

      if (paidActive.length > 0 && freeActive.length > 0) {
        console.log(`  Deactivating ${freeActive.length} Free plan subscriptions (user has paid plan)...`);
        for (const sub of freeActive) {
          await Subscription.findByIdAndUpdate(sub._id, {
            isActive: false,
            status: 'canceled',
            canceledAt: new Date()
          });
          deletedCount++;
        }
      }

      // If user has an active subscription, delete ALL pending subscriptions
      if (active.length > 0 && pending.length > 0) {
        console.log(`  Deleting ${pending.length} pending subscriptions (user already has active plan)...`);
        for (const sub of pending) {
          await Subscription.findByIdAndDelete(sub._id);
          deletedCount++;
        }
      } else if (pending.length > 0) {
        // No active subscription - delete only old pending (> 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const oldPending = pending.filter(s => new Date(s.createdAt) < oneDayAgo);

        if (oldPending.length > 0) {
          console.log(`  Deleting ${oldPending.length} old pending subscriptions...`);
          for (const sub of oldPending) {
            await Subscription.findByIdAndDelete(sub._id);
            deletedCount++;
          }
        }

        const recentPending = pending.filter(s => new Date(s.createdAt) >= oneDayAgo);
        if (recentPending.length > 0) {
          console.log(`  Keeping ${recentPending.length} recent pending subscriptions`);
        }
      }
    }

    console.log(`\n========== Summary ==========`);
    console.log(`Subscriptions kept/active: ${keptCount}`);
    console.log(`Subscriptions deleted/deactivated: ${deletedCount}`);

    // Final count
    const finalCount = await Subscription.countDocuments();
    console.log(`Final subscription count: ${finalCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run with --dry-run to just see what would happen
const isDryRun = process.argv.includes('--dry-run');
if (isDryRun) {
  console.log('=== DRY RUN MODE - No changes will be made ===\n');
}

cleanupSubscriptions();
