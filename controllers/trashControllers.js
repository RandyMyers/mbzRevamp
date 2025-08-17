const Trash = require("../models/trash");
const Inbox = require("../models/inbox");
const Email = require("../models/emails");
const logEvent = require('../helper/logEvent');

/**
 * @swagger
 * /api/trash/move:
 *   post:
 *     summary: Move email to trash
 *     tags: [Trash]
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
 *               - originalFolder
 *             properties:
 *               emailId:
 *                 type: string
 *                 format: ObjectId
 *                 description: ID of the email to move to trash
 *                 example: "507f1f77bcf86cd799439011"
 *               originalFolder:
 *                 type: string
 *                 enum: [inbox, sent, drafts, outbox, archived]
 *                 description: Original folder where the email was stored
 *                 example: "inbox"
 *     responses:
 *       200:
 *         description: Email moved to trash successfully
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
 *                   example: "Email moved to trash"
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
 *                   example: "Missing required fields"
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
 *                   example: "Failed to move email to trash"
 */

// Move email to trash
exports.moveToTrash = async (req, res) => {
  try {
    const { emailId, originalFolder } = req.body;
    let email;

    // Find the email in its original folder
    if (originalFolder === 'inbox') {
      email = await Inbox.findById(emailId);
    } else {
      email = await Email.findById(emailId);
    }

    if (!email) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }

    // Create trash entry
    const trashEmail = new Trash({
      sender: email.sender,
      subject: email.subject,
      body: email.body,
      replyTo: email.replyTo,
      status: email.status,
      receivedAt: email.receivedAt,
      emailLogs: email.emailLogs,
      organization: email.organization,
      user: email.user,
      originalFolder: originalFolder
    });

    await trashEmail.save();

    // Delete from original folder
    if (originalFolder === 'inbox') {
      await Inbox.findByIdAndDelete(emailId);
    } else {
      await Email.findByIdAndDelete(emailId);
    }

    await logEvent({
      action: 'move_to_trash',
      user: req.user._id,
      resource: 'Email',
      resourceId: emailId,
      details: { subject: email.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, message: "Email moved to trash" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to move email to trash" });
  }
};

/**
 * @swagger
 * /api/trash:
 *   get:
 *     summary: Get all trash emails
 *     tags: [Trash]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trash emails retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 trashEmails:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trash'
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
 *                   example: "Failed to retrieve trash emails"
 */

// Get all trash emails
exports.getTrashEmails = async (req, res) => {
  try {
    const trashEmails = await Trash.find({ organization: req.user.organization })
      .populate("user organization", "name email")
      .sort({ deletedAt: -1 })
      .exec();
    res.status(200).json({ success: true, trashEmails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve trash emails" });
  }
};

/**
 * @swagger
 * /api/trash/restore/{trashId}:
 *   post:
 *     summary: Restore email from trash
 *     tags: [Trash]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trashId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID of the trash email to restore
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Email restored successfully
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
 *                   example: "Email restored successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Trash email not found
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
 *                   example: "Trash email not found"
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
 *                   example: "Failed to restore email"
 */

// Restore email from trash
exports.restoreFromTrash = async (req, res) => {
  try {
    const { trashId } = req.params;
    const trashEmail = await Trash.findById(trashId);

    if (!trashEmail) {
      return res.status(404).json({ success: false, message: "Trash email not found" });
    }

    // Restore to original folder
    if (trashEmail.originalFolder === 'inbox') {
      const inboxEmail = new Inbox({
        sender: trashEmail.sender,
        subject: trashEmail.subject,
        body: trashEmail.body,
        replyTo: trashEmail.replyTo,
        status: trashEmail.status,
        receivedAt: trashEmail.receivedAt,
        emailLogs: trashEmail.emailLogs,
        organization: trashEmail.organization,
        user: trashEmail.user
      });
      await inboxEmail.save();
    } else {
      const email = new Email({
        sender: trashEmail.sender,
        subject: trashEmail.subject,
        body: trashEmail.body,
        replyTo: trashEmail.replyTo,
        status: trashEmail.status,
        receivedAt: trashEmail.receivedAt,
        emailLogs: trashEmail.emailLogs,
        organization: trashEmail.organization,
        user: trashEmail.user
      });
      await email.save();
    }

    // Delete from trash
    await Trash.findByIdAndDelete(trashId);

    await logEvent({
      action: 'restore_from_trash',
      user: req.user._id,
      resource: 'Email',
      resourceId: trashId,
      details: { subject: trashEmail.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, message: "Email restored successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to restore email" });
  }
};

/**
 * @swagger
 * /api/trash/{trashId}:
 *   delete:
 *     summary: Permanently delete email from trash
 *     tags: [Trash]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trashId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID of the trash email to permanently delete
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Email permanently deleted successfully
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
 *                   example: "Email permanently deleted"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Trash email not found
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
 *                   example: "Trash email not found"
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

// Permanently delete from trash
exports.deleteFromTrash = async (req, res) => {
  try {
    const { trashId } = req.params;
    const trashEmail = await Trash.findById(trashId);

    if (!trashEmail) {
      return res.status(404).json({ success: false, message: "Trash email not found" });
    }

    await Trash.findByIdAndDelete(trashId);

    await logEvent({
      action: 'delete_from_trash',
      user: req.user._id,
      resource: 'Email',
      resourceId: trashId,
      details: { subject: trashEmail.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, message: "Email permanently deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete email" });
  }
}; 