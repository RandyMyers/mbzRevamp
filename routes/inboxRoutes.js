const express = require("express");
const router = express.Router();
const inboxController = require("../controllers/inboxControllers");

router.post("/create", inboxController.createInboxEmail);
router.get("/all", inboxController.getAllInboxEmails); // Get all inbox emails for a specific user
router.get("/get/:inboxEmailId", inboxController.getInboxEmailById); // Get a specific inbox email by ID
router.patch("/update/:inboxEmailId", inboxController.updateInboxEmailStatus); // Update the status of an email
router.delete("/delete/:inboxEmailId", inboxController.deleteInboxEmail); // Delete a specific inbox email
router.get("/organization/:organizationId", inboxController.getInboxEmailsByOrganization);
router.delete("/organization/:organizationId", inboxController.deleteAllInboxEmailsByOrganization); // Delete all inbox emails by organization

module.exports = router;
