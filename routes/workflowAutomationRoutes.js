const express = require('express');
const router = express.Router();
const workflowAutomation = require('../controllers/workflowAutomationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication and authorization middleware
router.use(protect, restrictTo('super-admin', 'hr-manager'));

// Workflow management routes
router.get('/rules', workflowAutomation.getWorkflowRules);
router.post('/rules', workflowAutomation.createWorkflowRule);

// Workflow execution
router.post('/trigger', workflowAutomation.triggerWorkflow);
router.get('/instances', workflowAutomation.getWorkflowInstances);

// Workflow actions
router.post('/approve', workflowAutomation.approveWorkflowAction);
router.post('/escalate', workflowAutomation.escalateWorkflow);

// Analytics
router.get('/analytics', workflowAutomation.getWorkflowAnalytics);

module.exports = router;


