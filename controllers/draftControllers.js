/**
 * @swagger
 * tags:
 *   - name: Drafts
 *     description: Manage email drafts
 *
 * /api/drafts:
 *   post:
 *     tags: [Drafts]
 *     summary: Create a draft
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipient: { type: string }
 *               subject: { type: string }
 *               body: { type: string }
 *               variables: { type: object }
 *               emailTemplate: { type: string }
 *               organization: { type: string }
 *               user: { type: string }
 *     responses:
 *       201: { description: Draft created }
 *       500: { description: Server error }
 *   get:
 *     tags: [Drafts]
 *     summary: Get all drafts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Drafts list }
 *       500: { description: Server error }
 *
 * /api/drafts/organization/{organizationId}:
 *   get:
 *     tags: [Drafts]
 *     summary: Get drafts by organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Drafts list }
 *       500: { description: Server error }
 *
 * /api/drafts/{draftId}:
 *   get:
 *     tags: [Drafts]
 *     summary: Get a draft by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: draftId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Draft }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *   patch:
 *     tags: [Drafts]
 *     summary: Update a draft
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: draftId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipient: { type: string }
 *               subject: { type: string }
 *               body: { type: string }
 *               variables: { type: object }
 *               emailTemplate: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *   delete:
 *     tags: [Drafts]
 *     summary: Delete a draft
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: draftId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *
 * /api/drafts/{draftId}/send:
 *   post:
 *     tags: [Drafts]
 *     summary: Send a draft
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: draftId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sent }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
const Draft = require("../models/draft");
const Email = require("../models/emails");
const logEvent = require('../helper/logEvent');

// CREATE a new draft email
exports.createDraft = async (req, res) => {
  try {
    const { recipient, subject, body, variables, emailTemplate, organization, user } = req.body;

    const newDraft = new Draft({
      recipient,
      subject,
      body,
      variables,
      emailTemplate,
      organization,
      user,
    });

    const savedDraft = await newDraft.save();
    
    await logEvent({
      action: 'create_draft',
      user: req.user._id,
      resource: 'Draft',
      resourceId: savedDraft._id,
      details: { to: savedDraft.recipient, subject: savedDraft.subject },
      organization: req.user.organization
    });
    
    res.status(201).json({ success: true, draft: savedDraft });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create draft" });
  }
};

// GET all draft emails
exports.getDrafts = async (req, res) => {
  try {
    const drafts = await Draft.find()
      .populate("user organization emailTemplate", "name emailTemplateName")
      .exec();
    res.status(200).json({ success: true, drafts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve drafts" });
  }
};

// GET draft emails by organization
exports.getDraftsByOrganization = async (req, res) => {
  const { organizationId } = req.params;
  
  try {
    const drafts = await Draft.find({ organization: organizationId })
      .populate("user organization emailTemplate", "name emailTemplateName")
      .exec();
    
    res.status(200).json({ success: true, drafts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve drafts by organization" });
  }
};

// GET a single draft email by ID
exports.getDraftById = async (req, res) => {
  const { draftId } = req.params;
  try {
    const draft = await Draft.findById(draftId)
      .populate("user organization emailTemplate", "name emailTemplateName")
      .exec();
    if (!draft) {
      return res.status(404).json({ success: false, message: "Draft not found" });
    }
    res.status(200).json({ success: true, draft });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve draft" });
  }
};

// UPDATE a draft email
exports.updateDraft = async (req, res) => {
  const { draftId } = req.params;
  const { recipient, subject, body, variables, emailTemplate } = req.body;

  try {
    const updatedDraft = await Draft.findByIdAndUpdate(
      draftId,
      { recipient, subject, body, variables, emailTemplate, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedDraft) {
      return res.status(404).json({ success: false, message: "Draft not found" });
    }

    await logEvent({
      action: 'update_draft',
      user: req.user._id,
      resource: 'Draft',
      resourceId: updatedDraft._id,
      details: { to: updatedDraft.recipient, subject: updatedDraft.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, draft: updatedDraft });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update draft" });
  }
};

// DELETE a draft email
exports.deleteDraft = async (req, res) => {
  const { draftId } = req.params;
  try {
    const deletedDraft = await Draft.findByIdAndDelete(draftId);
    if (!deletedDraft) {
      return res.status(404).json({ success: false, message: "Draft not found" });
    }

    await logEvent({
      action: 'delete_draft',
      user: req.user._id,
      resource: 'Draft',
      resourceId: draftId,
      details: { to: deletedDraft.recipient, subject: deletedDraft.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, message: "Draft deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete draft" });
  }
};

// SEND a draft email
exports.sendDraft = async (req, res) => {
  const { draftId } = req.params;
  try {
    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({ success: false, message: "Draft not found" });
    }

    // Create a new email from the draft
    const newEmail = new Email({
      recipient: draft.recipient,
      subject: draft.subject,
      body: draft.body,
      variables: draft.variables,
      emailTemplate: draft.emailTemplate,
      organization: draft.organization,
      user: draft.user,
      status: 'sent',
      sentAt: new Date()
    });

    const savedEmail = await newEmail.save();

    // Delete the draft after sending
    await Draft.findByIdAndDelete(draftId);

    await logEvent({
      action: 'send_draft',
      user: req.user._id,
      resource: 'Email',
      resourceId: savedEmail._id,
      details: { to: savedEmail.recipient, subject: savedEmail.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, email: savedEmail, message: "Draft sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to send draft" });
  }
}; 