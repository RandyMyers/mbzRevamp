const Email = require("../models/emails"); // Import the Email model
const EmailLogs = require("../models/emailLogs");
const logEvent = require('../helper/logEvent');
const { createAuditLog, logCRUDOperation } = require('../helpers/auditLogHelper');
const sendEmail = require('../helper/senderEmail'); // Import the sendEmail helper
const Sender = require('../models/sender'); // Import Sender model for email sending

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

// Example: Add a function to log analytics info (to be called from webhook or tracking pixel endpoint)
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

// Test endpoint to create a sample email
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

// Test endpoint to get email count
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

