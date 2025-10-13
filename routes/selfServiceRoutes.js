const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Self Service
 *     description: self service operations
 */

const selfServiceControllers = require('../controllers/selfServiceControllers');
const { authenticateToken } = require('../middleware/authMiddleware');

// Equipment Request Routes

/**
 * @swagger
 * /api/self-service/equipment-requests:
 *   post:
 *     summary: Create Equipment-requests
 *     tags: [Self Service]
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
router.post('/equipment-requests', authenticateToken, selfServiceControllers.createEquipmentRequest);

/**
 * @swagger
 * /api/self-service/equipment-requests:
 *   get:
 *     summary: Get Equipment-requests
 *     tags: [Self Service]
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
router.get('/equipment-requests', authenticateToken, selfServiceControllers.getEquipmentRequests);

/**
 * @swagger
 * /api/self-service/equipment-requests/:id:
 *   get:
 *     summary: Get Equipment-requests
 *     tags: [Self Service]
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
router.get('/equipment-requests/:id', authenticateToken, selfServiceControllers.getEquipmentRequestById);

/**
 * @swagger
 * /api/self-service/equipment-requests/:id:
 *   put:
 *     summary: Update Equipment-requests
 *     tags: [Self Service]
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
router.put('/equipment-requests/:id', authenticateToken, selfServiceControllers.updateEquipmentRequest);

/**
 * @swagger
 * /api/self-service/equipment-requests/:id:
 *   delete:
 *     summary: Delete Equipment-requests
 *     tags: [Self Service]
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
router.delete('/equipment-requests/:id', authenticateToken, selfServiceControllers.cancelEquipmentRequest);

// Expense Reimbursement Routes

/**
 * @swagger
 * /api/self-service/expense-reimbursements:
 *   post:
 *     summary: Create Expense-reimbursements
 *     tags: [Self Service]
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
router.post('/expense-reimbursements', authenticateToken, selfServiceControllers.createExpenseReimbursement);

/**
 * @swagger
 * /api/self-service/expense-reimbursements:
 *   get:
 *     summary: Get Expense-reimbursements
 *     tags: [Self Service]
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
router.get('/expense-reimbursements', authenticateToken, selfServiceControllers.getExpenseReimbursements);

/**
 * @swagger
 * /api/self-service/expense-reimbursements/:id:
 *   get:
 *     summary: Get Expense-reimbursements
 *     tags: [Self Service]
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
router.get('/expense-reimbursements/:id', authenticateToken, selfServiceControllers.getExpenseReimbursementById);

/**
 * @swagger
 * /api/self-service/expense-reimbursements/:id:
 *   put:
 *     summary: Update Expense-reimbursements
 *     tags: [Self Service]
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
router.put('/expense-reimbursements/:id', authenticateToken, selfServiceControllers.updateExpenseReimbursement);

/**
 * @swagger
 * /api/self-service/expense-reimbursements/:id:
 *   delete:
 *     summary: Delete Expense-reimbursements
 *     tags: [Self Service]
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
router.delete('/expense-reimbursements/:id', authenticateToken, selfServiceControllers.cancelExpenseReimbursement);

// Salary Request Routes

/**
 * @swagger
 * /api/self-service/salary-requests:
 *   post:
 *     summary: Create Salary-requests
 *     tags: [Self Service]
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
router.post('/salary-requests', authenticateToken, selfServiceControllers.createSalaryRequest);

/**
 * @swagger
 * /api/self-service/salary-requests:
 *   get:
 *     summary: Get Salary-requests
 *     tags: [Self Service]
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
router.get('/salary-requests', authenticateToken, selfServiceControllers.getSalaryRequests);

/**
 * @swagger
 * /api/self-service/salary-requests/:id:
 *   get:
 *     summary: Get Salary-requests
 *     tags: [Self Service]
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
router.get('/salary-requests/:id', authenticateToken, selfServiceControllers.getSalaryRequestById);

/**
 * @swagger
 * /api/self-service/salary-requests/:id:
 *   put:
 *     summary: Update Salary-requests
 *     tags: [Self Service]
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
router.put('/salary-requests/:id', authenticateToken, selfServiceControllers.updateSalaryRequest);

/**
 * @swagger
 * /api/self-service/salary-requests/:id:
 *   delete:
 *     summary: Delete Salary-requests
 *     tags: [Self Service]
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
router.delete('/salary-requests/:id', authenticateToken, selfServiceControllers.cancelSalaryRequest);

module.exports = router;



