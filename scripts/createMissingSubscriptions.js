const mongoose = require("mongoose");
require("dotenv").config();

async function createMissingSubscriptions() {
  const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
  await mongoose.connect(mongoUrl);
  console.log("Connected to MongoDB");

  const User = require("../models/users");
  const Subscription = require("../models/subscriptions");
  const SubscriptionPlan = require("../models/subscriptionPlans");

  // Get the Free plan
  const freePlan = await SubscriptionPlan.findOne({ slug: "free" });
  console.log("Free plan ID:", freePlan ? freePlan._id : "NOT FOUND");

  if (!freePlan) {
    console.log("Free plan not found! Run seedSubscriptionPlans.js first.");
    await mongoose.disconnect();
    return;
  }

  // Get all users
  const users = await User.find({}, "_id email fullName");
  console.log(`Total users: ${users.length}`);

  // Get all existing subscriptions
  const existingSubscriptions = await Subscription.find({}, "user");
  const usersWithSubs = existingSubscriptions
    .map((s) => (s.user ? s.user.toString() : null))
    .filter(Boolean);

  console.log(`Users with existing subscriptions: ${usersWithSubs.length}`);

  // Find users without subscriptions
  const usersWithoutSubs = users.filter(
    (u) => usersWithSubs.indexOf(u._id.toString()) === -1
  );

  console.log(`Users without subscriptions: ${usersWithoutSubs.length}`);

  if (usersWithoutSubs.length === 0) {
    console.log("All users already have subscriptions!");
    await mongoose.disconnect();
    return;
  }

  // Create subscriptions for users without one
  let createdCount = 0;
  const now = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 100); // Free plan never expires

  for (const user of usersWithoutSubs) {
    try {
      const subscription = new Subscription({
        user: user._id,
        plan: freePlan._id,
        status: "active",
        isActive: true,
        startDate: now,
        endDate: endDate,
        billingInterval: "monthly",
        paymentStatus: "Paid", // Free plan is always "Paid"
        autoRenew: true,
      });

      await subscription.save();
      createdCount++;
      console.log(`Created subscription for: ${user.email}`);
    } catch (err) {
      console.error(`Error creating subscription for ${user.email}:`, err.message);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Created ${createdCount} new subscriptions`);
  console.log(`All users now have the Free plan`);

  await mongoose.disconnect();
  console.log("Done");
}

createMissingSubscriptions().catch(console.error);
