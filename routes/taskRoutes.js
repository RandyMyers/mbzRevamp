const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Tasks
 *     description: tasks operations
 */

const taskController = require("../controllers/taskControllers");
const { protect } = require("../middleware/authMiddleware");

// CREATE a new task
router.post("/create", protect, taskController.createTask);

// GET all tasks for an organization
router.get("/organization/:organizationId", protect, taskController.getTasksByOrganization);

// GET task by ID
router.get("/get/:taskId", protect, taskController.getTaskById);

// UPDATE a task
router.patch("/update/:taskId", protect, taskController.updateTask);

// DELETE a task
router.delete("/delete/:taskId", protect, taskController.deleteTask); 

// Task status update (for drag and drop)
router.patch("/status/:taskId", protect, taskController.updateTaskStatus);

// Subtask routes
router.post("/subtasks/create/:taskId", protect, taskController.addSubtask);
router.patch("/:taskId/subtasks/update/:subtaskId", protect, taskController.updateSubtask);
router.delete("/:taskId/subtasks/delete/:subtaskId", protect, taskController.deleteSubtask);

// Comment routes
router.post("/:taskId/comments", protect, taskController.addComment);
router.patch("/:taskId/comments/:commentId", protect, taskController.updateComment);
router.delete("/:taskId/comments/:commentId", protect, taskController.deleteComment);

// Attachments
router.post('/:taskId/attachments', protect, taskController.uploadAttachment);

// User-specific tasks
router.get("/user/:userId", protect, taskController.getTasksByUserId);

// Task assignment routes
router.patch("/:taskId/assignments", protect, taskController.updateTaskAssignments);
router.get("/organization/:organizationId/available-users", protect, taskController.getAvailableUsersForAssignment);

module.exports = router;
