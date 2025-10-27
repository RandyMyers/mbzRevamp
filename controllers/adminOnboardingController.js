const OnboardingTask = require('../models/OnboardingTask');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Comment = require('../models/Comment');
const HRFileUploadService = require('../services/hrFileUploadService');

/**
 * @swagger
 * /api/admin/onboarding/tasks:
 *   get:
 *     summary: List onboarding tasks
 *     tags: [Admin Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Filter by employee ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Not Started, In Progress, Completed]
 *         description: Filter by task status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Documentation, Training, Equipment, Access, Orientation, Other]
 *         description: Filter by task category
 *     responses:
 *       200:
 *         description: List of onboarding tasks
 */
exports.listOnboardingTasks = async (req, res, next) => {
  try {
    const { employeeId, status, category, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;
    if (category) query.category = category;

    const tasks = await OnboardingTask.find(query)
      .populate('employeeId', 'firstName lastName email department')
      .populate('assignedTo', 'firstName lastName email')
      .populate('completedBy', 'firstName lastName email')
      .populate('approval.approver', 'firstName lastName email')
      .sort({ priority: 1, dueDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await OnboardingTask.countDocuments(query);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error('Error listing onboarding tasks:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding tasks',
      message: `Failed to retrieve onboarding tasks: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/onboarding/tasks:
 *   post:
 *     summary: Create onboarding task
 *     tags: [Admin Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - name
 *             properties:
 *               employeeId:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Documentation, Training, Equipment, Access, Orientation, Other]
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High, Critical]
 *               dueDate:
 *                 type: string
 *                 format: date
 *               assignedTo:
 *                 type: string
 *               estimatedDuration:
 *                 type: number
 *               instructions:
 *                 type: string
 *               resources:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Onboarding task created successfully
 */
exports.createOnboardingTask = async (req, res, next) => {
  try {
    const {
      employeeId,
      name,
      description,
      category = 'Other',
      priority = 'Medium',
      dueDate,
      assignedTo,
      estimatedDuration,
      instructions,
      resources = [],
      dependencies = [],
      approval = {}
    } = req.body;

    // Validate required fields
    if (!employeeId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Employee ID and task name are required'
      });
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: 'The specified employee does not exist'
      });
    }

    const task = await OnboardingTask.create({
      employeeId,
      name,
      description,
      category,
      priority,
      dueDate,
      assignedTo,
      estimatedDuration,
      instructions,
      resources,
      dependencies,
      approval
    });

    res.status(201).json({
      success: true,
      data: task,
      message: 'Onboarding task created successfully'
    });
  } catch (err) {
    console.error('Error creating onboarding task:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create onboarding task',
      message: `Failed to create the onboarding task: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/onboarding/tasks/{id}:
 *   get:
 *     summary: Get onboarding task by ID
 *     tags: [Admin Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Onboarding task details
 */
exports.getOnboardingTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await OnboardingTask.findById(id)
      .populate('employeeId', 'firstName lastName email department')
      .populate('assignedTo', 'firstName lastName email')
      .populate('completedBy', 'firstName lastName email')
      .populate('approval.approver', 'firstName lastName email')
      .populate('comments.author', 'firstName lastName email')
      .populate('dependencies', 'name status dueDate')
      .populate('blocks', 'name status dueDate');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding task not found',
        message: 'The requested onboarding task does not exist'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    console.error('Error fetching onboarding task:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid onboarding task ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding task',
      message: `Failed to retrieve the onboarding task: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/onboarding/tasks/{id}/start:
 *   patch:
 *     summary: Start onboarding task
 *     tags: [Admin Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task started successfully
 */
exports.startTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await OnboardingTask.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding task not found',
        message: 'The requested onboarding task does not exist'
      });
    }

    if (!task.canStart()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot start task',
        message: 'Task cannot be started at this time. Check dependencies.'
      });
    }

    await task.startTask(req.user.id);

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task started successfully'
    });
  } catch (err) {
    console.error('Error starting task:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid task ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to start task',
      message: 'An error occurred while starting the task. Please try again.'
    });
  }
};

/**
 * @swagger
 * /api/admin/onboarding/tasks/{id}/complete:
 *   patch:
 *     summary: Complete onboarding task
 *     tags: [Admin Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Task completed successfully
 */
exports.completeTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { attachments = [] } = req.body;

    const task = await OnboardingTask.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding task not found',
        message: 'The requested onboarding task does not exist'
      });
    }

    if (task.status === 'Completed') {
      return res.status(400).json({
        success: false,
        error: 'Task already completed',
        message: 'This task has already been completed'
      });
    }

    // Handle file uploads if provided
    let uploadedAttachments = [];
    if (req.files && Object.keys(req.files).length > 0) {
      try {
        for (const [fieldName, file] of Object.entries(req.files)) {
          const uploadResult = await HRFileUploadService.uploadOnboardingDocument(file, id);
          uploadedAttachments.push({
            name: file.name,
            path: uploadResult.url,
            uploadedBy: req.user.id,
            type: file.mimetype,
            size: uploadResult.size
          });
        }
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          error: 'File upload failed',
          message: uploadError.message
        });
      }
    }

    // Combine provided attachments with uploaded files
    const allAttachments = [...attachments, ...uploadedAttachments];

    await task.completeTask(req.user.id, allAttachments);

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task completed successfully'
    });
  } catch (err) {
    console.error('Error completing task:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid task ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to complete task',
      message: 'An error occurred while completing the task. Please try again.'
    });
  }
};

/**
 * @swagger
 * /api/admin/onboarding/tasks/{id}/comment:
 *   post:
 *     summary: Add comment to onboarding task
 *     tags: [Admin Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *               isInternal:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Comment added successfully
 */
exports.addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, isInternal = false } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'Comment text is required'
      });
    }

    const task = await OnboardingTask.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding task not found',
        message: 'The requested onboarding task does not exist'
      });
    }

    await task.addComment(req.user.id, text, isInternal);

    res.status(200).json({
      success: true,
      data: task,
      message: 'Comment added successfully'
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid task ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to add comment',
      message: 'An error occurred while adding the comment. Please try again.'
    });
  }
};

/**
 * @swagger
 * /api/admin/onboarding/tasks/{id}/approve:
 *   patch:
 *     summary: Approve onboarding task
 *     tags: [Admin Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approvalNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task approved successfully
 */
exports.approveTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvalNotes } = req.body;

    const task = await OnboardingTask.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding task not found',
        message: 'The requested onboarding task does not exist'
      });
    }

    if (!task.approval.required) {
      return res.status(400).json({
        success: false,
        error: 'Approval not required',
        message: 'This task does not require approval'
      });
    }

    if (task.approval.approvedAt) {
      return res.status(400).json({
        success: false,
        error: 'Already approved',
        message: 'This task has already been approved'
      });
    }

    task.approval.approvedAt = new Date();
    task.approval.approver = req.user.id;
    task.approval.approvalNotes = approvalNotes;

    await task.save();

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task approved successfully'
    });
  } catch (err) {
    console.error('Error approving task:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid task ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to approve task',
      message: `Failed to approve the task: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/onboarding/analytics:
 *   get:
 *     summary: Get onboarding analytics
 *     tags: [Admin Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by task category
 *     responses:
 *       200:
 *         description: Onboarding analytics data
 */
exports.getOnboardingAnalytics = async (req, res, next) => {
  try {
    const { department, category } = req.query;

    const matchQuery = {};
    if (department) {
      matchQuery['employeeId.department'] = department;
    }
    if (category) {
      matchQuery.category = category;
    }

    // Get task status statistics
    const statusStats = await OnboardingTask.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get completion rates by category
    const categoryStats = await OnboardingTask.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          averageTime: { $avg: '$analytics.timeSpent' }
        }
      },
      {
        $addFields: {
          completionRate: {
            $multiply: [
              { $divide: ['$completed', '$total'] },
              100
            ]
          }
        }
      }
    ]);

    // Get overdue tasks
    const overdueTasks = await OnboardingTask.find({
      ...matchQuery,
      dueDate: { $lt: new Date() },
      status: { $ne: 'Completed' }
    }).countDocuments();

    // Get average completion time
    const avgCompletionTime = await OnboardingTask.aggregate([
      { $match: { ...matchQuery, status: 'Completed' } },
      {
        $group: {
          _id: null,
          averageTime: { $avg: '$analytics.timeSpent' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusStats,
        categoryStats,
        overdueTasks,
        averageCompletionTime: avgCompletionTime[0]?.averageTime || 0
      }
    });
  } catch (err) {
    console.error('Error fetching onboarding analytics:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding analytics',
      message: `Failed to retrieve onboarding analytics: ${err.message}`
    });
  }
};
