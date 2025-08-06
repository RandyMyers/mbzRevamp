const Task = require("../models/task");
const User = require("../models/users");
const Organization = require("../models/organization");
const logEvent = require('../helper/logEvent');

// CREATE a new task with subtasks
exports.createTask = async (req, res) => {
  const { title, description, status, priority, dueDate, assignedTo, organizationId, tags, createdBy, subtasks } = req.body;
  console.log(req.body);

  try {
    // Validate assigned users
    const users = await User.find({ _id: { $in: assignedTo } });
    if (users.length !== assignedTo.length) {
      return res.status(404).json({ success: false, message: "One or more assigned users not found" });
    }

    // Validate organization
    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    // Validate subtask assignees if provided
    if (subtasks && subtasks.length > 0) {
      const subtaskUserIds = subtasks.map(s => s.assignedTo).filter(Boolean);
      const subtaskUsers = await User.find({ _id: { $in: subtaskUserIds } });
      if (subtaskUsers.length !== new Set(subtaskUserIds).size) {
        return res.status(404).json({ success: false, message: "One or more subtask assignees not found" });
      }
    }

    const newTask = new Task({
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      createdBy,
      organization: organizationId,
      tags,
      subtasks: subtasks || []
    });

    const savedTask = await newTask.save();
    await logEvent({
      action: 'create_task',
      user: req.user._id,
      resource: 'Task',
      resourceId: savedTask._id,
      details: { title: savedTask.title, status: savedTask.status },
      organization: req.user.organization
    });
    res.status(201).json({ success: true, task: savedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create task" });
  }
};

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

// UPDATE a task's status (when moved between columns)
exports.updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;  // Only the status (new column) will be passed

  try {
    // Validate status
    const validStatuses = ['todo', 'in-progress', 'review', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status. Must be one of: todo, in-progress, review, completed" 
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

// ADD a comment to a task
exports.addComment = async (req, res) => {
  const { taskId } = req.params;
  const { user, text } = req.body;
  console.log(req.body);
 

  try {
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    

    // Add the comment to the task
    task.comments.push({
      text,
      user,
      createdAt: Date.now(),
    });

    const updatedTask = await task.save();
    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to add comment" });
  }
};

// UPDATE a comment
exports.updateComment = async (req, res) => {
  const { taskId, commentId } = req.params;
  const { text, user } = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== user) {
      return res.status(403).json({ success: false, message: "You can only edit your own comments" });
    }

    comment.text = text;
    comment.updatedAt = Date.now();

    const updatedTask = await task.save();
    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update comment" });
  }
};

// DELETE a comment
exports.deleteComment = async (req, res) => {
  const { taskId, commentId } = req.params;
  const { user } = req.body;

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
    if (comment.user.toString() !== user && task.createdBy.toString() !== user) {
      return res.status(403).json({ success: false, message: "You can only delete your own comments or be the task creator" });
    }

    comment.remove();
    const updatedTask = await task.save();
    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete comment" });
  }
};

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