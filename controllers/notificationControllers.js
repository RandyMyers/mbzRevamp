/**
 * @swagger
 * /api/notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Create a notification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user, subject, body]
 *             properties:
 *               user:
 *                 type: string
 *                 description: User ID
 *               template:
 *                 type: string
 *                 description: Notification template ID
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [email, system]
 *                 default: system
 *               status:
 *                 type: string
 *                 enum: [pending, sent, read, failed]
 *                 default: pending
 *               organization:
 *                 type: string
 *                 description: Organization ID
 *     responses:
 *       201:
 *         description: Notification created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 *   get:
 *     tags: [Notifications]
 *     summary: Get all notifications (paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, sent, read, failed] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [email, system] }
 *       - in: query
 *         name: user
 *         schema: { type: string }
 *       - in: query
 *         name: organization
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Notifications list
 *       500:
 *         description: Server error
 */
const Notification = require('../models/notification');
const NotificationTemplate = require('../models/notificationTemplates');
const User = require('../models/users');
const { createAuditLog } = require('../helpers/auditLogHelper');

// CREATE a new notification
exports.createNotification = async (req, res) => {
  try {
    const { 
      user, 
      template, 
      subject, 
      body, 
      type = 'system',
      status = 'pending',
      organization 
    } = req.body;

    // Validate required fields
    if (!user || !subject || !body) {
      return res.status(400).json({ 
        success: false, 
        message: "User, subject, and body are required" 
      });
    }

    // Validate notification type
    const validTypes = ['email', 'system'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid notification type. Must be 'email' or 'system'" 
      });
    }

    // Create the notification
    const notification = new Notification({
      user,
      template,
      subject,
      body,
      type,
      status,
      organization,
      deliveryStatus: 'failure', // Will be updated when sent
      deliveryAttemptCount: 0
    });

    const savedNotification = await notification.save();

    // ✅ AUDIT LOG: Notification Created
    await createAuditLog({
      action: 'Notification Created',
      user: req.user?._id,
      resource: 'notification',
      resourceId: savedNotification._id,
      details: {
        recipient: user,
        subject,
        type,
        status,
        organization,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization || organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: savedNotification
    });
  } catch (error) {
    console.error('Create Notification Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create notification",
      error: error.message 
    });
  }
};

// GET all notifications with pagination and filtering
exports.getAllNotifications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      user, 
      organization,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (user) filter.user = user;
    if (organization) filter.organization = organization;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get notifications with populated user and template
    const notifications = await Notification.find(filter)
      .populate('user', 'fullName email username')
      .populate('template', 'templateName subject')
      .populate('organization', 'name')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Notification.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get All Notifications Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get notifications",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   get:
 *     tags: [Notifications]
 *     summary: Get a notification by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notification }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
exports.getNotificationById = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId)
      .populate('user', 'fullName email username')
      .populate('template', 'templateName subject body')
      .populate('organization', 'name');

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Get Notification Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get notification",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   patch:
 *     tags: [Notifications]
 *     summary: Update a notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject: { type: string }
 *               body: { type: string }
 *               status: { type: string, enum: [pending, sent, read, failed] }
 *               deliveryStatus: { type: string }
 *               errorMessage: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
exports.updateNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { 
      subject, 
      body, 
      status, 
      deliveryStatus,
      errorMessage 
    } = req.body;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found" 
      });
    }

    // Update fields
    if (subject) notification.subject = subject;
    if (body) notification.body = body;
    if (status) notification.status = status;
    if (deliveryStatus) notification.deliveryStatus = deliveryStatus;
    if (errorMessage) notification.errorMessage = errorMessage;

    // Update sentAt if status is changed to 'sent'
    if (status === 'sent' && notification.status !== 'sent') {
      notification.sentAt = new Date();
    }

    const updatedNotification = await notification.save();

    // ✅ AUDIT LOG: Notification Updated
    await createAuditLog({
      action: 'Notification Updated',
      user: req.user?._id,
      resource: 'notification',
      resourceId: updatedNotification._id,
      details: {
        oldStatus: notification.status,
        newStatus: status,
        subject: updatedNotification.subject,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: "Notification updated successfully",
      data: updatedNotification
    });
  } catch (error) {
    console.error('Update Notification Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update notification",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found" 
      });
    }

    await Notification.findByIdAndDelete(notificationId);

    // ✅ AUDIT LOG: Notification Deleted
    await createAuditLog({
      action: 'Notification Deleted',
      user: req.user?._id,
      resource: 'notification',
      resourceId: notificationId,
      details: {
        subject: notification.subject,
        type: notification.type,
        status: notification.status,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization,
      severity: 'warning',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error('Delete Notification Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete notification",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Marked as read }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found" 
      });
    }

    notification.status = 'read';
    const updatedNotification = await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: updatedNotification
    });
  } catch (error) {
    console.error('Mark As Read Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to mark notification as read",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/notifications/user/{userId}/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read for a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: All marked as read }
 *       500: { description: Server error }
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.updateMany(
      { user: userId, status: { $in: ['pending', 'sent'] } },
      { status: 'read' }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: {
        updatedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Mark All As Read Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to mark notifications as read",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/notifications/user/{userId}:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notifications by user (paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, sent, read, failed] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [email, system] }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200: { description: Notifications list }
 *       500: { description: Server error }
 */
exports.getNotificationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { user: userId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get notifications
    const notifications = await Notification.find(filter)
      .populate('template', 'templateName subject')
      .populate('organization', 'name')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Notification.countDocuments(filter);

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      user: userId,
      status: { $in: ['pending', 'sent'] }
    });

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get Notifications By User Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get user notifications",
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organization
 *         schema: { type: string }
 *     responses:
 *       200: { description: Stats object }
 *       500: { description: Server error }
 */
exports.getNotificationStats = async (req, res) => {
  try {
    const { organization } = req.query;

    // Build filter
    const filter = {};
    if (organization) filter.organization = organization;

    // Get statistics
    const stats = await Notification.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          sent: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          },
          read: {
            $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          email: {
            $sum: { $cond: [{ $eq: ['$type', 'email'] }, 1, 0] }
          },
          system: {
            $sum: { $cond: [{ $eq: ['$type', 'system'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      pending: 0,
      sent: 0,
      read: 0,
      failed: 0,
      email: 0,
      system: 0
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get Notification Stats Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get notification statistics",
      error: error.message 
    });
  }
};