/**
 * @swagger
 * tags:
 *   - name: Archived
 *     description: Manage archived emails
 *
 * /api/archived:
 *   post:
 *     tags: [Archived]
 *     summary: Create an archived email
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject: { type: string }
 *               body: { type: string }
 *               sender: { type: string }
 *               recipients: { type: array, items: { type: string } }
 *               organizationId: { type: string }
 *               originalFolder: { type: string, enum: [inbox, sent, drafts, outbox] }
 *     responses:
 *       201: { description: Created }
 *       500: { description: Server error }
 *   get:
 *     tags: [Archived]
 *     summary: Get archived emails for current user's organization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Archived list }
 *       500: { description: Server error }
 *
 * /api/archived/organization/{organizationId}:
 *   get:
 *     tags: [Archived]
 *     summary: Get archived emails by organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Archived list }
 *       500: { description: Server error }
 *
 * /api/archived/{archivedEmailId}:
 *   get:
 *     tags: [Archived]
 *     summary: Get archived email by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: archivedEmailId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Archived email }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *   patch:
 *     tags: [Archived]
 *     summary: Update archived email
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: archivedEmailId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *   delete:
 *     tags: [Archived]
 *     summary: Delete archived email
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: archivedEmailId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
const Archived = require('../models/archived');
const Inbox = require('../models/inbox');
const Email = require('../models/emails');
const mongoose = require('mongoose');
const logEvent = require('../helper/logEvent');
const { createAuditLog } = require('../helpers/auditLogHelper');

// Create a new archived email
const createArchivedEmail = async (req, res) => {
  try {
    const { subject, body, sender, recipients, organizationId, originalFolder } = req.body;
    
    const archivedEmail = new Archived({
      subject,
      body,
      sender,
      recipients,
      organization: organizationId || req.user.organization,
      user: req.user._id,
      originalFolder: originalFolder || 'inbox'
    });

    const savedEmail = await archivedEmail.save();
    
    res.status(201).json({
      success: true,
      data: savedEmail
    });
  } catch (error) {
    console.error('Create Archived Email Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to create archived email"
    });
  }
};

// Get all archived emails
const getArchivedEmails = async (req, res) => {
  try {
    const archivedEmails = await Archived.find({
      organization: req.user.organization
    }).sort({ archivedAt: -1 });

    res.json({
      success: true,
      data: archivedEmails
    });
  } catch (error) {
    console.error('Get Archived Emails Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch archived emails"
    });
  }
};

// Get archived emails by organization
const getArchivedEmailsByOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const archivedEmails = await Archived.find({
      organization: new mongoose.Types.ObjectId(organizationId)
    }).sort({ archivedAt: -1 });

    res.json({
      success: true,
      archivedEmails: archivedEmails
    });
  } catch (error) {
    console.error('Get Archived Emails By Organization Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch archived emails"
    });
  }
};

// Get a specific archived email by ID
const getArchivedEmailById = async (req, res) => {
  try {
    const { archivedEmailId } = req.params;
    
    const archivedEmail = await Archived.findById(archivedEmailId);
    
    if (!archivedEmail) {
      return res.status(404).json({
        success: false,
        error: "Archived email not found"
      });
    }

    res.json({
      success: true,
      data: archivedEmail
    });
  } catch (error) {
    console.error('Get Archived Email By ID Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch archived email"
    });
  }
};

// Update an archived email
const updateArchivedEmail = async (req, res) => {
  try {
    const { archivedEmailId } = req.params;
    const updateData = req.body;
    
    const updatedEmail = await Archived.findByIdAndUpdate(
      archivedEmailId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedEmail) {
      return res.status(404).json({
        success: false,
        error: "Archived email not found"
      });
    }

    res.json({
      success: true,
      data: updatedEmail
    });
  } catch (error) {
    console.error('Update Archived Email Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update archived email"
    });
  }
};

// Delete an archived email
const deleteArchivedEmail = async (req, res) => {
  try {
    const { archivedEmailId } = req.params;
    
    const deletedEmail = await Archived.findByIdAndDelete(archivedEmailId);
    
    if (!deletedEmail) {
      return res.status(404).json({
        success: false,
        error: "Archived email not found"
      });
    }

    res.json({
      success: true,
      message: "Archived email deleted successfully"
    });
  } catch (error) {
    console.error('Delete Archived Email Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to delete archived email"
    });
  }
};

/**
 * @swagger
 * /api/archived/move-to-archive:
 *   post:
 *     summary: Move email from inbox/sent to archive
 *     tags: [Archived]
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
 *               - sourceFolder
 *             properties:
 *               emailId:
 *                 type: string
 *                 format: ObjectId
 *                 description: ID of the email to archive
 *               sourceFolder:
 *                 type: string
 *                 enum: [inbox, sent, drafts]
 *                 description: Source folder of the email
 *     responses:
 *       200:
 *         description: Email moved to archive successfully
 *       404:
 *         description: Email not found
 *       500:
 *         description: Server error
 */
// Move email to archive
const moveToArchive = async (req, res) => {
  try {
    const { emailId, sourceFolder } = req.body;

    if (!emailId || !sourceFolder) {
      return res.status(400).json({
        success: false,
        message: 'Email ID and source folder are required'
      });
    }

    let sourceEmail = null;
    let sourceModel = null;

    // Find the email in the appropriate source model
    switch (sourceFolder) {
      case 'inbox':
        sourceModel = Inbox;
        sourceEmail = await Inbox.findOne({
          _id: emailId,
          organization: req.user.organization
        });
        break;
      case 'sent':
      case 'drafts':
        sourceModel = Email;
        sourceEmail = await Email.findOne({
          _id: emailId,
          organization: req.user.organization,
          status: sourceFolder
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid source folder'
        });
    }

    if (!sourceEmail) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    // Create archived email
    const archivedEmail = new Archived({
      sender: sourceEmail.sender || sourceEmail.from || 'Unknown',
      subject: sourceEmail.subject,
      body: sourceEmail.body || sourceEmail.html || sourceEmail.text,
      recipients: sourceEmail.recipients || [sourceEmail.recipient] || [],
      cc: sourceEmail.cc || [],
      bcc: sourceEmail.bcc || [],
      attachments: sourceEmail.attachments || [],
      organization: req.user.organization,
      user: req.user._id,
      receiver: sourceEmail.receiver,
      originalFolder: sourceFolder,
      archivedAt: new Date()
    });

    await archivedEmail.save();

    // Delete from source folder
    await sourceModel.findByIdAndDelete(emailId);

    // Audit log
    await createAuditLog({
      action: 'Email Moved to Archive',
      user: req.user._id,
      resource: 'archived',
      resourceId: archivedEmail._id,
      details: {
        originalEmailId: emailId,
        sourceFolder: sourceFolder,
        subject: sourceEmail.subject
      },
      organization: req.user.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Event log
    await logEvent({
      action: 'move_to_archive',
      user: req.user._id,
      resource: 'Archived',
      resourceId: archivedEmail._id,
      details: {
        originalEmailId: emailId,
        sourceFolder: sourceFolder,
        subject: sourceEmail.subject
      },
      organization: req.user.organization
    });

    res.status(200).json({
      success: true,
      message: 'Email moved to archive successfully',
      archivedEmail
    });
  } catch (error) {
    console.error('Error moving email to archive:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move email to archive',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/archived/restore/{archivedEmailId}:
 *   post:
 *     summary: Restore email from archive to original folder
 *     tags: [Archived]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: archivedEmailId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID of the archived email to restore
 *     responses:
 *       200:
 *         description: Email restored successfully
 *       404:
 *         description: Archived email not found
 *       500:
 *         description: Server error
 */
// Restore email from archive
const restoreFromArchive = async (req, res) => {
  try {
    const { archivedEmailId } = req.params;

    const archivedEmail = await Archived.findOne({
      _id: archivedEmailId,
      organization: req.user.organization
    });

    if (!archivedEmail) {
      return res.status(404).json({
        success: false,
        message: 'Archived email not found'
      });
    }

    let restoredEmail = null;

    // Restore to appropriate folder based on originalFolder
    switch (archivedEmail.originalFolder) {
      case 'inbox':
        restoredEmail = new Inbox({
          sender: archivedEmail.sender,
          subject: archivedEmail.subject,
          body: archivedEmail.body,
          recipients: archivedEmail.recipients,
          cc: archivedEmail.cc,
          bcc: archivedEmail.bcc,
          attachments: archivedEmail.attachments,
          organization: archivedEmail.organization,
          user: archivedEmail.user,
          receiver: archivedEmail.receiver,
          status: 'unread',
          receivedAt: new Date()
        });
        break;
      case 'sent':
      case 'drafts':
        restoredEmail = new Email({
          recipient: archivedEmail.recipients[0] || 'Unknown',
          subject: archivedEmail.subject,
          body: archivedEmail.body,
          recipients: archivedEmail.recipients,
          cc: archivedEmail.cc,
          bcc: archivedEmail.bcc,
          attachments: archivedEmail.attachments,
          organization: archivedEmail.organization,
          createdBy: archivedEmail.user,
          receiver: archivedEmail.receiver,
          status: archivedEmail.originalFolder,
          sentAt: archivedEmail.originalFolder === 'sent' ? new Date() : undefined
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Cannot restore email from unknown folder'
        });
    }

    await restoredEmail.save();

    // Delete from archive
    await Archived.findByIdAndDelete(archivedEmailId);

    // Audit log
    await createAuditLog({
      action: 'Email Restored from Archive',
      user: req.user._id,
      resource: archivedEmail.originalFolder,
      resourceId: restoredEmail._id,
      details: {
        originalArchivedId: archivedEmailId,
        restoredTo: archivedEmail.originalFolder,
        subject: archivedEmail.subject
      },
      organization: req.user.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Event log
    await logEvent({
      action: 'restore_from_archive',
      user: req.user._id,
      resource: archivedEmail.originalFolder,
      resourceId: restoredEmail._id,
      details: {
        originalArchivedId: archivedEmailId,
        restoredTo: archivedEmail.originalFolder,
        subject: archivedEmail.subject
      },
      organization: req.user.organization
    });

    res.status(200).json({
      success: true,
      message: 'Email restored successfully',
      restoredEmail
    });
  } catch (error) {
    console.error('Error restoring email from archive:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore email from archive',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/archived/bulk-archive:
 *   post:
 *     summary: Move multiple emails to archive
 *     tags: [Archived]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailIds
 *               - sourceFolder
 *             properties:
 *               emailIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *                 description: Array of email IDs to archive
 *               sourceFolder:
 *                 type: string
 *                 enum: [inbox, sent, drafts]
 *                 description: Source folder of the emails
 *     responses:
 *       200:
 *         description: Emails moved to archive successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
// Bulk move emails to archive
const bulkMoveToArchive = async (req, res) => {
  try {
    const { emailIds, sourceFolder } = req.body;

    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email IDs array is required'
      });
    }

    if (!sourceFolder) {
      return res.status(400).json({
        success: false,
        message: 'Source folder is required'
      });
    }

    let sourceModel = null;
    switch (sourceFolder) {
      case 'inbox':
        sourceModel = Inbox;
        break;
      case 'sent':
      case 'drafts':
        sourceModel = Email;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid source folder'
        });
    }

    const archivedEmails = [];
    const errors = [];

    for (const emailId of emailIds) {
      try {
        let sourceEmail = null;

        if (sourceFolder === 'inbox') {
          sourceEmail = await Inbox.findOne({
            _id: emailId,
            organization: req.user.organization
          });
        } else {
          sourceEmail = await Email.findOne({
            _id: emailId,
            organization: req.user.organization,
            status: sourceFolder
          });
        }

        if (sourceEmail) {
          const archivedEmail = new Archived({
            sender: sourceEmail.sender || sourceEmail.from || 'Unknown',
            subject: sourceEmail.subject,
            body: sourceEmail.body || sourceEmail.html || sourceEmail.text,
            recipients: sourceEmail.recipients || [sourceEmail.recipient] || [],
            cc: sourceEmail.cc || [],
            bcc: sourceEmail.bcc || [],
            attachments: sourceEmail.attachments || [],
            organization: req.user.organization,
            user: req.user._id,
            receiver: sourceEmail.receiver,
            originalFolder: sourceFolder,
            archivedAt: new Date()
          });

          await archivedEmail.save();
          archivedEmails.push(archivedEmail);

          // Delete from source folder
          await sourceModel.findByIdAndDelete(emailId);
        } else {
          errors.push(`Email ${emailId} not found`);
        }
      } catch (error) {
        errors.push(`Error archiving email ${emailId}: ${error.message}`);
      }
    }

    // Event log
    await logEvent({
      action: 'bulk_move_to_archive',
      user: req.user._id,
      resource: 'Archived',
      resourceId: null,
      details: {
        emailCount: archivedEmails.length,
        sourceFolder: sourceFolder,
        errors: errors
      },
      organization: req.user.organization
    });

    res.status(200).json({
      success: true,
      message: `Successfully archived ${archivedEmails.length} emails`,
      archivedCount: archivedEmails.length,
      errors: errors
    });
  } catch (error) {
    console.error('Error in bulk archive:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk archive emails',
      error: error.message
    });
  }
};

module.exports = {
  createArchivedEmail,
  getArchivedEmails,
  getArchivedEmailById,
  updateArchivedEmail,
  deleteArchivedEmail,
  getArchivedEmailsByOrganization,
  moveToArchive,
  restoreFromArchive,
  bulkMoveToArchive
};
