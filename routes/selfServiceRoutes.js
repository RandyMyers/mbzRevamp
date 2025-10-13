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
router.post('/equipment-requests', authenticateToken, selfServiceControllers.createEquipmentRequest);
router.get('/equipment-requests', authenticateToken, selfServiceControllers.getEquipmentRequests);
router.get('/equipment-requests/:id', authenticateToken, selfServiceControllers.getEquipmentRequestById);
router.put('/equipment-requests/:id', authenticateToken, selfServiceControllers.updateEquipmentRequest);
router.delete('/equipment-requests/:id', authenticateToken, selfServiceControllers.cancelEquipmentRequest);

// Expense Reimbursement Routes
router.post('/expense-reimbursements', authenticateToken, selfServiceControllers.createExpenseReimbursement);
router.get('/expense-reimbursements', authenticateToken, selfServiceControllers.getExpenseReimbursements);
router.get('/expense-reimbursements/:id', authenticateToken, selfServiceControllers.getExpenseReimbursementById);
router.put('/expense-reimbursements/:id', authenticateToken, selfServiceControllers.updateExpenseReimbursement);
router.delete('/expense-reimbursements/:id', authenticateToken, selfServiceControllers.cancelExpenseReimbursement);

// Salary Request Routes
router.post('/salary-requests', authenticateToken, selfServiceControllers.createSalaryRequest);
router.get('/salary-requests', authenticateToken, selfServiceControllers.getSalaryRequests);
router.get('/salary-requests/:id', authenticateToken, selfServiceControllers.getSalaryRequestById);
router.put('/salary-requests/:id', authenticateToken, selfServiceControllers.updateSalaryRequest);
router.delete('/salary-requests/:id', authenticateToken, selfServiceControllers.cancelSalaryRequest);

module.exports = router;



