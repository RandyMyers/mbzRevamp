const mongoose = require("mongoose");
require("dotenv").config();

async function fixSubscriptions() {
  const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
  await mongoose.connect(mongoUrl);
  console.log("Connected to MongoDB");

  const Subscription = require("../models/subscriptions");
  const SubscriptionPlan = require("../models/subscriptionPlans");

  // Get the Free plan
  const freePlan = await SubscriptionPlan.findOne({ slug: "free" });
  console.log("Free plan ID:", freePlan ? freePlan._id : "NOT FOUND");

  if (!freePlan) {
    console.log("Free plan not found!");
    await mongoose.disconnect();
    return;
  }

  // Get all valid plan IDs
  const validPlans = await SubscriptionPlan.find({}, "_id");
  const validPlanIds = validPlans.map((p) => p._id.toString());
  console.log("Valid plan IDs:", validPlanIds);

  // Find all subscriptions
  const allSubs = await Subscription.find({});
  console.log("Total subscriptions:", allSubs.length);

  let updatedCount = 0;
  for (const sub of allSubs) {
    const planId = sub.plan ? sub.plan.toString() : null;
    const isValid = planId && validPlanIds.includes(planId);

    if (!isValid) {
      console.log(`Fixing subscription ${sub._id} (plan was: ${planId})`);
      await Subscription.updateOne(
        { _id: sub._id },
        { $set: { plan: freePlan._id } }
      );
      updatedCount++;
    }
  }

  console.log("Updated subscriptions:", updatedCount);

  await mongoose.disconnect();
  console.log("Done");
}

fixSubscriptions().catch(console.error);
