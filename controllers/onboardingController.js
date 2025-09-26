const Onboarding = require('../models/Onboarding');
const User = require('../models/users');
const Organization = require('../models/organization');
const Store = require('../models/store');
const Subscription = require('../models/subscriptions');
const SubscriptionPlan = require('../models/subscriptionPlans');
const { createAuditLog } = require('../helpers/auditLogHelper');

// Helper function to check onboarding status
const checkOnboardingStatus = async (organizationId) => {
  const onboarding = await Onboarding.findOne({ organizationId });
  
  if (!onboarding) {
    return {
      status: 'not_started',
      currentStep: 1,
      redirectTo: '/onboarding?step=1',
      isComplete: false
    };
  }
  
  if (onboarding.status === 'completed') {
    return {
      status: 'completed',
      currentStep: 4,
      redirectTo: '/dashboard',
      isComplete: true
    };
  }
  
  if (onboarding.status === 'skipped') {
    return {
      status: 'skipped',
      currentStep: 4,
      redirectTo: '/dashboard',
      isComplete: true
    };
  }
  
  // Determine which step to redirect to
  let redirectStep = 1;
  if (!onboarding.storeSetup.isCompleted) redirectStep = 1;
  else if (!onboarding.planSelection.isCompleted) redirectStep = 2;
  else if (!onboarding.platformTour.isCompleted) {
    // Check if all required modules are completed
    const requiredModules = ['stores', 'tasks', 'inventory', 'billing', 'analytics', 'customers', 'marketing', 'settings'];
    const completedModules = onboarding.platformTour.moduleToursCompleted.map(m => m.moduleId);
    const allRequiredCompleted = requiredModules.every(module => completedModules.includes(module));
    
    if (allRequiredCompleted) {
      // Mark platform tour as completed
      onboarding.platformTour.isCompleted = true;
      onboarding.platformTour.completedAt = new Date();
      onboarding.save();
      redirectStep = 4;
    } else {
      redirectStep = 3;
    }
  }
  else if (!onboarding.finalSetup.isCompleted) redirectStep = 4;
  
  return {
    status: onboarding.status,
    currentStep: redirectStep,
    redirectTo: `/onboarding?step=${redirectStep}`,
    isComplete: false
  };
};

// Get onboarding status for current user's organization
exports.getOnboardingStatus = async (req, res) => {
  try {
    const organizationId = req.user.organization;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with an organization'
      });
    }

    const onboarding = await Onboarding.findOne({ organizationId });
    
    if (!onboarding) {
      return res.status(200).json({
        success: true,
        message: 'Onboarding not started for this organization',
        data: null,
        status: {
          status: 'not_started',
          currentStep: 1,
          redirectTo: '/onboarding?step=1',
          isComplete: false
        }
      });
    }

    const status = await checkOnboardingStatus(organizationId);
    
    res.status(200).json({
      success: true,
      message: 'Onboarding status retrieved successfully',
      data: onboarding,
      status: status
    });
  } catch (error) {
    console.error('Get onboarding status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Start onboarding process for organization
exports.startOnboarding = async (req, res) => {
  try {
    const organizationId = req.user.organization;
    const userId = req.user.id;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with an organization'
      });
    }

    // Check if onboarding already exists
    let onboarding = await Onboarding.findOne({ organizationId });
    
    if (onboarding) {
      // Reset existing onboarding
      onboarding.status = 'in_progress';
      onboarding.currentStep = 1;
      onboarding.completedSteps = [];
      onboarding.storeSetup = { isCompleted: false };
      onboarding.planSelection = { isCompleted: false };
      onboarding.platformTour = { isCompleted: false };
      onboarding.finalSetup = { isCompleted: false };
      onboarding.onboardingStartedAt = new Date();
      onboarding.onboardingCompletedAt = null;
      onboarding.skippedOnboarding = false;
      
      await onboarding.save();
    } else {
      // Create new onboarding record
      onboarding = new Onboarding({
        organizationId,
        mainUserId: userId,
        status: 'in_progress',
        currentStep: 1,
        completedSteps: [],
        storeSetup: { isCompleted: false },
        planSelection: { isCompleted: false },
        platformTour: { isCompleted: false },
        finalSetup: { isCompleted: false },
        onboardingStartedAt: new Date()
      });
      
      await onboarding.save();
    }

    // Update user's onboarding status
    await User.findByIdAndUpdate(userId, {
      'onboardingStatus.isOnboardingComplete': false,
      'onboardingStatus.lastOnboardingStep': 1
    });

    // Audit log
    await createAuditLog({
      action: 'Onboarding Started',
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        currentStep: 1
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding process started successfully',
      data: onboarding
    });
  } catch (error) {
    console.error('Start onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Complete onboarding process
exports.completeOnboarding = async (req, res) => {
  try {
    const organizationId = req.user.organization;
    const userId = req.user.id;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with an organization'
      });
    }

    const onboarding = await Onboarding.findOne({ organizationId });
    
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding record not found'
      });
    }

    // Mark all steps as completed
    onboarding.status = 'completed';
    onboarding.currentStep = 4;
    onboarding.completedSteps = [1, 2, 3, 4];
    onboarding.storeSetup.isCompleted = true;
    onboarding.planSelection.isCompleted = true;
    onboarding.platformTour.isCompleted = true;
    onboarding.finalSetup.isCompleted = true;
    onboarding.onboardingCompletedAt = new Date();
    
    await onboarding.save();

    // Update user's onboarding status
    await User.findByIdAndUpdate(userId, {
      'onboardingStatus.isOnboardingComplete': true,
      'onboardingStatus.onboardingCompletedAt': new Date(),
      'onboardingStatus.lastOnboardingStep': 4
    });

    // Audit log
    await createAuditLog({
      action: 'Onboarding Completed',
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        completedAt: new Date()
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding process completed successfully',
      data: onboarding
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Skip onboarding process
exports.skipOnboarding = async (req, res) => {
  try {
    const organizationId = req.user.organization;
    const userId = req.user.id;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with an organization'
      });
    }

    let onboarding = await Onboarding.findOne({ organizationId });
    
    if (!onboarding) {
      // Create new onboarding record with skipped status
      onboarding = new Onboarding({
        organizationId,
        mainUserId: userId,
        status: 'skipped',
        currentStep: 4,
        completedSteps: [],
        storeSetup: { isCompleted: false },
        planSelection: { isCompleted: false },
        platformTour: { isCompleted: false },
        finalSetup: { isCompleted: false },
        skippedOnboarding: true,
        onboardingStartedAt: new Date(),
        onboardingCompletedAt: new Date()
      });
    } else {
      // Update existing onboarding
      onboarding.status = 'skipped';
      onboarding.skippedOnboarding = true;
      onboarding.onboardingCompletedAt = new Date();
    }
    
    await onboarding.save();

    // Update user's onboarding status
    await User.findByIdAndUpdate(userId, {
      'onboardingStatus.isOnboardingComplete': true,
      'onboardingStatus.onboardingCompletedAt': new Date(),
      'onboardingStatus.lastOnboardingStep': 4,
      'onboardingStatus.onboardingPreferences.skipOnboarding': true
    });

    // Audit log
    await createAuditLog({
      action: 'Onboarding Skipped',
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        skippedAt: new Date()
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding process skipped successfully',
      data: onboarding
    });
  } catch (error) {
    console.error('Skip onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update onboarding step
exports.updateOnboardingStep = async (req, res) => {
  try {
    const { stepNumber } = req.params;
    const { isComplete, data } = req.body;
    const organizationId = req.user.organization;
    const userId = req.user.id;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with an organization'
      });
    }

    const stepNum = parseInt(stepNumber);
    if (stepNum < 1 || stepNum > 4) {
      return res.status(400).json({
        success: false,
        message: 'Invalid step number. Must be between 1 and 4'
      });
    }

    let onboarding = await Onboarding.findOne({ organizationId });
    
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding record not found'
      });
    }

    // Update step completion
    if (isComplete) {
      if (!onboarding.completedSteps.includes(stepNum)) {
        onboarding.completedSteps.push(stepNum);
      }
      
      // Update step-specific data
      switch (stepNum) {
        case 1:
          onboarding.storeSetup.isCompleted = true;
          onboarding.storeSetup.completedAt = new Date();
          if (data) {
            onboarding.storeSetup.storeId = data.storeId;
            onboarding.storeSetup.setupMode = data.setupMode;
          }
          break;
        case 2:
          onboarding.planSelection.isCompleted = true;
          onboarding.planSelection.completedAt = new Date();
          if (data) {
            onboarding.planSelection.planId = data.planId;
            onboarding.planSelection.subscriptionId = data.subscriptionId;
            onboarding.planSelection.isTrialActivated = data.isTrialActivated || false;
          }
          break;
        case 3:
          onboarding.platformTour.isCompleted = true;
          onboarding.platformTour.completedAt = new Date();
          if (data && data.completedModules) {
            onboarding.platformTour.completedModules = data.completedModules;
          }
          break;
        case 4:
          onboarding.finalSetup.isCompleted = true;
          onboarding.finalSetup.completedAt = new Date();
          if (data && data.preferences) {
            onboarding.onboardingPreferences = data.preferences;
          }
          break;
      }
      
      // Update current step
      if (stepNum < 4) {
        onboarding.currentStep = stepNum + 1;
      } else {
        onboarding.currentStep = 4;
      }
    }

    await onboarding.save();

    // Audit log
    await createAuditLog({
      action: `Onboarding Step ${stepNum} Updated`,
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        stepNumber: stepNum,
        isComplete,
        data
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: `Onboarding step ${stepNum} updated successfully`,
      data: onboarding
    });
  } catch (error) {
    console.error('Update onboarding step error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update onboarding preferences
exports.updateOnboardingPreferences = async (req, res) => {
  try {
    const { skipTutorials, showTips } = req.body;
    const organizationId = req.user.organization;
    const userId = req.user.id;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with an organization'
      });
    }

    const onboarding = await Onboarding.findOne({ organizationId });
    
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding record not found'
      });
    }

    // Update preferences
    onboarding.onboardingPreferences = {
      skipTutorials: skipTutorials || false,
      showTips: showTips !== undefined ? showTips : true
    };
    
    await onboarding.save();

    // Update user's preferences
    await User.findByIdAndUpdate(userId, {
      'onboardingStatus.onboardingPreferences.skipTutorials': skipTutorials || false,
      'onboardingStatus.onboardingPreferences.showTips': showTips !== undefined ? showTips : true
    });

    // Audit log
    await createAuditLog({
      action: 'Onboarding Preferences Updated',
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        preferences: { skipTutorials, showTips }
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding preferences updated successfully',
      data: onboarding
    });
  } catch (error) {
    console.error('Update onboarding preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Complete individual module tour
exports.completeModuleTour = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { timeSpent, tourType } = req.body;
    const organizationId = req.user.organization;
    const userId = req.user.id;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with an organization'
      });
    }

    // Validate moduleId
    const validModules = ['stores', 'tasks', 'inventory', 'billing', 'analytics', 'customers', 'marketing', 'settings', 'user-management', 'integrations', 'customer-support', 'audit-logs', 'invoices'];
    if (!validModules.includes(moduleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module ID'
      });
    }

    const onboarding = await Onboarding.findOne({ organizationId });
    
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding record not found'
      });
    }

    // Check if module tour is already completed
    const existingModule = onboarding.platformTour.moduleToursCompleted.find(
      module => module.moduleId === moduleId
    );

    if (existingModule) {
      return res.status(200).json({
        success: true,
        message: 'Module tour already completed',
        data: onboarding
      });
    }

    // Add module to completed tours
    onboarding.platformTour.moduleToursCompleted.push({
      moduleId,
      completedAt: new Date(),
      completedBy: userId,
      timeSpent: timeSpent || 0,
      tourType: tourType || 'interactive'
    });

    // Update module progress
    const existingProgress = onboarding.platformTour.moduleProgress.find(
      progress => progress.moduleId === moduleId
    );

    if (existingProgress) {
      existingProgress.isCompleted = true;
      existingProgress.completedAt = new Date();
      existingProgress.timeSpent = timeSpent || 0;
      existingProgress.progressPercentage = 100;
    } else {
      onboarding.platformTour.moduleProgress.push({
        moduleId,
        isCompleted: true,
        completedAt: new Date(),
        timeSpent: timeSpent || 0,
        lastAccessedAt: new Date(),
        progressPercentage: 100
      });
    }

    // Update completed modules array
    if (!onboarding.platformTour.completedModules.includes(moduleId)) {
      onboarding.platformTour.completedModules.push(moduleId);
    }

    await onboarding.save();

    // Audit log
    await createAuditLog({
      action: `Module Tour Completed: ${moduleId}`,
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        moduleId,
        timeSpent,
        tourType
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: `Module tour '${moduleId}' completed successfully`,
      data: onboarding
    });
  } catch (error) {
    console.error('Complete module tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get module tour status
exports.getModuleStatus = async (req, res) => {
  try {
    const organizationId = req.user.organization;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with an organization'
      });
    }

    const onboarding = await Onboarding.findOne({ organizationId });
    
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding record not found'
      });
    }

    // Get all available modules
    const allModules = ['stores', 'tasks', 'inventory', 'billing', 'analytics', 'customers', 'marketing', 'settings', 'user-management', 'integrations', 'customer-support', 'audit-logs', 'invoices'];
    
    // Create module status array
    const moduleStatus = allModules.map(moduleId => {
      const completedModule = onboarding.platformTour.moduleToursCompleted.find(
        module => module.moduleId === moduleId
      );
      
      const progressModule = onboarding.platformTour.moduleProgress.find(
        progress => progress.moduleId === moduleId
      );

      return {
        moduleId,
        isCompleted: !!completedModule,
        completedAt: completedModule?.completedAt || null,
        timeSpent: completedModule?.timeSpent || 0,
        tourType: completedModule?.tourType || 'interactive',
        progressPercentage: progressModule?.progressPercentage || 0,
        lastAccessedAt: progressModule?.lastAccessedAt || null
      };
    });

    // Calculate overall progress
    const completedCount = onboarding.platformTour.moduleToursCompleted.length;
    const totalModules = allModules.length;
    const overallProgress = Math.round((completedCount / totalModules) * 100);

    res.status(200).json({
      success: true,
      message: 'Module status retrieved successfully',
      data: {
        moduleStatus,
        overallProgress,
        completedCount,
        totalModules,
        dashboardTourCompleted: onboarding.platformTour.dashboardTourCompleted,
        platformTourCompleted: onboarding.platformTour.isCompleted
      }
    });
  } catch (error) {
    console.error('Get module status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update module progress
exports.updateModuleProgress = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { progressPercentage, timeSpent } = req.body;
    const organizationId = req.user.organization;
    const userId = req.user.id;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with an organization'
      });
    }

    // Validate moduleId
    const validModules = ['stores', 'tasks', 'inventory', 'billing', 'analytics', 'customers', 'marketing', 'settings', 'user-management', 'integrations', 'customer-support', 'audit-logs', 'invoices'];
    if (!validModules.includes(moduleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid module ID'
      });
    }

    // Validate progress percentage
    if (progressPercentage !== undefined && (progressPercentage < 0 || progressPercentage > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Progress percentage must be between 0 and 100'
      });
    }

    const onboarding = await Onboarding.findOne({ organizationId });
    
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding record not found'
      });
    }

    // Find or create module progress entry
    let moduleProgress = onboarding.platformTour.moduleProgress.find(
      progress => progress.moduleId === moduleId
    );

    if (!moduleProgress) {
      moduleProgress = {
        moduleId,
        isCompleted: false,
        timeSpent: 0,
        lastAccessedAt: new Date(),
        progressPercentage: 0
      };
      onboarding.platformTour.moduleProgress.push(moduleProgress);
    }

    // Update progress
    moduleProgress.lastAccessedAt = new Date();
    if (progressPercentage !== undefined) {
      moduleProgress.progressPercentage = progressPercentage;
    }
    if (timeSpent !== undefined) {
      moduleProgress.timeSpent = timeSpent;
    }

    await onboarding.save();

    // Audit log
    await createAuditLog({
      action: `Module Progress Updated: ${moduleId}`,
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        moduleId,
        progressPercentage,
        timeSpent
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: `Module progress for '${moduleId}' updated successfully`,
      data: {
        moduleId,
        progressPercentage: moduleProgress.progressPercentage,
        timeSpent: moduleProgress.timeSpent,
        lastAccessedAt: moduleProgress.lastAccessedAt
      }
    });
  } catch (error) {
    console.error('Update module progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check if specific module tour is completed
exports.isModuleTourCompleted = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const organizationId = req.user.organization;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with an organization'
      });
    }

    const onboarding = await Onboarding.findOne({ organizationId });
    
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding record not found'
      });
    }

    const isCompleted = onboarding.platformTour.moduleToursCompleted.some(
      module => module.moduleId === moduleId
    );

    res.status(200).json({
      success: true,
      message: 'Module completion status retrieved successfully',
      data: {
        moduleId,
        isCompleted
      }
    });
  } catch (error) {
    console.error('Check module completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Export the helper function for use in other files
exports.checkOnboardingStatus = checkOnboardingStatus;
