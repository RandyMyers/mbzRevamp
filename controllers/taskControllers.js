const Task = require("../models/task");
const User = require("../models/users");
const Organization = require("../models/organization");
const logEvent = require('../helper/logEvent');

/**
 * @swagger
 * /api/tasks/create:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - organizationId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Task title
 *                 example: "Complete project setup"
 *               description:
 *                 type: string
 *                 description: Task description
 *                 example: "Set up the development environment"
 *               status:
 *                 type: string
 *                 enum: [pending, inProgress, review, completed, cancelled, onHold]
 *                 default: pending
 *                 description: Task status
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Task priority
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Task due date
 *                 example: "2024-12-31T23:59:59.000Z"
 *               assignedTo:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *                 description: Array of user IDs assigned to the task
 *                 example: ["507f1f77bcf86cd799439011"]
 *               organizationId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID (required)
 *                 example: "507f1f77bcf86cd799439011"
 *               createdBy:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID who created the task (optional, defaults to authenticated user)
 *                 example: "507f1f77bcf86cd799439011"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Task tags
 *                 example: ["urgent", "frontend"]
 *               subtasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - title
 *                     - createdBy
 *                   properties:
 *                     title:
 *                       type: string
 *                       description: Subtask title
 *                     status:
 *                       type: string
 *                       enum: [pending, completed]
 *                       default: pending
 *                       description: Subtask status
 *                     createdBy:
 *                       type: string
 *                       format: ObjectId
 *                       description: User ID who created the subtask
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *                   example: "Task created successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Title, description, and organizationId are required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Organization not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to create task"
 */
// CREATE a new task with subtasks
exports.createTask = async (req, res) => {
  const { title, description, status, priority, dueDate, assignedTo, organizationId, tags, createdBy, subtasks } = req.body;
  console.log(req.body);

  try {
    // ✅ VALIDATION 1: Check required fields
    if (!title || !description || !organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: "Title, description, and organizationId are required" 
      });
    }

    // ✅ VALIDATION 2: Handle assignedTo properly
    let validatedAssignedTo = [];
    if (assignedTo) {
      // Convert to array if single user ID is sent
      const assignedToArray = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
      
      // Filter out null/undefined values
      const validUserIds = assignedToArray.filter(id => id && id.toString().trim() !== '');
      
      if (validUserIds.length > 0) {
        // Validate assigned users
        const users = await User.find({ _id: { $in: validUserIds } });
        if (users.length !== validUserIds.length) {
          return res.status(404).json({ 
            success: false, 
            message: "One or more assigned users not found" 
          });
        }
        validatedAssignedTo = validUserIds;
      }
    }

    // ✅ VALIDATION 3: Validate organization
    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(404).json({ 
        success: false, 
        message: "Organization not found" 
      });
    }

    // ✅ VALIDATION 4: Validate subtask assignees if provided
    if (subtasks && Array.isArray(subtasks) && subtasks.length > 0) {
      const subtaskUserIds = subtasks
        .map(s => s.assignedTo)
        .filter(Boolean)
        .filter(id => id.toString().trim() !== '');
      
      if (subtaskUserIds.length > 0) {
        const subtaskUsers = await User.find({ _id: { $in: subtaskUserIds } });
        if (subtaskUsers.length !== subtaskUserIds.length) {
          return res.status(404).json({ 
            success: false, 
            message: "One or more subtask assignees not found" 
          });
        }
      }
    }

    // ✅ CREATE TASK
    const newTask = new Task({
      title: title.trim(),
      description: description.trim(),
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      assignedTo: validatedAssignedTo,
      createdBy: createdBy || req.user._id, // Use authenticated user if not provided
      organization: organizationId,
      tags: tags || [],
      subtasks: subtasks || []
    });

    const savedTask = await newTask.save();
    
    // ✅ LOG EVENT
    await logEvent({
      action: 'create_task',
      user: req.user._id,
      resource: 'Task',
      resourceId: savedTask._id,
      details: { 
        title: savedTask.title, 
        status: savedTask.status,
        assignedToCount: savedTask.assignedTo.length,
        subtasksCount: savedTask.subtasks.length
      },
      organization: req.user.organization
    });
    
    res.status(201).json({ 
      success: true, 
      task: savedTask,
      message: "Task created successfully"
    });
    
  } catch (error) {
    console.error('Create task error:', error);
    
    // ✅ BETTER ERROR HANDLING
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Validation error: " + Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Task with this title already exists" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to create task",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/tasks/organization/{organizationId}:
 *   get:
 *     summary: Get all tasks for an organization
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: No tasks found for this organization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No tasks found for this organization"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve tasks"
 */
// GET all tasks for an organization
exports.getTasksByOrganization = async (req, res) => {
  const { organizationId } = req.params;

  try {
    const tasks = await Task.find({ organization: organizationId }).populate('assignedTo createdBy organization');
    if (!tasks) {
      return res.status(404).json({ success: false, message: "No tasks found for this organization" });
    }
    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve tasks" });
  }
};

/**
 * @swagger
 * /api/tasks/get/{taskId}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Task ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Task not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve task"
 */
// GET task by ID
exports.getTaskById = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId)
      .populate('assignedTo createdBy organization')
      .populate('comments.user', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve task" });
  }
};


/**
 * @swagger
 * /api/tasks/update/{taskId}:
 *   patch:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Task ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Task title
 *                 example: "Updated project setup"
 *               description:
 *                 type: string
 *                 description: Task description
 *                 example: "Updated development environment setup"
 *               status:
 *                 type: string
 *                 enum: [pending, inProgress, review, completed, cancelled, onHold]
 *                 description: Task status
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Task priority
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Task due date
 *                 example: "2024-12-31T23:59:59.000Z"
 *               assignedTo:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *                 description: Array of user IDs assigned to the task
 *                 example: ["507f1f77bcf86cd799439011"]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Task tags
 *                 example: ["urgent", "frontend"]
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "One or more assigned users not found"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Task not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to update task"
 */
// UPDATE a task (including subtasks)
exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const updateData = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Validate assigned users if being updated
    if (updateData.assignedTo && Array.isArray(updateData.assignedTo)) {
      const users = await User.find({ _id: { $in: updateData.assignedTo } });
      if (users.length !== updateData.assignedTo.length) {
        return res.status(404).json({ success: false, message: "One or more assigned users not found" });
      }
    }

    // Update task fields
    const fields = ['title', 'status', 'description', 'priority', 'dueDate', 'assignedTo', 'tags'];
    const oldTask = { ...task.toObject() };
    fields.forEach(field => {
      if (updateData[field] !== undefined) {
        task[field] = updateData[field];
      }
    });

    const updatedTask = await task.save();
    await logEvent({
      action: 'update_task',
      user: req.user._id,
      resource: 'Task',
      resourceId: task._id,
      details: { before: oldTask, after: updatedTask },
      organization: req.user.organization
    });
    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update task" });
  }
};


/**
 * @swagger
 * /api/tasks/subtasks/create/{taskId}:
 *   post:
 *     summary: Add a subtask to a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Task ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - createdBy
 *             properties:
 *               title:
 *                 type: string
 *                 description: Subtask title
 *                 example: "Set up database connection"
 *               createdBy:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID who created the subtask
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Subtask added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *                   example: "Subtask added successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Task or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Task not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to add subtask"
 */
// ADD a subtask to a task
exports.addSubtask = async (req, res) => {
  const { taskId } = req.params;
  const { title, createdBy } = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Validate createdBy user exists
    const user = await User.findById(createdBy);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const newSubtask = {
      title,
      createdBy,
      status: 'pending'
    };

    task.subtasks.push(newSubtask);
    const updatedTask = await task.save();

    res.status(201).json({ 
      success: true, 
      task: updatedTask,
      message: "Subtask added successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to add subtask",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/tasks/{taskId}/subtasks/update/{subtaskId}:
 *   patch:
 *     summary: Update a subtask
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Task ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: subtaskId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Subtask ID
 *         example: "507f1f77bcf86cd799439012"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Subtask title
 *                 example: "Updated database connection setup"
 *               status:
 *                 type: string
 *                 enum: [pending, completed]
 *                 description: Subtask status
 *                 example: "completed"
 *     responses:
 *       200:
 *         description: Subtask updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *                   example: "Subtask updated successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid status value. Must be 'pending' or 'completed'"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Task or subtask not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Task not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to update subtask"
 */
exports.updateSubtask = async (req, res) => {
  const { taskId, subtaskId } = req.params;
  const { status, title } = req.body;  // Get title from body, not params

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) {
      return res.status(404).json({ success: false, message: "Subtask not found" });
    }

    // Update title if provided
    if (title !== undefined) {
      subtask.title = title;
    }

    // Update status if provided and valid
    if (status !== undefined) {
      if (['pending', 'completed'].includes(status)) {
        subtask.status = status;
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid status value. Must be 'pending' or 'completed'" 
        });
      }
    }

    // Return error if neither title nor status was provided
    if (title === undefined && status === undefined) {
      return res.status(400).json({
        success: false,
        message: "Must provide either title or status to update"
      });
    }

    const updatedTask = await task.save();
    res.status(200).json({ 
      success: true, 
      task: updatedTask,
      message: "Subtask updated successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update subtask",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/tasks/{taskId}/subtasks/delete/{subtaskId}:
 *   delete:
 *     summary: Delete a subtask
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Task ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: subtaskId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Subtask ID
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Subtask deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *                   example: "Subtask deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Task or subtask not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Task not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to delete subtask"
 */
// DELETE a subtask
exports.deleteSubtask = async (req, res) => {
  const { taskId, subtaskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Find the index of the subtask
    const subtaskIndex = task.subtasks.findIndex(sub => sub._id.toString() === subtaskId);
    if (subtaskIndex === -1) {
      return res.status(404).json({ success: false, message: "Subtask not found" });
    }

    // Remove the subtask from the array
    task.subtasks.splice(subtaskIndex, 1);
    const updatedTask = await task.save();

    res.status(200).json({ 
      success: true, 
      task: updatedTask,
      message: "Subtask deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete subtask",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/tasks/status/{taskId}:
 *   patch:
 *     summary: Update a task's status (for drag and drop)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Task ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, inProgress, review, completed, cancelled, onHold]
 *                 description: New task status
 *                 example: "inProgress"
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid status value
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid status. Must be one of: pending, inProgress, review, completed, cancelled, onHold"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Task not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to update task status"
 */
// UPDATE a task's status (when moved between columns)
exports.updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;  // Only the status (new column) will be passed

  try {
    // Validate status
    const validStatuses = ['pending', 'inProgress', 'review', 'completed', 'cancelled', 'onHold'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const oldStatus = task.status;
    
    // Update only the status (column)
    task.status = status;

    const updatedTask = await task.save();
    
    // Log the status change
    await logEvent({
      action: 'update_task_status',
      user: req.user._id,
      resource: 'Task',
      resourceId: task._id,
      details: { 
        before: oldStatus, 
        after: status,
        taskTitle: task.title 
      },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update task status" });
  }
};


/**
 * @swagger
 * /api/tasks/delete/{taskId}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Task ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Task not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to delete task"
 */
// DELETE a task
exports.deleteTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await Task.findByIdAndDelete(taskId);
    
    // Log the task deletion
    await logEvent({
      action: 'delete_task',
      user: req.user._id,
      resource: 'Task',
      resourceId: taskId,
      details: { 
        taskTitle: task.title,
        taskStatus: task.status 
      },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete task" });
  }
};

/**
 * @swagger
 * /api/tasks/{taskId}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Task ID
 *         example: "507f1f77bcf86cd799439011"
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
 *                 description: Comment text
 *                 example: "This task is progressing well"
 *                 minLength: 1
 *     responses:
 *       200:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Comment text is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Comment text is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User can only comment on tasks in their organization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You can only comment on tasks in your organization"
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Task not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to add comment"
 */
// ADD a comment to a task
exports.addComment = async (req, res) => {
  const { taskId } = req.params;
  const { text } = req.body;
  const userId = req.user._id; // Get user from authenticated request

  try {
    // Validate required fields
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Comment text is required" 
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Verify user belongs to the same organization as the task
    if (task.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only comment on tasks in your organization" 
      });
    }

    // Add the comment to the task
    task.comments.push({
      text: text.trim(),
      user: userId,
      createdAt: Date.now(),
    });

    const updatedTask = await task.save();

    // Log the comment addition
    await logEvent({
      action: 'add_task_comment',
      user: userId,
      resource: 'Task',
      resourceId: task._id,
      details: { 
        taskTitle: task.title,
        commentText: text.trim().substring(0, 100) // Log first 100 chars
      },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to add comment" });
  }
};

/**
 * @swagger
 * /api/tasks/{taskId}/comments/{commentId}:
 *   patch:
 *     summary: Update a comment on a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Task ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Comment ID
 *         example: "507f1f77bcf86cd799439012"
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
 *                 description: Updated comment text
 *                 example: "Updated comment text"
 *                 minLength: 1
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Comment text is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Comment text is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User can only edit their own comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You can only edit your own comments"
 *       404:
 *         description: Task or comment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Task not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to update comment"
 */
// UPDATE a comment
exports.updateComment = async (req, res) => {
  const { taskId, commentId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;

  try {
    // Validate required fields
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Comment text is required" 
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "You can only edit your own comments" });
    }

    comment.text = text.trim();
    comment.updatedAt = Date.now();

    const updatedTask = await task.save();

    // Log the comment update
    await logEvent({
      action: 'update_task_comment',
      user: userId,
      resource: 'Task',
      resourceId: task._id,
      details: { 
        taskTitle: task.title,
        commentText: text.trim().substring(0, 100)
      },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update comment" });
  }
};

/**
 * @swagger
 * /api/tasks/{taskId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment from a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Task ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Comment ID
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User can only delete their own comments or be the task creator
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You can only delete your own comments or be the task creator"
 *       404:
 *         description: Task or comment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Task not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to delete comment"
 */
// DELETE a comment
exports.deleteComment = async (req, res) => {
  const { taskId, commentId } = req.params;
  const userId = req.user._id;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Check if user owns the comment or is task creator
    if (comment.user.toString() !== userId.toString() && task.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own comments or be the task creator" });
    }

    comment.deleteOne();
    const updatedTask = await task.save();

    // Log the comment deletion
    await logEvent({
      action: 'delete_task_comment',
      user: userId,
      resource: 'Task',
      resourceId: task._id,
      details: { 
        taskTitle: task.title,
        commentText: comment.text.substring(0, 100)
      },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete comment" });
  }
};

/**
 * @swagger
 * /api/tasks/user/{userId}:
 *   get:
 *     summary: Get tasks by user ID (assigned, created, or with assigned subtasks)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: No tasks found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No tasks found for this user"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve tasks"
 */
// GET tasks by userId with subtasks
exports.getTasksByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const tasks = await Task.find({
      $or: [
        { assignedTo: userId },
        { createdBy: userId },
        { 'subtasks.assignedTo': userId }
      ]
    })
    .populate('assignedTo createdBy organization')
    .populate('subtasks.assignedTo', 'name email');

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ success: false, message: "No tasks found for this user" });
    }

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve tasks" });
  }
};

/**
 * @swagger
 * /api/tasks/{taskId}/assignments:
 *   patch:
 *     summary: Update task assignments (add/remove/replace users)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Task ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignedTo
 *               - action
 *             properties:
 *               assignedTo:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *                 description: Array of user IDs for assignment
 *                 example: ["507f1f77bcf86cd799439011"]
 *               action:
 *                 type: string
 *                 enum: [add, remove, replace]
 *                 description: Action to perform on assignments
 *                 example: "add"
 *     responses:
 *       200:
 *         description: Task assignments updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *                   example: "Task assignments added successfully"
 *       400:
 *         description: Invalid action or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid action. Use 'add', 'remove', or 'replace'"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Task or users not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Task not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to update task assignments"
 */
// UPDATE task assignments (add/remove users)
exports.updateTaskAssignments = async (req, res) => {
  const { taskId } = req.params;
  const { assignedTo, action } = req.body; // action: 'add', 'remove', 'replace'

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Validate assigned users
    if (assignedTo && Array.isArray(assignedTo)) {
      const users = await User.find({ _id: { $in: assignedTo } });
      if (users.length !== assignedTo.length) {
        return res.status(404).json({ success: false, message: "One or more assigned users not found" });
      }
    }

    const oldAssignments = [...task.assignedTo];
    let newAssignments = [];

    switch (action) {
      case 'add':
        // Add new users without duplicates
        newAssignments = [...new Set([...task.assignedTo.map(id => id.toString()), ...assignedTo])];
        break;
      
      case 'remove':
        // Remove specified users
        newAssignments = task.assignedTo
          .map(id => id.toString())
          .filter(id => !assignedTo.includes(id));
        break;
      
      case 'replace':
        // Replace all assignments
        newAssignments = assignedTo;
        break;
      
      default:
        return res.status(400).json({ success: false, message: "Invalid action. Use 'add', 'remove', or 'replace'" });
    }

    // Convert back to ObjectIds
    task.assignedTo = newAssignments.map(id => new mongoose.Types.ObjectId(id));

    const updatedTask = await task.save();
    
    await logEvent({
      action: 'update_task_assignments',
      user: req.user._id,
      resource: 'Task',
      resourceId: task._id,
      details: { 
        before: oldAssignments, 
        after: task.assignedTo,
        action: action 
      },
      organization: req.user.organization
    });

    res.status(200).json({ 
      success: true, 
      task: updatedTask,
      message: `Task assignments ${action}ed successfully`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update task assignments" });
  }
};

/**
 * @swagger
 * /api/tasks/organization/{organizationId}/available-users:
 *   get:
 *     summary: Get users available for task assignment in organization
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Available users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         format: ObjectId
 *                         description: User ID
 *                       name:
 *                         type: string
 *                         description: User name
 *                       email:
 *                         type: string
 *                         description: User email
 *                       role:
 *                         type: string
 *                         format: ObjectId
 *                         description: User role ID
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: No users found in this organization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No users found in this organization"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve available users"
 */
// GET users available for task assignment in organization
exports.getAvailableUsersForAssignment = async (req, res) => {
  const { organizationId } = req.params;

  try {
    const users = await User.find({ 
      organization: organizationId,
      isActive: true 
    }).select('name email role');

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found in this organization" });
    }

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve available users" });
  }
};