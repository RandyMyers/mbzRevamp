const Campaign = require('../models/campaigns');
const Customer = require('../models/customers');
const Organization = require('../models/organization');
const EmailTemplate = require('../models/emailTemplate');  // Fixed typo
const Sender = require('../models/sender');
const CampaignLog = require('../models/campaignLogs');
const sendEmail = require('../helper/senderEmail');
const mongoose = require("mongoose");
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const EmailLogs = require('../models/emailLogs');
const logEvent = require('../helper/logEvent');

const dotenv = require('dotenv');
dotenv.config();

/**
 * @swagger
 * components:
 *   schemas:
 *     Campaign:
 *       type: object
 *       required:
 *         - name
 *         - subject
 *         - organization
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique campaign ID
 *         name:
 *           type: string
 *           description: Campaign name
 *         subject:
 *           type: string
 *           description: Email subject line
 *         body:
 *           type: string
 *           description: Email body content
 *         status:
 *           type: string
 *           enum: [draft, active, paused, completed, cancelled]
 *           description: Campaign status
 *         organization:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID
 *         emailTemplate:
 *           type: string
 *           format: ObjectId
 *           description: Email template ID
 *         trackingEnabled:
 *           type: boolean
 *           description: Whether email tracking is enabled
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *           description: When campaign should be sent
 *         sentAt:
 *           type: string
 *           format: date-time
 *           description: When campaign was sent
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Campaign creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Campaign last update timestamp
 */

/**
 * @swagger
 * /api/campaigns/create:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - subject
 *               - organization
 *             properties:
 *               name:
 *                 type: string
 *                 description: Campaign name
 *                 example: "Welcome Campaign"
 *               subject:
 *                 type: string
 *                 description: Email subject line
 *                 example: "Welcome to our platform!"
 *               body:
 *                 type: string
 *                 description: Email body content
 *                 example: "<h1>Welcome!</h1><p>Thank you for joining us.</p>"
 *               status:
 *                 type: string
 *                 enum: [draft, active, paused, completed, cancelled]
 *                 default: draft
 *                 description: Campaign status
 *               organization:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID
 *                 example: "507f1f77bcf86cd799439011"
 *               emailTemplate:
 *                 type: string
 *                 format: ObjectId
 *                 description: Email template ID
 *                 example: "507f1f77bcf86cd799439011"
 *               trackingEnabled:
 *                 type: boolean
 *                 default: false
 *                 description: Whether email tracking is enabled
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 description: When campaign should be sent
 *                 example: "2024-12-31T23:59:59.000Z"
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaignId:
 *                   type: string
 *                   format: ObjectId
 *                   example: "507f1f77bcf86cd799439011"
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error creating campaign: Validation failed"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */
// Create a new campaign
exports.createCampaign = async (req, res) => {
  try {
    const campaign = new Campaign(req.body);
    await campaign.save();
    await logEvent({
      action: 'create_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { name: campaign.name, subject: campaign.subject },
      organization: req.user.organization
    });
    res.status(201).json({ campaignId: campaign._id });
  } catch (error) {
    res.status(400).json({ error: 'Error creating campaign: ' + error.message });
  }
};

/**
 * @swagger
 * /api/campaigns/updateTemplate/{campaignId}:
 *   patch:
 *     summary: Update campaign with selected template
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *               - subject
 *               - body
 *             properties:
 *               templateId:
 *                 type: string
 *                 description: Template ID
 *                 example: "template123"
 *               subject:
 *                 type: string
 *                 description: Email subject line
 *                 example: "Updated Subject"
 *               body:
 *                 type: string
 *                 description: Email body content
 *                 example: "Updated email body content"
 *               trackingEnabled:
 *                 type: boolean
 *                 description: Whether email tracking is enabled
 *                 example: true
 *     responses:
 *       200:
 *         description: Campaign and template updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaign:
 *                   $ref: '#/components/schemas/Campaign'
 *                 template:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       format: ObjectId
 *                     template:
 *                       type: string
 *                     subject:
 *                       type: string
 *                     body:
 *                       type: string
 *                     trackingEnabled:
 *                       type: boolean
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Campaign not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error creating template or updating campaign"
 */
// Update campaign with selected template
exports.updateTemplate = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { templateId, subject, body, trackingEnabled } = req.body;

    console.log(req.body);

    // Step 1: Create a new template
    const newTemplate = new EmailTemplate({  // Fixed typo
      template: templateId,
      subject,
      body,
      trackingEnabled: trackingEnabled || false,
    });

    const savedTemplate = await newTemplate.save();

    // Step 2: Update the campaign with the newly created template
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { emailTemplate: savedTemplate._id }, // Link the new template to the campaign
      { new: true } // Return the updated document
    );

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await logEvent({
      action: 'update_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { before: oldCampaign, after: campaign },
      organization: req.user.organization
    });

    res.status(200).json({ campaign, template: savedTemplate });
  } catch (error) {
    console.error('Error creating template or updating campaign:', error);
    res.status(500).json({ error: 'Error creating template or updating campaign' });
  }
};

/**
 * @swagger
 * /api/campaigns/updateContacts/{campaignId}:
 *   patch:
 *     summary: Update campaign with selected contacts
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactIds
 *             properties:
 *               contactIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *                 description: Array of contact IDs to target
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     responses:
 *       200:
 *         description: Campaign contacts updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Campaign not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error updating campaign contacts"
 */
// Update campaign with selected contacts
exports.updateContacts = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { contactIds } = req.body;

    console.log(req.body);

    // Update the campaign with new contact IDs
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { targetContacts: contactIds },  // Update contacts in the targetContacts array
      { new: true } // Return the updated document
    );

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    await logEvent({
      action: 'update_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { before: oldCampaign, after: campaign },
      organization: req.user.organization
    });

    res.status(200).json(campaign);
  } catch (error) {
    console.error("Error updating campaign contacts:", error);
    res.status(500).json({ error: "Error updating campaign contacts" });
  }
};

/**
 * @swagger
 * /api/campaigns/updateSenderEmails/{campaignId}:
 *   patch:
 *     summary: Update campaign with selected sender emails
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderEmailIds
 *             properties:
 *               senderEmailIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ObjectId
 *                 description: Array of sender email IDs
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     responses:
 *       200:
 *         description: Campaign sender emails updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Campaign not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error updating sender emails"
 */
// Update campaign with selected sender emails
exports.updateSenderEmails = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { senderEmailIds } = req.body;

    console.log(req.body, req.params);

    // Update the campaign with the new sender emails
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { senderEmails: senderEmailIds },  // Set the sender emails field
      { new: true } // Return the updated document
    );

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    await logEvent({
      action: 'update_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { before: oldCampaign, after: campaign },
      organization: req.user.organization
    });

    res.status(200).json(campaign);
  } catch (error) {
    console.error("Error updating sender emails:", error);
    res.status(500).json({ error: "Error updating sender emails" });
  }
};

/**
 * @swagger
 * /api/campaigns/updateTargetCategories/{campaignId}:
 *   patch:
 *     summary: Update campaign with selected target categories
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetCategories
 *             properties:
 *               targetCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of target categories
 *                 example: ["electronics", "clothing", "books"]
 *     responses:
 *       200:
 *         description: Campaign target categories updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Campaign not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error updating target categories"
 */
// Update campaign with selected target categories
exports.updateTargetCategories = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { targetCategories } = req.body;

    // Update the campaign with the target categories
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { targetCategories },  // Set the target categories
      { new: true } // Return the updated document
    );

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    await logEvent({
      action: 'update_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { before: oldCampaign, after: campaign },
      organization: req.user.organization
    });

    res.status(200).json(campaign);
  } catch (error) {
    console.error("Error updating target categories:", error);
    res.status(500).json({ error: "Error updating target categories" });
  }
};

/**
 * @swagger
 * /api/campaigns/start/{campaignId}:
 *   post:
 *     summary: Start a campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Campaign ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Campaign started successfully
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
 *                   example: "Campaign started successfully"
 *                 campaign:
 *                   $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Bad request - Campaign cannot be started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Campaign cannot be started"
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Campaign not found"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */
exports.startCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId)
      .populate('senderEmails') 
      .populate('targetContacts') 
      .populate('emailTemplate');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    campaign.status = 'running';
    await campaign.save();

    console.log('All sender emails:', campaign.senderEmails);

    let activeSenderIndex = 0;

    for (const contact of campaign.targetContacts) {
      try {
        let activeSender = campaign.senderEmails[activeSenderIndex];

        while (activeSender && activeSender.emailsSentToday >= activeSender.maxDailyLimit) {
          activeSenderIndex++;
          activeSender = campaign.senderEmails[activeSenderIndex];
        }

        if (!activeSender) {
          console.log('No active sender available. Pausing the campaign...');
          campaign.status = 'paused';
          await campaign.save();
          return res.status(200).json({
            message: 'Campaign paused as all sender emails have reached their limits.',
            campaign,
          });
        }

        const personalizedSubject = replacePlaceholders(campaign.emailTemplate.subject, contact);
        let personalizedBody = replacePlaceholders(campaign.emailTemplate.body, contact);

        if (campaign.emailTemplate.trackingEnabled) {
          personalizedBody = injectTrackingIntoLinks(personalizedBody, campaign._id, contact._id);
        }

        const emailSent = await sendEmail({
            senderId: activeSender._id,
            campaign: campaign._id,
            createdBy: campaign.createdBy,
            organization: campaign.organization,
            emailTemplate: campaign.emailTemplate,
            to: contact.email,
            subject: personalizedSubject,
            html: personalizedBody,
          });
        
        campaign.sentCount += 1;

        // Check if email was sent successfully (backward compatibility)
        if (emailSent && emailSent.success) {
            campaign.deliveredCount += 1; // Assuming email is delivered successfully
        } else {
            campaign.bouncedCount += 1; // Increment bounced count if sending fails
        }

        // Note: sender daily count is now handled in the helper function
        // activeSender.emailsSentToday++; // This is now handled in sendEmail helper
        // await activeSender.save(); // This is now handled in sendEmail helper
      } catch (error) {
        console.error('Error sending email to contact:', contact.email, error);
      }
    }

    await logEvent({
      action: 'send_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { recipients: campaign.targetContacts.map(c => c.email) },
      organization: req.user.organization
    });

    res.status(200).json({ message: 'Campaign started successfully', campaign });
  } catch (error) {
    console.error('Error starting campaign:', error);
    res.status(400).json({ error: 'Error starting campaign' });
  }
};

/**
 * @swagger
 * /api/campaigns/updateStatus/{campaignId}:
 *   patch:
 *     summary: Update campaign status
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Campaign ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, active, paused, completed, cancelled]
 *                 description: New campaign status
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Campaign status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Bad request - Invalid status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid status"
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Campaign not found"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */
exports.updateStatus = async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
  
      campaign.status = req.body.status;
      await campaign.save();
      await logEvent({
        action: 'update_campaign',
        user: req.user._id,
        resource: 'Campaign',
        resourceId: campaign._id,
        details: { before: oldCampaign, after: campaign },
        organization: req.user.organization
      });
      res.status(200).json(campaign);
    } catch (error) {
      res.status(400).json({ error: 'Error updating campaign status: ' + error.message });
    }
  };
  
  
  
  // Route to track email opens
  exports.trackOpen = async (req, res) => {
    const { campaignId, customerId } = req.params;
  
    console.log(req.params);
  
    try {
      // Find the campaign
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
  
      // Find the contact by contactId in the Contact model
      const contact = await Customer.findById(customerId);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
  
      // Add the contact's ID to the campaign's contactsOpened array
      if (!campaign.contactsOpened.includes(contact._id)) {
        campaign.contactsOpened.push(contact._id);
      }
  
      // Optionally update the campaign's open count
      campaign.openCount = (campaign.openCount || 0) + 1;
  
      // Save the updated campaign
      await campaign.save();
  
      // --- NEW: Extract analytics info ---
      // Get IP address (handle proxies)
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
      const geo = geoip.lookup(ip) || {};
      const country = geo.country || 'Unknown';
  
      // Parse user agent
      const ua = req.headers['user-agent'] || '';
      const parser = new UAParser(ua);
      const deviceType = parser.getDevice().type || 'desktop';
      const client = parser.getBrowser().name || 'Unknown';
  
      // Log to EmailLogs (or CampaignLogs if you prefer)
      await EmailLogs.create({
        emailId: null, // If you have the emailId, set it here
        status: 'opened',
        deviceType,
        client,
        country,
        // Optionally add campaignId, customerId, timestamp, etc.
      });
  
      // Send the 1x1 pixel image (transparent GIF) for open tracking
      res.setHeader('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP8A//8AAAAAAwAAACwAAAAAAQABAAEAAAIBAAEAAQAAAOwAAAAAIAEAAQABAAAABwEAAQAAIAEAAEAAAwAAAAAAQABAAEAAAAABwAAA==', 'base64'));
    } catch (error) {
      console.error('Error tracking open event:', error);
      res.status(500).json({ error: 'Error tracking open event' });
    }
  };
  
  

/**
 * @swagger
 * /api/campaigns/metrics/total-campaigns/{organizationId}:
 *   get:
 *     summary: Get total campaigns count for organization
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Total campaigns count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       description: Total number of campaigns
 *                       example: 25
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
 *                 error:
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
 *                 error:
 *                   type: string
 *                   example: "Failed to count campaigns"
 */

/**
 * @swagger
 * /api/campaigns/metrics/active-campaigns/{organizationId}:
 *   get:
 *     summary: Get active campaigns count for organization
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Active campaigns count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       description: Number of active campaigns
 *                       example: 8
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
 *                 error:
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
 *                 error:
 *                   type: string
 *                   example: "Failed to count active campaigns"
 */

/**
 * @swagger
 * /api/campaigns/metrics/emails-sent/{organizationId}:
 *   get:
 *     summary: Get emails sent and delivered count for organization
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Emails sent metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     sent:
 *                       type: integer
 *                       description: Total emails sent
 *                       example: 1500
 *                     delivered:
 *                       type: integer
 *                       description: Total emails delivered
 *                       example: 1420
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
 *                 error:
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
 *                 error:
 *                   type: string
 *                   example: "Failed to calculate emails sent"
 */

/**
 * @swagger
 * /api/campaigns/metrics/open-rate/{organizationId}:
 *   get:
 *     summary: Get email open rate for organization
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Open rate metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     openRate:
 *                       type: number
 *                       description: Email open rate percentage
 *                       example: 23.5
 *                     totalOpened:
 *                       type: integer
 *                       description: Total emails opened
 *                       example: 334
 *                     totalDelivered:
 *                       type: integer
 *                       description: Total emails delivered
 *                       example: 1420
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
 *                 error:
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
 *                 error:
 *                   type: string
 *                   example: "Failed to calculate open rate"
 */

/**
 * @swagger
 * /api/campaigns/metrics/click-rate/{organizationId}:
 *   get:
 *     summary: Get email click rate for organization
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Click rate metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     clickRate:
 *                       type: number
 *                       description: Email click rate percentage
 *                       example: 5.2
 *                     totalClicked:
 *                       type: integer
 *                       description: Total emails clicked
 *                       example: 74
 *                     totalDelivered:
 *                       type: integer
 *                       description: Total emails delivered
 *                       example: 1420
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
 *                 error:
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
 *                 error:
 *                   type: string
 *                   example: "Failed to calculate click rate"
 */

// Marketing Stats Functions for Page Overview
exports.getTotalCampaigns = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const totalCampaigns = await Campaign.countDocuments({ 
      organization: new mongoose.Types.ObjectId(organizationId) 
    });

    res.json({
      success: true,
      data: { count: totalCampaigns }
    });
  } catch (error) {
    console.error('Total Campaigns Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to count campaigns"
    });
  }
};

exports.getActiveCampaigns = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const activeCampaigns = await Campaign.countDocuments({ 
      organization: new mongoose.Types.ObjectId(organizationId),
      status: { $in: ['running', 'scheduled'] }
    });

    res.json({
      success: true,
      data: { count: activeCampaigns }
    });
  } catch (error) {
    console.error('Active Campaigns Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to count active campaigns"
    });
  }
};

exports.getEmailsSent = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const pipeline = [
      {
        $match: {
          organization: new mongoose.Types.ObjectId(organizationId)
        }
      },
      {
        $group: {
          _id: null,
          totalSent: { $sum: "$sentCount" },
          totalDelivered: { $sum: "$deliveredCount" }
        }
      }
    ];

    const result = await Campaign.aggregate(pipeline);
    const emailsSent = result[0]?.totalSent || 0;
    const emailsDelivered = result[0]?.totalDelivered || 0;

    res.json({
      success: true,
      data: { 
        sent: emailsSent,
        delivered: emailsDelivered
      }
    });
  } catch (error) {
    console.error('Emails Sent Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate emails sent"
    });
  }
};

exports.getOpenRate = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const pipeline = [
      {
        $match: {
          organization: new mongoose.Types.ObjectId(organizationId)
        }
      },
      {
        $group: {
          _id: null,
          totalDelivered: { $sum: "$deliveredCount" },
          totalOpened: { $sum: { $size: "$contactsOpened" } }
        }
      }
    ];

    const result = await Campaign.aggregate(pipeline);
    const totalDelivered = result[0]?.totalDelivered || 0;
    const totalOpened = result[0]?.totalOpened || 0;
    
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;

    res.json({
      success: true,
      data: { 
        openRate: Math.round(openRate * 100) / 100,
        totalOpened,
        totalDelivered
      }
    });
  } catch (error) {
    console.error('Open Rate Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate open rate"
    });
  }
};

exports.getClickRate = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const pipeline = [
      {
        $match: {
          organization: new mongoose.Types.ObjectId(organizationId)
        }
      },
      {
        $group: {
          _id: null,
          totalDelivered: { $sum: "$deliveredCount" },
          totalClicked: { $sum: { $size: "$contactsClicked" } }
        }
      }
    ];

    const result = await Campaign.aggregate(pipeline);
    const totalDelivered = result[0]?.totalDelivered || 0;
    const totalClicked = result[0]?.totalClicked || 0;
    
    const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;

    res.json({
      success: true,
      data: { 
        clickRate: Math.round(clickRate * 100) / 100,
        totalClicked,
        totalDelivered
      }
    });
  } catch (error) {
    console.error('Click Rate Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate click rate"
    });
  }
};

// Helper function to replace placeholders in the template with actual data
const replacePlaceholders = (template, contact) => {
  console.log(template, contact);
  return template
    .replace('{{firstName}}', contact.firstName)
    .replace('{{lastName}}', contact.lastName)
    .replace('{{email}}', contact.email)
    .replace('{{country}}', contact.country || '') // Optional fallback for undefined values
    .replace('{{language}}', contact.language || 'en'); // Fallback to 'en' if no language is provided
};

const BASE_URL = process.env.BASE_URL;

// Helper function to inject tracking into all <a> tags in the email body
const injectTrackingIntoLinks = (htmlContent, campaignId, contactId) => {
  const trackingBaseUrl = `${BASE_URL}/track/click/${campaignId}/${contactId}`;

  // Use regex to find and replace <a href="..."> links
  return htmlContent.replace(/<a\s+href="([^"]+)"/g, (match, url) => {
    const encodedUrl = encodeURIComponent(url); // Encode the original URL
    return `<a href="${trackingBaseUrl}?redirect=${encodedUrl}"`;
  });
};

/**
 * @swagger
 * /api/campaigns/all:
 *   get:
 *     summary: Get all campaigns for an organization
 *     tags: [Campaigns]
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
 *     responses:
 *       200:
 *         description: Campaigns retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Campaign'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('emailTemplate')
      .populate('senderEmails')
      .populate('targetContacts');

    console.log(campaigns);
    
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching campaigns: ' + error.message });
  }
};

/**
 * @swagger
 * /api/campaigns/get/{campaignId}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Campaign ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Campaign retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Campaign not found"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId)
      .populate('emailTemplate')
      .populate('senderEmails')
      .populate('targetContacts');
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const targetContactsCount = campaign.targetContacts.length;

    res.status(200).json({
      campaign,
      targetContactsCount,
    });
  } catch (error) {
    res.status(400).json({ error: 'Error fetching campaign: ' + error.message });
  }
};

/**
 * @swagger
 * /api/campaigns/update/{campaignId}:
 *   patch:
 *     summary: Update campaign details
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Campaign ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Campaign name
 *                 example: "Updated Campaign Name"
 *               subject:
 *                 type: string
 *                 description: Email subject line
 *                 example: "Updated Subject"
 *               body:
 *                 type: string
 *                 description: Email body content
 *                 example: "<h1>Updated Content</h1>"
 *               status:
 *                 type: string
 *                 enum: [draft, active, paused, completed, cancelled]
 *                 description: Campaign status
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Campaign not found"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.campaignId, req.body, { new: true });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    await logEvent({
      action: 'update_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { before: oldCampaign, after: campaign },
      organization: req.user.organization
    });
    res.status(200).json(campaign);
  } catch (error) {
    res.status(400).json({ error: 'Error updating campaign: ' + error.message });
  }
};

/**
 * @swagger
 * /api/campaigns/delete/{campaignId}:
 *   delete:
 *     summary: Delete campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Campaign ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Campaign deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Campaign deleted successfully"
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Campaign not found"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    await logEvent({
      action: 'delete_campaign',
      user: req.user._id,
      resource: 'Campaign',
      resourceId: campaign._id,
      details: { name: campaign.name },
      organization: req.user.organization
    });
    res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Error deleting campaign: ' + error.message });
  }
};

  
  
