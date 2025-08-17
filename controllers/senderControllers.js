/**
 * @swagger
 * tags:
 *   - name: Senders
 *     description: Outbound email sender accounts
 *
 * /api/senders/create:
 *   post:
 *     tags: [Senders]
 *     summary: Create a sender
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationId, userId, name, email]
 *             properties:
 *               organizationId: { type: string }
 *               userId: { type: string }
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               smtpHost: { type: string }
 *               smtpPort: { type: integer }
 *               username: { type: string }
 *               password: { type: string }
 *               maxDailyLimit: { type: integer }
 *     responses:
 *       201: { description: Created }
 *       500: { description: Server error }
 *
 * /api/senders/user/{userId}:
 *   get:
 *     tags: [Senders]
 *     summary: Get senders by user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Senders list }
 *       500: { description: Server error }
 *
 * /api/senders/organization/{organizationId}:
 *   get:
 *     tags: [Senders]
 *     summary: Get senders by organization
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Senders list }
 *       500: { description: Server error }
 *
 * /api/senders/{senderId}:
 *   get:
 *     tags: [Senders]
 *     summary: Get sender by ID
 *     parameters:
 *       - in: path
 *         name: senderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Sender }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *   patch:
 *     tags: [Senders]
 *     summary: Update sender
 *     parameters:
 *       - in: path
 *         name: senderId
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
 *     tags: [Senders]
 *     summary: Delete sender
 *     parameters:
 *       - in: path
 *         name: senderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 *       500: { description: Server error }
 *
 * /api/senders/reset-limit/{senderId}:
 *   patch:
 *     tags: [Senders]
 *     summary: Reset daily email limit for a sender
 *     parameters:
 *       - in: path
 *         name: senderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Reset }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
const Sender = require("../models/sender"); // Import the Sender model
const Organization = require("../models/organization"); // If needed to check organization
const User = require("../models/users"); // If needed to check user

// CREATE a new sender
exports.createSender = async (req, res) => {
  try {
    const { organizationId, userId, name, email, smtpHost, smtpPort, username, password, maxDailyLimit } = req.body;
    console.log(req.body);

    const newSender = new Sender({
      organization: organizationId,
      userId,
      name,
      email,
      smtpHost,
      smtpPort,
      username,
      password,
      maxDailyLimit,
    });

    const savedSender = await newSender.save();
    res.status(201).json({ success: true, sender: savedSender });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create sender" });
  }
};

// GET all senders for a user
exports.getSendersByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const senders = await Sender.find({ userId })
      .populate('organization userId')
      .exec();
    res.status(200).json({ success: true, senders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve senders" });
  }
};

// GET a sender by ID
exports.getSenderById = async (req, res) => {
  const { senderId } = req.params;
  try {
    const sender = await Sender.findById(senderId)
      .populate('organization user')
      .exec();
    if (!sender) {
      return res.status(404).json({ success: false, message: "Sender not found" });
    }
    res.status(200).json({ success: true, sender });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve sender" });
  }
};

// GET all senders for a specific organization
exports.getSendersByOrganization = async (req, res) => {
    const { organizationId } = req.params;
    try {
      const senders = await Sender.find({ organization: organizationId })
        .populate('organization user')
        .exec();
      res.status(200).json({ success: true, senders });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to retrieve senders" });
    }
  };

// UPDATE a sender's details
exports.updateSender = async (req, res) => {
  const { senderId } = req.params;
  const { name, email, smtpHost, smtpPort, username, password, maxDailyLimit, isActive, organizationId, userId } = req.body;
  console.log(req.body);

  try {
    const updateFields = { name, email, smtpHost, smtpPort, username, password, maxDailyLimit, isActive, updatedAt: Date.now() };
    if (organizationId) updateFields.organization = organizationId;
    if (userId) updateFields.userId = userId;
    const updatedSender = await Sender.findByIdAndUpdate(
      senderId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedSender) {
      return res.status(404).json({ success: false, message: "Sender not found" });
    }

    res.status(200).json({ success: true, sender: updatedSender });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update sender" });
  }
};

// DELETE a sender
exports.deleteSender = async (req, res) => {
  const { senderId } = req.params;

  try {
    const deletedSender = await Sender.findByIdAndDelete(senderId);

    if (!deletedSender) {
      return res.status(404).json({ success: false, message: "Sender not found" });
    }

    res.status(200).json({ success: true, message: "Sender deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete sender" });
  }
};

// RESET the daily limit of emails sent
exports.resetDailyLimit = async (req, res) => {
  const { senderId } = req.params;

  try {
    const sender = await Sender.findById(senderId);

    if (!sender) {
      return res.status(404).json({ success: false, message: "Sender not found" });
    }

    await sender.resetDailyLimit();
    res.status(200).json({ success: true, message: "Daily email limit reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to reset daily email limit" });
  }
};
