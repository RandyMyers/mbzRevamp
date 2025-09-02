/**
 * @swagger
 * tags:
 *   - name: Inbox
 *     description: Manage inbox emails
 *
 * /api/inbox/create:
 *   post:
 *     tags: [Inbox]
 *     summary: Create an inbox email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sender: { type: string }
 *               subject: { type: string }
 *               body: { type: string }
 *               replyTo: { type: string }
 *               status: { type: string, enum: [unread, read, archived, spam] }
 *               organization: { type: string }
 *               user: { type: string }
 *               receiver: { type: string, description: 'Receiver email account ID this email came from' }
 *               recipient: { type: string, description: 'Email address that received this email' }
 *     responses:
 *       201: { description: Created }
 *       500: { description: Server error }
 *
 * /api/inbox/all:
 *   get:
 *     tags: [Inbox]
 *     summary: Get all inbox emails
 *     responses:
 *       200: { description: Inbox emails list }
 *       500: { description: Server error }
 *
 * /api/inbox/get/{inboxEmailId}:
 *   get:
 *     tags: [Inbox]
 *     summary: Get inbox email by ID
 *     parameters:
 *       - in: path
 *         name: inboxEmailId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Inbox email }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *
 * /api/inbox/update/{inboxEmailId}:
 *   patch:
 *     tags: [Inbox]
 *     summary: Update inbox email status
 *     parameters:
 *       - in: path
 *         name: inboxEmailId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [unread, read, archived] }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *
 * /api/inbox/delete/{inboxEmailId}:
 *   delete:
 *     tags: [Inbox]
 *     summary: Delete inbox email
 *     parameters:
 *       - in: path
 *         name: inboxEmailId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *
 * /api/inbox/organization/{organizationId}:
 *   get:
 *     tags: [Inbox]
 *     summary: Get inbox emails by organization
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: receiver
 *         required: false
 *         schema: { type: string }
 *         description: Filter by receiver email account ID
 *     responses:
 *       200: { description: Inbox emails list }
 *       400: { description: Missing organizationId }
 *       500: { description: Server error }
 *
 * /api/inbox/receiver/{receiverId}:
 *   get:
 *     tags: [Inbox]
 *     summary: Get inbox emails by specific receiver
 *     parameters:
 *       - in: path
 *         name: receiverId
 *         required: true
 *         schema: { type: string }
 *         description: Receiver email account ID
 *     responses:
 *       200: { description: Inbox emails for specific receiver }
 *       404: { description: Receiver not found }
 *       500: { description: Server error }
 */
const Inbox = require("../models/inbox"); // Import the Inbox model

// CREATE a new email in the inbox (e.g., when receiving an email)
exports.createInboxEmail = async (req, res) => {
  try {
    const { sender, subject, body, replyTo, status, organization, user } = req.body;

    const newInboxEmail = new Inbox({
      sender,
      subject,
      body,
      replyTo,
      status,
      organization,
      user,
    });

    const savedInboxEmail = await newInboxEmail.save();
    res.status(201).json({ success: true, inboxEmail: savedInboxEmail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create inbox email" });
  }
};

// GET all emails in the inbox for a specific user
exports.getAllInboxEmails = async (req, res) => {
  
  try {
    const inboxEmails = await Inbox.find()
      .populate("sender replyTo organization", "name") // Populate relevant fields
      .exec();

      console.log(inboxEmails);
      
    res.status(200).json({ success: true, inboxEmails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve inbox emails" });
  }
};

// GET a specific email from the inbox by ID
exports.getInboxEmailById = async (req, res) => {
  const { inboxEmailId } = req.params;
  try {
    const inboxEmail = await Inbox.findById(inboxEmailId)
      .populate("sender replyTo organization", "name")
      .exec();
    if (!inboxEmail) {
      return res.status(404).json({ success: false, message: "Inbox email not found" });
    }
    res.status(200).json({ success: true, inboxEmail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve inbox email" });
  }
};

// UPDATE the status of an email (e.g., mark as read or archived)
exports.updateInboxEmailStatus = async (req, res) => {
  const { inboxEmailId } = req.params;
  const { status } = req.body; // status can be "unread", "read", or "archived"

  try {
    const updatedInboxEmail = await Inbox.findByIdAndUpdate(
      inboxEmailId,
      { status, updatedAt: Date.now() },
      { new: true } // return the updated inbox email
    );

    if (!updatedInboxEmail) {
      return res.status(404).json({ success: false, message: "Inbox email not found" });
    }

    res.status(200).json({ success: true, inboxEmail: updatedInboxEmail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update inbox email status" });
  }
};

// DELETE an email from the inbox
exports.deleteInboxEmail = async (req, res) => {
  const { inboxEmailId } = req.params;
  try {
    const deletedInboxEmail = await Inbox.findByIdAndDelete(inboxEmailId);
    if (!deletedInboxEmail) {
      return res.status(404).json({ success: false, message: "Inbox email not found" });
    }
    res.status(200).json({ success: true, message: "Inbox email deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete inbox email" });
  }
};

// GET all emails in the inbox for a specific organization
exports.getInboxEmailsByOrganization = async (req, res) => {
  const organizationId = req.query.organizationId || req.params.organizationId;
  if (!organizationId) {
    return res.status(400).json({ success: false, message: "organizationId is required" });
  }
  try {
    const inboxEmails = await Inbox.find({ organization: organizationId })
      .populate("sender replyTo organization", "name")
      .exec();

      console.log(inboxEmails);
    res.status(200).json({ success: true, inboxEmails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve inbox emails by organization" });
  }
};

// DELETE all emails in the inbox for a specific organization
exports.deleteAllInboxEmailsByOrganization = async (req, res) => {
  const organizationId = req.query.organizationId || req.params.organizationId;
  
  if (!organizationId) {
    return res.status(400).json({ success: false, message: "organizationId is required" });
  }

  try {
    // First, get the count of emails to be deleted for confirmation
    const emailCount = await Inbox.countDocuments({ organization: organizationId });
    
    if (emailCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No inbox emails found for this organization" 
      });
    }

    // Delete all emails for the organization
    const deleteResult = await Inbox.deleteMany({ organization: organizationId });
    
    console.log(`Deleted ${deleteResult.deletedCount} inbox emails for organization: ${organizationId}`);
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully deleted ${deleteResult.deletedCount} inbox emails`,
      deletedCount: deleteResult.deletedCount,
      organizationId: organizationId
    });
  } catch (error) {
    console.error('Error deleting all inbox emails by organization:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete inbox emails by organization" 
    });
  }
};
