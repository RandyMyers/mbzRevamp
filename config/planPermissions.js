/**
 * Subscription Plan Permissions Configuration
 * Defines feature limits and access for each plan tier
 *
 * Based on: plans splitting document
 * Plans: Free, Basic, Standard, Premium
 * Free Trial: Everyone starts with Standard plan for 14 days
 */

const PLAN_PERMISSIONS = {
  free: {
    name: 'Free',
    slug: 'free',
    price: 0,
    limits: {
      // Stores & Products
      maxStores: 1,
      maxProducts: 10,

      // Users
      maxUsers: 1,

      // Websites
      maxFreeWebsites: 1,

      // Integrations
      maxIntegrations: 1,
      allowedIntegrations: ['woocommerce'],

      // Features Access
      features: {
        dashboard: true,
        ordersAndCustomers: true,
        tasks: false,
        inventory: 'view_only', // 'full', 'view_only', false
        marketing: false,
        analytics: false,
        auditLogs: false,
        callScheduler: false,
        referralPoints: true,
        billings: true,
        settings: true,
        feedbackAndSurvey: true,
      },

      // Analytics Tabs Access
      analyticsAccess: [],

      // Marketing Access
      marketingAccess: [],

      // Support
      support: ['email'],
    }
  },

  basic: {
    name: 'Basic',
    slug: 'basic',
    price: 9.99,
    limits: {
      // Stores & Products
      maxStores: 1,
      maxProducts: 100,

      // Users
      maxUsers: 1,

      // Websites
      maxFreeWebsites: 1,

      // Integrations
      maxIntegrations: 3,
      allowedIntegrations: ['woocommerce', 'email', 'payment_gateway'],

      // Features Access
      features: {
        dashboard: true,
        ordersAndCustomers: true,
        tasks: false,
        inventory: 'full',
        marketing: 'limited', // Only templates and emails
        analytics: 'limited',
        auditLogs: false,
        callScheduler: false,
        referralPoints: true,
        billings: true,
        settings: true,
        feedbackAndSurvey: true,
      },

      // Analytics Tabs Access
      analyticsAccess: ['overview', 'customer_insights', 'sales_performance'],

      // Marketing Access
      marketingAccess: ['templates', 'emails'],

      // Support
      support: ['email', 'ticket'],
    }
  },

  standard: {
    name: 'Standard',
    slug: 'standard',
    price: 29.99,
    limits: {
      // Stores & Products
      maxStores: 2,
      maxProducts: -1, // -1 means unlimited

      // Users
      maxUsers: 5,

      // Websites
      maxFreeWebsites: 1,

      // Integrations
      maxIntegrations: -1, // Unlimited
      allowedIntegrations: 'all',

      // Features Access
      features: {
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
        feedbackAndSurvey: true,
      },

      // Analytics Tabs Access
      analyticsAccess: ['overview', 'customer_insights', 'sales_performance', 'product_analytics', 'marketing_effectiveness'],

      // Marketing Access
      marketingAccess: ['overview', 'campaigns', 'templates', 'emails'],

      // Support
      support: ['email', 'ticket'],
    }
  },

  premium: {
    name: 'Premium',
    slug: 'premium',
    price: 79.99,
    limits: {
      // Stores & Products
      maxStores: 4,
      maxProducts: -1, // Unlimited

      // Users
      maxUsers: 20,

      // Websites
      maxFreeWebsites: 2,

      // Integrations
      maxIntegrations: -1, // Unlimited
      allowedIntegrations: 'all',

      // Features Access
      features: {
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
        feedbackAndSurvey: true,
      },

      // Analytics Tabs Access (includes Customer Lifetime)
      analyticsAccess: ['overview', 'customer_insights', 'sales_performance', 'product_analytics', 'marketing_effectiveness', 'customer_lifetime'],

      // Marketing Access
      marketingAccess: ['overview', 'campaigns', 'templates', 'emails'],

      // Support
      support: ['email', 'ticket', 'live_chat', 'whatsapp'],
    }
  }
};

// Trial configuration
const TRIAL_CONFIG = {
  defaultPlan: 'standard',
  durationDays: 14,
};

// Website pricing (after free allocation)
const WEBSITE_PRICING = {
  minPrice: 20,
  maxPrice: 50,
  currency: 'USD',
};

// Helper function to get plan by name (case-insensitive)
const getPlanPermissions = (planName) => {
  if (!planName) return PLAN_PERMISSIONS.free;
  const normalizedName = planName.toLowerCase().trim();
  return PLAN_PERMISSIONS[normalizedName] || PLAN_PERMISSIONS.free;
};

// Check if a feature is allowed for a plan
const isFeatureAllowed = (planName, featureName) => {
  const plan = getPlanPermissions(planName);
  const featureValue = plan.limits.features[featureName];

  if (featureValue === true || featureValue === 'full') return true;
  if (featureValue === 'limited') return 'limited';
  if (featureValue === 'view_only') return 'view_only';
  return false;
};

// Check if within limit (-1 means unlimited)
const isWithinLimit = (currentCount, maxLimit) => {
  if (maxLimit === -1) return true;
  return currentCount < maxLimit;
};

// Get feature access level
const getFeatureAccess = (planName, featureName) => {
  const plan = getPlanPermissions(planName);
  return plan.limits.features[featureName] || false;
};

// Check analytics tab access
const hasAnalyticsAccess = (planName, tabName) => {
  const plan = getPlanPermissions(planName);
  if (!plan.limits.analyticsAccess.length) return false;
  if (plan.limits.analyticsAccess.includes('all')) return true;
  return plan.limits.analyticsAccess.includes(tabName);
};

// Check marketing access
const hasMarketingAccess = (planName, sectionName) => {
  const plan = getPlanPermissions(planName);
  if (!plan.limits.marketingAccess.length) return false;
  if (plan.limits.marketingAccess.includes('all')) return true;
  return plan.limits.marketingAccess.includes(sectionName);
};

// Get limits for a plan
const getPlanLimits = (planName) => {
  const plan = getPlanPermissions(planName);
  return plan.limits;
};

// Check if user can add more of a resource
const canAddResource = (planName, resourceType, currentCount) => {
  const limits = getPlanLimits(planName);

  switch (resourceType) {
    case 'store':
      return isWithinLimit(currentCount, limits.maxStores);
    case 'product':
      return isWithinLimit(currentCount, limits.maxProducts);
    case 'user':
      return isWithinLimit(currentCount, limits.maxUsers);
    case 'website':
      return isWithinLimit(currentCount, limits.maxFreeWebsites);
    case 'integration':
      return isWithinLimit(currentCount, limits.maxIntegrations);
    default:
      return true;
  }
};

// Get remaining quota for a resource
const getRemainingQuota = (planName, resourceType, currentCount) => {
  const limits = getPlanLimits(planName);

  let maxLimit;
  switch (resourceType) {
    case 'store':
      maxLimit = limits.maxStores;
      break;
    case 'product':
      maxLimit = limits.maxProducts;
      break;
    case 'user':
      maxLimit = limits.maxUsers;
      break;
    case 'website':
      maxLimit = limits.maxFreeWebsites;
      break;
    case 'integration':
      maxLimit = limits.maxIntegrations;
      break;
    default:
      return -1; // Unlimited
  }

  if (maxLimit === -1) return -1; // Unlimited
  return Math.max(0, maxLimit - currentCount);
};

module.exports = {
  PLAN_PERMISSIONS,
  TRIAL_CONFIG,
  WEBSITE_PRICING,
  getPlanPermissions,
  isFeatureAllowed,
  isWithinLimit,
  getFeatureAccess,
  hasAnalyticsAccess,
  hasMarketingAccess,
  getPlanLimits,
  canAddResource,
  getRemainingQuota,
};
