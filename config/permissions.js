/**
 * Unified Permission Schema
 * Used by both frontend and backend for consistent permission handling
 */

// Permission modules and their available actions
const PERMISSION_MODULES = {
  dashboard: ['view', 'edit'],
  users: ['view', 'create', 'edit', 'delete'],
  stores: ['view', 'create', 'edit', 'delete', 'sync'],
  products: ['view', 'create', 'edit', 'delete'],
  orders: ['view', 'create', 'edit', 'delete', 'export'],
  customers: ['view', 'create', 'edit', 'delete', 'export'],
  inventory: ['view', 'edit'],
  tasks: ['view', 'create', 'edit', 'delete', 'assign'],
  calls: ['view', 'create', 'edit', 'delete', 'schedule'],
  marketing: ['view', 'create', 'edit', 'delete'],
  websites: ['view', 'create', 'edit', 'delete'],
  analytics: ['view', 'export'],
  settings: ['view', 'edit'],
  roles: ['view', 'create', 'edit', 'delete'],
  audit_logs: ['view']
};

// Generate default permissions object with all false values
const generateDefaultPermissions = () => {
  const permissions = {};
  for (const [module, actions] of Object.entries(PERMISSION_MODULES)) {
    permissions[module] = {};
    for (const action of actions) {
      permissions[module][action] = false;
    }
  }
  return permissions;
};

// Generate admin permissions with all true values
const generateAdminPermissions = () => {
  const permissions = {};
  for (const [module, actions] of Object.entries(PERMISSION_MODULES)) {
    permissions[module] = {};
    for (const action of actions) {
      permissions[module][action] = true;
    }
  }
  return permissions;
};

// Role templates for quick setup
const ROLE_TEMPLATES = {
  admin: {
    name: 'Admin',
    description: 'Full access to all features',
    permissions: generateAdminPermissions()
  },
  manager: {
    name: 'Manager',
    description: 'Can manage most features except user deletion and role management',
    permissions: (() => {
      const perms = generateAdminPermissions();
      perms.users.delete = false;
      perms.roles.create = false;
      perms.roles.edit = false;
      perms.roles.delete = false;
      perms.settings.edit = false;
      return perms;
    })()
  },
  staff: {
    name: 'Staff',
    description: 'Can view all data and manage day-to-day operations',
    permissions: (() => {
      const perms = generateDefaultPermissions();
      // View access for most modules
      perms.dashboard.view = true;
      perms.users.view = true;
      perms.stores.view = true;
      perms.products.view = true;
      perms.orders.view = true;
      perms.orders.create = true;
      perms.orders.edit = true;
      perms.customers.view = true;
      perms.customers.create = true;
      perms.customers.edit = true;
      perms.inventory.view = true;
      perms.tasks.view = true;
      perms.tasks.create = true;
      perms.tasks.edit = true;
      perms.calls.view = true;
      perms.calls.create = true;
      perms.calls.edit = true;
      perms.calls.schedule = true;
      perms.marketing.view = true;
      perms.websites.view = true;
      perms.analytics.view = true;
      perms.settings.view = true;
      return perms;
    })()
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to view data',
    permissions: (() => {
      const perms = generateDefaultPermissions();
      // View-only access
      perms.dashboard.view = true;
      perms.stores.view = true;
      perms.products.view = true;
      perms.orders.view = true;
      perms.customers.view = true;
      perms.inventory.view = true;
      perms.tasks.view = true;
      perms.calls.view = true;
      perms.marketing.view = true;
      perms.websites.view = true;
      perms.analytics.view = true;
      return perms;
    })()
  }
};

// Validate permissions object structure
const validatePermissions = (permissions) => {
  if (!permissions || typeof permissions !== 'object') {
    return { valid: false, errors: ['Permissions must be an object'] };
  }

  const errors = [];

  for (const [module, actions] of Object.entries(permissions)) {
    if (!PERMISSION_MODULES[module]) {
      errors.push(`Unknown permission module: ${module}`);
      continue;
    }

    if (!actions || typeof actions !== 'object') {
      errors.push(`Module ${module} must have an actions object`);
      continue;
    }

    for (const [action, value] of Object.entries(actions)) {
      if (!PERMISSION_MODULES[module].includes(action)) {
        errors.push(`Unknown action '${action}' in module '${module}'`);
      }
      if (typeof value !== 'boolean') {
        errors.push(`Action '${module}.${action}' must be a boolean`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Check if a specific permission is granted
const hasPermission = (permissions, module, action) => {
  if (!permissions || !permissions[module]) return false;
  return permissions[module][action] === true;
};

// Check if any of the specified permissions are granted
const hasAnyPermission = (permissions, checks) => {
  return checks.some(({ module, action }) => hasPermission(permissions, module, action));
};

// Check if all of the specified permissions are granted
const hasAllPermissions = (permissions, checks) => {
  return checks.every(({ module, action }) => hasPermission(permissions, module, action));
};

module.exports = {
  PERMISSION_MODULES,
  ROLE_TEMPLATES,
  generateDefaultPermissions,
  generateAdminPermissions,
  validatePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions
};
