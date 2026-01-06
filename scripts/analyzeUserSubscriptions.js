const mongoose = require("mongoose");
require("dotenv").config();

async function analyze() {
  await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const User = require("../models/users");
  const Subscription = require("../models/subscriptions");
  const SubscriptionPlan = require("../models/subscriptionPlans");

  // Get all plans
  const plans = await SubscriptionPlan.find({});
  console.log("\n=== Current Plans ===");
  plans.forEach((p) =>
    console.log(`- ${p.name} (ID: ${p._id}, slug: ${p.slug})`)
  );

  // Get all users
  const users = await User.find({}, "_id email fullName");
  console.log(`\n=== Total Users: ${users.length} ===`);

  // Get all subscriptions with populated plan
  const subscriptions = await Subscription.find({})
    .populate("plan")
    .populate("user", "email fullName");
  console.log(`=== Total Subscriptions: ${subscriptions.length} ===`);

  // Check for users without subscriptions
  const usersWithSubs = subscriptions
    .map((s) => (s.user && s.user._id ? s.user._id.toString() : null))
    .filter(Boolean);
  const usersWithoutSubs = users.filter(
    (u) => usersWithSubs.indexOf(u._id.toString()) === -1
  );

  console.log(`\n=== Users WITHOUT subscriptions: ${usersWithoutSubs.length} ===`);
  usersWithoutSubs.slice(0, 10).forEach((u) => console.log(`- ${u.email}`));
  if (usersWithoutSubs.length > 10)
    console.log(`... and ${usersWithoutSubs.length - 10} more`);

  // Check subscription plan distribution
  console.log("\n=== Subscription Plan Distribution ===");
  const planCounts = {};
  subscriptions.forEach((sub) => {
    const planName = sub.plan ? sub.plan.name : "NULL/Invalid";
    planCounts[planName] = (planCounts[planName] || 0) + 1;
  });
  Object.entries(planCounts).forEach(([name, count]) =>
    console.log(`- ${name}: ${count}`)
  );

  // Show subscription details
  console.log("\n=== Subscription Details ===");
  subscriptions.forEach((sub) => {
    console.log(
      `User: ${sub.user?.email || "N/A"} | Plan: ${sub.plan?.name || "NULL"} | Active: ${sub.isActive} | Status: ${sub.status}`
    );
  });

  await mongoose.disconnect();
  console.log("\nDone");
}

analyze().catch(console.error);
