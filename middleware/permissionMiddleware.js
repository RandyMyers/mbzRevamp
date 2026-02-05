const Role = require('../models/role');
const Subscription = require('../models/subscriptions');
const Store = require('../models/store');
const User = require('../models/users');
const Website = require('../models/website');
const { ForbiddenError } = require('../utils/errors');
const { hasPermission } = require('../config/permissions');
const {
  getPlanPermissions,
  isFeatureAllowed,
  canAddResource,
  hasAnalyticsAccess,
  hasMarketingAccess,
  TRIAL_CONFIG
} = require('../config/planPermissions');
const { createAuditLog } = require('../helpers/auditLogHelper');

/**
 * Permission middleware for checking granular permissions
 * Supports the unified permission schema from config/permissions.js
 */

/**
 * Check if a role name indicates admin privileges
 * Handles variations like "admin", "Admin", "Administrator", "super-admin", "Super Admin", etc.
 */
const isAdminRole = (roleName) => {
  if (!roleName) return false;
  const normalized = String(roleName).toLowerCase().replace(/[\s_-]/g, '');
  // Match: admin, administrator, superadmin, super-admin, super_admin, etc.
  return normalized === 'admin' ||
         normalized === 'administrator' ||
         normalized === 'superadmin' ||
         normalized.includes('superadmin');
};

/**
 * Check if user has a specific permission
 * @param {string} module - Permission module (e.g., 'orders', 'users')
 * @param {string} action - Permission action (e.g., 'view', 'create', 'edit', 'delete')
 * @returns {Function} Express middleware
 */
exports.requirePermission = (module, action) => {
  return async (req, res, next) => {
    try {
      // User must be authenticated first
      if (!req.user) {
        return next(new ForbiddenError('Authentication required'));
      }

      const user = req.user;
      const roleName = typeof user.role === 'string' ? user.role : user.role?.name || req.userRoleName || '';

      // Super admin and admin have all permissions
      if (isAdminRole(roleName)) {
        return next();
      }

      // Get user's role permissions
      let permissions = null;

      // If user.role is an object with permissions
      if (user.role && typeof user.role === 'object' && user.role.permissions) {
        permissions = user.role.permissions;
      }
      // If user.role is an ObjectId, fetch the role
      else if (user.role && typeof user.role !== 'string') {
        try {
          const roleDoc = await Role.findById(user.role).select('permissions name');
          if (roleDoc && roleDoc.permissions) {
            permissions = roleDoc.permissions;
          }
        } catch (err) {
          console.error('Error fetching role permissions:', err);
        }
      }

      // Users without roles have NO access (security)
      if (!permissions) {
        // Log permission denial
        try {
          await createAuditLog({
            action: 'Permission Denied - No Role',
            user: user._id,
            resource: module,
            resourceId: req.params.id || 'n/a',
            details: {
              module,
              action,
              reason: 'User has no role assigned',
              path: req.originalUrl,
              method: req.method
            },
            organization: user.organizationId,
            severity: 'warning'
          });
        } catch (auditError) {
          console.error('Failed to create audit log:', auditError);
        }

        return next(new ForbiddenError('You do not have permission to perform this action. Please contact your administrator to assign you a role.'));
      }

      // Check if user has the specific permission
      const hasAccess = hasPermission(permissions, module, action);

      if (!hasAccess) {
        // Log permission denial
        try {
          await createAuditLog({
            action: 'Permission Denied',
            user: user._id,
            resource: module,
            resourceId: req.params.id || 'n/a',
            details: {
              module,
              action,
              requiredPermission: `${module}.${action}`,
              path: req.originalUrl,
              method: req.method
            },
            organization: user.organizationId,
            severity: 'warning'
          });
        } catch (auditError) {
          console.error('Failed to create audit log:', auditError);
        }

        return next(new ForbiddenError(`You do not have permission to ${action} ${module}. Required: ${module}.${action}`));
      }

      // Permission granted
      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      next(error);
    }
  };
};

/**
 * Check if user has any of the specified permissions
 * @param {Array<{module: string, action: string}>} requiredPermissions - Array of required permissions
 * @returns {Function} Express middleware
 */
exports.requireAnyPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ForbiddenError('Authentication required'));
      }

      const user = req.user;
      const roleName = typeof user.role === 'string' ? user.role : user.role?.name || req.userRoleName || '';

      // Super admin and admin have all permissions
      if (isAdminRole(roleName)) {
        return next();
      }

      // Get user's role permissions
      let permissions = null;

      if (user.role && typeof user.role === 'object' && user.role.permissions) {
        permissions = user.role.permissions;
      } else if (user.role && typeof user.role !== 'string') {
        try {
          const roleDoc = await Role.findById(user.role).select('permissions');
          if (roleDoc && roleDoc.permissions) {
            permissions = roleDoc.permissions;
          }
        } catch (err) {
          console.error('Error fetching role permissions:', err);
        }
      }

      if (!permissions) {
        return next(new ForbiddenError('You do not have permission to perform this action'));
      }

      // Check if user has any of the required permissions
      const hasAnyAccess = requiredPermissions.some(
        ({ module, action }) => hasPermission(permissions, module, action)
      );

      if (!hasAnyAccess) {
        return next(new ForbiddenError('You do not have the required permissions'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has all of the specified permissions
 * @param {Array<{module: string, action: string}>} requiredPermissions - Array of required permissions
 * @returns {Function} Express middleware
 */
exports.requireAllPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ForbiddenError('Authentication required'));
      }

      const user = req.user;
      const roleName = typeof user.role === 'string' ? user.role : user.role?.name || req.userRoleName || '';

      // Super admin and admin have all permissions
      if (isAdminRole(roleName)) {
        return next();
      }

      // Get user's role permissions
      let permissions = null;

      if (user.role && typeof user.role === 'object' && user.role.permissions) {
        permissions = user.role.permissions;
      } else if (user.role && typeof user.role !== 'string') {
        try {
          const roleDoc = await Role.findById(user.role).select('permissions');
          if (roleDoc && roleDoc.permissions) {
            permissions = roleDoc.permissions;
          }
        } catch (err) {
          console.error('Error fetching role permissions:', err);
        }
      }

      if (!permissions) {
        return next(new ForbiddenError('You do not have permission to perform this action'));
      }

      // Check if user has all required permissions
      const hasAllAccess = requiredPermissions.every(
        ({ module, action }) => hasPermission(permissions, module, action)
      );

      if (!hasAllAccess) {
        const missing = requiredPermissions
          .filter(({ module, action }) => !hasPermission(permissions, module, action))
          .map(({ module, action }) => `${module}.${action}`)
          .join(', ');
        return next(new ForbiddenError(`Missing required permissions: ${missing}`));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user can access a resource they own or has permission
 * @param {string} module - Permission module
 * @param {string} action - Permission action
 * @param {Function} getOwnerId - Function to get owner ID from request (req) => ownerId
 * @returns {Function} Express middleware
 */
exports.requirePermissionOrOwner = (module, action, getOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ForbiddenError('Authentication required'));
      }

      // Check if user is the owner
      const ownerId = await getOwnerId(req);
      if (ownerId && ownerId.toString() === req.user._id.toString()) {
        return next(); // Owner has access
      }

      // Fall back to permission check
      return exports.requirePermission(module, action)(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// ============================================
// SUBSCRIPTION PLAN PERMISSION MIDDLEWARE
// ============================================

/**
 * Get user's current subscription plan name
 */
const getUserPlanName = async (userId) => {
  try {
    // Check for active trial first (trials should be checked by trialEnd, not endDate)
    const trialSub = await Subscription.findOne({
      user: userId,
      isTrial: true,
      trialConverted: false,
      trialEnd: { $gt: new Date() },
      status: 'active'
    }).populate('plan', 'name slug');

    if (trialSub && trialSub.plan) {
      return trialSub.plan.slug || trialSub.plan.name.toLowerCase();
    }

    // Check for paid subscription (exclude trials to avoid double-checking)
    const subscription = await Subscription.findOne({
      user: userId,
      isTrial: { $ne: true },  // Exclude trials
      isActive: true,
      status: 'active',
      endDate: { $gte: new Date() }  // Ensure subscription hasn't expired
    }).populate('plan', 'name slug');

    if (subscription && subscription.plan) {
      return subscription.plan.slug || subscription.plan.name.toLowerCase();
    }

    return 'free'; // Default to free if no subscription
  } catch (error) {
    console.error('Error getting user plan:', error);
    return 'free';
  }
};

/**
 * Middleware to check if a feature is allowed for user's subscription plan
 * @param {string} featureName - Feature to check (tasks, marketing, analytics, etc.)
 * @returns {Function} Express middleware
 */
exports.requirePlanFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ForbiddenError('Authentication required'));
      }

      const planName = await getUserPlanName(req.user._id);
      const access = isFeatureAllowed(planName, featureName);

      if (access === false) {
        return next(new ForbiddenError(
          `Your ${planName} plan does not include access to ${featureName}. Please upgrade your plan.`
        ));
      }

      // Attach plan info to request for downstream use
      req.userPlan = planName;
      req.featureAccess = access; // true, 'limited', or 'view_only'

      next();
    } catch (error) {
      console.error('Plan feature middleware error:', error);
      next(error);
    }
  };
};

/**
 * Middleware to check resource limits (stores, products, users, websites)
 * @param {string} resourceType - Type of resource (store, product, user, website)
 * @returns {Function} Express middleware
 */
exports.checkResourceLimit = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ForbiddenError('Authentication required'));
      }

      const planName = await getUserPlanName(req.user._id);
      const userId = req.user._id;
      const organizationId = req.user.organization;

      let currentCount = 0;

      switch (resourceType) {
        case 'store':
          currentCount = await Store.countDocuments({
            $or: [{ user: userId }, { organization: organizationId }]
          });
          break;
        case 'user':
          if (organizationId) {
            // Count only active users in organization, excluding:
            // 1. Users pending deletion (soft-deleted)
            // 2. The owner (owner doesn't count towards the user limit)
            const totalUsers = await User.countDocuments({
              organization: organizationId,
              status: { $nin: ['pending-deletion', 'deleted'] } // Exclude soft-deleted users
            });
            currentCount = Math.max(0, totalUsers - 1); // Subtract 1 for the owner
          } else {
            currentCount = 0; // No additional users besides owner
          }
          break;
        case 'website':
          currentCount = await Website.countDocuments({
            $or: [{ user: userId }, { organization: organizationId }]
          });
          break;
        default:
          return next(); // Unknown resource type, allow
      }

      if (!canAddResource(planName, resourceType, currentCount)) {
        const limits = getPlanPermissions(planName).limits;
        let maxLimit;

        switch (resourceType) {
          case 'store':
            maxLimit = limits.maxStores;
            break;
          case 'user':
            maxLimit = limits.maxUsers;
            break;
          case 'website':
            maxLimit = limits.maxFreeWebsites;
            break;
        }

        return next(new ForbiddenError(
          `You have reached the maximum number of ${resourceType}s (${maxLimit}) for your ${planName} plan. Please upgrade to add more.`
        ));
      }

      req.userPlan = planName;
      next();
    } catch (error) {
      console.error('Resource limit middleware error:', error);
      next(error);
    }
  };
};

/**
 * Middleware to check analytics tab access
 * @param {string} tabName - Analytics tab to check
 * @returns {Function} Express middleware
 */
exports.requireAnalyticsAccess = (tabName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ForbiddenError('Authentication required'));
      }

      const planName = await getUserPlanName(req.user._id);

      if (!hasAnalyticsAccess(planName, tabName)) {
        return next(new ForbiddenError(
          `Your ${planName} plan does not include access to ${tabName} analytics. Please upgrade your plan.`
        ));
      }

      req.userPlan = planName;
      next();
    } catch (error) {
      console.error('Analytics access middleware error:', error);
      next(error);
    }
  };
};

/**
 * Middleware to check marketing section access
 * @param {string} sectionName - Marketing section to check
 * @returns {Function} Express middleware
 */
exports.requireMarketingAccess = (sectionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ForbiddenError('Authentication required'));
      }

      const planName = await getUserPlanName(req.user._id);

      if (!hasMarketingAccess(planName, sectionName)) {
        return next(new ForbiddenError(
          `Your ${planName} plan does not include access to ${sectionName}. Please upgrade your plan.`
        ));
      }

      req.userPlan = planName;
      next();
    } catch (error) {
      console.error('Marketing access middleware error:', error);
      next(error);
    }
  };
};

/**
 * Middleware to get and attach user's plan info to request
 * Use this for routes that need plan info but don't restrict access
 */
exports.attachPlanInfo = async (req, res, next) => {
  try {
    if (req.user) {
      const planName = await getUserPlanName(req.user._id);
      const planPermissions = getPlanPermissions(planName);

      req.userPlan = planName;
      req.planLimits = planPermissions.limits;
      req.planFeatures = planPermissions.limits.features;
    }
    next();
  } catch (error) {
    console.error('Attach plan info error:', error);
    next();
  }
};

/**
 * Middleware to check inventory access level
 * Returns 'full', 'view_only', or denies access
 */
exports.checkInventoryAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    const planName = await getUserPlanName(req.user._id);
    const access = isFeatureAllowed(planName, 'inventory');

    if (access === false || access === 'none') {
      return next(new ForbiddenError(
        `Your ${planName} plan does not include inventory access. Please upgrade your plan.`
      ));
    }

    // For view_only plans, only allow GET requests
    if (access === 'view_only' && req.method !== 'GET') {
      return next(new ForbiddenError(
        `Your ${planName} plan only allows viewing inventory. Please upgrade to edit inventory.`
      ));
    }

    req.userPlan = planName;
    req.inventoryAccess = access;
    next();
  } catch (error) {
    console.error('Inventory access middleware error:', error);
    next(error);
  }
};

// Export helper function for use in controllers
exports.getUserPlanName = getUserPlanName;
