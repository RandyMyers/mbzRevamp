const express = require("express");
const router = express.Router();
const emailTemplateController = require("../controllers/emailTemplateControllers");
const { protect } = require('../middleware/authMiddleware');

router.post("/create", protect, emailTemplateController.createEmailTemplate);
router.get("/all", protect, emailTemplateController.getAllEmailTemplates);
router.get("/get/:emailTemplateId", protect, emailTemplateController.getEmailTemplateById);
router.patch("/update/:emailTemplateId", protect, emailTemplateController.updateEmailTemplate);
router.delete("/delete/:emailTemplateId", protect, emailTemplateController.deleteEmailTemplate);
router.get("/organization/:organizationId", protect, emailTemplateController.getEmailTemplatesByOrganization);

// New variable management routes
router.get("/variables", protect, emailTemplateController.getAvailableVariables);
router.post("/validate-variables", protect, emailTemplateController.validateTemplateVariables);


module.exports = router;