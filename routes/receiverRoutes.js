const express = require("express");
const router = express.Router();
const receiverController = require("../controllers/receiverControllers"); // Adjust the path as necessary

// CREATE a new Receiver
router.post("/create", receiverController.createReceiver);

// GET all Receivers for a specific User
router.get("/user/:userId", receiverController.getReceiversByUser);

// GET a specific Receiver by ID
router.get("/:receiverId", receiverController.getReceiverById);

// UPDATE a Receiver by ID
router.patch("/update/:receiverId", receiverController.updateReceiver);

// DELETE a Receiver by ID
router.delete("/delete/:receiverId", receiverController.deleteReceiver);

// DEACTIVATE a Receiver by ID
router.patch("/:receiverId/deactivate", receiverController.deactivateReceiver);

// MANUAL TRIGGER: Check for new incoming emails for a specific receiver
router.post("/:receiverId/check-incoming", receiverController.triggerIncomingEmailCheck);

// MANUAL TRIGGER: Perform full email sync for a specific receiver
router.post("/:receiverId/full-sync", receiverController.triggerFullEmailSync);

// MANUAL TRIGGER: Custom email sync (incoming or full) for a specific receiver
router.post("/:receiverId/custom-sync", receiverController.triggerCustomEmailSync);

// LEGACY: Manual trigger for backward compatibility
router.post("/:receiverId/fetch-emails", receiverController.triggerEmailFetch);

module.exports = router;
