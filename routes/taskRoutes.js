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
const { requirePlanFeature } = require("../middleware/permissionMiddleware");

// Apply plan feature check to all task routes
// Tasks are only available on Standard and Premium plans
router.use(protect, requirePlanFeature('tasks'));

// CREATE a new task

/**
 * @swagger
 * /api/tasks/create:
 *   post:
 *     summary: Create Create
 *     tags: [Tasks]
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
router.post("/create", taskController.createTask);

// GET all tasks for an organization

/**
 * @swagger
 * /api/tasks/organization/:organizationId:
 *   get:
 *     summary: Get Organization
 *     tags: [Tasks]
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
router.get("/organization/:organizationId", taskController.getTasksByOrganization);

// GET task by ID

/**
 * @swagger
 * /api/tasks/get/:taskId:
 *   get:
 *     summary: Get Get
 *     tags: [Tasks]
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
router.get("/get/:taskId", taskController.getTaskById);

// UPDATE a task

/**
 * @swagger
 * /api/tasks/update/:taskId:
 *   patch:
 *     summary: Update Update
 *     tags: [Tasks]
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
router.patch("/update/:taskId", taskController.updateTask);

// DELETE a task

/**
 * @swagger
 * /api/tasks/delete/:taskId:
 *   delete:
 *     summary: Delete Delete
 *     tags: [Tasks]
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
router.delete("/delete/:taskId", taskController.deleteTask); 

// Task status update (for drag and drop)

/**
 * @swagger
 * /api/tasks/status/:taskId:
 *   patch:
 *     summary: Update Status
 *     tags: [Tasks]
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
router.patch("/status/:taskId", taskController.updateTaskStatus);

// Subtask routes

/**
 * @swagger
 * /api/tasks/subtasks/create/:taskId:
 *   post:
 *     summary: Create Create
 *     tags: [Tasks]
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
router.post("/subtasks/create/:taskId", taskController.addSubtask);

/**
 * @swagger
 * /api/tasks/:taskId/subtasks/update/:subtaskId:
 *   patch:
 *     summary: Update Update
 *     tags: [Tasks]
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
router.patch("/:taskId/subtasks/update/:subtaskId", taskController.updateSubtask);

/**
 * @swagger
 * /api/tasks/:taskId/subtasks/delete/:subtaskId:
 *   delete:
 *     summary: Delete Delete
 *     tags: [Tasks]
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
router.delete("/:taskId/subtasks/delete/:subtaskId", taskController.deleteSubtask);

// Subtask assignment routes
router.patch("/:taskId/subtasks/:subtaskId/assign", taskController.assignSubtask);
router.patch("/:taskId/subtasks/:subtaskId/unassign", taskController.unassignSubtask);

// Comment routes

/**
 * @swagger
 * /api/tasks/:taskId/comments:
 *   post:
 *     summary: Create Comments
 *     tags: [Tasks]
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
router.post("/:taskId/comments", taskController.addComment);

/**
 * @swagger
 * /api/tasks/:taskId/comments/:commentId:
 *   patch:
 *     summary: Update Comments
 *     tags: [Tasks]
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
router.patch("/:taskId/comments/:commentId", taskController.updateComment);

/**
 * @swagger
 * /api/tasks/:taskId/comments/:commentId:
 *   delete:
 *     summary: Delete Comments
 *     tags: [Tasks]
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
router.delete("/:taskId/comments/:commentId", taskController.deleteComment);

// Attachments

/**
 * @swagger
 * /api/tasks/:taskId/attachments:
 *   post:
 *     summary: Create Attachments
 *     tags: [Tasks]
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
router.post('/:taskId/attachments', taskController.uploadAttachment);

// User-specific tasks

/**
 * @swagger
 * /api/tasks/user/:userId:
 *   get:
 *     summary: Get User
 *     tags: [Tasks]
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
router.get("/user/:userId", taskController.getTasksByUserId);

// Task assignment routes

/**
 * @swagger
 * /api/tasks/:taskId/assignments:
 *   patch:
 *     summary: Update Assignments
 *     tags: [Tasks]
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
router.patch("/:taskId/assignments", taskController.updateTaskAssignments);

/**
 * @swagger
 * /api/tasks/organization/:organizationId/available-users:
 *   get:
 *     summary: Get Available-users
 *     tags: [Tasks]
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
router.get("/organization/:organizationId/available-users", taskController.getAvailableUsersForAssignment);

module.exports = router;
