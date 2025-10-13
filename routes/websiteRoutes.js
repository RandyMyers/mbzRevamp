const express = require('express');
const router = express.Router();
const websiteController = require('../controllers/websiteControllers');


// Website creation and domain check
router.post('/create',  websiteController.createWebsite);
router.get('/check-domain', websiteController.checkDomain);

// Super admin routes (must come before /:id to avoid conflicts)
router.get('/all/:userId', websiteController.getAllWebsites);
router.get('/analytics/:userId', websiteController.getWebsiteAnalytics);

// Organization analytics (must come before /:id to avoid conflicts)
router.get('/analytics/organization/:organizationId', websiteController.getOrganizationWebsiteAnalytics);

// Organization websites (must come before /:id to avoid conflicts)
router.get('/organization/:organizationId', websiteController.getOrganizationWebsites);

// Step-by-step website configuration (must come before /:id to avoid conflicts)
router.patch('/basic-info/:id', websiteController.updateBasicInfo);
router.patch('/business-info/:id', websiteController.updateBusinessInfo);
router.patch('/colors/:id', websiteController.updateColors);
router.patch('/emails/:id', websiteController.updateEmails);

// Delete website (must come before /:id to avoid conflicts)
router.delete('/delete/:id', websiteController.deleteWebsite);

// Generic website CRUD operations (MUST be last due to /:id catching all)
router.get('/:id', websiteController.getWebsiteById);


module.exports = router;
