const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Trash
 *     description: trash operations
 */

const { protect } = require("../middleware/authMiddleware");
const {
  moveToTrash,
  getTrashEmails,
  restoreFromTrash,
  deleteFromTrash
} = require("../controllers/trashControllers");

// Move email to trash

/**
 * @swagger
 * /api/trash/move:
 *   post:
 *     summary: Create Move
 *     tags: [Trash]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/move", protect, moveToTrash);

// Get all trash emails

/**
 * @swagger
 * /api/trash/:
 *   get:
 *     summary: Get Item
 *     tags: [Trash]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", protect, getTrashEmails);

// Restore email from trash

/**
 * @swagger
 * /api/trash/restore/:trashId:
 *   post:
 *     summary: Create Restore
 *     tags: [Trash]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/restore/:trashId", protect, restoreFromTrash);

// Permanently delete from trash

/**
 * @swagger
 * /api/trash/:trashId:
 *   delete:
 *     summary: Delete Item
 *     tags: [Trash]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete("/:trashId", protect, deleteFromTrash);

module.exports = router;  
