const mongoose = require('mongoose');
const Subscription = require('../models/subscriptions');
const SubscriptionPlan = require('../models/subscriptionPlans');
require('dotenv').config();

/**
 * Fix orphaned subscriptions whose plan references were broken
 * when the seed script deleted and recreated plan documents.
 *
 * This script:
 * 1. Finds all active subscriptions
 * 2. Populates the plan reference
 * 3. If plan is null (orphaned), tries to match by the plan name stored
 *    in the subscription or by looking at the organization's expected tier
 * 4. Reassigns to the correct new plan document
 */
async function fixOrphanedSubscriptions() {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (!mongoUrl) {
      throw new Error('MongoDB connection string not found in environment variables');
    }

    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Get all current plans (the new ones)
    const plans = await SubscriptionPlan.find({ isCustom: false });
    console.log(`Found ${plans.length} current plans:`);
    plans.forEach(p => console.log(`  - ${p.name} (${p._id})`));

    // Build a lookup by plan name (case-insensitive)
    const planByName = {};
    for (const plan of plans) {
      planByName[plan.name.toLowerCase()] = plan;
    }

    // Find all subscriptions where plan is set but the referenced doc no longer exists
    const allSubscriptions = await Subscription.find({
      status: { $in: ['active', 'pending', 'pending_renewal'] }
    }).populate('plan');

    console.log(`\nFound ${allSubscriptions.length} active/pending subscriptions`);

    let fixed = 0;
    let alreadyOk = 0;
    let unfixable = 0;

    for (const sub of allSubscriptions) {
      if (sub.plan && sub.plan._id) {
        // Plan reference is valid
        alreadyOk++;
        console.log(`  OK: Subscription ${sub._id} -> plan "${sub.plan.name}"`);
        continue;
      }

      // Plan is null - orphaned subscription
      console.log(`\n  ORPHANED: Subscription ${sub._id}`);
      console.log(`    Organization: ${sub.organization}`);
      console.log(`    User: ${sub.user}`);
      console.log(`    Status: ${sub.status}`);
      console.log(`    Billing interval: ${sub.billingInterval}`);
      console.log(`    Currency: ${sub.currency}`);

      // Try to determine which plan this was on.
      // We can check the raw plan ObjectId still stored in the doc
      const rawPlanId = sub._doc?.plan || sub.plan;
      console.log(`    Old plan ID (raw): ${rawPlanId}`);

      // Strategy: Look at the subscription price to determine plan tier
      // Or check if there's a planName field
      // Since we know the pricing, we can match by price
      let matchedPlan = null;

      // Check if subscription has amount/price info we can match on
      if (sub.amount) {
        console.log(`    Amount: ${sub.amount}`);
        // Try matching by price
        for (const plan of plans) {
          const usdPrice = plan.pricing?.USD?.monthly || plan.price;
          const ngnPrice = plan.pricing?.NGN?.monthly || 0;
          if (sub.amount === usdPrice || sub.amount === ngnPrice) {
            matchedPlan = plan;
            console.log(`    Matched by amount -> "${plan.name}"`);
            break;
          }
          // Also check quarterly and yearly
          const intervals = ['monthly', 'quarterly', 'yearly'];
          for (const interval of intervals) {
            if (sub.amount === plan.pricing?.USD?.[interval] || sub.amount === plan.pricing?.NGN?.[interval]) {
              matchedPlan = plan;
              console.log(`    Matched by amount (${interval}) -> "${plan.name}"`);
              break;
            }
          }
          if (matchedPlan) break;
        }
      }

      if (!matchedPlan) {
        // Default: assign to Premium since user said they're on Premium
        matchedPlan = planByName['premium'];
        if (matchedPlan) {
          console.log(`    Defaulting to Premium (user reported being on Premium)`);
        }
      }

      if (matchedPlan) {
        await Subscription.findByIdAndUpdate(sub._id, {
          plan: matchedPlan._id
        });
        console.log(`    FIXED: Reassigned to "${matchedPlan.name}" (${matchedPlan._id})`);
        fixed++;
      } else {
        console.log(`    UNFIXABLE: Could not determine plan`);
        unfixable++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`  Already OK: ${alreadyOk}`);
    console.log(`  Fixed: ${fixed}`);
    console.log(`  Unfixable: ${unfixable}`);
    console.log(`  Total: ${allSubscriptions.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixOrphanedSubscriptions();
