const express = require('express');
const router = express.Router();
const employeeSelfService = require('../controllers/employeeSelfServiceController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     EmployeeProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Employee ID
 *         employeeId:
 *           type: string
 *           description: Employee ID (e.g., Mb001Z)
 *         firstName:
 *           type: string
 *           description: Employee first name
 *         lastName:
 *           type: string
 *           description: Employee last name
 *         fullName:
 *           type: string
 *           description: Employee full name
 *         email:
 *           type: string
 *           format: email
 *           description: Employee email address
 *         phone:
 *           type: string
 *           description: Employee phone number
 *         department:
 *           type: object
 *           description: Department information
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *         jobTitle:
 *           type: string
 *           description: Employee job title
 *         startDate:
 *           type: string
 *           format: date
 *           description: Employment start date
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended, terminated]
 *           description: Employee status
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *           description: Employee gender
 *         maritalStatus:
 *           type: string
 *           enum: [Single, Married, Divorced, Widowed]
 *           description: Marital status
 *         avatar:
 *           type: string
 *           description: Employee avatar URL
 *         emergencyContact:
 *           type: object
 *           description: Emergency contact information
 *           properties:
 *             name:
 *               type: string
 *             relationship:
 *               type: string
 *             phone:
 *               type: string
 *             address:
 *               type: string
 *         bankDetails:
 *           type: object
 *           description: Bank details
 *           properties:
 *             bankName:
 *               type: string
 *             accountName:
 *               type: string
 *             accountNumber:
 *               type: string
 *             accountType:
 *               type: string
 *             taxId:
 *               type: string
 *             taxState:
 *               type: string
 *             pensionNumber:
 *               type: string
 *         country:
 *           type: string
 *           description: Employee country
 *         employmentType:
 *           type: string
 *           enum: [Permanent, Contract, Intern, Part-time, Temporary]
 *           description: Employment type
 *         salary:
 *           type: number
 *           description: Employee salary
 *         reportingManager:
 *           type: object
 *           description: Reporting manager information
 *           properties:
 *             _id:
 *               type: string
 *             fullName:
 *               type: string
 *             email:
 *               type: string
 *             employeeId:
 *               type: string
 *     
 *     LeaveRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Leave request ID
 *         employee:
 *           type: string
 *           description: Employee ID
 *         leaveType:
 *           type: string
 *           description: Type of leave
 *         startDate:
 *           type: string
 *           format: date
 *           description: Leave start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Leave end date
 *         reason:
 *           type: string
 *           description: Reason for leave
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           description: Leave request status
 *         emergencyContact:
 *           type: string
 *           description: Emergency contact during leave
 *         address:
 *           type: string
 *           description: Address during leave
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     Attendance:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Attendance record ID
 *         employee:
 *           type: string
 *           description: Employee ID
 *         checkIn:
 *           type: string
 *           format: date-time
 *           description: Check-in time
 *         checkOut:
 *           type: string
 *           format: date-time
 *           description: Check-out time
 *         date:
 *           type: string
 *           format: date
 *           description: Attendance date
 *         totalHours:
 *           type: number
 *           description: Total hours worked
 *         status:
 *           type: string
 *           enum: [present, absent, late, half-day]
 *           description: Attendance status
 *     
 *     EquipmentRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Equipment request ID
 *         employee:
 *           type: string
 *           description: Employee ID
 *         equipmentName:
 *           type: string
 *           description: Name of requested equipment
 *         justification:
 *           type: string
 *           description: Justification for request
 *         urgency:
 *           type: string
 *           enum: [Low, Medium, High]
 *           description: Request urgency level
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Approved, Rejected]
 *           description: Request status
 *         requestDate:
 *           type: string
 *           format: date
 *           description: Request date
 *         referenceFile:
 *           type: string
 *           description: Reference file URL
 *     
 *     ExpenseRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Expense request ID
 *         employee:
 *           type: string
 *           description: Employee ID
 *         expenseType:
 *           type: string
 *           description: Type of expense
 *         amount:
 *           type: number
 *           description: Expense amount
 *         description:
 *           type: string
 *           description: Expense description
 *         receipt:
 *           type: string
 *           description: Receipt file URL
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Approved, Rejected]
 *           description: Request status
 *         requestDate:
 *           type: string
 *           format: date
 *           description: Request date
 *     
 *     SalaryRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Salary request ID
 *         employee:
 *           type: string
 *           description: Employee ID
 *         requestType:
 *           type: string
 *           enum: [adjustment, advance]
 *           description: Type of salary request
 *         amount:
 *           type: number
 *           description: Requested amount
 *         reason:
 *           type: string
 *           description: Reason for request
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Approved, Rejected]
 *           description: Request status
 *         requestDate:
 *           type: string
 *           format: date
 *           description: Request date
 *     
 *     WeeklyReport:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Weekly report ID
 *         employee:
 *           type: string
 *           description: Employee ID
 *         weekStartDate:
 *           type: string
 *           format: date
 *           description: Week start date
 *         completedWork:
 *           type: string
 *           description: Completed work description
 *         challenges:
 *           type: string
 *           description: Challenges faced
 *         nextWeekGoals:
 *           type: string
 *           description: Next week goals
 *         status:
 *           type: string
 *           enum: [draft, submitted, reviewed]
 *           description: Report status
 *         reviewComments:
 *           type: string
 *           description: Manager review comments
 */

// Apply authentication middleware (employees can access their own data)
router.use(protect);

/**
 * @swagger
 * /api/employee/profile:
 *   get:
 *     summary: Get employee personal profile
 *     description: Retrieve the current employee's personal profile information
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EmployeeProfile'
 *                 message:
 *                   type: string
 *                   example: "Profile retrieved successfully"
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Employee not found"
 *                 message:
 *                   type: string
 *                   example: "No employee profile found for the current user"
 *   put:
 *     summary: Update employee personal profile
 *     description: Update the current employee's personal profile information (restricted fields)
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Employee phone number
 *                 example: "+1234567890"
 *               emergencyContact:
 *                 type: object
 *                 description: Emergency contact information
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Jane Doe"
 *                   relationship:
 *                     type: string
 *                     example: "Spouse"
 *                   phone:
 *                     type: string
 *                     example: "+1234567891"
 *                   address:
 *                     type: string
 *                     example: "123 Main St, City, State 12345"
 *               bankDetails:
 *                 type: object
 *                 description: Bank details
 *                 properties:
 *                   bankName:
 *                     type: string
 *                     example: "Chase Bank"
 *                   accountName:
 *                     type: string
 *                     example: "John Doe"
 *                   accountNumber:
 *                     type: string
 *                     example: "1234567890"
 *                   accountType:
 *                     type: string
 *                     example: "Checking"
 *                   taxId:
 *                     type: string
 *                     example: "123-45-6789"
 *                   taxState:
 *                     type: string
 *                     example: "CA"
 *                   pensionNumber:
 *                     type: string
 *                     example: "PEN123456"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EmployeeProfile'
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */

// Employee self-service routes
router.get('/profile', employeeSelfService.getPersonalProfile);
router.put('/profile', employeeSelfService.updatePersonalProfile);

/**
 * @swagger
 * /api/employee/leave-requests:
 *   get:
 *     summary: Get employee leave requests
 *     description: Retrieve all leave requests for the current employee
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by leave request status
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *     responses:
 *       200:
 *         description: Leave requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaveRequest'
 *                 message:
 *                   type: string
 *                   example: "Leave requests retrieved successfully"
 *   post:
 *     summary: Submit leave request
 *     description: Submit a new leave request
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leaveType, startDate, endDate, reason]
 *             properties:
 *               leaveType:
 *                 type: string
 *                 description: Type of leave
 *                 example: "Annual Leave"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Leave start date
 *                 example: "2024-02-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Leave end date
 *                 example: "2024-02-05"
 *               reason:
 *                 type: string
 *                 description: Reason for leave
 *                 example: "Family vacation"
 *               emergencyContact:
 *                 type: string
 *                 description: Emergency contact during leave
 *                 example: "+1234567890"
 *               address:
 *                 type: string
 *                 description: Address during leave
 *                 example: "123 Vacation St, Beach City"
 *     responses:
 *       201:
 *         description: Leave request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LeaveRequest'
 *                 message:
 *                   type: string
 *                   example: "Leave request submitted successfully"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */

// Leave management
router.get('/leave-requests', employeeSelfService.getLeaveRequests);
router.post('/leave-requests', employeeSelfService.submitLeaveRequest);

/**
 * @swagger
 * /api/employee/leave-balance:
 *   get:
 *     summary: Get employee leave balance
 *     description: Retrieve the current employee's leave balance information
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     annualLeave:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 25
 *                         used:
 *                           type: number
 *                           example: 5
 *                         remaining:
 *                           type: number
 *                           example: 20
 *                     sickLeave:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 10
 *                         used:
 *                           type: number
 *                           example: 2
 *                         remaining:
 *                           type: number
 *                           example: 8
 *                 message:
 *                   type: string
 *                   example: "Leave balance retrieved successfully"
 */

router.get('/leave-balance', employeeSelfService.getLeaveBalance);

/**
 * @swagger
 * /api/employee/attendance/check-in:
 *   post:
 *     summary: Employee check-in
 *     description: Record employee check-in time and location
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: string
 *                 description: Check-in location
 *                 example: "Office - Main Building"
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *                 example: "Working from office today"
 *               latitude:
 *                 type: number
 *                 description: GPS latitude
 *                 example: 40.7128
 *               longitude:
 *                 type: number
 *                 description: GPS longitude
 *                 example: -74.0060
 *     responses:
 *       200:
 *         description: Check-in recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *                 message:
 *                   type: string
 *                   example: "Check-in recorded successfully"
 *       400:
 *         description: Bad request - already checked in or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/employee/attendance/check-out:
 *   post:
 *     summary: Employee check-out
 *     description: Record employee check-out time and notes
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Check-out notes
 *                 example: "Completed all tasks for the day"
 *               overtime:
 *                 type: number
 *                 description: Overtime hours worked
 *                 example: 1.5
 *     responses:
 *       200:
 *         description: Check-out recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *                 message:
 *                   type: string
 *                   example: "Check-out recorded successfully"
 *       400:
 *         description: Bad request - not checked in or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/employee/attendance/history:
 *   get:
 *     summary: Get attendance history
 *     description: Retrieve employee attendance history with filtering options
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *         example: "2024-01-31"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [present, absent, late, half-day]
 *         description: Filter by attendance status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Attendance history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Attendance'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     pages:
 *                       type: integer
 *                       example: 5
 *                 message:
 *                   type: string
 *                   example: "Attendance history retrieved successfully"
 */

// Attendance tracking
router.post('/attendance/check-in', employeeSelfService.checkIn);
router.post('/attendance/check-out', employeeSelfService.checkOut);

/**
 * @swagger
 * /api/employee/attendance/break-start:
 *   post:
 *     summary: Start break
 *     description: Record employee break start time
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Break notes
 *                 example: "Lunch break"
 *     responses:
 *       200:
 *         description: Break started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *                 message:
 *                   type: string
 *                   example: "Break started successfully"
 *       400:
 *         description: Bad request - not checked in or already on break
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.post('/attendance/break-start', employeeSelfService.startBreak);

/**
 * @swagger
 * /api/employee/attendance/break-end:
 *   post:
 *     summary: End break
 *     description: Record employee break end time
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Break end notes
 *                 example: "Back from lunch"
 *     responses:
 *       200:
 *         description: Break ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *                 message:
 *                   type: string
 *                   example: "Break ended successfully"
 *       400:
 *         description: Bad request - not on break
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.post('/attendance/break-end', employeeSelfService.endBreak);

router.get('/attendance/history', employeeSelfService.getAttendanceHistory);

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
