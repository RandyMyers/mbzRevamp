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
const mongoose = require('mongoose');

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

module.exports = {
  createArchivedEmail,
  getArchivedEmails,
  getArchivedEmailById,
  updateArchivedEmail,
  deleteArchivedEmail,
  getArchivedEmailsByOrganization
};
