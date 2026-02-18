const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/subscriptionPlans');
require('dotenv').config();

/**
 * Subscription Plans Seed Data
 * Based on plans splitting document:
 * - Free: Limited features, 1 store, 10 products
 * - Basic: Small businesses, 1 store, 100 products
 * - Standard: Growing businesses, 2 stores, unlimited products (14-day trial default)
 * - Premium: Enterprise, 4 stores, 20 users
 */

const subscriptionPlans = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Perfect for getting started and exploring the platform',
    price: 0,
    pricing: {
      USD: { monthly: 0, quarterly: 0, yearly: 0 },
      NGN: { monthly: 0, quarterly: 0, yearly: 0 },
    },
    currency: 'USD',
    billingInterval: 'monthly',
    features: [
      '1 Store',
      '10 Products',
      '1 User',
      '1 Free Website',
      'Dashboard Access',
      'Orders & Customers',
      'View-only Inventory',
      'Email Support'
    ],
    limits: {
      maxStores: 1,
      maxProducts: 10,
      maxUsers: 1,
      maxFreeWebsites: 1,
      maxIntegrations: 1,
      allowedIntegrations: ['woocommerce']
    },
    featureAccess: {
      dashboard: true,
      ordersAndCustomers: true,
      tasks: false,
      inventory: 'view_only',
      marketing: 'none',
      analytics: 'none',
      auditLogs: false,
      callScheduler: false,
      referralPoints: true,
      billings: true,
      settings: true,
      feedbackAndSurvey: true
    },
    analyticsAccess: [],
    marketingAccess: [],
    supportChannels: ['email'],
    isActive: true,
    isCustom: false,
    displayOrder: 1,
    isRecommended: false
  },
  {
    name: 'Basic',
    slug: 'basic',
    description: 'For small businesses ready to grow',
    price: 5,
    pricing: {
      USD: { monthly: 5, quarterly: 14, yearly: 50 },
      NGN: { monthly: 6000, quarterly: 15000, yearly: 55000 },
    },
    currency: 'USD',
    billingInterval: 'monthly',
    features: [
      '1 Store',
      '100 Products',
      '1 User',
      '1 Free Website',
      'Full Dashboard Access',
      'Orders & Customers',
      'Full Inventory Access',
      'Limited Marketing (Templates & Emails)',
      'Limited Analytics (Overview, Customer Insights, Sales)',
      'Email & Ticket Support'
    ],
    limits: {
      maxStores: 1,
      maxProducts: 100,
      maxUsers: 1,
      maxFreeWebsites: 1,
      maxIntegrations: 3,
      allowedIntegrations: ['woocommerce', 'email', 'payment_gateway']
    },
    featureAccess: {
      dashboard: true,
      ordersAndCustomers: true,
      tasks: false,
      inventory: 'full',
      marketing: 'limited',
      analytics: 'limited',
      auditLogs: false,
      callScheduler: false,
      referralPoints: true,
      billings: true,
      settings: true,
      feedbackAndSurvey: true
    },
    analyticsAccess: ['overview', 'customer_insights', 'sales_performance'],
    marketingAccess: ['templates', 'emails'],
    supportChannels: ['email', 'ticket'],
    isActive: true,
    isCustom: false,
    displayOrder: 2,
    isRecommended: false
  },
  {
    name: 'Standard',
    slug: 'standard',
    description: 'For growing businesses that need more power',
    price: 10,
    pricing: {
      USD: { monthly: 10, quarterly: 27, yearly: 100 },
      NGN: { monthly: 12000, quarterly: 30000, yearly: 110000 },
    },
    currency: 'USD',
    billingInterval: 'monthly',
    features: [
      '2 Stores',
      'Unlimited Products',
      '5 Users',
      '1 Free Website',
      'Full Dashboard Access',
      'Orders & Customers',
      'Full Inventory Access',
      'Task Management',
      'Full Marketing Suite',
      'Full Analytics (5 Tabs)',
      'Audit Logs',
      'Call Scheduler',
      'Unlimited Integrations',
      'Email & Ticket Support'
    ],
    limits: {
      maxStores: 2,
      maxProducts: -1, // Unlimited
      maxUsers: 5,
      maxFreeWebsites: 1,
      maxIntegrations: -1, // Unlimited
      allowedIntegrations: ['all']
    },
    featureAccess: {
      dashboard: true,
      ordersAndCustomers: true,
      tasks: true,
      inventory: 'full',
      marketing: 'full',
      analytics: 'full',
      auditLogs: true,
      callScheduler: true,
      referralPoints: true,
      billings: true,
      settings: true,
      feedbackAndSurvey: true
    },
    analyticsAccess: ['overview', 'customer_insights', 'sales_performance', 'product_analytics', 'marketing_effectiveness'],
    marketingAccess: ['overview', 'campaigns', 'templates', 'emails'],
    supportChannels: ['email', 'ticket'],
    isActive: true,
    isCustom: false,
    displayOrder: 3,
    isRecommended: true // Standard is the recommended plan
  },
  {
    name: 'Premium',
    slug: 'premium',
    description: 'For enterprises that need the full suite',
    price: 15,
    pricing: {
      USD: { monthly: 15, quarterly: 40, yearly: 150 },
      NGN: { monthly: 20000, quarterly: 50000, yearly: 195000 },
    },
    currency: 'USD',
    billingInterval: 'monthly',
    features: [
      '4 Stores',
      'Unlimited Products',
      '20 Users',
      '2 Free Websites',
      'Full Dashboard Access',
      'Orders & Customers',
      'Full Inventory Access',
      'Task Management',
      'Full Marketing Suite',
      'Full Analytics (6 Tabs including Customer Lifetime)',
      'Audit Logs',
      'Call Scheduler',
      'Unlimited Integrations',
      'Priority Support (Email, Ticket, Live Chat, WhatsApp)'
    ],
    limits: {
      maxStores: 4,
      maxProducts: -1, // Unlimited
      maxUsers: 20,
      maxFreeWebsites: 2,
      maxIntegrations: -1, // Unlimited
      allowedIntegrations: ['all']
    },
    featureAccess: {
      dashboard: true,
      ordersAndCustomers: true,
      tasks: true,
      inventory: 'full',
      marketing: 'full',
      analytics: 'full',
      auditLogs: true,
      callScheduler: true,
      referralPoints: true,
      billings: true,
      settings: true,
      feedbackAndSurvey: true
    },
    analyticsAccess: ['overview', 'customer_insights', 'sales_performance', 'product_analytics', 'marketing_effectiveness', 'customer_lifetime'],
    marketingAccess: ['overview', 'campaigns', 'templates', 'emails'],
    supportChannels: ['email', 'ticket', 'live_chat', 'whatsapp'],
    isActive: true,
    isCustom: false,
    displayOrder: 4,
    isRecommended: false
  }
];

async function seedSubscriptionPlans() {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (!mongoUrl) {
      throw new Error('MongoDB connection string not found in environment variables');
    }

    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Check existing plans
    const existingPlans = await SubscriptionPlan.find({ isCustom: false });
    console.log(`Found ${existingPlans.length} existing system plans`);

    // Option 1: Update existing plans or create new ones (upsert)
    for (const planData of subscriptionPlans) {
      const existingPlan = await SubscriptionPlan.findOne({ slug: planData.slug });

      if (existingPlan) {
        // Update existing plan
        await SubscriptionPlan.findByIdAndUpdate(existingPlan._id, planData, { new: true });
        console.log(`Updated existing plan: ${planData.name}`);
      } else {
        // Create new plan
        const plan = new SubscriptionPlan(planData);
        await plan.save();
        console.log(`Created new plan: ${planData.name}`);
      }
    }

    // Verify all plans were created/updated
    const allPlans = await SubscriptionPlan.find({ isCustom: false }).sort({ displayOrder: 1 });

    console.log('\n=== Subscription Plans Summary ===');
    for (const plan of allPlans) {
      console.log(`\n${plan.displayOrder}. ${plan.name} (${plan.slug})`);
      console.log(`   USD: $${plan.pricing?.USD?.monthly || plan.price}/mo, $${plan.pricing?.USD?.quarterly || 0}/qtr, $${plan.pricing?.USD?.yearly || 0}/yr`);
      console.log(`   NGN: N${plan.pricing?.NGN?.monthly || 0}/mo, N${plan.pricing?.NGN?.quarterly || 0}/qtr, N${plan.pricing?.NGN?.yearly || 0}/yr`);
      console.log(`   Stores: ${plan.limits.maxStores}, Products: ${plan.limits.maxProducts === -1 ? 'Unlimited' : plan.limits.maxProducts}`);
      console.log(`   Users: ${plan.limits.maxUsers}, Websites: ${plan.limits.maxFreeWebsites}`);
      console.log(`   Recommended: ${plan.isRecommended ? 'Yes' : 'No'}`);
    }

    console.log('\n✅ Successfully seeded subscription plans!');
    console.log(`📋 Total plans: ${allPlans.length}`);

  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

/**
 * Delete all non-custom plans and recreate them
 * Use this for a clean slate
 */
async function resetSubscriptionPlans() {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (!mongoUrl) {
      throw new Error('MongoDB connection string not found in environment variables');
    }

    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Delete ALL plans with matching slugs (handles both custom and non-custom)
    const slugsToDelete = subscriptionPlans.map(p => p.slug);
    const deleted = await SubscriptionPlan.deleteMany({
      $or: [
        { isCustom: false },
        { slug: { $in: slugsToDelete } },
        { name: { $in: subscriptionPlans.map(p => p.name) } }
      ]
    });
    console.log(`Deleted ${deleted.deletedCount} existing plans`);

    // Create all plans fresh
    for (const planData of subscriptionPlans) {
      const plan = new SubscriptionPlan(planData);
      await plan.save();
      console.log(`Created plan: ${planData.name}`);
    }

    console.log('\n✅ Successfully reset subscription plans!');

  } catch (error) {
    console.error('❌ Error resetting subscription plans:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--reset')) {
    console.log('Running in RESET mode - will delete and recreate all system plans\n');
    resetSubscriptionPlans();
  } else {
    console.log('Running in UPSERT mode - will update existing or create new plans\n');
    seedSubscriptionPlans();
  }
}

module.exports = {
  seedSubscriptionPlans,
  resetSubscriptionPlans,
  subscriptionPlans
};
