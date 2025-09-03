/**
 * @swagger
 * tags:
 *   - name: Sent Emails
 *     description: Manage sent emails
 *
 * /api/sent:
 *   get:
 *     tags: [Sent Emails]
 *     summary: Get all sent emails
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Sent emails list }
 *       500: { description: Server error }
 *
 * /api/sent/organization/{organizationId}:
 *   get:
 *     tags: [Sent Emails]
 *     summary: Get sent emails by organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sent emails list }
 *       500: { description: Server error }
 *
 * /api/sent/{sentEmailId}:
 *   get:
 *     tags: [Sent Emails]
 *     summary: Get a sent email by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sentEmailId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sent email }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *   delete:
 *     tags: [Sent Emails]
 *     summary: Delete a sent email
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sentEmailId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *
 * /api/sent/{sentEmailId}/resend:
 *   post:
 *     tags: [Sent Emails]
 *     summary: Resend a sent email
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sentEmailId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Email resent }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
const Email = require("../models/emails");
const logEvent = require('../helper/logEvent');

// GET all sent emails
exports.getSentEmails = async (req, res) => {
  try {
    // Filter by organization and user for security
    const filter = { 
      status: 'sent',
      organization: req.user.organization 
    };

    const sentEmails = await Email.find(filter)
      .populate("createdBy", "name email")
      .populate("organization", "name")
      .populate("emailTemplate", "name subject")
      .sort({ sentAt: -1 })
      .exec();
    
    res.status(200).json({ success: true, sentEmails });
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve sent emails",
      error: error.message 
    });
  }
};

// GET sent emails by organization
exports.getSentEmailsByOrganization = async (req, res) => {
  const { organizationId } = req.params;
  
  try {
    const sentEmails = await Email.find({ 
      status: 'sent',
      organization: organizationId 
    })
      .populate("createdBy", "name email")
      .populate("organization", "name")
      .populate("emailTemplate", "name subject")
      .sort({ sentAt: -1 })
      .exec();
    
    res.status(200).json({ success: true, sentEmails });
  } catch (error) {
    console.error('Error fetching sent emails by organization:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve sent emails by organization",
      error: error.message 
    });
  }
};

// GET a specific sent email by ID
exports.getSentEmailById = async (req, res) => {
  const { sentEmailId } = req.params;
  
  try {
    const sentEmail = await Email.findOne({
      _id: sentEmailId,
      organization: req.user.organization,
      status: 'sent'
    })
      .populate("createdBy", "name email")
      .populate("organization", "name")
      .populate("emailTemplate", "name subject")
      .exec();
    
    if (!sentEmail) {
      return res.status(404).json({ success: false, message: "Sent email not found" });
    }
    
    res.status(200).json({ success: true, sentEmail });
  } catch (error) {
    console.error('Error fetching sent email by ID:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve sent email",
      error: error.message 
    });
  }
};

// DELETE a sent email
exports.deleteSentEmail = async (req, res) => {
  const { sentEmailId } = req.params;
  
  try {
    const sentEmail = await Email.findOne({
      _id: sentEmailId,
      organization: req.user.organization,
      status: 'sent'
    });
    
    if (!sentEmail) {
      return res.status(404).json({ success: false, message: "Sent email not found" });
    }
    
    await Email.findByIdAndDelete(sentEmailId);
    
    await logEvent({
      action: 'delete_sent_email',
      user: req.user._id,
      resource: 'Email',
      resourceId: sentEmailId,
      details: { to: sentEmail.recipient, subject: sentEmail.subject },
      organization: req.user.organization
    });
    
    res.status(200).json({ success: true, message: "Sent email deleted successfully" });
  } catch (error) {
    console.error('Error deleting sent email:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete sent email",
      error: error.message 
    });
  }
};

// RESEND a sent email
exports.resendEmail = async (req, res) => {
  const { sentEmailId } = req.params;
  
  try {
    const originalEmail = await Email.findOne({
      _id: sentEmailId,
      organization: req.user.organization,
      status: 'sent'
    });
    
    if (!originalEmail) {
      return res.status(404).json({ success: false, message: "Sent email not found" });
    }
    
    // Create a new email based on the original
    const newEmail = new Email({
      recipient: originalEmail.recipient,
      subject: originalEmail.subject,
      body: originalEmail.body,
      variables: originalEmail.variables,
      emailTemplate: originalEmail.emailTemplate,
      organization: originalEmail.organization,
      createdBy: originalEmail.createdBy,
      status: 'sent',
      sentAt: new Date()
    });
    
    const savedEmail = await newEmail.save();
    
    await logEvent({
      action: 'resend_email',
      user: req.user._id,
      resource: 'Email',
      resourceId: savedEmail._id,
      details: { 
        to: savedEmail.recipient, 
        subject: savedEmail.subject,
        originalEmailId: sentEmailId 
      },
      organization: req.user.organization
    });
    
    res.status(200).json({ 
      success: true, 
      email: savedEmail, 
      message: "Email resent successfully" 
    });
  } catch (error) {
    console.error('Error resending email:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to resend email",
      error: error.message 
    });
  }
}; 