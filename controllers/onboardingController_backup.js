const Onboarding = require('../models/Onboarding');
const User = require('../models/users');
const Organization = require('../models/organization');
const Store = require('../models/store');
const Subscription = require('../models/subscriptions');
const SubscriptionPlan = require('../models/subscriptionPlans');
const { createAuditLog } = require('../helpers/auditLogHelper');

// Onboarding Controller - Swagger documentation for endpoints is in the main swagger.js file

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
  else if (!onboarding.platformTour.isCompleted) redirectStep = 3;
  else if (!onboarding.finalSetup.isCompleted) redirectStep = 4;
  
  return {
    status: onboarding.status,
    currentStep: redirectStep,
    redirectTo: `/onboarding?step=${redirectStep}`,
    isComplete: false
  };
};

/**
 * @swagger
 * /api/onboarding/status:
 *   get:
 *     summary: Get onboarding status for current user's organization
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Onboarding'
 *                 status:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     currentStep:
 *                       type: number
 *                     redirectTo:
 *                       type: string
 *                     isComplete:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
exports.getOnboardingStatus = async (req, res) => {
  try {
    const organizationId = req.user.organization;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with an organization'
      });
    }

    const onboarding = await Onboarding.findByOrganization(organizationId);
    const status = await checkOnboardingStatus(organizationId);

    res.status(200).json({
      success: true,
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

/**
 * @swagger
 * /api/onboarding/start:
 *   post:
 *     summary: Start onboarding process for organization
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Onboarding started successfully
 *       400:
 *         description: Onboarding already exists or user not in organization
 *       500:
 *         description: Server error
 */
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
    const existingOnboarding = await Onboarding.findOne({ organizationId });
    if (existingOnboarding) {
      return res.status(400).json({
        success: false,
        message: 'Onboarding already exists for this organization',
        data: existingOnboarding
      });
    }

    // Create new onboarding
    const onboarding = new Onboarding({
      organizationId,
      mainUserId: userId,
      status: 'in_progress',
      currentStep: 1,
      startedAt: new Date(),
      lastActivityAt: new Date()
    });

    await onboarding.save();

    // Update user's onboarding status
    await User.findByIdAndUpdate(userId, {
      'onboardingStatus.lastOnboardingStep': 1,
      'onboardingStatus.isOnboardingComplete': false
    });

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

    res.status(201).json({
      success: true,
      message: 'Onboarding started successfully',
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

/**
 * @swagger
 * /api/onboarding/complete:
 *   post:
 *     summary: Complete onboarding process
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding completed successfully
 *       404:
 *         description: Onboarding not found
 *       500:
 *         description: Server error
 */
exports.completeOnboarding = async (req, res) => {
  try {
    const organizationId = req.user.organization;
    const userId = req.user.id;

    const onboarding = await Onboarding.findOne({ organizationId });
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding not found'
      });
    }

    // Mark as completed
    onboarding.status = 'completed';
    onboarding.completedAt = new Date();
    onboarding.lastActivityAt = new Date();

    await onboarding.save();

    // Update user's onboarding status
    await User.findByIdAndUpdate(userId, {
      'onboardingStatus.isOnboardingComplete': true,
      'onboardingStatus.onboardingCompletedAt': new Date(),
      'onboardingStatus.lastOnboardingStep': 4
    });

    await createAuditLog({
      action: 'Onboarding Completed',
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        completedAt: new Date(),
        timeSpent: onboarding.timeSpent
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
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

/**
 * @swagger
 * /api/onboarding/skip:
 *   post:
 *     summary: Skip onboarding process
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [user_choice, admin_override, technical_issue, other]
 *                 default: user_choice
 *               details:
 *                 type: string
 *                 description: Additional details about why onboarding was skipped
 *     responses:
 *       200:
 *         description: Onboarding skipped successfully
 *       404:
 *         description: Onboarding not found
 *       500:
 *         description: Server error
 */
exports.skipOnboarding = async (req, res) => {
  try {
    const organizationId = req.user.organization;
    const userId = req.user.id;
    const { reason = 'user_choice', details = '' } = req.body;

    const onboarding = await Onboarding.findOne({ organizationId });
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding not found'
      });
    }

    // Skip onboarding
    await onboarding.skipOnboarding(userId, reason, details);

    // Update user's onboarding status
    await User.findByIdAndUpdate(userId, {
      'onboardingStatus.isOnboardingComplete': true,
      'onboardingStatus.onboardingCompletedAt': new Date(),
      'onboardingStatus.onboardingPreferences.skipOnboarding': true
    });

    await createAuditLog({
      action: 'Onboarding Skipped',
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        reason,
        details,
        skippedAt: new Date()
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding skipped successfully',
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

/**
 * @swagger
 * /api/onboarding/reset:
 *   post:
 *     summary: Reset onboarding process
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding reset successfully
 *       404:
 *         description: Onboarding not found
 *       500:
 *         description: Server error
 */
exports.resetOnboarding = async (req, res) => {
  try {
    const organizationId = req.user.organization;
    const userId = req.user.id;

    const onboarding = await Onboarding.findOne({ organizationId });
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding not found'
      });
    }

    // Reset onboarding
    await onboarding.resetOnboarding();

    // Update user's onboarding status
    await User.findByIdAndUpdate(userId, {
      'onboardingStatus.isOnboardingComplete': false,
      'onboardingStatus.onboardingCompletedAt': null,
      'onboardingStatus.lastOnboardingStep': 1
    });

    await createAuditLog({
      action: 'Onboarding Reset',
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        resetAt: new Date()
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding reset successfully',
      data: onboarding
    });

  } catch (error) {
    console.error('Reset onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @swagger
 * /api/onboarding/steps/{stepNumber}:
 *   get:
 *     summary: Get step data and configuration
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stepNumber
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *         description: Step number
 *     responses:
 *       200:
 *         description: Step data retrieved successfully
 *       400:
 *         description: Invalid step number
 *       500:
 *         description: Server error
 */
exports.getStepData = async (req, res) => {
  try {
    const { stepNumber } = req.params;
    const stepNum = parseInt(stepNumber);

    if (stepNum < 1 || stepNum > 4) {
      return res.status(400).json({
        success: false,
        message: 'Invalid step number. Must be between 1 and 4.'
      });
    }

    const organizationId = req.user.organization;
    const onboarding = await Onboarding.findOne({ organizationId });

    // Step configurations
    const stepConfigs = {
      1: {
        title: 'Store & Website Setup',
        description: 'Set up your business store and website',
        fields: ['businessName', 'businessType', 'domain', 'logoUrl', 'colors', 'businessEmail', 'description'],
        isCompleted: onboarding?.storeSetup?.isCompleted || false,
        data: onboarding?.storeSetup?.storeData || {}
      },
      2: {
        title: 'Choose Your Plan',
        description: 'Select the perfect plan for your business needs',
        fields: ['selectedPlan', 'billingInterval'],
        isCompleted: onboarding?.planSelection?.isCompleted || false,
        data: {
          selectedPlan: onboarding?.planSelection?.selectedPlan || '',
          billingInterval: onboarding?.planSelection?.billingInterval || 'monthly',
          trialActivated: onboarding?.planSelection?.trialActivated || false
        }
      },
      3: {
        title: 'Platform Tour',
        description: 'Learn about the platform features and modules',
        fields: ['completedModules', 'dashboardTourCompleted'],
        isCompleted: onboarding?.platformTour?.isCompleted || false,
        data: {
          completedModules: onboarding?.platformTour?.completedModules || [],
          dashboardTourCompleted: onboarding?.platformTour?.dashboardTourCompleted || false
        }
      },
      4: {
        title: 'Final Setup',
        description: 'Complete your profile and preferences',
        fields: ['preferences', 'userProfile'],
        isCompleted: onboarding?.finalSetup?.isCompleted || false,
        data: {
          preferences: onboarding?.finalSetup?.preferences || {},
          userProfile: onboarding?.finalSetup?.userProfile || {}
        }
      }
    };

    res.status(200).json({
      success: true,
      data: stepConfigs[stepNum],
      stepNumber: stepNum
    });

  } catch (error) {
    console.error('Get step data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @swagger
 * /api/onboarding/steps/{stepNumber}/complete:
 *   post:
 *     summary: Complete a specific onboarding step
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stepNumber
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *         description: Step number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stepData:
 *                 type: object
 *                 description: Data specific to the step being completed
 *     responses:
 *       200:
 *         description: Step completed successfully
 *       400:
 *         description: Invalid step number or data
 *       500:
 *         description: Server error
 */
exports.completeStep = async (req, res) => {
  try {
    const { stepNumber } = req.params;
    const { stepData = {} } = req.body;
    const stepNum = parseInt(stepNumber);
    const userId = req.user.id;
    const organizationId = req.user.organization;

    if (stepNum < 1 || stepNum > 4) {
      return res.status(400).json({
        success: false,
        message: 'Invalid step number. Must be between 1 and 4.'
      });
    }

    let onboarding = await Onboarding.findOne({ organizationId });
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding not found'
      });
    }

    // Update step-specific data
    switch (stepNum) {
      case 1:
        onboarding.storeSetup = {
          ...onboarding.storeSetup,
          isCompleted: true,
          completedAt: new Date(),
          completedBy: userId,
          storeData: { ...onboarding.storeSetup.storeData, ...stepData }
        };
        break;
      case 2:
        onboarding.planSelection = {
          ...onboarding.planSelection,
          isCompleted: true,
          completedAt: new Date(),
          completedBy: userId,
          ...stepData
        };
        break;
      case 3:
        onboarding.platformTour = {
          ...onboarding.platformTour,
          isCompleted: true,
          completedAt: new Date(),
          completedBy: userId,
          ...stepData
        };
        break;
      case 4:
        onboarding.finalSetup = {
          ...onboarding.finalSetup,
          isCompleted: true,
          completedAt: new Date(),
          completedBy: userId,
          ...stepData
        };
        break;
    }

    // Complete the step
    await onboarding.completeStep(stepNum, userId, stepData);

    await createAuditLog({
      action: `Onboarding Step ${stepNum} Completed`,
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        stepNumber: stepNum,
        stepData
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: `Step ${stepNum} completed successfully`,
      data: onboarding
    });

  } catch (error) {
    console.error('Complete step error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Step-specific completion functions

/**
 * @swagger
 * /api/onboarding/steps/1/store-setup:
 *   post:
 *     summary: Complete store setup step
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - businessType
 *             properties:
 *               businessName:
 *                 type: string
 *               businessType:
 *                 type: string
 *               domain:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *               businessEmail:
 *                 type: string
 *               description:
 *                 type: string
 *               setupMode:
 *                 type: string
 *                 enum: [new, existing]
 *               linkedStoreUrl:
 *                 type: string
 *               platform:
 *                 type: string
 *     responses:
 *       200:
 *         description: Store setup completed successfully
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Server error
 */
exports.completeStoreSetup = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organization;
    const storeData = req.body;

    // Validate required fields
    if (!storeData.businessName || !storeData.businessType) {
      return res.status(400).json({
        success: false,
        message: 'Business name and type are required'
      });
    }

    let onboarding = await Onboarding.findOne({ organizationId });
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding not found'
      });
    }

    // Create store if setup mode is 'new'
    let storeId = null;
    if (storeData.setupMode === 'new') {
      const store = new Store({
        organizationId,
        userId,
        name: storeData.businessName,
        description: storeData.description || '',
        url: storeData.domain || `${storeData.businessName.toLowerCase().replace(/\s+/g, '')}.mbztech.com`,
        platformType: 'custom',
        apiKey: 'manual',
        secretKey: 'manual',
        isActive: true
      });
      
      const savedStore = await store.save();
      storeId = savedStore._id;
    }

    // Update onboarding
    onboarding.storeSetup = {
      isCompleted: true,
      completedAt: new Date(),
      completedBy: userId,
      storeData,
      storeId
    };

    await onboarding.completeStep(1, userId, storeData);

    await createAuditLog({
      action: 'Store Setup Completed',
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        storeData,
        storeId
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: 'Store setup completed successfully',
      data: {
        onboarding,
        storeId
      }
    });

  } catch (error) {
    console.error('Complete store setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @swagger
 * /api/onboarding/steps/2/plan-selection:
 *   post:
 *     summary: Complete plan selection step
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selectedPlan
 *             properties:
 *               selectedPlan:
 *                 type: string
 *               billingInterval:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 default: monthly
 *     responses:
 *       200:
 *         description: Plan selection completed successfully
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Server error
 */
exports.completePlanSelection = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organization;
    const { selectedPlan, billingInterval = 'monthly' } = req.body;

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: 'Selected plan is required'
      });
    }

    let onboarding = await Onboarding.findOne({ organizationId });
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding not found'
      });
    }

    // Find the plan
    const plan = await SubscriptionPlan.findOne({ name: selectedPlan });
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Selected plan not found'
      });
    }

    // Create subscription
    const subscription = new Subscription({
      user: userId,
      plan: plan._id,
      isTrial: true,
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      billingInterval,
      currency: 'USD',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      renewalDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'active'
    });

    const savedSubscription = await subscription.save();

    // Update onboarding
    onboarding.planSelection = {
      isCompleted: true,
      completedAt: new Date(),
      completedBy: userId,
      selectedPlan,
      planId: plan._id,
      subscriptionId: savedSubscription._id,
      trialActivated: true,
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      billingInterval
    };

    await onboarding.completeStep(2, userId, { selectedPlan, billingInterval });

    await createAuditLog({
      action: 'Plan Selection Completed',
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        selectedPlan,
        planId: plan._id,
        subscriptionId: savedSubscription._id,
        billingInterval
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: 'Plan selection completed successfully',
      data: {
        onboarding,
        subscription: savedSubscription
      }
    });

  } catch (error) {
    console.error('Complete plan selection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @swagger
 * /api/onboarding/steps/3/platform-tour:
 *   post:
 *     summary: Complete platform tour step
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completedModules:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [stores, tasks, inventory, billing, analytics, customers, marketing, settings]
 *               dashboardTourCompleted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Platform tour completed successfully
 *       500:
 *         description: Server error
 */
exports.completePlatformTour = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organization;
    const { completedModules = [], dashboardTourCompleted = false } = req.body;

    let onboarding = await Onboarding.findOne({ organizationId });
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding not found'
      });
    }

    // Update onboarding
    onboarding.platformTour = {
      isCompleted: true,
      completedAt: new Date(),
      completedBy: userId,
      completedModules,
      dashboardTourCompleted,
      moduleProgress: completedModules.map(moduleId => ({
        moduleId,
        isCompleted: true,
        completedAt: new Date(),
        timeSpent: 5 // Default 5 minutes per module
      }))
    };

    await onboarding.completeStep(3, userId, { completedModules, dashboardTourCompleted });

    await createAuditLog({
      action: 'Platform Tour Completed',
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        completedModules,
        dashboardTourCompleted
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: 'Platform tour completed successfully',
      data: onboarding
    });

  } catch (error) {
    console.error('Complete platform tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @swagger
 * /api/onboarding/steps/4/final-setup:
 *   post:
 *     summary: Complete final setup step
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferences:
 *                 type: object
 *                 properties:
 *                   notifications:
 *                     type: boolean
 *                   emailUpdates:
 *                     type: boolean
 *                   dataSharing:
 *                     type: boolean
 *                   marketingEmails:
 *                     type: boolean
 *                   showTips:
 *                     type: boolean
 *               userProfile:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   timezone:
 *                     type: string
 *                   language:
 *                     type: string
 *     responses:
 *       200:
 *         description: Final setup completed successfully
 *       500:
 *         description: Server error
 */
exports.completeFinalSetup = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organization;
    const { preferences = {}, userProfile = {} } = req.body;

    let onboarding = await Onboarding.findOne({ organizationId });
    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding not found'
      });
    }

    // Update user profile if provided
    if (Object.keys(userProfile).length > 0) {
      await User.findByIdAndUpdate(userId, {
        fullName: userProfile.firstName && userProfile.lastName 
          ? `${userProfile.firstName} ${userProfile.lastName}` 
          : undefined,
        phone: userProfile.phone,
        timezone: userProfile.timezone,
        language: userProfile.language
      });
    }

    // Update onboarding
    onboarding.finalSetup = {
      isCompleted: true,
      completedAt: new Date(),
      completedBy: userId,
      preferences: {
        notifications: preferences.notifications !== undefined ? preferences.notifications : true,
        emailUpdates: preferences.emailUpdates !== undefined ? preferences.emailUpdates : true,
        dataSharing: preferences.dataSharing !== undefined ? preferences.dataSharing : false,
        marketingEmails: preferences.marketingEmails !== undefined ? preferences.marketingEmails : false,
        showTips: preferences.showTips !== undefined ? preferences.showTips : true
      },
      userProfile
    };

    // Complete the entire onboarding
    onboarding.status = 'completed';
    onboarding.completedAt = new Date();
    onboarding.lastActivityAt = new Date();

    await onboarding.save();

    // Update user's onboarding status
    await User.findByIdAndUpdate(userId, {
      'onboardingStatus.isOnboardingComplete': true,
      'onboardingStatus.onboardingCompletedAt': new Date(),
      'onboardingStatus.lastOnboardingStep': 4
    });

    await createAuditLog({
      action: 'Final Setup Completed - Onboarding Complete',
      user: userId,
      resource: 'onboarding',
      resourceId: onboarding._id,
      details: {
        organizationId,
        preferences,
        userProfile,
        completedAt: new Date()
      },
      organization: organizationId,
      severity: 'info'
    });

    res.status(200).json({
      success: true,
      message: 'Final setup completed successfully - Onboarding complete!',
      data: onboarding
    });

  } catch (error) {
    console.error('Complete final setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Export the helper function for use in auth controllers
exports.checkOnboardingStatus = checkOnboardingStatus;
