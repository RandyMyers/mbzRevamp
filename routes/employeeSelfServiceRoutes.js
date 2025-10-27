const express = require('express');
const router = express.Router();
const employeeSelfService = require('../controllers/employeeSelfServiceController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication middleware (employees can access their own data)
router.use(protect);

// Employee self-service routes
router.get('/profile', employeeSelfService.getPersonalProfile);
router.put('/profile', employeeSelfService.updatePersonalProfile);

// Leave management
router.get('/leave-requests', employeeSelfService.getLeaveRequests);
router.post('/leave-requests', employeeSelfService.submitLeaveRequest);
router.get('/leave-balance', employeeSelfService.getLeaveBalance);

// Payroll information
router.get('/payroll-info', employeeSelfService.getPayrollInfo);

// Training opportunities
router.get('/training-opportunities', employeeSelfService.getTrainingOpportunities);
router.post('/training-enroll', employeeSelfService.enrollInTraining);

// Performance goals
router.get('/performance-goals', employeeSelfService.getPerformanceGoals);

// Schedule
router.get('/schedule', employeeSelfService.getSchedule);

// Document management
router.get('/documents', employeeSelfService.getMyDocuments);
router.post('/documents/upload', employeeSelfService.uploadDocument);

// Attendance tracking
router.post('/attendance/check-in', employeeSelfService.checkIn);
router.post('/attendance/check-out', employeeSelfService.checkOut);
router.get('/attendance/history', employeeSelfService.getAttendanceHistory);

// Equipment requests
router.get('/equipment-requests', employeeSelfService.getEquipmentRequests);
router.post('/equipment-requests', employeeSelfService.submitEquipmentRequest);

// Expense requests
router.get('/expense-requests', employeeSelfService.getExpenseRequests);
router.post('/expense-requests', employeeSelfService.submitExpenseRequest);

// Salary requests
router.get('/salary-requests', employeeSelfService.getSalaryRequests);
router.post('/salary-requests', employeeSelfService.submitSalaryRequest);

// Weekly reports
router.get('/weekly-reports', employeeSelfService.getWeeklyReports);
router.post('/weekly-reports', employeeSelfService.submitWeeklyReport);

// Staff surveys
router.get('/surveys/available', employeeSelfService.getAvailableSurveys);
router.post('/surveys/:surveyId/submit', employeeSelfService.submitSurveyResponse);

// Settings
router.get('/settings', employeeSelfService.getSettings);
router.put('/settings', employeeSelfService.updateSettings);

module.exports = router;
