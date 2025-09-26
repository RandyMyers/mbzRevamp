const Onboarding = require('../models/Onboarding');
const { checkOnboardingStatus } = require('../controllers/onboardingController');

/**
 * Middleware to check onboarding status and add it to request object
 * This middleware should be used on routes that need onboarding information
 */
exports.checkOnboardingStatus = async (req, res, next) => {
  try {
    if (req.user && req.user.organization) {
      const organizationId = req.user.organization;
      
      // Get onboarding status
      const onboardingStatus = await checkOnboardingStatus(organizationId);
      
      // Add to request object
      req.onboardingStatus = onboardingStatus;
      
      // Get full onboarding data if needed
      if (req.query.includeData === 'true') {
        const onboarding = await Onboarding.findByOrganization(organizationId);
        req.onboarding = onboarding;
      }
    }
    
    next();
  } catch (error) {
    console.error('Onboarding middleware error:', error);
    // Don't fail the request, just continue without onboarding data
    req.onboardingStatus = {
      status: 'not_started',
      currentStep: 1,
      redirectTo: '/onboarding?step=1',
      isComplete: false
    };
    next();
  }
};

/**
 * Middleware to require onboarding completion
 * Use this on routes that should only be accessible after onboarding is complete
 */
exports.requireOnboardingComplete = async (req, res, next) => {
  try {
    if (!req.user || !req.user.organization) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const organizationId = req.user.organization;
    const onboardingStatus = await checkOnboardingStatus(organizationId);

    if (!onboardingStatus.isComplete) {
      return res.status(403).json({
        success: false,
        message: 'Onboarding must be completed to access this resource',
        onboarding: {
          status: onboardingStatus.status,
          currentStep: onboardingStatus.currentStep,
          redirectTo: onboardingStatus.redirectTo
        }
      });
    }

    req.onboardingStatus = onboardingStatus;
    next();
  } catch (error) {
    console.error('Require onboarding complete middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Middleware to redirect incomplete onboarding
 * Use this on dashboard routes to redirect users to incomplete onboarding steps
 */
exports.redirectIncompleteOnboarding = async (req, res, next) => {
  try {
    if (!req.user || !req.user.organization) {
      return next();
    }

    const organizationId = req.user.organization;
    const onboardingStatus = await checkOnboardingStatus(organizationId);

    // If onboarding is not complete, redirect to the appropriate step
    if (!onboardingStatus.isComplete) {
      // For API requests, return JSON response
      if (req.path.startsWith('/api/')) {
        return res.status(302).json({
          success: false,
          message: 'Onboarding incomplete',
          redirect: onboardingStatus.redirectTo,
          onboarding: {
            status: onboardingStatus.status,
            currentStep: onboardingStatus.currentStep,
            redirectTo: onboardingStatus.redirectTo
          }
        });
      }
      
      // For web requests, redirect
      return res.redirect(onboardingStatus.redirectTo);
    }

    req.onboardingStatus = onboardingStatus;
    next();
  } catch (error) {
    console.error('Redirect incomplete onboarding middleware error:', error);
    // Don't fail the request, just continue
    next();
  }
};

/**
 * Middleware to track onboarding progress
 * Use this on onboarding-related routes to track user progress
 */
exports.trackOnboardingProgress = (stepNumber) => {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.organization) {
        const organizationId = req.user.organization;
        const userId = req.user.id;
        
        // Update last activity time
        await Onboarding.findOneAndUpdate(
          { organizationId },
          { 
            lastActivityAt: new Date(),
            currentStep: stepNumber
          }
        );

        // Track step start time if not already tracked
        const onboarding = await Onboarding.findOne({ organizationId });
        if (onboarding) {
          const existingStepTime = onboarding.stepTimes.find(st => st.stepNumber === stepNumber);
          if (!existingStepTime) {
            onboarding.stepTimes.push({
              stepNumber,
              timeSpent: 0,
              startedAt: new Date()
            });
            await onboarding.save();
          }
        }
      }
      
      next();
    } catch (error) {
      console.error('Track onboarding progress middleware error:', error);
      // Don't fail the request, just continue
      next();
    }
  };
};

/**
 * Middleware to validate onboarding step access
 * Ensures users can only access the current step or previous completed steps
 */
exports.validateStepAccess = (requiredStep) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.organization) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const organizationId = req.user.organization;
      const onboarding = await Onboarding.findOne({ organizationId });
      
      if (!onboarding) {
        // If no onboarding exists, allow access to step 1
        if (requiredStep === 1) {
          return next();
        }
        return res.status(403).json({
          success: false,
          message: 'Onboarding not started. Please start with step 1.'
        });
      }

      // Check if user can access this step
      const completedSteps = onboarding.completedSteps.map(step => step.stepNumber);
      const canAccessStep = completedSteps.includes(requiredStep) || 
                           requiredStep === onboarding.currentStep ||
                           requiredStep === 1;

      if (!canAccessStep) {
        return res.status(403).json({
          success: false,
          message: `Cannot access step ${requiredStep}. Current step: ${onboarding.currentStep}`,
          currentStep: onboarding.currentStep,
          completedSteps: completedSteps
        });
      }

      req.onboarding = onboarding;
      next();
    } catch (error) {
      console.error('Validate step access middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};

/**
 * Middleware to check if user is the main user (organization owner/admin)
 * Only the main user can perform certain onboarding actions
 */
exports.requireMainUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user.organization) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const organizationId = req.user.organization;
    const userId = req.user.id;
    
    const onboarding = await Onboarding.findOne({ organizationId });
    
    if (!onboarding) {
      // If no onboarding exists, allow the user to start it
      return next();
    }

    if (onboarding.mainUserId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the organization owner/admin can perform this action'
      });
    }

    req.onboarding = onboarding;
    next();
  } catch (error) {
    console.error('Require main user middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Middleware to add onboarding analytics tracking
 * Tracks user interactions with onboarding steps
 */
exports.trackOnboardingAnalytics = (eventType) => {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.organization) {
        const organizationId = req.user.organization;
        const userId = req.user.id;
        
        // Track the event (you can implement analytics tracking here)
        console.log(`Onboarding Analytics: ${eventType}`, {
          userId,
          organizationId,
          timestamp: new Date(),
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
        
        // You can add this to an analytics service or database
        // await AnalyticsService.trackEvent({
        //   eventType,
        //   userId,
        //   organizationId,
        //   metadata: {
        //     userAgent: req.get('User-Agent'),
        //     ip: req.ip,
        //     timestamp: new Date()
        //   }
        // });
      }
      
      next();
    } catch (error) {
      console.error('Track onboarding analytics middleware error:', error);
      // Don't fail the request, just continue
      next();
    }
  };
};

module.exports = exports;

