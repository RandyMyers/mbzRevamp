# 📋 TASK NOTIFICATION SYSTEM

## 📊 Overview
Comprehensive notification system for task management with 8 different notification templates covering all task-related activities.

## 🎯 Task Notification Templates

### **Total Templates: 8 Templates**

---

## 📝 **1. TASK CREATED**
- **Template Name:** `task_created`
- **Trigger Event:** `task_created`
- **Type:** `email`
- **Priority:** `high`
- **Category:** `task_management`
- **Description:** Notifies users when a new task is created and assigned to them

**Variables:**
- `{{taskTitle}}` - Task title
- `{{taskDescription}}` - Task description
- `{{createdByName}}` - Name of user who created the task
- `{{dueDate}}` - Task due date
- `{{priority}}` - Task priority (low/medium/high)
- `{{companyName}}` - Organization name

---

## 👥 **2. TASK ASSIGNED**
- **Template Name:** `task_assigned`
- **Trigger Event:** `task_assigned`
- **Type:** `email`
- **Priority:** `high`
- **Category:** `task_management`
- **Description:** Notifies users when they are assigned to an existing task

**Variables:**
- `{{taskTitle}}` - Task title
- `{{assignedByName}}` - Name of user who assigned the task
- `{{dueDate}}` - Task due date
- `{{priority}}` - Task priority (low/medium/high)
- `{{companyName}}` - Organization name

---

## 🔄 **3. TASK STATUS UPDATED**
- **Template Name:** `task_status_updated`
- **Trigger Event:** `task_status_updated`
- **Type:** `email`
- **Priority:** `medium`
- **Category:** `task_management`
- **Description:** Notifies when task status changes (pending → inProgress → completed, etc.)

**Variables:**
- `{{taskTitle}}` - Task title
- `{{newStatus}}` - New task status
- `{{oldStatus}}` - Previous task status
- `{{updatedByName}}` - Name of user who updated the task
- `{{dueDate}}` - Task due date
- `{{companyName}}` - Organization name

---

## ⏰ **4. TASK DUE SOON**
- **Template Name:** `task_due_soon`
- **Trigger Event:** `task_due_soon`
- **Type:** `email`
- **Priority:** `high`
- **Category:** `task_management`
- **Description:** Reminder notification when task is approaching due date

**Variables:**
- `{{taskTitle}}` - Task title
- `{{dueDate}}` - Task due date
- `{{taskStatus}}` - Current task status
- `{{priority}}` - Task priority (low/medium/high)
- `{{companyName}}` - Organization name

---

## 🚨 **5. TASK OVERDUE**
- **Template Name:** `task_overdue`
- **Trigger Event:** `task_overdue`
- **Type:** `email`
- **Priority:** `critical`
- **Category:** `task_management`
- **Description:** Critical alert when task has passed its due date

**Variables:**
- `{{taskTitle}}` - Task title
- `{{dueDate}}` - Task due date
- `{{taskStatus}}` - Current task status
- `{{priority}}` - Task priority (low/medium/high)
- `{{companyName}}` - Organization name

---

## ✅ **6. SUBTASK COMPLETED**
- **Template Name:** `subtask_completed`
- **Trigger Event:** `subtask_completed`
- **Type:** `system`
- **Priority:** `medium`
- **Category:** `task_management`
- **Description:** Notifies when a subtask is completed (in-app notification)

**Variables:**
- `{{subtaskTitle}}` - Subtask title
- `{{taskTitle}}` - Parent task title
- `{{completedByName}}` - Name of user who completed subtask
- `{{progress}}` - Task progress percentage
- `{{companyName}}` - Organization name

---

## 💬 **7. TASK COMMENT ADDED**
- **Template Name:** `task_comment_added`
- **Trigger Event:** `task_comment_added`
- **Type:** `email`
- **Priority:** `medium`
- **Category:** `task_management`
- **Description:** Notifies when someone adds a comment to a task

**Variables:**
- `{{taskTitle}}` - Task title
- `{{commentedByName}}` - Name of user who added comment
- `{{commentText}}` - Comment text (truncated if long)
- `{{companyName}}` - Organization name

---

## 📎 **8. TASK ATTACHMENT UPLOADED**
- **Template Name:** `task_attachment_uploaded`
- **Trigger Event:** `task_attachment_uploaded`
- **Type:** `system`
- **Priority:** `low`
- **Category:** `task_management`
- **Description:** Notifies when someone uploads an attachment to a task (in-app notification)

**Variables:**
- `{{taskTitle}}` - Task title
- `{{fileName}}` - Uploaded file name
- `{{fileSize}}` - File size
- `{{uploadedByName}}` - Name of user who uploaded file
- `{{companyName}}` - Organization name

---

## 🔧 **Implementation Guide**

### **Files Created/Modified:**

1. **`server/scripts/notificationTemplatesData.js`** - Added 8 task notification templates
2. **`server/models/notificationTemplates.js`** - Added `task_management` category and task trigger events
3. **`server/scripts/seedTaskNotificationTemplates.js`** - Script to seed task templates
4. **`server/helpers/taskNotificationHelper.js`** - Helper functions for task notifications

### **Integration Points:**

To integrate these notifications into your task controllers, use the helper functions:

```javascript
const {
  notifyTaskCreated,
  notifyTaskAssigned,
  notifyTaskStatusUpdated,
  notifyTaskDueSoon,
  notifyTaskOverdue,
  notifySubtaskCompleted,
  notifyTaskCommentAdded,
  notifyTaskAttachmentUploaded
} = require('../helpers/taskNotificationHelper');

// Example usage in task controller
exports.createTask = async (req, res) => {
  try {
    // ... create task logic ...
    
    // Send notification after task creation
    if (task.assignedTo && task.assignedTo.length > 0) {
      await notifyTaskCreated(task, req.user._id, task.assignedTo, req.user.organization);
    }
    
    // ... rest of response ...
  } catch (error) {
    // ... error handling ...
  }
};
```

### **Notification Triggers:**

| Task Operation | Notification Function | Template Used |
|----------------|----------------------|---------------|
| Create Task | `notifyTaskCreated()` | `task_created` |
| Assign Task | `notifyTaskAssigned()` | `task_assigned` |
| Update Status | `notifyTaskStatusUpdated()` | `task_status_updated` |
| Complete Subtask | `notifySubtaskCompleted()` | `subtask_completed` |
| Add Comment | `notifyTaskCommentAdded()` | `task_comment_added` |
| Upload Attachment | `notifyTaskAttachmentUploaded()` | `task_attachment_uploaded` |
| Due Soon (Scheduled) | `notifyTaskDueSoon()` | `task_due_soon` |
| Overdue (Scheduled) | `notifyTaskOverdue()` | `task_overdue` |

### **Scheduled Notifications:**

For due date and overdue notifications, you'll need to implement a scheduled job (cron job) that:

1. **Daily checks** for tasks due within 24 hours
2. **Daily checks** for overdue tasks
3. Calls the appropriate notification functions

Example cron job implementation:
```javascript
// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  // Check for tasks due soon
  const tasksDueSoon = await Task.find({
    dueDate: { 
      $gte: new Date(),
      $lte: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    status: { $nin: ['completed', 'cancelled'] }
  });
  
  for (const task of tasksDueSoon) {
    await notifyTaskDueSoon(task, task.assignedTo, task.organization);
  }
  
  // Check for overdue tasks
  const overdueTasks = await Task.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  });
  
  for (const task of overdueTasks) {
    await notifyTaskOverdue(task, task.assignedTo, task.organization);
  }
});
```

## ✅ **Status**
- ✅ All 8 task notification templates created
- ✅ Template data seeded to database
- ✅ Helper functions implemented
- ✅ Documentation completed
- 🔄 **Next:** Integrate into task controllers (manual integration required)

## 📋 **Total Notification Templates in System: 40**
- Authentication & User Management: 6 templates
- Order Management: 6 templates
- Subscription & Billing: 6 templates
- Marketing & Campaigns: 6 templates
- Customer Management: 4 templates
- Inventory Management: 4 templates
- System & Maintenance: 4 templates
- Communication: 4 templates
- **Task Management: 8 templates** ✨
