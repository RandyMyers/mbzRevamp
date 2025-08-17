/**
 * @swagger
 * tags:
 *   - name: Website Progress
 *     description: Track website build progress
 *
 * /api/website/progress/{websiteId}:
 *   get:
 *     tags: [Website Progress]
 *     summary: Get website progress
 *     parameters:
 *       - in: path
 *         name: websiteId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Progress }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Website Progress]
 *     summary: Update current step
 *     parameters:
 *       - in: path
 *         name: websiteId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               step: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *
 * /api/website/progress/{websiteId}/notes:
 *   post:
 *     tags: [Website Progress]
 *     summary: Add a progress note
 *     parameters:
 *       - in: path
 *         name: websiteId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: string }
 *     responses:
 *       200: { description: Note added }
 *       404: { description: Not found }
 *
 * /api/website/progress/{websiteId}/notes/{noteId}:
 *   patch:
 *     tags: [Website Progress]
 *     summary: Update note status
 *     parameters:
 *       - in: path
 *         name: websiteId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolved: { type: boolean }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *
 * /api/website/progress/{websiteId}/assets:
 *   post:
 *     tags: [Website Progress]
 *     summary: Upload design asset record
 *     parameters:
 *       - in: path
 *         name: websiteId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string }
 *               url: { type: string }
 *               description: { type: string }
 *     responses:
 *       200: { description: Asset recorded }
 *       404: { description: Not found }
 *
 * /api/website/progress/{websiteId}/designers:
 *   post:
 *     tags: [Website Progress]
 *     summary: Assign a designer
 *     parameters:
 *       - in: path
 *         name: websiteId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               designerId: { type: string }
 *               role: { type: string }
 *     responses:
 *       200: { description: Assigned }
 *       404: { description: Not found }
 *
 * /api/website/progress/{websiteId}/milestones:
 *   post:
 *     tags: [Website Progress]
 *     summary: Add milestone
 *     parameters:
 *       - in: path
 *         name: websiteId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       200: { description: Added }
 *       404: { description: Not found }
 *
 * /api/website/progress/{websiteId}/milestones/{milestoneId}:
 *   patch:
 *     tags: [Website Progress]
 *     summary: Update milestone status
 *     parameters:
 *       - in: path
 *         name: websiteId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completed: { type: boolean }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *
 * /api/website/progress/{websiteId}/approvals:
 *   post:
 *     tags: [Website Progress]
 *     summary: Record approval
 *     parameters:
 *       - in: path
 *         name: websiteId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string }
 *               approved: { type: boolean }
 *               comments: { type: string }
 *     responses:
 *       200: { description: Recorded }
 *       404: { description: Not found }
 *
 * /api/website/progress/{websiteId}/versions:
 *   post:
 *     tags: [Website Progress]
 *     summary: Add version
 *     parameters:
 *       - in: path
 *         name: websiteId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               versionNumber: { type: string }
 *               changes: { type: string }
 *               snapshot: { type: string }
 *     responses:
 *       200: { description: Added }
 *       404: { description: Not found }
 *
 * /api/website/progress/{websiteId}/feedback:
 *   post:
 *     tags: [Website Progress]
 *     summary: Add feedback
 *     parameters:
 *       - in: path
 *         name: websiteId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string }
 *               text: { type: string }
 *     responses:
 *       200: { description: Submitted }
 *       404: { description: Not found }
 *
 * /api/website/progress/{websiteId}/feedback/{feedbackId}:
 *   patch:
 *     tags: [Website Progress]
 *     summary: Update feedback status
 *     parameters:
 *       - in: path
 *         name: websiteId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string }
 *               response: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 */
const WebsiteProgress = require('../models/websiteProgress');
const Website = require('../models/website');
const User = require('../models/users');


// Helper function to handle errors
const handleError = (res, error, status = 400) => {
    console.log(error);
    console.error(error);
    res.status(status).json({ 
      success: false, 
      message: error.message || 'An error occurred' 
    });
  };
  

// Get progress for a website
exports.getWebsiteProgress = async (req, res) => {
  try {
    const { websiteId } = req.params;
    console.log(websiteId);
    
    const progress = await WebsiteProgress.findOne({ website: websiteId })
      .populate('completedSteps.completedBy')
      .populate('notes.addedBy')
      .populate('assets.uploadedBy')
      .populate('assignedDesigners.designer')
      .populate('approvals.approvedBy')
      .populate('versions.createdBy')
      .populate('feedback.submittedBy')
      .populate('qaChecks.checkedBy');

    if (!progress) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress tracker not found' 
      });
    }

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    handleError(res, error);
  }
};

// Update current step
exports.updateCurrentStep = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { step } = req.body;
    const userId = req.user._id;

    const progress = await WebsiteProgress.findOne({ website: websiteId });
    if (!progress) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress tracker not found' 
      });
    }

    progress.currentStep = step;
    progress.completedSteps.push({
      step,
      completedAt: new Date(),
      completedBy: userId
    });

    await progress.save();

    res.status(200).json({ 
      success: true, 
      message: 'Step updated successfully',
      data: progress 
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Add a progress note
exports.addProgressNote = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const progress = await WebsiteProgress.findOne({ website: websiteId });
    if (!progress) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress tracker not found' 
      });
    }

    progress.notes.push({
      text,
      addedBy: userId
    });

    await progress.save();

    res.status(200).json({ 
      success: true, 
      message: 'Note added successfully',
      data: progress.notes 
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Update note resolution status
exports.updateNoteStatus = async (req, res) => {
  try {
    const { websiteId, noteId } = req.params;
    const { resolved } = req.body;

    const progress = await WebsiteProgress.findOne({ website: websiteId });
    if (!progress) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress tracker not found' 
      });
    }

    const note = progress.notes.id(noteId);
    if (!note) {
      return res.status(404).json({ 
        success: false, 
        message: 'Note not found' 
      });
    }

    note.resolved = resolved;
    await progress.save();

    res.status(200).json({ 
      success: true, 
      message: 'Note status updated',
      data: note 
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Upload design asset
exports.uploadDesignAsset = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { type, description, url } = req.body;
    const userId = req.user._id;

    const progress = await WebsiteProgress.findOne({ website: websiteId });
    if (!progress) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress tracker not found' 
      });
    }

    progress.assets.push({
      type,
      url,
      description,
      uploadedBy: userId
    });

    await progress.save();

    res.status(200).json({ 
      success: true, 
      message: 'Asset uploaded successfully',
      data: progress.assets 
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Assign designer to website
exports.assignDesigner = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { designerId, role } = req.body;

    const [progress, designer] = await Promise.all([
      WebsiteProgress.findOne({ website: websiteId }),
      User.findById(designerId)
    ]);

    if (!progress) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress tracker not found' 
      });
    }
    if (!designer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Designer not found' 
      });
    }

    // Check if designer is already assigned
    const existingAssignment = progress.assignedDesigners.find(
      assignment => assignment.designer.toString() === designerId
    );

    if (existingAssignment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Designer already assigned' 
      });
    }

    progress.assignedDesigners.push({
      designer: designerId,
      role
    });

    await progress.save();

    res.status(200).json({ 
      success: true, 
      message: 'Designer assigned successfully',
      data: progress.assignedDesigners 
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Add milestone
exports.addMilestone = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { name, description, dueDate } = req.body;

    const progress = await WebsiteProgress.findOne({ website: websiteId });
    if (!progress) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress tracker not found' 
      });
    }

    progress.milestones.push({
      name,
      description,
      dueDate
    });

    await progress.save();

    res.status(200).json({ 
      success: true, 
      message: 'Milestone added successfully',
      data: progress.milestones 
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Update milestone completion
exports.updateMilestoneStatus = async (req, res) => {
  try {
    const { websiteId, milestoneId } = req.params;
    const { completed } = req.body;

    const progress = await WebsiteProgress.findOne({ website: websiteId });
    if (!progress) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress tracker not found' 
      });
    }

    const milestone = progress.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ 
        success: false, 
        message: 'Milestone not found' 
      });
    }

    milestone.completed = completed;
    if (completed) {
      milestone.completedAt = new Date();
    } else {
      milestone.completedAt = null;
    }

    await progress.save();

    res.status(200).json({ 
      success: true, 
      message: 'Milestone status updated',
      data: milestone 
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Record approval
exports.recordApproval = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { type, approved, comments } = req.body;
    const userId = req.user._id;

    const progress = await WebsiteProgress.findOne({ website: websiteId });
    if (!progress) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress tracker not found' 
      });
    }

    progress.approvals.push({
      type,
      approved,
      approvedBy: userId,
      approvedAt: new Date(),
      comments
    });

    await progress.save();

    res.status(200).json({ 
      success: true, 
      message: 'Approval recorded',
      data: progress.approvals 
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Add version history
exports.addVersion = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { versionNumber, changes, snapshot } = req.body;
    const userId = req.user._id;

    const progress = await WebsiteProgress.findOne({ website: websiteId });
    if (!progress) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress tracker not found' 
      });
    }

    progress.versions.push({
      versionNumber,
      changes,
      snapshot,
      createdBy: userId
    });

    await progress.save();

    res.status(200).json({ 
      success: true, 
      message: 'Version added',
      data: progress.versions 
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Add client feedback
exports.addFeedback = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { type, text } = req.body;
    const userId = req.user._id;

    const progress = await WebsiteProgress.findOne({ website: websiteId });
    if (!progress) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress tracker not found' 
      });
    }

    progress.feedback.push({
      type,
      text,
      submittedBy: userId
    });

    await progress.save();

    res.status(200).json({ 
      success: true, 
      message: 'Feedback submitted',
      data: progress.feedback 
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Update feedback status
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { websiteId, feedbackId } = req.params;
    const { status, response } = req.body;

    const progress = await WebsiteProgress.findOne({ website: websiteId });
    if (!progress) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress tracker not found' 
      });
    }

    const feedback = progress.feedback.id(feedbackId);
    if (!feedback) {
      return res.status(404).json({ 
        success: false, 
        message: 'Feedback not found' 
      });
    }

    feedback.status = status;
    if (response) {
      feedback.response = response;
    }

    await progress.save();

    res.status(200).json({ 
      success: true, 
      message: 'Feedback status updated',
      data: feedback 
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Record QA check
exports.recordQACheck = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { checkType, passed, notes } = req.body;
    const userId = req.user._id;

    const progress = await WebsiteProgress.findOne({ website: websiteId });
    if (!progress) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress tracker not found' 
      });
    }

    progress.qaChecks.push({
      checkType,
      passed,
      notes,
      checkedBy: userId,
      checkedAt: new Date()
    });

    await progress.save();

    res.status(200).json({ 
      success: true, 
      message: 'QA check recorded',
      data: progress.qaChecks 
    });
  } catch (error) {
    handleError(res, error);
  }
};