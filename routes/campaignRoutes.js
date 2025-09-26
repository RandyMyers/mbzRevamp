const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignControllers');
const { protect } = require('../middleware/authMiddleware');

// CRUD routes
router.post('/create', protect, campaignController.createCampaign);
router.get('/all', protect, campaignController.getCampaigns);
router.get('/organization/:organizationId', protect, campaignController.getCampaignsByOrganization);
router.get('/get/:campaignId', protect, campaignController.getCampaignById);
router.patch('/update/:campaignId', protect, campaignController.updateCampaign);
router.delete('/delete/:campaignId', protect, campaignController.deleteCampaign);

// Specialized campaign updates
router.patch('/updateTemplate/:campaignId', protect, campaignController.updateTemplate);
router.patch('/updateContacts/:campaignId', protect, campaignController.updateContacts);
router.patch('/updateSenderEmails/:campaignId', protect, campaignController.updateSenderEmails);
router.patch('/updateTargetCategories/:campaignId', protect, campaignController.updateTargetCategories);
router.patch('/updateStatus/:campaignId', protect, campaignController.updateStatus);

// Start campaign
router.post('/start/:campaignId', protect, campaignController.startCampaign);

// Stats routes for page overview
router.get('/metrics/total-campaigns/:organizationId', protect, campaignController.getTotalCampaigns);
router.get('/metrics/active-campaigns/:organizationId', protect, campaignController.getActiveCampaigns);
router.get('/metrics/emails-sent/:organizationId', protect, campaignController.getEmailsSent);
router.get('/metrics/open-rate/:organizationId', protect, campaignController.getOpenRate);
router.get('/metrics/click-rate/:organizationId', protect, campaignController.getClickRate);

// Stats route for overview
//router.get('/stats/overview', campaignController.getCampaignStats);

// Tracking endpoints
router.get('/track/open/:campaignId/:customerId', protect, campaignController.trackOpen);
// router.get('/track/click/:campaignId/:contactId', protect, campaignController.trackClick); // Implement if needed

module.exports = router; 
