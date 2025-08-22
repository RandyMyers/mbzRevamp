const express = require('express');
const router = express.Router();

const { protect, restrictTo } = require('../middleware/authMiddleware');

// Controllers
const adminAffiliate = require('../controllers/adminAffiliateController');
const adminAnalytics = require('../controllers/adminAnalyticsController');
const adminAccounting = require('../controllers/adminAccountingController');
const adminBanking = require('../controllers/adminBankingController');
const adminReports = require('../controllers/adminReportsController');
const adminHR = require('../controllers/adminHRController');
const adminLeave = require('../controllers/adminLeaveController');
const adminRequests = require('../controllers/adminRequestsController');
const adminWeeklyReports = require('../controllers/adminWeeklyReportsController');
const adminTraining = require('../controllers/adminTrainingController');
const adminPerformance = require('../controllers/adminPerformanceController');
const adminSurveys = require('../controllers/adminSurveyController');
const adminDocuments = require('../controllers/adminDocumentsController');
const adminBilling = require('../controllers/adminBillingController');
const adminInvoices = require('../controllers/adminInvoicesController');
const adminAffiliateMgmt = require('../controllers/adminAffiliateMgmtController');
const adminStaff = require('../controllers/adminStaffController');
const adminSessions = require('../controllers/adminSessionsController');
const adminSystem = require('../controllers/adminSystemController');
const adminProjects = require('../controllers/adminProjectsController');
const adminMeetings = require('../controllers/adminMeetingsController');

// Guard all admin routes
router.use(protect);
router.use(restrictTo('super-admin', 'staff'));

// Admin Analytics
/**
 * @swagger
 * /api/admin/analytics/overview:
 *   get:
 *     summary: Get admin analytics overview
 *     description: Returns high-level analytics aggregates for Super Admin dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated dashboard data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/analytics/overview', adminAnalytics.getOverview);

// Admin Billing (Trials & Plans)
/**
 * @swagger
 * /api/admin/billing/trial/start:
 *   post:
 *     summary: Start a 14-day trial for a user/organization
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trial started
 */
router.post('/billing/trial/start', adminBilling.startTrial);
/**
 * @swagger
 * /api/admin/billing/trial/status:
 *   get:
 *     summary: Get current trial status
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trial status
 */
router.get('/billing/trial/status', adminBilling.getTrialStatus);
/**
 * @swagger
 * /api/admin/billing/trial/convert:
 *   post:
 *     summary: Convert trial to paid subscription
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trial converted
 */
router.post('/billing/trial/convert', adminBilling.convertTrial);
/**
 * @swagger
 * /api/admin/billing/plans:
 *   get:
 *     summary: List subscription plans
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plan list
 */
router.get('/billing/plans', adminBilling.listPlans);
/**
 * @swagger
 * /api/admin/billing/plans:
 *   post:
 *     summary: Create a subscription plan
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Plan created
 */
router.post('/billing/plans', adminBilling.createPlan);
/**
 * @swagger
 * /api/admin/billing/plans/{id}:
 *   patch:
 *     summary: Update a subscription plan
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Plan updated
 */
router.patch('/billing/plans/:id', adminBilling.updatePlan);
/**
 * @swagger
 * /api/admin/billing/plans/{id}:
 *   delete:
 *     summary: Delete a subscription plan
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Plan deleted
 */
router.delete('/billing/plans/:id', adminBilling.deletePlan);
/**
 * @swagger
 * /api/admin/billing/subscriptions/pending:
 *   get:
 *     summary: List pending subscription approvals
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending subscriptions
 */
router.get('/billing/subscriptions/pending', adminBilling.listPendingSubscriptions);
/**
 * @swagger
 * /api/admin/billing/subscriptions/{id}/approve:
 *   post:
 *     summary: Approve a pending subscription
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Subscription approved
 */
router.post('/billing/subscriptions/:id/approve', adminBilling.approveSubscription);
/**
 * @swagger
 * /api/admin/billing/subscriptions/{id}/reject:
 *   post:
 *     summary: Reject a pending subscription
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Subscription rejected
 */
router.post('/billing/subscriptions/:id/reject', adminBilling.rejectSubscription);

// Affiliate - Commission Rule Sets
/**
 * @swagger
 * /api/admin/affiliate/commission-rules:
 *   get:
 *     summary: List commission rule sets
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rule sets
 */
router.get('/affiliate/commission-rules', adminAffiliate.listCommissionRules);
/**
 * @swagger
 * /api/admin/affiliate/commission-rules:
 *   post:
 *     summary: Create a commission rule set
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Rule set created
 */
router.post('/affiliate/commission-rules', adminAffiliate.createCommissionRule);
/**
 * @swagger
 * /api/admin/affiliate/commission-rules/{id}:
 *   get:
 *     summary: Get a commission rule set
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rule set
 */
router.get('/affiliate/commission-rules/:id', adminAffiliate.getCommissionRule);
/**
 * @swagger
 * /api/admin/affiliate/commission-rules/{id}:
 *   patch:
 *     summary: Update a commission rule set
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rule set updated
 */
router.patch('/affiliate/commission-rules/:id', adminAffiliate.updateCommissionRule);
/**
 * @swagger
 * /api/admin/affiliate/commission-rules/{id}:
 *   delete:
 *     summary: Delete a commission rule set
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Rule set deleted
 */
router.delete('/affiliate/commission-rules/:id', adminAffiliate.deleteCommissionRule);

// Affiliate - Programs
/**
 * @swagger
 * /api/admin/affiliate/programs:
 *   get:
 *     summary: List affiliate programs
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Programs
 */
router.get('/affiliate/programs', adminAffiliate.listPrograms);
/**
 * @swagger
 * /api/admin/affiliate/programs:
 *   post:
 *     summary: Create an affiliate program
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Program created
 */
router.post('/affiliate/programs', adminAffiliate.createProgram);
router.get('/affiliate/programs/:id', adminAffiliate.getProgram);
router.patch('/affiliate/programs/:id', adminAffiliate.updateProgram);
router.delete('/affiliate/programs/:id', adminAffiliate.deleteProgram);

// Affiliate - Global Settings
/**
 * @swagger
 * /api/admin/affiliate/settings:
 *   get:
 *     summary: Get affiliate global settings
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings
 */
router.get('/affiliate/settings', adminAffiliate.getAffiliateSettings);
/**
 * @swagger
 * /api/admin/affiliate/settings:
 *   put:
 *     summary: Create or update affiliate global settings
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings upserted
 */
router.put('/affiliate/settings', adminAffiliate.upsertAffiliateSettings);

// Accounting - Chart of Accounts
router.get('/accounting/accounts', adminAccounting.listAccounts);
/**
 * @swagger
 * /api/admin/accounting/accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Account created
 */
router.post('/accounting/accounts', adminAccounting.createAccount);
/**
 * @swagger
 * /api/admin/accounting/accounts/{id}:
 *   patch:
 *     summary: Update an account
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account updated
 */
router.patch('/accounting/accounts/:id', adminAccounting.updateAccount);
/**
 * @swagger
 * /api/admin/accounting/accounts/{id}:
 *   delete:
 *     summary: Delete an account
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Account deleted
 */
router.delete('/accounting/accounts/:id', adminAccounting.deleteAccount);

// Accounting - Journal Entries
router.post('/accounting/journal-entries', adminAccounting.createJournalEntry);

// Accounting - Exchange Rates
router.get('/accounting/exchange-rates', adminAccounting.listExchangeRates);
/**
 * @swagger
 * /api/admin/accounting/exchange-rates:
 *   post:
 *     summary: Set or update today’s exchange rates
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exchange rate upserted
 */
router.post('/accounting/exchange-rates', adminAccounting.upsertExchangeRate);

// Banking - Accounts
router.get('/accounting/bank-accounts', adminBanking.listBankAccounts);
/**
 * @swagger
 * /api/admin/accounting/bank-accounts:
 *   post:
 *     summary: Create a bank account
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Bank account created
 */
router.post('/accounting/bank-accounts', adminBanking.createBankAccount);
router.patch('/accounting/bank-accounts/:id', adminBanking.updateBankAccount);
router.delete('/accounting/bank-accounts/:id', adminBanking.deleteBankAccount);

// Banking - Transactions
router.get('/accounting/bank-accounts/:id/transactions', adminBanking.listBankTransactions);
router.post('/accounting/bank-accounts/:id/transactions', adminBanking.createBankTransaction);

// Accounting - Reports
router.get('/accounting/reports/trial-balance', adminReports.getTrialBalance);
router.get('/accounting/reports/income-statement', adminReports.getIncomeStatement);
router.get('/accounting/reports/balance-sheet', adminReports.getBalanceSheet);
router.get('/accounting/reports/cash-flow', adminReports.getCashFlow);
router.get('/accounting/reports/subaccount', adminReports.getSubaccountReport);
router.post('/accounting/payroll/generate', adminAccounting.generatePayroll);

// Accounting - Invoices (Admin)
router.get('/accounting/invoices', adminInvoices.listInvoices);
router.post('/accounting/invoices/:id/mark-paid', adminInvoices.markInvoicePaid);

// Admin Affiliate Mgmt
router.get('/affiliate/affiliates', adminAffiliateMgmt.listAffiliates);
router.post('/affiliate/affiliates/:id/approve', adminAffiliateMgmt.approveAffiliate);
router.post('/affiliate/affiliates/:id/reject', adminAffiliateMgmt.rejectAffiliate);
router.get('/affiliate/payouts/pending', adminAffiliateMgmt.listPendingPayouts);
router.post('/affiliate/payouts/:id/process', adminAffiliateMgmt.processPayout);
router.post('/affiliate/payouts/:id/complete', adminAffiliateMgmt.completePayout);
router.post('/affiliate/payouts/:id/fail', adminAffiliateMgmt.failPayout);

// Admin Staff
/**
 * @swagger
 * /api/admin/staff/users:
 *   get:
 *     summary: List staff users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff users list
 */
router.get('/staff/users', adminStaff.listStaff);
/**
 * @swagger
 * /api/admin/staff/users/{id}/status:
 *   post:
 *     summary: Update staff user status (activate/suspend/deactivate)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.post('/staff/users/:id/status', adminStaff.updateStatus);
/**
 * @swagger
 * /api/admin/staff/users/{id}/set-password:
 *   post:
 *     summary: Set or reset staff password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password updated
 */
router.post('/staff/users/:id/set-password', adminStaff.setPassword);
/**
 * @swagger
 * /api/admin/staff/users/{id}/twofactor:
 *   post:
 *     summary: Enable or disable 2FA for a staff user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 2FA toggled
 */
router.post('/staff/users/:id/twofactor', adminStaff.toggleTwoFactor);

// Admin Sessions & System
/**
 * @swagger
 * /api/admin/sessions:
 *   get:
 *     summary: List active sessions
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sessions list
 */
router.get('/sessions', adminSessions.listSessions);
/**
 * @swagger
 * /api/admin/sessions/{id}/revoke:
 *   post:
 *     summary: Revoke an active session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session revoked
 */
router.post('/sessions/:id/revoke', adminSessions.revokeSession);
/**
 * @swagger
 * /api/admin/system/settings:
 *   get:
 *     summary: List system settings
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings list
 */
router.get('/system/settings', adminSystem.listSettings);
/**
 * @swagger
 * /api/admin/system/settings:
 *   post:
 *     summary: Create or update a system setting
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Setting upserted
 */
router.post('/system/settings', adminSystem.upsertSetting);
router.get('/tools/domains', adminSystem.listDomains);
router.get('/tools/ssl', adminSystem.listSsl);

// Admin Projects
/**
 * @swagger
 * /api/admin/projects:
 *   get:
 *     summary: List projects
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects list
 */
router.get('/projects', adminProjects.listProjects);
/**
 * @swagger
 * /api/admin/projects:
 *   post:
 *     summary: Create a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Project created
 */
router.post('/projects', adminProjects.createProject);
router.patch('/projects/:id', adminProjects.updateProject);
router.delete('/projects/:id', adminProjects.deleteProject);

// Admin Meetings
/**
 * @swagger
 * /api/admin/meetings:
 *   get:
 *     summary: List meetings
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Meetings list
 */
router.get('/meetings', adminMeetings.listMeetings);
/**
 * @swagger
 * /api/admin/meetings:
 *   post:
 *     summary: Create a meeting
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Meeting created
 */
router.post('/meetings', adminMeetings.createMeeting);
router.patch('/meetings/:id', adminMeetings.updateMeeting);
router.delete('/meetings/:id', adminMeetings.deleteMeeting);
router.get('/meetings/series/:seriesId', adminMeetings.getMeetingSeries);

// HR - Departments
/**
 * @swagger
 * /api/admin/hr/departments:
 *   get:
 *     summary: List departments
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Departments list
 */
router.get('/hr/departments', adminHR.listDepartments);
/**
 * @swagger
 * /api/admin/hr/departments:
 *   post:
 *     summary: Create a department
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Department created
 */
router.post('/hr/departments', adminHR.createDepartment);
router.patch('/hr/departments/:id', adminHR.updateDepartment);
router.delete('/hr/departments/:id', adminHR.deleteDepartment);

// HR - Employees
/**
 * @swagger
 * /api/admin/hr/employees:
 *   get:
 *     summary: List employees
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employees list
 */
router.get('/hr/employees', adminHR.listEmployees);
/**
 * @swagger
 * /api/admin/hr/employees:
 *   post:
 *     summary: Create an employee record
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Employee created
 */
router.post('/hr/employees', adminHR.createEmployee);
router.patch('/hr/employees/:id', adminHR.updateEmployee);
router.delete('/hr/employees/:id', adminHR.deleteEmployee);

// HR - Attendance
/**
 * @swagger
 * /api/admin/hr/attendance:
 *   get:
 *     summary: List daily attendance records
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance list
 */
router.get('/hr/attendance', adminHR.listAttendance);

// HR - Leave
/**
 * @swagger
 * /api/admin/hr/leave/categories:
 *   get:
 *     summary: List leave categories
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave categories
 */
router.get('/hr/leave/categories', adminLeave.listLeaveCategories);
/**
 * @swagger
 * /api/admin/hr/leave/categories:
 *   post:
 *     summary: Create a leave category
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Leave category created
 */
router.post('/hr/leave/categories', adminLeave.createLeaveCategory);
router.patch('/hr/leave/categories/:id', adminLeave.updateLeaveCategory);
router.delete('/hr/leave/categories/:id', adminLeave.deleteLeaveCategory);
/**
 * @swagger
 * /api/admin/hr/leave/balances:
 *   get:
 *     summary: List leave balances
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave balances list
 */
router.get('/hr/leave/balances', adminLeave.listLeaveBalances);
router.post('/hr/leave/balances', adminLeave.upsertLeaveBalance);
/**
 * @swagger
 * /api/admin/hr/leave/requests:
 *   get:
 *     summary: List leave requests
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave requests list
 */
router.get('/hr/leave/requests', adminLeave.listLeaveRequests);
router.post('/hr/leave/requests/:id/approve', adminLeave.approveLeaveRequest);
router.post('/hr/leave/requests/:id/reject', adminLeave.rejectLeaveRequest);

// HR - Requests
/**
 * @swagger
 * /api/admin/hr/requests:
 *   get:
 *     summary: List employee requests
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Requests list
 */
router.get('/hr/requests', (req, res, next) => adminRequests.listRequests(req, res, next));
router.get('/hr/requests/:id', (req, res, next) => adminRequests.getRequest(req, res, next));
router.post('/hr/requests/:id/approve', (req, res, next) => adminRequests.approveRequest(req, res, next));
router.post('/hr/requests/:id/reject', (req, res, next) => adminRequests.rejectRequest(req, res, next));

// HR - Weekly Reports
/**
 * @swagger
 * /api/admin/hr/weekly-reports:
 *   get:
 *     summary: List weekly reports
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly reports
 */
router.get('/hr/weekly-reports', adminWeeklyReports.listWeeklyReports);
router.post('/hr/weekly-reports/:id/review', adminWeeklyReports.reviewWeeklyReport);
router.get('/hr/weekly-reports/window', adminWeeklyReports.getWeeklyReportWindow);

// HR - Training
/**
 * @swagger
 * /api/admin/hr/trainings:
 *   get:
 *     summary: List trainings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trainings list
 */
router.get('/hr/trainings', adminTraining.listTrainings);
router.post('/hr/trainings', adminTraining.createTraining);
router.patch('/hr/trainings/:id', adminTraining.updateTraining);
router.delete('/hr/trainings/:id', adminTraining.deleteTraining);
router.post('/hr/trainings/:id/materials', adminTraining.addTrainingMaterial);
router.post('/hr/trainings/:id/enroll', adminTraining.enrollTraining);
router.post('/hr/trainings/:id/complete', adminTraining.completeTraining);

// HR - Performance Reviews
/**
 * @swagger
 * /api/admin/hr/performance-reviews:
 *   get:
 *     summary: List performance reviews
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reviews list
 */
router.get('/hr/performance-reviews', adminPerformance.listReviews);
router.post('/hr/performance-reviews', adminPerformance.createReview);
router.patch('/hr/performance-reviews/:id', adminPerformance.updateReview);
router.post('/hr/performance-reviews/:id/acknowledge', adminPerformance.acknowledgeReview);

// HR - Surveys
/**
 * @swagger
 * /api/admin/hr/surveys:
 *   get:
 *     summary: List staff surveys
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Surveys list
 */
router.get('/hr/surveys', adminSurveys.listSurveys);
router.post('/hr/surveys', adminSurveys.createSurvey);
router.patch('/hr/surveys/:id', adminSurveys.updateSurvey);
router.post('/hr/surveys/:id/publish', adminSurveys.publishSurvey);

// HR - Documents
/**
 * @swagger
 * /api/admin/hr/documents:
 *   get:
 *     summary: List HR documents
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents list
 */
router.get('/hr/documents', adminDocuments.listDocuments);
router.post('/hr/documents', adminDocuments.createDocument);
router.patch('/hr/documents/:id', adminDocuments.updateDocument);
router.delete('/hr/documents/:id', adminDocuments.deleteDocument);
router.post('/hr/documents/:id/assign', adminDocuments.assignDocument);

module.exports = router;


