const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Receivers
 *     description: receivers operations
 */

const receiverController = require("../controllers/receiverControllers"); // Adjust the path as necessary
const { protect } = require("../middleware/authMiddleware");

// CREATE a new Receiver
router.post("/create", protect, receiverController.createReceiver);

// GET all Receivers for a specific User
router.get("/user/:userId", protect, receiverController.getReceiversByUser);

// GET all Receivers for a specific Organization
router.get("/organization/:organizationId", protect, receiverController.getReceiversByOrganization);

// GET a specific Receiver by ID
router.get("/:receiverId", protect, receiverController.getReceiverById);

// UPDATE a Receiver by ID
router.patch("/update/:receiverId", protect, receiverController.updateReceiver);

// DELETE a Receiver by ID
router.delete("/delete/:receiverId", protect, receiverController.deleteReceiver);

// DEACTIVATE a Receiver by ID
router.patch("/:receiverId/deactivate", protect, receiverController.deactivateReceiver);

// MANUAL TRIGGER: Check for new incoming emails for a specific receiver
router.post("/:receiverId/check-incoming", protect, receiverController.triggerIncomingEmailCheck);

// MANUAL TRIGGER: Perform full email sync for a specific receiver
router.post("/:receiverId/full-sync", protect, receiverController.triggerFullEmailSync);

// MANUAL TRIGGER: Custom email sync (incoming or full) for a specific receiver
router.post("/:receiverId/custom-sync", protect, receiverController.triggerCustomEmailSync);

// LEGACY: Manual trigger for backward compatibility
router.post("/:receiverId/fetch-emails", protect, receiverController.triggerEmailFetch);

module.exports = router;
