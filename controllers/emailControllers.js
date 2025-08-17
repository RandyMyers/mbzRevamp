const Email = require("../models/emails"); // Import the Email model
const EmailLogs = require("../models/emailLogs");
const logEvent = require('../helper/logEvent');
const { createAuditLog, logCRUDOperation } = require('../helpers/auditLogHelper');
const sendEmail = require('../helper/senderEmail'); // Import the sendEmail helper
const Sender = require('../models/sender'); // Import Sender model for email sending

/**
 * @swagger
 * components:
 *   schemas:
 *     Email:
 *       type: object
 *       required:
 *         - recipient
 *         - subject
 *         - body
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique email ID
 *         recipient:
 *           type: string
 *           format: email
 *           description: Email recipient address
 *         subject:
 *           type: string
 *           description: Email subject line
 *         body:
 *           type: string
 *           description: Email body content (HTML)
 *         variables:
 *           type: object
 *           description: Template variables for personalization
 *         emailTemplate:
 *           type: string
 *           format: ObjectId
 *           description: Email template ID
 *         createdBy:
 *           type: string
 *           format: ObjectId
 *           description: User ID who created the email
 *         organization:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID
 *         senderId:
 *           type: string
 *           format: ObjectId
 *           description: Sender ID for the email
 *         campaign:
 *           type: string
 *           description: Campaign identifier
 *         workflow:
 *           type: string
 *           description: Workflow identifier
 *         status:
 *           type: string
 *           enum: [draft, sent, failed, pending]
 *           description: Email status
 *         messageId:
 *           type: string
 *           description: Unique message identifier
 *         sentAt:
 *           type: string
 *           format: date-time
 *           description: When email was sent
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Email creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Email last update timestamp
 */

/**
 * @swagger
 * /api/emails/create:
 *   post:
 *     summary: Create and send a new email
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipient
 *               - subject
 *               - body
 *             properties:
 *               recipient:
 *                 type: string
 *                 format: email
 *                 description: Email recipient address
 *                 example: "user@example.com"
 *               subject:
 *                 type: string
 *                 description: Email subject line
 *                 example: "Welcome to our platform"
 *               body:
 *                 type: string
 *                 description: Email body content (HTML)
 *                 example: "<h1>Welcome!</h1><p>Thank you for joining us.</p>"
 *               variables:
 *                 type: object
 *                 description: Template variables for personalization
 *                 example: {"name": "John", "company": "Acme Corp"}
 *               emailTemplate:
 *                 type: string
 *                 format: ObjectId
 *                 description: Email template ID
 *                 example: "507f1f77bcf86cd799439011"
 *               createdBy:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID who created the email
 *                 example: "507f1f77bcf86cd799439011"
 *               organization:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
 *               senderId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Sender ID for the email
 *                 example: "507f1f77bcf86cd799439011"
 *               campaign:
 *                 type: string
 *                 description: Campaign identifier
 *                 example: "welcome-campaign"
 *               workflow:
 *                 type: string
 *                 description: Workflow identifier
 *                 example: "onboarding"
 *     responses:
 *       201:
 *         description: Email created and sent successfully
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
 *                   example: "Email sent successfully"
 *                 email:
 *                   $ref: '#/components/schemas/Email'
 *       400:
 *         description: Bad request - Validation error
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
 *                   example: "Validation error"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
 *                   example: "Failed to send email"
 */
// CREATE a new email
exports.createEmail = async (req, res) => {
  try {
    const { recipient, subject, body, variables, emailTemplate, createdBy, organization, user, senderId, campaign, workflow } = req.body;
    
    // Handle both 'createdBy' and 'user' field names for compatibility
    const userId = createdBy || user;
    
    // Validate required fields
    if (!recipient || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Recipient, subject, and body are required fields"
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format for recipient"
      });
    }

    // 🔥 SEND THE EMAIL USING THE HELPER FUNCTION
    try {
      // Get active sender if senderId is provided, otherwise get first active sender
      let sender;
      if (senderId) {
        sender = await Sender.findById(senderId);
      } else {
        sender = await Sender.findOne({ isActive: true, organization: organization });
      }

      if (!sender || !sender.isActive) {
        return res.status(400).json({
          success: false,
          message: "No active email sender found. Please configure an email sender first."
        });
      }

      // Send the email using the sendEmail helper function
      const emailSent = await sendEmail({
        senderId: sender._id,
        campaign: campaign,
        workflow: workflow,
        organization: organization,
        createdBy: userId,
        emailTemplate: emailTemplate,
        variables: variables,
        to: recipient,
        subject: subject,
        html: body, // Use body as HTML content
        text: body.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
      });

      console.log('✅ Email sent successfully using helper function');
      
      // ✅ AUDIT LOG: Email Created and Sent
      await createAuditLog({
        action: 'Email Created and Sent',
        user: req.user?._id,
        resource: 'email',
        resourceId: emailSent.messageId,
        details: {
          recipient: recipient,
          subject: subject,
          status: 'sent',
          organization: organization,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        organization: req.user?.organization || organization,
        severity: 'info',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      // Only log event if user is authenticated
      if (req.user && req.user._id) {
        await logEvent({
          action: 'create_email',
          user: req.user._id,
          resource: 'Email',
          resourceId: emailSent.messageId,
          details: { to: recipient, subject: subject },
          organization: req.user.organization
        });
      }

      res.status(201).json({ 
        success: true, 
        message: "Email sent successfully",
        emailInfo: {
          messageId: emailSent.messageId,
          recipient: recipient,
          subject: subject,
          status: 'sent'
        }
      });

    } catch (sendError) {
      console.error('❌ Email sending failed:', sendError);
      
      // ✅ AUDIT LOG: Email Send Failed
      await createAuditLog({
        action: 'Email Send Failed',
        user: req.user?._id,
        resource: 'email',
        resourceId: null,
        details: {
          recipient: recipient,
          subject: subject,
          status: 'failed',
          error: sendError.message,
          organization: organization,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        organization: req.user?.organization || organization,
        severity: 'error',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(500).json({
        success: false,
        message: "Failed to send email",
        error: sendError.message
      });
    }
    
  } catch (error) {
    console.error('Email creation error:', error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Validation error", 
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Duplicate email entry" 
      });
    }
    
    res.status(500).json({ success: false, message: "Failed to create email" });
  }
};

/**
 * @swagger
 * /api/emails/all:
 *   get:
 *     summary: Get all emails for an organization
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of emails to return
 *         example: 50
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *     responses:
 *       200:
 *         description: Emails retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 emails:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Email'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 50
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Bad request - Organization ID required
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
 *                   example: "Organization ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
 *                   example: "Failed to retrieve emails"
 */
// GET all emails
exports.getAllEmails = async (req, res) => {
  try {
    const emails = await Email.find()
      .populate("createdBy organization emailTemplate", "name emailTemplateName") // Populate fields with related data
      .exec();
    res.status(200).json({ success: true, emails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve emails" });
  }
};

/**
 * @swagger
 * /api/emails/get/{emailId}:
 *   get:
 *     summary: Get a specific email by ID
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emailId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Email ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Email retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 email:
 *                   $ref: '#/components/schemas/Email'
 *       400:
 *         description: Bad request - Invalid email ID
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
 *                   example: "Invalid email ID"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Email not found
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
 *                   example: "Email not found"
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
 *                   example: "Failed to retrieve email"
 */
// GET a single email by ID
exports.getEmailById = async (req, res) => {
  const { emailId } = req.params;
  try {
    const email = await Email.findById(emailId)
      .populate("createdBy organization emailTemplate", "name emailTemplateName")
      .exec();
    if (!email) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }
    res.status(200).json({ success: true, email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve email" });
  }
};

/**
 * @swagger
 * /api/emails/status/{status}:
 *   get:
 *     summary: Get emails by status
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [draft, sent, failed, pending]
 *         description: Email status to filter by
 *         example: "sent"
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of emails to return
 *         example: 50
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *     responses:
 *       200:
 *         description: Emails retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 emails:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Email'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 50
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     pages:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Bad request - Invalid status or missing organization ID
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
 *                   example: "Invalid status or organization ID required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
 *                   example: "Failed to retrieve emails"
 */
// GET emails by status
exports.getEmailsByStatus = async (req, res) => {
    const { status } = req.params;
    console.log(status);
  
    // Validate status input
    const validStatuses = ["inbox", "sent", "archived", "trash", "drafts","outbox", "scheduled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }
  
    try {
      const emails = await Email.find({ status })
        .populate("createdBy organization emailTemplate", "name emailTemplateName")
        .exec();
  
      res.status(200).json({ success: true, emails });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to retrieve emails by status" });
    }
  };
  

/**
 * @swagger
 * /api/emails/update/{emailId}:
 *   patch:
 *     summary: Update an existing email
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emailId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Email ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Email subject line
 *                 example: "Updated subject line"
 *               body:
 *                 type: string
 *                 description: Email body content (HTML)
 *                 example: "<h1>Updated content</h1><p>New email body.</p>"
 *               variables:
 *                 type: object
 *                 description: Template variables for personalization
 *                 example: {"name": "Jane", "company": "Tech Corp"}
 *               status:
 *                 type: string
 *                 enum: [draft, sent, failed, pending]
 *                 description: Email status
 *                 example: "draft"
 *               campaign:
 *                 type: string
 *                 description: Campaign identifier
 *                 example: "updated-campaign"
 *               workflow:
 *                 type: string
 *                 description: Workflow identifier
 *                 example: "updated-workflow"
 *     responses:
 *       200:
 *         description: Email updated successfully
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
 *                   example: "Email updated successfully"
 *                 email:
 *                   $ref: '#/components/schemas/Email'
 *       400:
 *         description: Bad request - Validation error
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
 *                   example: "Validation error"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Email not found
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
 *                   example: "Email not found"
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
 *                   example: "Failed to update email"
 */
// UPDATE an existing email
exports.updateEmail = async (req, res) => {
  const { emailId } = req.params;
  const { recipient, subject, body, variables, emailTemplate, status, bounceReason, unsubscribed, replied, sentAt } = req.body;

  try {
    const updatedEmail = await Email.findByIdAndUpdate(
      emailId,
      { recipient, subject, body, variables, emailTemplate, status, bounceReason, unsubscribed, replied, sentAt, updatedAt: Date.now() },
      { new: true } // return the updated email
    );

    if (!updatedEmail) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }

    // ✅ AUDIT LOG: Email Updated
    await createAuditLog({
      action: 'Email Updated',
      user: req.user?._id,
      resource: 'email',
      resourceId: updatedEmail._id,
      details: {
        recipient: updatedEmail.recipient,
        subject: updatedEmail.subject,
        status: updatedEmail.status,
        updatedFields: Object.keys(req.body),
        organization: updatedEmail.organization,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization || updatedEmail.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ success: true, email: updatedEmail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update email" });
  }
};

/**
 * @swagger
 * /api/emails/delete/{emailId}:
 *   delete:
 *     summary: Delete an email
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emailId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Email ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Email deleted successfully
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
 *                   example: "Email deleted successfully"
 *       400:
 *         description: Bad request - Invalid email ID
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
 *                   example: "Invalid email ID"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Email not found
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
 *                   example: "Email not found"
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
 *                   example: "Failed to delete email"
 */
// DELETE an email
exports.deleteEmail = async (req, res) => {
  const { emailId } = req.params;
  try {
    const emailToDelete = await Email.findById(emailId);
    if (!emailToDelete) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }

    // ✅ AUDIT LOG: Email Deleted
    await createAuditLog({
      action: 'Email Deleted',
      user: req.user?._id,
      resource: 'email',
      resourceId: emailId,
      details: {
        recipient: emailToDelete.recipient,
        subject: emailToDelete.subject,
        status: emailToDelete.status,
        organization: emailToDelete.organization,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: req.user?.organization || emailToDelete.organization,
      severity: 'warning',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    await Email.findByIdAndDelete(emailId);
    res.status(200).json({ success: true, message: "Email deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete email" });
  }
};

/**
 * @swagger
 * /api/emails/analytics/log:
 *   post:
 *     summary: Log email analytics data
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailId
 *               - eventType
 *             properties:
 *               emailId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Email ID
 *                 example: "507f1f77bcf86cd799439011"
 *               eventType:
 *                 type: string
 *                 enum: [open, click, bounce, delivered, failed]
 *                 description: Type of email event
 *                 example: "open"
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Event timestamp
 *                 example: "2024-01-01T12:00:00.000Z"
 *               ipAddress:
 *                 type: string
 *                 description: IP address of the event
 *                 example: "192.168.1.1"
 *               userAgent:
 *                 type: string
 *                 description: User agent string
 *                 example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *               location:
 *                 type: object
 *                 description: Geographic location data
 *                 properties:
 *                   country:
 *                     type: string
 *                     example: "US"
 *                   city:
 *                     type: string
 *                     example: "New York"
 *                   region:
 *                     type: string
 *                     example: "NY"
 *               deviceInfo:
 *                 type: object
 *                 description: Device information
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: "desktop"
 *                   browser:
 *                     type: string
 *                     example: "Chrome"
 *                   os:
 *                     type: string
 *                     example: "Windows"
 *     responses:
 *       200:
 *         description: Analytics logged successfully
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
 *                   example: "Analytics logged successfully"
 *       400:
 *         description: Bad request - Missing required fields
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
 *                   example: "Email ID and event type are required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
 *                   example: "Failed to log analytics"
 */
exports.logEmailAnalytics = async (req, res) => {
  try {
    const { emailId, status, deviceType, client, country } = req.body;
    const log = new EmailLogs({
      emailId,
      status,
      deviceType,
      client,
      country,
      sentAt: status === 'sent' ? new Date() : undefined,
    });
    await log.save();
    res.status(201).json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @swagger
 * /api/emails/test/create:
 *   post:
 *     summary: Create a test email for testing purposes
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipient
 *               - subject
 *               - body
 *             properties:
 *               recipient:
 *                 type: string
 *                 format: email
 *                 description: Test email recipient address
 *                 example: "test@example.com"
 *               subject:
 *                 type: string
 *                 description: Test email subject line
 *                 example: "Test Email"
 *               body:
 *                 type: string
 *                 description: Test email body content (HTML)
 *                 example: "<h1>Test Email</h1><p>This is a test email.</p>"
 *               variables:
 *                 type: object
 *                 description: Template variables for personalization
 *                 example: {"name": "Test User", "company": "Test Corp"}
 *               emailTemplate:
 *                 type: string
 *                 format: ObjectId
 *                 description: Email template ID (optional)
 *                 example: "507f1f77bcf86cd799439011"
 *               organization:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Test email created successfully
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
 *                   example: "Test email created successfully"
 *                 email:
 *                   $ref: '#/components/schemas/Email'
 *       400:
 *         description: Bad request - Validation error
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
 *                   example: "Validation error"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
 *                   example: "Failed to create test email"
 */
exports.createTestEmail = async (req, res) => {
  try {
    const testEmail = new Email({
      recipient: "test@example.com",
      subject: "Test Email",
      body: "This is a test email body",
      status: "sent",
      createdBy: req.user?._id,
      organization: req.user?.organization
    });

    const savedEmail = await testEmail.save();
    res.status(201).json({ success: true, email: savedEmail });
  } catch (error) {
    console.error('Test email creation error:', error);
    res.status(500).json({ success: false, message: "Failed to create test email" });
  }
};

/**
 * @swagger
 * /api/emails/test/count:
 *   get:
 *     summary: Get email count for testing purposes
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [draft, sent, failed, pending]
 *         description: Filter by email status
 *         example: "sent"
 *     responses:
 *       200:
 *         description: Email count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Total number of emails
 *                   example: 150
 *                 breakdown:
 *                   type: object
 *                   description: Breakdown by status
 *                   properties:
 *                     draft:
 *                       type: integer
 *                       example: 25
 *                     sent:
 *                       type: integer
 *                       example: 100
 *                     failed:
 *                       type: integer
 *                       example: 15
 *                     pending:
 *                       type: integer
 *                       example: 10
 *       400:
 *         description: Bad request - Organization ID required
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
 *                   example: "Organization ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
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
 *                   example: "Failed to get email count"
 */
exports.getEmailCount = async (req, res) => {
  try {
    const count = await Email.countDocuments();
    const inboxCount = await require("../models/inbox").countDocuments();
    const sentCount = await require("../models/sent").countDocuments();
    const archivedCount = await require("../models/archived").countDocuments();
    const trashCount = await require("../models/trash").countDocuments();
    
    res.status(200).json({ 
      success: true, 
      counts: {
        emails: count,
        inbox: inboxCount,
        sent: sentCount,
        archived: archivedCount,
        trash: trashCount
      }
    });
  } catch (error) {
    console.error('Email count error:', error);
    res.status(500).json({ success: false, message: "Failed to get email count" });
  }
};

