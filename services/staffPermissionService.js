/**
 * Staff Permission Service
 * Manages module permissions for nexusfinal2 staff accounts
 */

// Default permission structure based on nexusfinal2 types.ts
const createDefaultPermissions = () => {
  const defaultPermission = { view: false, edit: false, delete: false, grant: false };
  
  return {
    dashboard: {
      overview: defaultPermission,
      userStats: defaultPermission,
      revenueStats: defaultPermission,
      systemHealth: defaultPermission,
    },
    accounting: {
      dashboard: defaultPermission,
      journalEntries: { view: false, create: false, edit: false, delete: false, approve: false },
      exchangeRates: defaultPermission,
      chartOfAccounts: { view: false, create: false, edit: false, delete: false, export: false },
      financialReports: { view: false, generate: false, export: false, schedule: false },
      bankAccounts: { view: false, create: false, edit: false, delete: false, reconcile: false },
      invoices: { view: false, create: false, edit: false, delete: false, send: false, approve: false },
      payroll: { view: false, create: false, edit: false, delete: false, process: false, approve: false },
      templates: { view: false, create: false, edit: false, delete: false, customize: false }
    },
    hrManagement: {
      dashboard: defaultPermission,
      employeeDirectory: { view: false, create: false, edit: false, delete: false, terminate: false, export: false },
      timeOffManagement: { view: false, approve: false, reject: false, override: false, manageCategories: false, manageBalances: false },
      payrollManagement: { view: false, create: false, edit: false, process: false, approve: false },
      performanceReviews: { view: false, create: false, edit: false, conduct: false, approve: false },
      documents: { view: false, upload: false, edit: false, delete: false, approve: false },
      training: { view: false, create: false, edit: false, enroll: false, approve: false },
      attendance: { view: false, edit: false, approve: false, reports: false },
      jobPostings: { view: false, create: false, edit: false, delete: false, publish: false, manageApplicants: false },
      onboarding: { view: false, create: false, edit: false, delete: false, assign: false, track: false },
      weeklyReports: { view: false, create: false, edit: false, approve: false, export: false },
      requests: { view: false, create: false, edit: false, approve: false, reject: false, assign: false }
    },
    taskManagement: {
      allTasks: { view: false, create: false, edit: false, delete: false, assign: false },
      myTasks: defaultPermission,
      projects: { view: false, create: false, edit: false, delete: false, manage: false },
      callScheduler: { view: false, create: false, edit: false, delete: false, joinCalls: false },
      calendar: { view: false, create: false, edit: false, delete: false, schedule: false },
      analytics: defaultPermission
    },
    userManagement: {
      users: { view: false, create: false, edit: false, delete: false, suspend: false, resetPassword: false },
      subscriptions: { view: false, create: false, edit: false, cancel: false, refund: false, upgrade: false, downgrade: false },
      affiliate: { view: false, create: false, edit: false, approve: false, payout: false, commission: false, track: false }
    },
    tools: {
      analytics: defaultPermission,
      email: { view: false, send: false, templates: false, campaigns: false },
      chat: { view: false, moderate: false, archive: false, export: false },
      internalChat: { view: false, create: false, moderate: false, archive: false, export: false, manageGroups: false },
      crm: { view: false, create: false, edit: false, delete: false, campaigns: false },
      support: { view: false, create: false, edit: false, assign: false, close: false },
      website: { view: false, create: false, edit: false, publish: false, domains: false },
      blog: { view: false, create: false, edit: false, delete: false, publish: false, moderate: false },
      notifications: { view: false, send: false, schedule: false, manage: false }
    },
    administration: {
      dashboard: defaultPermission,
      staffAccounts: { view: false, create: false, edit: false, delete: false, suspend: false, resetPassword: false, manageRoles: false },
      security: { view: false, edit: false, auditLogs: false, sessions: false },
      auditLogs: { view: false, export: false, filter: false, delete: false },
      emailSignatures: { view: false, create: false, edit: false, delete: false, assign: false },
      contentManagement: { view: false, create: false, edit: false, delete: false, publish: false },
      analytics: defaultPermission,
      notifications: { view: false, send: false, schedule: false, templates: false }
    },
    selfService: {
      profile: defaultPermission,
      leaveRequests: defaultPermission,
      attendance: defaultPermission,
      documents: defaultPermission,
      training: defaultPermission,
      performanceReview: defaultPermission,
      expenses: defaultPermission,
      salaryRequests: defaultPermission,
      weeklyReports: defaultPermission,
      equipment: defaultPermission,
      salaryAdvance: defaultPermission
    },
    system: {
      settings: { view: false, edit: false, integrations: false, features: false },
      integrations: { view: false, configure: false, enable: false, disable: false }
    }
  };
};

// Admin permissions (all true)
const createAdminPermissions = () => {
  const adminPermission = { view: true, edit: true, delete: true, grant: true };
  
  return {
    dashboard: {
      overview: adminPermission,
      userStats: adminPermission,
      revenueStats: adminPermission,
      systemHealth: adminPermission,
    },
    accounting: {
      dashboard: adminPermission,
      journalEntries: { view: true, create: true, edit: true, delete: true, approve: true },
      exchangeRates: adminPermission,
      chartOfAccounts: { view: true, create: true, edit: true, delete: true, export: true },
      financialReports: { view: true, generate: true, export: true, schedule: true },
      bankAccounts: { view: true, create: true, edit: true, delete: true, reconcile: true },
      invoices: { view: true, create: true, edit: true, delete: true, send: true, approve: true },
      payroll: { view: true, create: true, edit: true, delete: true, process: true, approve: true },
      templates: { view: true, create: true, edit: true, delete: true, customize: true }
    },
    hrManagement: {
      dashboard: adminPermission,
      employeeDirectory: { view: true, create: true, edit: true, delete: true, terminate: true, export: true },
      timeOffManagement: { view: true, approve: true, reject: true, override: true, manageCategories: true, manageBalances: true },
      payrollManagement: { view: true, create: true, edit: true, process: true, approve: true },
      performanceReviews: { view: true, create: true, edit: true, conduct: true, approve: true },
      documents: { view: true, upload: true, edit: true, delete: true, approve: true },
      training: { view: true, create: true, edit: true, enroll: true, approve: true },
      attendance: { view: true, edit: true, approve: true, reports: true },
      jobPostings: { view: true, create: true, edit: true, delete: true, publish: true, manageApplicants: true },
      onboarding: { view: true, create: true, edit: true, delete: true, assign: true, track: true },
      weeklyReports: { view: true, create: true, edit: true, approve: true, export: true },
      requests: { view: true, create: true, edit: true, approve: true, reject: true, assign: true }
    },
    taskManagement: {
      allTasks: { view: true, create: true, edit: true, delete: true, assign: true },
      myTasks: adminPermission,
      projects: { view: true, create: true, edit: true, delete: true, manage: true },
      callScheduler: { view: true, create: true, edit: true, delete: true, joinCalls: true },
      calendar: { view: true, create: true, edit: true, delete: true, schedule: true },
      analytics: adminPermission
    },
    userManagement: {
      users: { view: true, create: true, edit: true, delete: true, suspend: true, resetPassword: true },
      subscriptions: { view: true, create: true, edit: true, cancel: true, refund: true, upgrade: true, downgrade: true },
      affiliate: { view: true, create: true, edit: true, approve: true, payout: true, commission: true, track: true }
    },
    tools: {
      analytics: adminPermission,
      email: { view: true, send: true, templates: true, campaigns: true },
      chat: { view: true, moderate: true, archive: true, export: true },
      internalChat: { view: true, create: true, moderate: true, archive: true, export: true, manageGroups: true },
      crm: { view: true, create: true, edit: true, delete: true, campaigns: true },
      support: { view: true, create: true, edit: true, assign: true, close: true },
      website: { view: true, create: true, edit: true, publish: true, domains: true },
      blog: { view: true, create: true, edit: true, delete: true, publish: true, moderate: true },
      notifications: { view: true, send: true, schedule: true, manage: true }
    },
    administration: {
      dashboard: adminPermission,
      staffAccounts: { view: true, create: true, edit: true, delete: true, suspend: true, resetPassword: true, manageRoles: true },
      security: { view: true, edit: true, auditLogs: true, sessions: true },
      auditLogs: { view: true, export: true, filter: true, delete: true },
      emailSignatures: { view: true, create: true, edit: true, delete: true, assign: true },
      contentManagement: { view: true, create: true, edit: true, delete: true, publish: true },
      analytics: adminPermission,
      notifications: { view: true, send: true, schedule: true, templates: true }
    },
    selfService: {
      profile: adminPermission,
      leaveRequests: adminPermission,
      attendance: adminPermission,
      documents: adminPermission,
      training: adminPermission,
      performanceReview: adminPermission,
      expenses: adminPermission,
      salaryRequests: adminPermission,
      weeklyReports: adminPermission,
      equipment: adminPermission,
      salaryAdvance: adminPermission
    },
    system: {
      settings: { view: true, edit: true, integrations: true, features: true },
      integrations: { view: true, configure: true, enable: true, disable: true }
    }
  };
};

// Role-specific permission templates
const getRolePermissions = (staffRole) => {
  switch (staffRole) {
    case 'super-admin':
      return createAdminPermissions();
    
    case 'hr-manager':
      return {
        ...createDefaultPermissions(),
        dashboard: {
          overview: { view: true, edit: false, delete: false, grant: false },
          userStats: { view: true, edit: false, delete: false, grant: false },
          revenueStats: { view: false, edit: false, delete: false, grant: false },
          systemHealth: { view: false, edit: false, delete: false, grant: false }
        },
        hrManagement: {
          dashboard: { view: true, edit: false, delete: false, grant: false },
          employeeDirectory: { view: true, create: true, edit: true, delete: true, terminate: true, export: true },
          timeOffManagement: { view: true, approve: true, reject: true, override: true, manageCategories: true, manageBalances: true },
          payrollManagement: { view: true, create: true, edit: true, process: true, approve: true },
          performanceReviews: { view: true, create: true, edit: true, conduct: true, approve: true },
          documents: { view: true, upload: true, edit: true, delete: true, approve: true },
          training: { view: true, create: true, edit: true, enroll: true, approve: true },
          attendance: { view: true, edit: true, approve: true, reports: true },
          jobPostings: { view: true, create: true, edit: true, delete: true, publish: true, manageApplicants: true },
          onboarding: { view: true, create: true, edit: true, delete: true, assign: true, track: true },
          weeklyReports: { view: true, create: true, edit: true, approve: true, export: true },
          requests: { view: true, create: true, edit: true, approve: true, reject: true, assign: true }
        },
        selfService: {
          profile: { view: true, edit: true, delete: false, grant: false },
          leaveRequests: { view: true, edit: true, delete: false, grant: false },
          attendance: { view: true, edit: true, delete: false, grant: false },
          documents: { view: true, edit: true, delete: false, grant: false },
          training: { view: true, edit: true, delete: false, grant: false },
          performanceReview: { view: true, edit: true, delete: false, grant: false },
          expenses: { view: true, edit: true, delete: false, grant: false },
          salaryRequests: { view: true, edit: true, delete: false, grant: false },
          weeklyReports: { view: true, edit: true, delete: false, grant: false },
          equipment: { view: true, edit: true, delete: false, grant: false },
          salaryAdvance: { view: true, edit: true, delete: false, grant: false }
        }
      };
    
    case 'hr-assistant':
      return {
        ...createDefaultPermissions(),
        dashboard: {
          overview: { view: true, edit: false, delete: false, grant: false },
          userStats: { view: true, edit: false, delete: false, grant: false },
          revenueStats: { view: false, edit: false, delete: false, grant: false },
          systemHealth: { view: false, edit: false, delete: false, grant: false }
        },
        hrManagement: {
          dashboard: { view: true, edit: false, delete: false, grant: false },
          employeeDirectory: { view: true, create: false, edit: true, delete: false, terminate: false, export: false },
          timeOffManagement: { view: true, approve: false, reject: false, override: false, manageCategories: false, manageBalances: false },
          payrollManagement: { view: true, create: false, edit: false, process: false, approve: false },
          performanceReviews: { view: true, create: false, edit: false, conduct: false, approve: false },
          documents: { view: true, upload: true, edit: true, delete: false, approve: false },
          training: { view: true, create: false, edit: false, enroll: true, approve: false },
          attendance: { view: true, edit: true, approve: false, reports: false },
          jobPostings: { view: true, create: false, edit: false, delete: false, publish: false, manageApplicants: false },
          onboarding: { view: true, create: false, edit: false, delete: false, assign: false, track: true },
          weeklyReports: { view: true, create: false, edit: false, approve: false, export: false },
          requests: { view: true, create: false, edit: false, approve: false, reject: false, assign: false }
        },
        selfService: {
          profile: { view: true, edit: true, delete: false, grant: false },
          leaveRequests: { view: true, edit: true, delete: false, grant: false },
          attendance: { view: true, edit: true, delete: false, grant: false },
          documents: { view: true, edit: true, delete: false, grant: false },
          training: { view: true, edit: true, delete: false, grant: false },
          performanceReview: { view: true, edit: true, delete: false, grant: false },
          expenses: { view: true, edit: true, delete: false, grant: false },
          salaryRequests: { view: true, edit: true, delete: false, grant: false },
          weeklyReports: { view: true, edit: true, delete: false, grant: false },
          equipment: { view: true, edit: true, delete: false, grant: false },
          salaryAdvance: { view: true, edit: true, delete: false, grant: false }
        }
      };
    
    case 'accountant':
      return {
        ...createDefaultPermissions(),
        dashboard: {
          overview: { view: true, edit: false, delete: false, grant: false },
          userStats: { view: false, edit: false, delete: false, grant: false },
          revenueStats: { view: true, edit: false, delete: false, grant: false },
          systemHealth: { view: false, edit: false, delete: false, grant: false }
        },
        accounting: {
          dashboard: { view: true, edit: false, delete: false, grant: false },
          journalEntries: { view: true, create: true, edit: true, delete: true, approve: true },
          exchangeRates: { view: true, edit: true, delete: false, grant: false },
          chartOfAccounts: { view: true, create: true, edit: true, delete: true, export: true },
          financialReports: { view: true, generate: true, export: true, schedule: true },
          bankAccounts: { view: true, create: true, edit: true, delete: true, reconcile: true },
          invoices: { view: true, create: true, edit: true, delete: true, send: true, approve: true },
          payroll: { view: true, create: true, edit: true, delete: true, process: true, approve: true },
          templates: { view: true, create: true, edit: true, delete: true, customize: true }
        },
        selfService: {
          profile: { view: true, edit: true, delete: false, grant: false },
          leaveRequests: { view: true, edit: true, delete: false, grant: false },
          attendance: { view: true, edit: true, delete: false, grant: false },
          documents: { view: true, edit: true, delete: false, grant: false },
          training: { view: true, edit: true, delete: false, grant: false },
          performanceReview: { view: true, edit: true, delete: false, grant: false },
          expenses: { view: true, edit: true, delete: false, grant: false },
          salaryRequests: { view: true, edit: true, delete: false, grant: false },
          weeklyReports: { view: true, edit: true, delete: false, grant: false },
          equipment: { view: true, edit: true, delete: false, grant: false },
          salaryAdvance: { view: true, edit: true, delete: false, grant: false }
        }
      };
    
    case 'developer':
      return {
        ...createDefaultPermissions(),
        dashboard: {
          overview: { view: true, edit: false, delete: false, grant: false },
          userStats: { view: true, edit: false, delete: false, grant: false },
          revenueStats: { view: false, edit: false, delete: false, grant: false },
          systemHealth: { view: true, edit: false, delete: false, grant: false }
        },
        system: {
          settings: { view: true, edit: true, integrations: true, features: true },
          integrations: { view: true, configure: true, enable: true, disable: true }
        },
        tools: {
          analytics: { view: true, edit: false, delete: false, grant: false },
          email: { view: true, send: false, templates: false, campaigns: false },
          chat: { view: true, moderate: false, archive: false, export: false },
          internalChat: { view: true, create: false, moderate: false, archive: false, export: false, manageGroups: false },
          crm: { view: true, create: false, edit: false, delete: false, campaigns: false },
          support: { view: true, create: false, edit: false, assign: false, close: false },
          website: { view: true, create: true, edit: true, delete: true, publish: true, domains: true },
          blog: { view: true, create: true, edit: true, delete: true, publish: true, moderate: false },
          notifications: { view: true, send: false, schedule: false, manage: false }
        },
        selfService: {
          profile: { view: true, edit: true, delete: false, grant: false },
          leaveRequests: { view: true, edit: true, delete: false, grant: false },
          attendance: { view: true, edit: true, delete: false, grant: false },
          documents: { view: true, edit: true, delete: false, grant: false },
          training: { view: true, edit: true, delete: false, grant: false },
          performanceReview: { view: true, edit: true, delete: false, grant: false },
          expenses: { view: true, edit: true, delete: false, grant: false },
          salaryRequests: { view: true, edit: true, delete: false, grant: false },
          weeklyReports: { view: true, edit: true, delete: false, grant: false },
          equipment: { view: true, edit: true, delete: false, grant: false },
          salaryAdvance: { view: true, edit: true, delete: false, grant: false }
        }
      };
    
    case 'support':
      return {
        ...createDefaultPermissions(),
        dashboard: {
          overview: { view: true, edit: false, delete: false, grant: false },
          userStats: { view: true, edit: false, delete: false, grant: false },
          revenueStats: { view: false, edit: false, delete: false, grant: false },
          systemHealth: { view: true, edit: false, delete: false, grant: false }
        },
        tools: {
          analytics: { view: true, edit: false, delete: false, grant: false },
          email: { view: true, send: true, templates: false, campaigns: false },
          chat: { view: true, moderate: true, archive: true, export: false },
          internalChat: { view: true, create: false, moderate: false, archive: false, export: false, manageGroups: false },
          crm: { view: true, create: true, edit: true, delete: false, campaigns: false },
          support: { view: true, create: true, edit: true, assign: true, close: true },
          website: { view: true, create: false, edit: false, delete: false, publish: false, domains: false },
          blog: { view: true, create: false, edit: false, delete: false, publish: false, moderate: false },
          notifications: { view: true, send: false, schedule: false, manage: false }
        },
        selfService: {
          profile: { view: true, edit: true, delete: false, grant: false },
          leaveRequests: { view: true, edit: true, delete: false, grant: false },
          attendance: { view: true, edit: true, delete: false, grant: false },
          documents: { view: true, edit: true, delete: false, grant: false },
          training: { view: true, edit: true, delete: false, grant: false },
          performanceReview: { view: true, edit: true, delete: false, grant: false },
          expenses: { view: true, edit: true, delete: false, grant: false },
          salaryRequests: { view: true, edit: true, delete: false, grant: false },
          weeklyReports: { view: true, edit: true, delete: false, grant: false },
          equipment: { view: true, edit: true, delete: false, grant: false },
          salaryAdvance: { view: true, edit: true, delete: false, grant: false }
        }
      };
    
    default:
      return createDefaultPermissions();
  }
};

// Validate permission structure
const validatePermissions = (permissions) => {
  const requiredModules = [
    'dashboard', 'accounting', 'hrManagement', 'taskManagement', 
    'userManagement', 'tools', 'administration', 'selfService', 'system'
  ];
  
  for (const module of requiredModules) {
    if (!permissions[module]) {
      return false;
    }
  }
  
  return true;
};

module.exports = {
  createDefaultPermissions,
  createAdminPermissions,
  getRolePermissions,
  validatePermissions
};
