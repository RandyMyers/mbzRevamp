const { createAndSendNotification, createNotificationFromTemplate } = require('../services/notificationService');
const NotificationTemplate = require('../models/notificationTemplates');
const User = require('../models/users');
const Organization = require('../models/organization');

// Helper function to get notification category
const getNotificationCategory = (type) => {
  const categoryMap = {
    'task_created': 'task_management',
    'task_assigned': 'task_management',
    'task_status_updated': 'task_management',
    'task_due_soon': 'task_management',
    'task_overdue': 'task_management',
    'subtask_completed': 'task_management',
    'task_comment_added': 'task_management',
    'task_attachment_uploaded': 'task_management'
  };
  return categoryMap[type] || 'system_maintenance';
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to truncate text
const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Helper function to get organization name
const getOrganizationName = async (organizationId) => {
  try {
    const organization = await Organization.findById(organizationId);
    return organization ? organization.name : 'Unknown Organization';
  } catch (error) {
    console.error('Error getting organization name:', error);
    return 'Unknown Organization';
  }
};

// Helper function to get user name
const getUserName = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user ? user.fullName : 'Unknown User';
  } catch (error) {
    console.error('Error getting user name:', error);
    return 'Unknown User';
  }
};

// Send notification to specific users
const sendTaskNotification = async (templateName, userIds, variables, organizationId) => {
  try {
    const template = await NotificationTemplate.findOne({ templateName });
    if (!template) {
      console.error(`Template not found: ${templateName}`);
      return { success: false, error: 'Template not found' };
    }

    const results = [];
    for (const userId of userIds) {
      try {
        const result = await createNotificationFromTemplate(
          template._id,
          userId,
          variables
        );
        results.push({ userId, ...result });
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        results.push({ userId, success: false, error: error.message });
      }
    }

    return {
      success: true,
      total: userIds.length,
      sent: results.filter(r => r.success).length,
      results
    };
  } catch (error) {
    console.error('Send task notification error:', error);
    return { success: false, error: error.message };
  }
};

// Notify when task is created
const notifyTaskCreated = async (task, createdBy, assignedTo, organizationId) => {
  try {
    const companyName = await getOrganizationName(organizationId);
    const createdByName = await getUserName(createdBy);
    
    const variables = {
      taskTitle: task.title,
      taskDescription: task.description,
      createdByName: createdByName,
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set',
      priority: task.priority || 'medium',
      companyName: companyName
    };

    // Notify assigned users
    if (assignedTo && assignedTo.length > 0) {
      return await sendTaskNotification('task_created', assignedTo, variables, organizationId);
    }

    return { success: true, message: 'No users assigned to notify' };
  } catch (error) {
    console.error('Notify task created error:', error);
    return { success: false, error: error.message };
  }
};

// Notify when task is assigned to users
const notifyTaskAssigned = async (task, assignedBy, assignedTo, organizationId) => {
  try {
    const companyName = await getOrganizationName(organizationId);
    const assignedByName = await getUserName(assignedBy);
    
    const variables = {
      taskTitle: task.title,
      assignedByName: assignedByName,
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set',
      priority: task.priority || 'medium',
      companyName: companyName
    };

    return await sendTaskNotification('task_assigned', assignedTo, variables, organizationId);
  } catch (error) {
    console.error('Notify task assigned error:', error);
    return { success: false, error: error.message };
  }
};

// Notify when task status is updated
const notifyTaskStatusUpdated = async (task, updatedBy, assignedTo, oldStatus, newStatus, organizationId) => {
  try {
    const companyName = await getOrganizationName(organizationId);
    const updatedByName = await getUserName(updatedBy);
    
    const variables = {
      taskTitle: task.title,
      newStatus: newStatus,
      oldStatus: oldStatus,
      updatedByName: updatedByName,
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set',
      companyName: companyName
    };

    // Notify all assigned users
    const userIds = [...new Set([...assignedTo, updatedBy])]; // Include updater and assigned users
    return await sendTaskNotification('task_status_updated', userIds, variables, organizationId);
  } catch (error) {
    console.error('Notify task status updated error:', error);
    return { success: false, error: error.message };
  }
};

// Notify when task is due soon (called by scheduled job)
const notifyTaskDueSoon = async (task, assignedTo, organizationId) => {
  try {
    const companyName = await getOrganizationName(organizationId);
    
    const variables = {
      taskTitle: task.title,
      dueDate: new Date(task.dueDate).toLocaleDateString(),
      taskStatus: task.status,
      priority: task.priority || 'medium',
      companyName: companyName
    };

    return await sendTaskNotification('task_due_soon', assignedTo, variables, organizationId);
  } catch (error) {
    console.error('Notify task due soon error:', error);
    return { success: false, error: error.message };
  }
};

// Notify when task is overdue (called by scheduled job)
const notifyTaskOverdue = async (task, assignedTo, organizationId) => {
  try {
    const companyName = await getOrganizationName(organizationId);
    
    const variables = {
      taskTitle: task.title,
      dueDate: new Date(task.dueDate).toLocaleDateString(),
      taskStatus: task.status,
      priority: task.priority || 'medium',
      companyName: companyName
    };

    return await sendTaskNotification('task_overdue', assignedTo, variables, organizationId);
  } catch (error) {
    console.error('Notify task overdue error:', error);
    return { success: false, error: error.message };
  }
};

// Notify when subtask is completed
const notifySubtaskCompleted = async (task, subtask, completedBy, organizationId) => {
  try {
    const companyName = await getOrganizationName(organizationId);
    const completedByName = await getUserName(completedBy);
    
    const variables = {
      subtaskTitle: subtask.title,
      taskTitle: task.title,
      completedByName: completedByName,
      progress: task.progress || 0,
      companyName: companyName
    };

    // Notify all assigned users and creator
    const userIds = [...new Set([...task.assignedTo, task.createdBy])];
    return await sendTaskNotification('subtask_completed', userIds, variables, organizationId);
  } catch (error) {
    console.error('Notify subtask completed error:', error);
    return { success: false, error: error.message };
  }
};

// Notify when comment is added to task
const notifyTaskCommentAdded = async (task, comment, commentedBy, organizationId) => {
  try {
    const companyName = await getOrganizationName(organizationId);
    const commentedByName = await getUserName(commentedBy);
    
    const variables = {
      taskTitle: task.title,
      commentedByName: commentedByName,
      commentText: truncateText(comment.text),
      companyName: companyName
    };

    // Notify all assigned users and creator (except the commenter)
    const userIds = [...new Set([...task.assignedTo, task.createdBy])].filter(
      userId => userId.toString() !== commentedBy.toString()
    );
    
    return await sendTaskNotification('task_comment_added', userIds, variables, organizationId);
  } catch (error) {
    console.error('Notify task comment added error:', error);
    return { success: false, error: error.message };
  }
};

// Notify when attachment is uploaded to task
const notifyTaskAttachmentUploaded = async (task, attachment, uploadedBy, organizationId) => {
  try {
    const companyName = await getOrganizationName(organizationId);
    const uploadedByName = await getUserName(uploadedBy);
    
    const variables = {
      taskTitle: task.title,
      fileName: attachment.filename,
      fileSize: formatFileSize(attachment.size || 0),
      uploadedByName: uploadedByName,
      companyName: companyName
    };

    // Notify all assigned users and creator (except the uploader)
    const userIds = [...new Set([...task.assignedTo, task.createdBy])].filter(
      userId => userId.toString() !== uploadedBy.toString()
    );
    
    return await sendTaskNotification('task_attachment_uploaded', userIds, variables, organizationId);
  } catch (error) {
    console.error('Notify task attachment uploaded error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  notifyTaskCreated,
  notifyTaskAssigned,
  notifyTaskStatusUpdated,
  notifyTaskDueSoon,
  notifyTaskOverdue,
  notifySubtaskCompleted,
  notifyTaskCommentAdded,
  notifyTaskAttachmentUploaded,
  sendTaskNotification,
  getNotificationCategory,
  formatFileSize,
  truncateText,
  getOrganizationName,
  getUserName
};

