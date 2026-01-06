/**
 * Usage Tracking Service
 * Manages and syncs resource usage counts for organizations
 * Used for subscription plan limit enforcement
 */

const Organization = require('../models/organization');
const Store = require('../models/store');
const User = require('../models/users');
const Website = require('../models/website');
const Product = require('../models/product');
const Order = require('../models/order');
const Customer = require('../models/customers');
const Task = require('../models/task');
const Campaign = require('../models/campaigns');
const Invoice = require('../models/Invoice');
const Receipt = require('../models/Receipt');
const Subscription = require('../models/subscriptions');
const { getPlanPermissions } = require('../config/planPermissions');

/**
 * Refresh all usage counts for an organization
 * @param {string} organizationId - Organization ID
 * @returns {Object} Updated usage counts
 */
const refreshUsageCounts = async (organizationId) => {
  try {
    const [
      storeCount,
      productCount,
      userCount,
      websiteCount
    ] = await Promise.all([
      Store.countDocuments({ organization: organizationId }),
      Product.countDocuments({ organization: organizationId }),
      User.countDocuments({ organization: organizationId }),
      Website.countDocuments({ organization: organizationId })
    ]);

    const usageTracking = {
      storeCount,
      productCount,
      userCount,
      websiteCount,
      lastUpdated: new Date()
    };

    await Organization.findByIdAndUpdate(organizationId, {
      usageTracking
    });

    return usageTracking;
  } catch (error) {
    console.error('Error refreshing usage counts:', error);
    throw error;
  }
};

/**
 * Refresh feature usage metrics for an organization
 * @param {string} organizationId - Organization ID
 * @returns {Object} Updated feature usage metrics
 */
const refreshFeatureUsage = async (organizationId) => {
  try {
    const [
      totalOrders,
      totalCustomers,
      totalTasks,
      totalCampaigns,
      totalInvoices,
      totalReceipts
    ] = await Promise.all([
      Order.countDocuments({ organization: organizationId }),
      Customer.countDocuments({ organization: organizationId }),
      Task.countDocuments({ organization: organizationId }),
      Campaign.countDocuments({ organization: organizationId }),
      Invoice.countDocuments({ organization: organizationId }),
      Receipt.countDocuments({ organization: organizationId })
    ]);

    const featureUsage = {
      totalOrders,
      totalCustomers,
      totalTasks,
      totalCampaigns,
      totalInvoices,
      totalReceipts,
      lastActivityAt: new Date()
    };

    await Organization.findByIdAndUpdate(organizationId, {
      featureUsage
    });

    return featureUsage;
  } catch (error) {
    console.error('Error refreshing feature usage:', error);
    throw error;
  }
};

/**
 * Increment a usage count
 * @param {string} organizationId - Organization ID
 * @param {string} resourceType - Type of resource (store, product, user, website)
 */
const incrementUsage = async (organizationId, resourceType) => {
  const fieldMap = {
    store: 'usageTracking.storeCount',
    product: 'usageTracking.productCount',
    user: 'usageTracking.userCount',
    website: 'usageTracking.websiteCount',
    integration: 'usageTracking.integrationCount'
  };

  const field = fieldMap[resourceType];
  if (!field) return;

  await Organization.findByIdAndUpdate(organizationId, {
    $inc: { [field]: 1 },
    'usageTracking.lastUpdated': new Date()
  });
};

/**
 * Decrement a usage count
 * @param {string} organizationId - Organization ID
 * @param {string} resourceType - Type of resource (store, product, user, website)
 */
const decrementUsage = async (organizationId, resourceType) => {
  const fieldMap = {
    store: 'usageTracking.storeCount',
    product: 'usageTracking.productCount',
    user: 'usageTracking.userCount',
    website: 'usageTracking.websiteCount',
    integration: 'usageTracking.integrationCount'
  };

  const field = fieldMap[resourceType];
  if (!field) return;

  await Organization.findByIdAndUpdate(organizationId, {
    $inc: { [field]: -1 },
    'usageTracking.lastUpdated': new Date()
  });
};

/**
 * Increment feature usage count
 * @param {string} organizationId - Organization ID
 * @param {string} featureType - Type of feature (orders, customers, tasks, campaigns, invoices, receipts)
 */
const incrementFeatureUsage = async (organizationId, featureType) => {
  const fieldMap = {
    orders: 'featureUsage.totalOrders',
    customers: 'featureUsage.totalCustomers',
    tasks: 'featureUsage.totalTasks',
    campaigns: 'featureUsage.totalCampaigns',
    invoices: 'featureUsage.totalInvoices',
    receipts: 'featureUsage.totalReceipts'
  };

  const field = fieldMap[featureType];
  if (!field) return;

  await Organization.findByIdAndUpdate(organizationId, {
    $inc: { [field]: 1 },
    'featureUsage.lastActivityAt': new Date()
  });
};

/**
 * Sync current plan info to organization
 * @param {string} organizationId - Organization ID
 */
const syncCurrentPlan = async (organizationId) => {
  try {
    // Find active subscription for this organization
    const subscription = await Subscription.findOne({
      $or: [
        { organization: organizationId },
        { user: { $in: await User.find({ organization: organizationId }).distinct('_id') } }
      ],
      isActive: true,
      status: 'active'
    }).populate('plan', 'name slug');

    let currentPlan = {
      planSlug: 'free',
      planName: 'Free',
      isTrial: false,
      trialEndsAt: null,
      expiresAt: null
    };

    if (subscription) {
      currentPlan = {
        planId: subscription.plan?._id,
        planSlug: subscription.plan?.slug || 'free',
        planName: subscription.plan?.name || 'Free',
        isTrial: subscription.isTrial || false,
        trialEndsAt: subscription.trialEnd,
        expiresAt: subscription.endDate
      };
    } else {
      // Check for trial subscription
      const trialSub = await Subscription.findOne({
        $or: [
          { organization: organizationId },
          { user: { $in: await User.find({ organization: organizationId }).distinct('_id') } }
        ],
        isTrial: true,
        trialConverted: false,
        trialEnd: { $gt: new Date() }
      }).populate('plan', 'name slug');

      if (trialSub) {
        currentPlan = {
          planId: trialSub.plan?._id,
          planSlug: trialSub.plan?.slug || 'standard',
          planName: trialSub.plan?.name || 'Standard',
          isTrial: true,
          trialEndsAt: trialSub.trialEnd,
          expiresAt: trialSub.trialEnd
        };
      }
    }

    await Organization.findByIdAndUpdate(organizationId, { currentPlan });

    return currentPlan;
  } catch (error) {
    console.error('Error syncing current plan:', error);
    throw error;
  }
};

/**
 * Get usage summary with limits for an organization
 * @param {string} organizationId - Organization ID
 * @returns {Object} Usage summary with limits and remaining quota
 */
const getUsageSummary = async (organizationId) => {
  try {
    const org = await Organization.findById(organizationId);
    if (!org) {
      throw new Error('Organization not found');
    }

    const planSlug = org.currentPlan?.planSlug || 'free';
    const planPermissions = getPlanPermissions(planSlug);
    const limits = planPermissions.limits;

    const usage = org.usageTracking || {
      storeCount: 0,
      productCount: 0,
      userCount: 1,
      websiteCount: 0,
      integrationCount: 0
    };

    return {
      plan: {
        name: planPermissions.name,
        slug: planSlug,
        isTrial: org.currentPlan?.isTrial || false,
        trialEndsAt: org.currentPlan?.trialEndsAt,
        expiresAt: org.currentPlan?.expiresAt
      },
      usage: {
        stores: {
          current: usage.storeCount,
          max: limits.maxStores,
          remaining: limits.maxStores === -1 ? -1 : Math.max(0, limits.maxStores - usage.storeCount)
        },
        products: {
          current: usage.productCount,
          max: limits.maxProducts,
          remaining: limits.maxProducts === -1 ? -1 : Math.max(0, limits.maxProducts - usage.productCount)
        },
        users: {
          current: usage.userCount,
          max: limits.maxUsers,
          remaining: limits.maxUsers === -1 ? -1 : Math.max(0, limits.maxUsers - usage.userCount)
        },
        websites: {
          current: usage.websiteCount,
          max: limits.maxFreeWebsites,
          remaining: limits.maxFreeWebsites === -1 ? -1 : Math.max(0, limits.maxFreeWebsites - usage.websiteCount)
        },
        integrations: {
          current: usage.integrationCount || 0,
          max: limits.maxIntegrations,
          remaining: limits.maxIntegrations === -1 ? -1 : Math.max(0, limits.maxIntegrations - (usage.integrationCount || 0))
        }
      },
      features: limits.features,
      analytics: limits.analyticsAccess,
      marketing: limits.marketingAccess,
      lastUpdated: usage.lastUpdated
    };
  } catch (error) {
    console.error('Error getting usage summary:', error);
    throw error;
  }
};

/**
 * Check if organization can add a resource
 * @param {string} organizationId - Organization ID
 * @param {string} resourceType - Type of resource (store, product, user, website)
 * @returns {Object} { allowed: boolean, reason?: string }
 */
const canAddResource = async (organizationId, resourceType) => {
  try {
    const summary = await getUsageSummary(organizationId);
    const resourceMap = {
      store: 'stores',
      product: 'products',
      user: 'users',
      website: 'websites',
      integration: 'integrations'
    };

    const key = resourceMap[resourceType];
    if (!key) {
      return { allowed: true };
    }

    const resourceUsage = summary.usage[key];
    if (resourceUsage.max === -1) {
      return { allowed: true }; // Unlimited
    }

    if (resourceUsage.remaining <= 0) {
      return {
        allowed: false,
        reason: `You have reached the maximum number of ${key} (${resourceUsage.max}) for your ${summary.plan.name} plan. Please upgrade to add more.`
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking resource limit:', error);
    return { allowed: true }; // Allow on error to not block user
  }
};

module.exports = {
  refreshUsageCounts,
  refreshFeatureUsage,
  incrementUsage,
  decrementUsage,
  incrementFeatureUsage,
  syncCurrentPlan,
  getUsageSummary,
  canAddResource
};
