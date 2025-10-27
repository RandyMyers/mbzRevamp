const express = require('express');
const router = express.Router();
const adminPayroll = require('../controllers/adminPayrollController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication and authorization middleware
router.use(protect, restrictTo('super-admin', 'hr-manager', 'payroll-admin'));

// Payroll processing routes
router.post('/process', adminPayroll.processPayroll);
router.get('/reports', adminPayroll.generatePayrollReport);
router.get('/history', adminPayroll.payrollHistory);

// Employee salary management
router.put('/employees/:id/salary', adminPayroll.updateEmployeeSalary);

// Tax calculations
router.post('/calculate-taxes', adminPayroll.calculateTaxes);

// Payslip generation
router.get('/payslips/:payrollId', adminPayroll.generatePayslips);

module.exports = router;


