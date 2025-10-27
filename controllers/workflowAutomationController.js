const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const PerformanceReview = require('../models/PerformanceReview');
const TrainingEnrollment = require('../models/TrainingEnrollment');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Workflow Automation
 *     description: HR workflow automation and approval processes
 */

// In-memory workflow rules (in production, this would be a database model)
const workflowRules = [
  {
    id: '1',
    name: 'Leave Request Approval',
    module: 'hr',
    event: 'leave_request_submitted',
    conditions: {
      leaveDays: { min: 1, max: 3 },
      department: 'any',
      employeeLevel: 'any'
    },
    actions: [
      {
        type: 'auto_approve',
        message: 'Leave request automatically approved for short duration'
      }
    ],
    escalation: {
      enabled: true,
      timeLimit: 24, // hours
      escalateTo: 'hr-manager'
    },
    isActive: true
  },
  {
    id: '2',
    name: 'Long Leave Request',
    module: 'hr',
    event: 'leave_request_submitted',
    conditions: {
      leaveDays: { min: 4 },
      department: 'any',
      employeeLevel: 'any'
    },
    actions: [
      {
        type: 'require_approval',
        approver: 'hr-manager',
        message: 'Long leave request requires HR manager approval'
      }
    ],
    escalation: {
      enabled: true,
      timeLimit: 48,
      escalateTo: 'super-admin'
    },
    isActive: true
  },
  {
    id: '3',
    name: 'Performance Review Reminder',
    module: 'hr',
    event: 'performance_review_due',
    conditions: {
      reviewType: 'annual',
      daysUntilDue: 30
    },
    actions: [
      {
        type: 'send_reminder',
        channels: ['email', 'in_app'],
        message: 'Annual performance review is due in 30 days'
      }
    ],
    escalation: {
      enabled: true,
      timeLimit: 7,
      escalateTo: 'hr-manager'
    },
    isActive: true
  },
  {
    id: '4',
    name: 'Training Completion Notification',
    module: 'hr',
    event: 'training_completed',
    conditions: {
      trainingType: 'mandatory',
      department: 'any'
    },
    actions: [
      {
        type: 'notify_hr',
        message: 'Employee completed mandatory training'
      },
      {
        type: 'update_compliance',
        field: 'training_status',
        value: 'completed'
      }
    ],
    escalation: {
      enabled: false
    },
    isActive: true
  }
];

// In-memory workflow instances (in production, this would be a database model)
let workflowInstances = [];

/**
 * @swagger
 * /api/admin/workflow/rules:
 *   get:
 *     summary: Get all workflow rules
 *     tags: [Workflow Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: Filter by module
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Workflow rules retrieved successfully
 */
exports.getWorkflowRules = async (req, res, next) => {
  try {
    const { module, isActive } = req.query;
    
    let filteredRules = workflowRules;
    
    if (module) {
      filteredRules = filteredRules.filter(rule => rule.module === module);
    }
    
    if (isActive !== undefined) {
      const activeFilter = isActive === 'true';
      filteredRules = filteredRules.filter(rule => rule.isActive === activeFilter);
    }

    res.status(200).json({
      success: true,
      data: filteredRules,
      message: 'Workflow rules retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving workflow rules:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve workflow rules',
      message: `Failed to retrieve workflow rules: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/workflow/rules:
 *   post:
 *     summary: Create new workflow rule
 *     tags: [Workflow Automation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - module
 *               - event
 *               - conditions
 *               - actions
 *             properties:
 *               name:
 *                 type: string
 *                 description: Rule name
 *               module:
 *                 type: string
 *                 description: Module (hr, finance, etc.)
 *               event:
 *                 type: string
 *                 description: Trigger event
 *               conditions:
 *                 type: object
 *                 description: Rule conditions
 *               actions:
 *                 type: array
 *                 description: Actions to take
 *               escalation:
 *                 type: object
 *                 description: Escalation settings
 *     responses:
 *       201:
 *         description: Workflow rule created successfully
 */
exports.createWorkflowRule = async (req, res, next) => {
  try {
    const { name, module, event, conditions, actions, escalation } = req.body;

    if (!name || !module || !event || !conditions || !actions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, module, event, conditions, and actions are required'
      });
    }

    const newRule = {
      id: (workflowRules.length + 1).toString(),
      name,
      module,
      event,
      conditions,
      actions,
      escalation: escalation || { enabled: false },
      isActive: true,
      createdAt: new Date(),
      createdBy: req.user.id
    };

    workflowRules.push(newRule);

    res.status(201).json({
      success: true,
      data: newRule,
      message: 'Workflow rule created successfully'
    });
  } catch (err) {
    console.error('Error creating workflow rule:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create workflow rule',
      message: `Failed to create the workflow rule: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/workflow/trigger:
 *   post:
 *     summary: Trigger workflow for an event
 *     tags: [Workflow Automation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - data
 *             properties:
 *               event:
 *                 type: string
 *                 description: Event type
 *               data:
 *                 type: object
 *                 description: Event data
 *               context:
 *                 type: object
 *                 description: Additional context
 *     responses:
 *       200:
 *         description: Workflow triggered successfully
 */
exports.triggerWorkflow = async (req, res, next) => {
  try {
    const { event, data, context = {} } = req.body;

    if (!event || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Event and data are required'
      });
    }

    // Find applicable rules
    const applicableRules = workflowRules.filter(rule => 
      rule.isActive && 
      rule.event === event && 
      evaluateConditions(rule.conditions, data, context)
    );

    const results = [];

    for (const rule of applicableRules) {
      const workflowInstance = {
        id: (workflowInstances.length + 1).toString(),
        ruleId: rule.id,
        event,
        data,
        context,
        status: 'active',
        createdAt: new Date(),
        triggeredBy: req.user.id,
        actions: []
      };

      // Execute actions
      for (const action of rule.actions) {
        const actionResult = await executeAction(action, data, context);
        workflowInstance.actions.push({
          action,
          result: actionResult,
          executedAt: new Date()
        });
      }

      // Set up escalation if enabled
      if (rule.escalation && rule.escalation.enabled) {
        workflowInstance.escalation = {
          scheduledFor: new Date(Date.now() + rule.escalation.timeLimit * 60 * 60 * 1000),
          escalateTo: rule.escalation.escalateTo,
          status: 'pending'
        };
      }

      workflowInstances.push(workflowInstance);
      results.push(workflowInstance);
    }

    res.status(200).json({
      success: true,
      data: {
        triggeredRules: results.length,
        instances: results
      },
      message: 'Workflow triggered successfully'
    });
  } catch (err) {
    console.error('Error triggering workflow:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger workflow',
      message: `Failed to trigger the workflow: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/workflow/instances:
 *   get:
 *     summary: Get workflow instances
 *     tags: [Workflow Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, failed, escalated]
 *         description: Filter by status
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: Filter by module
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of records to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number
 *     responses:
 *       200:
 *         description: Workflow instances retrieved successfully
 */
exports.getWorkflowInstances = async (req, res, next) => {
  try {
    const { status, module, limit = 10, page = 1 } = req.query;

    let filteredInstances = workflowInstances;

    if (status) {
      filteredInstances = filteredInstances.filter(instance => instance.status === status);
    }

    if (module) {
      const ruleIds = workflowRules
        .filter(rule => rule.module === module)
        .map(rule => rule.id);
      filteredInstances = filteredInstances.filter(instance => 
        ruleIds.includes(instance.ruleId)
      );
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedInstances = filteredInstances
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + parseInt(limit));

    const totalInstances = filteredInstances.length;
    const totalPages = Math.ceil(totalInstances / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        instances: paginatedInstances,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalInstances,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      },
      message: 'Workflow instances retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving workflow instances:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve workflow instances',
      message: `Failed to retrieve workflow instances: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/workflow/approve:
 *   post:
 *     summary: Approve workflow action
 *     tags: [Workflow Automation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instanceId
 *               - actionId
 *             properties:
 *               instanceId:
 *                 type: string
 *                 description: Workflow instance ID
 *               actionId:
 *                 type: string
 *                 description: Action ID to approve
 *               notes:
 *                 type: string
 *                 description: Approval notes
 *     responses:
 *       200:
 *         description: Workflow action approved successfully
 */
exports.approveWorkflowAction = async (req, res, next) => {
  try {
    const { instanceId, actionId, notes } = req.body;

    if (!instanceId || !actionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Instance ID and action ID are required'
      });
    }

    const instance = workflowInstances.find(inst => inst.id === instanceId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Workflow instance not found',
        message: 'No workflow instance found with the provided ID'
      });
    }

    const action = instance.actions.find(act => act.action.id === actionId);
    if (!action) {
      return res.status(404).json({
        success: false,
        error: 'Action not found',
        message: 'No action found with the provided ID'
      });
    }

    // Update action status
    action.status = 'approved';
    action.approvedAt = new Date();
    action.approvedBy = req.user.id;
    action.notes = notes || '';

    // Check if all actions are completed
    const allActionsCompleted = instance.actions.every(act => 
      act.status === 'approved' || act.status === 'rejected'
    );

    if (allActionsCompleted) {
      instance.status = 'completed';
      instance.completedAt = new Date();
    }

    res.status(200).json({
      success: true,
      data: {
        instance,
        action
      },
      message: 'Workflow action approved successfully'
    });
  } catch (err) {
    console.error('Error approving workflow action:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to approve workflow action',
      message: `Failed to approve the workflow action: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/workflow/escalate:
 *   post:
 *     summary: Escalate workflow instance
 *     tags: [Workflow Automation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instanceId
 *             properties:
 *               instanceId:
 *                 type: string
 *                 description: Workflow instance ID
 *               reason:
 *                 type: string
 *                 description: Escalation reason
 *     responses:
 *       200:
 *         description: Workflow escalated successfully
 */
exports.escalateWorkflow = async (req, res, next) => {
  try {
    const { instanceId, reason } = req.body;

    if (!instanceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Instance ID is required'
      });
    }

    const instance = workflowInstances.find(inst => inst.id === instanceId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Workflow instance not found',
        message: 'No workflow instance found with the provided ID'
      });
    }

    if (!instance.escalation) {
      return res.status(400).json({
        success: false,
        error: 'Escalation not configured',
        message: 'This workflow instance does not have escalation configured'
      });
    }

    instance.escalation.status = 'escalated';
    instance.escalation.escalatedAt = new Date();
    instance.escalation.escalatedBy = req.user.id;
    instance.escalation.reason = reason || 'Manual escalation';
    instance.status = 'escalated';

    res.status(200).json({
      success: true,
      data: instance,
      message: 'Workflow escalated successfully'
    });
  } catch (err) {
    console.error('Error escalating workflow:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to escalate workflow',
      message: `Failed to escalate the workflow: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/workflow/analytics:
 *   get:
 *     summary: Get workflow analytics
 *     tags: [Workflow Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: monthly
 *         description: Analytics period
 *     responses:
 *       200:
 *         description: Workflow analytics retrieved successfully
 */
exports.getWorkflowAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;

    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const recentInstances = workflowInstances.filter(instance => 
      new Date(instance.createdAt) >= startDate
    );

    const analytics = {
      period,
      summary: {
        totalInstances: recentInstances.length,
        activeInstances: recentInstances.filter(inst => inst.status === 'active').length,
        completedInstances: recentInstances.filter(inst => inst.status === 'completed').length,
        escalatedInstances: recentInstances.filter(inst => inst.status === 'escalated').length,
        failedInstances: recentInstances.filter(inst => inst.status === 'failed').length
      },
      byModule: {},
      byRule: {},
      averageProcessingTime: 0,
      escalationRate: 0
    };

    // Calculate module breakdown
    recentInstances.forEach(instance => {
      const rule = workflowRules.find(r => r.id === instance.ruleId);
      if (rule) {
        if (!analytics.byModule[rule.module]) {
          analytics.byModule[rule.module] = 0;
        }
        analytics.byModule[rule.module]++;

        if (!analytics.byRule[rule.name]) {
          analytics.byRule[rule.name] = 0;
        }
        analytics.byRule[rule.name]++;
      }
    });

    // Calculate escalation rate
    if (recentInstances.length > 0) {
      analytics.escalationRate = (analytics.summary.escalatedInstances / recentInstances.length) * 100;
    }

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'Workflow analytics retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving workflow analytics:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve workflow analytics',
      message: `Failed to retrieve workflow analytics: ${err.message}`
    });
  }
};

// Helper function to evaluate conditions
function evaluateConditions(conditions, data, context) {
  for (const [key, value] of Object.entries(conditions)) {
    if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
      const dataValue = data[key] || context[key];
      if (dataValue < value.min || dataValue > value.max) {
        return false;
      }
    } else if (value !== 'any' && data[key] !== value && context[key] !== value) {
      return false;
    }
  }
  return true;
}

// Helper function to execute actions
async function executeAction(action, data, context) {
  try {
    switch (action.type) {
      case 'auto_approve':
        return {
          success: true,
          message: action.message,
          data: { approved: true, timestamp: new Date() }
        };
      
      case 'require_approval':
        return {
          success: true,
          message: action.message,
          data: { 
            requiresApproval: true, 
            approver: action.approver,
            timestamp: new Date()
          }
        };
      
      case 'send_reminder':
        return {
          success: true,
          message: action.message,
          data: { 
            channels: action.channels,
            sent: true,
            timestamp: new Date()
          }
        };
      
      case 'notify_hr':
        return {
          success: true,
          message: action.message,
          data: { 
            notificationSent: true,
            timestamp: new Date()
          }
        };
      
      case 'update_compliance':
        return {
          success: true,
          message: `Updated ${action.field} to ${action.value}`,
          data: { 
            field: action.field,
            value: action.value,
            timestamp: new Date()
          }
        };
      
      default:
        return {
          success: false,
          message: `Unknown action type: ${action.type}`,
          data: null
        };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error executing action: ${error.message}`,
      data: null
    };
  }
}


