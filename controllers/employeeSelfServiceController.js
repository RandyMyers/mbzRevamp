const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const PerformanceReview = require('../models/PerformanceReview');
const Training = require('../models/Training');
const TrainingEnrollment = require('../models/TrainingEnrollment');
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const EquipmentRequest = require('../models/EquipmentRequest');
const ExpenseRequest = require('../models/ExpenseRequest');
const SalaryRequest = require('../models/SalaryRequest');
const WeeklyReport = require('../models/WeeklyReport');
const StaffSurvey = require('../models/StaffSurvey');
const HRFileUploadService = require('../services/hrFileUploadService');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Employee Self-Service
 *     description: Employee self-service portal features
 */

/**
 * @swagger
 * /api/employee/profile:
 *   get:
 *     summary: Get employee personal profile
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee profile retrieved successfully
 */
exports.getPersonalProfile = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;

    const employee = await Employee.findById(employeeId)
      .populate('department', 'name')
      .populate('reportingManager', 'fullName email employeeId')
      .select('-__v');

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: 'No employee profile found for the current user'
      });
    }

    res.status(200).json({
      success: true,
      data: employee,
      message: 'Profile retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving profile:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
      message: `Failed to retrieve your profile: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/profile:
 *   put:
 *     summary: Update employee personal profile
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               emergencyContact:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   relationship:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: string
 *               bankDetails:
 *                 type: object
 *                 properties:
 *                   bankName:
 *                     type: string
 *                   accountName:
 *                     type: string
 *                   accountNumber:
 *                     type: string
 *                   accountType:
 *                     type: string
 *                   taxId:
 *                     type: string
 *                   taxState:
 *                     type: string
 *                   pensionNumber:
 *                     type: string
 *               country:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
exports.updatePersonalProfile = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated by employee
    delete updateData.employeeId;
    delete updateData.salary;
    delete updateData.status;
    delete updateData.department;
    delete updateData.roleTitle;
    delete updateData.employmentType; // This should be managed by HR

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      updateData,
      { new: true, runValidators: true }
    ).populate('department', 'name');

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: 'No employee profile found for the current user'
      });
    }

    res.status(200).json({
      success: true,
      data: employee,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: `Failed to update your profile: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/leave-requests:
 *   get:
 *     summary: Get employee leave requests
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Filter by year
 *     responses:
 *       200:
 *         description: Leave requests retrieved successfully
 */
exports.getLeaveRequests = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { status, year } = req.query;

    let query = { employee: employeeId };
    if (status) query.status = status;
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      query.startDate = { $gte: startDate, $lte: endDate };
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate('leaveCategory', 'name')
      .populate('approvedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: leaveRequests,
      message: 'Leave requests retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving leave requests:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve leave requests',
      message: `Failed to retrieve your leave requests: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/leave-requests:
 *   post:
 *     summary: Submit new leave request
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leaveCategory
 *               - startDate
 *               - endDate
 *               - reason
 *             properties:
 *               leaveCategory:
 *                 type: string
 *                 description: Leave category ID
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *               emergencyContact:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Leave request submitted successfully
 */
exports.submitLeaveRequest = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { leaveCategory, startDate, endDate, reason, emergencyContact, address } = req.body;

    if (!leaveCategory || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Leave category, start date, end date, and reason are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dates',
        message: 'End date must be after start date'
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid start date',
        message: 'Start date cannot be in the past'
      });
    }

    // Check for overlapping requests
    const overlappingRequest = await LeaveRequest.findOne({
      employee: employeeId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlappingRequest) {
      return res.status(409).json({
        success: false,
        error: 'Overlapping request',
        message: 'You already have a leave request for this period'
      });
    }

    const leaveRequest = await LeaveRequest.create({
      employee: employeeId,
      leaveCategory,
      startDate: start,
      endDate: end,
      reason,
      emergencyContact,
      address,
      status: 'pending'
    });

    await leaveRequest.populate('leaveCategory', 'name');

    res.status(201).json({
      success: true,
      data: leaveRequest,
      message: 'Leave request submitted successfully'
    });
  } catch (err) {
    console.error('Error submitting leave request:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to submit leave request',
      message: `Failed to submit your leave request: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/leave-balance:
 *   get:
 *     summary: Get employee leave balance
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leave balance retrieved successfully
 */
exports.getLeaveBalance = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;

    const leaveBalance = await LeaveBalance.findOne({ employee: employeeId })
      .populate('leaveCategory', 'name');

    if (!leaveBalance) {
      return res.status(404).json({
        success: false,
        error: 'Leave balance not found',
        message: 'No leave balance found for your account'
      });
    }

    res.status(200).json({
      success: true,
      data: leaveBalance,
      message: 'Leave balance retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving leave balance:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve leave balance',
      message: `Failed to retrieve your leave balance: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/payroll-info:
 *   get:
 *     summary: Get employee payroll information
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Year to get payroll for
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *         description: Specific month (optional)
 *     responses:
 *       200:
 *         description: Payroll information retrieved successfully
 */
exports.getPayrollInfo = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { year, month } = req.query;

    let query = {};
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);

    const payrolls = await Payroll.find(query)
      .populate({
        path: 'items.employee',
        match: { _id: employeeId }
      });

    const employeePayrolls = payrolls
      .map(payroll => ({
        ...payroll.toObject(),
        items: payroll.items.filter(item => item.employee && item.employee._id.toString() === employeeId.toString())
      }))
      .filter(payroll => payroll.items.length > 0);

    if (employeePayrolls.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No payroll data found',
        message: 'No payroll information found for the specified period'
      });
    }

    res.status(200).json({
      success: true,
      data: employeePayrolls,
      message: 'Payroll information retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving payroll info:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payroll information',
      message: `Failed to retrieve your payroll information: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/training-opportunities:
 *   get:
 *     summary: Get available training opportunities
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by training category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, enrolled, completed]
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: Training opportunities retrieved successfully
 */
exports.getTrainingOpportunities = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { category, status } = req.query;

    let trainingQuery = { isActive: true };
    if (category) trainingQuery.category = category;

    const trainings = await Training.find(trainingQuery)
      .populate('instructor', 'fullName email')
      .select('-__v');

    // Get employee's training enrollments
    const enrollments = await TrainingEnrollment.find({ employeeId })
      .populate('trainingId', 'title category');

    let availableTrainings = trainings;

    if (status === 'enrolled') {
      availableTrainings = enrollments
        .filter(enrollment => enrollment.status === 'Enrolled' || enrollment.status === 'In Progress')
        .map(enrollment => enrollment.trainingId);
    } else if (status === 'completed') {
      availableTrainings = enrollments
        .filter(enrollment => enrollment.status === 'Completed')
        .map(enrollment => enrollment.trainingId);
    } else if (status === 'available') {
      const enrolledTrainingIds = enrollments.map(enrollment => enrollment.trainingId._id.toString());
      availableTrainings = trainings.filter(training => 
        !enrolledTrainingIds.includes(training._id.toString())
      );
    }

    res.status(200).json({
      success: true,
      data: {
        trainings: availableTrainings,
        enrollments: enrollments.map(enrollment => ({
          trainingId: enrollment.trainingId._id,
          title: enrollment.trainingId.title,
          status: enrollment.status,
          enrollmentDate: enrollment.enrollmentDate,
          completionDate: enrollment.completionDate
        }))
      },
      message: 'Training opportunities retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving training opportunities:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve training opportunities',
      message: `Failed to retrieve training opportunities: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/training-enroll:
 *   post:
 *     summary: Enroll in training
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trainingId
 *             properties:
 *               trainingId:
 *                 type: string
 *                 description: Training ID to enroll in
 *     responses:
 *       201:
 *         description: Training enrollment successful
 */
exports.enrollInTraining = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { trainingId } = req.body;

    if (!trainingId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Training ID is required'
      });
    }

    // Check if training exists and is active
    const training = await Training.findById(trainingId);
    if (!training || !training.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Training not found',
        message: 'The requested training is not available'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await TrainingEnrollment.findOne({
      trainingId,
      employeeId,
      status: { $in: ['Enrolled', 'In Progress'] }
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        error: 'Already enrolled',
        message: 'You are already enrolled in this training'
      });
    }

    const enrollment = await TrainingEnrollment.create({
      trainingId,
      employeeId,
      enrollmentDate: new Date(),
      status: 'Enrolled'
    });

    await enrollment.populate('trainingId', 'title category instructor');

    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Successfully enrolled in training'
    });
  } catch (err) {
    console.error('Error enrolling in training:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to enroll in training',
      message: `Failed to enroll in the training: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/performance-goals:
 *   get:
 *     summary: Get employee performance goals
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance goals retrieved successfully
 */
exports.getPerformanceGoals = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;

    const performanceReviews = await PerformanceReview.find({ employee: employeeId })
      .populate('reviewer', 'fullName email')
      .sort({ createdAt: -1 });

    const currentGoals = performanceReviews.length > 0 ? 
      performanceReviews[0].goals || [] : [];

    res.status(200).json({
      success: true,
      data: {
        currentGoals,
        recentReviews: performanceReviews.slice(0, 3),
        totalReviews: performanceReviews.length
      },
      message: 'Performance goals retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving performance goals:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance goals',
      message: `Failed to retrieve your performance goals: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/schedule:
 *   get:
 *     summary: Get employee schedule
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for schedule
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for schedule
 *     responses:
 *       200:
 *         description: Schedule retrieved successfully
 */
exports.getSchedule = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Get employee info
    const employee = await Employee.findById(employeeId)
      .populate('department', 'name')
      .select('fullName workSchedule department');

    // Get leave requests for the period
    const leaveRequests = await LeaveRequest.find({
      employee: employeeId,
      status: 'approved',
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    }).populate('leaveCategory', 'name');

    // Mock schedule data (in production, this would come from a scheduling system)
    const schedule = {
      employee: {
        fullName: employee.fullName,
        workSchedule: employee.workSchedule,
        department: employee.department?.name || 'N/A'
      },
      period: { start, end },
      workDays: generateWorkDays(start, end, employee.workSchedule),
      leaveDays: leaveRequests.map(leave => ({
        startDate: leave.startDate,
        endDate: leave.endDate,
        type: leave.leaveCategory?.name || 'Leave',
        reason: leave.reason
      })),
      holidays: [], // Would be populated from a holidays calendar
      upcomingEvents: [] // Would be populated from meetings, training, etc.
    };

    res.status(200).json({
      success: true,
      data: schedule,
      message: 'Schedule retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving schedule:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve schedule',
      message: `Failed to retrieve your schedule: ${err.message}`
    });
  }
};

// Helper function to generate work days
function generateWorkDays(startDate, endDate, workSchedule) {
  const workDays = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    
    // Check if it's a work day based on schedule
    let isWorkDay = false;
    switch (workSchedule) {
      case 'full-time':
        isWorkDay = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
        break;
      case 'part-time':
        isWorkDay = dayOfWeek >= 1 && dayOfWeek <= 3; // Monday to Wednesday
        break;
      case 'shift':
        isWorkDay = true; // All days for shift workers
        break;
      default:
        isWorkDay = dayOfWeek >= 1 && dayOfWeek <= 5;
    }
    
    if (isWorkDay) {
      workDays.push({
        date: new Date(current),
        type: 'work',
        hours: workSchedule === 'part-time' ? 6 : 8
      });
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return workDays;
}

// ==================== MY DOCUMENTS ====================

/**
 * @swagger
 * /api/employee/documents:
 *   get:
 *     summary: Get employee documents
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [personal, employment, training, performance, other]
 *         description: Filter by document category
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 */
exports.getMyDocuments = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { category } = req.query;

    // Get employee to access their documents
    const employee = await Employee.findById(employeeId)
      .populate('department', 'name')
      .select('documents fullName employeeId');

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: 'No employee profile found for the current user'
      });
    }

    let documents = employee.documents || [];
    
    if (category) {
      documents = documents.filter(doc => doc.category === category);
    }

    // Sort by upload date (newest first)
    documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.status(200).json({
      success: true,
      data: {
        documents,
        totalCount: documents.length,
        categories: [...new Set((employee.documents || []).map(doc => doc.category))]
      },
      message: 'Documents retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving documents:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve documents',
      message: `Failed to retrieve your documents: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/documents/upload:
 *   post:
 *     summary: Upload employee document
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - category
 *               - name
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *                 enum: [personal, employment, training, performance, other]
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { category, name, description } = req.body;

    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        message: 'Please select a file to upload'
      });
    }

    if (!category || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Category and name are required'
      });
    }

    // Upload file to Cloudinary
    let documentUrl;
    try {
      const uploadResult = await HRFileUploadService.uploadDocument(
        req.files.file, 
        category, 
        employeeId
      );
      documentUrl = uploadResult.url;
    } catch (uploadError) {
      return res.status(400).json({
        success: false,
        error: 'File upload failed',
        message: `Failed to upload file: ${uploadError.message}`
      });
    }

    // Add document to employee's documents array
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: 'No employee profile found for the current user'
      });
    }

    const newDocument = {
      name,
      category,
      description: description || '',
      url: documentUrl,
      uploadedAt: new Date(),
      uploadedBy: req.user.id
    };

    employee.documents = employee.documents || [];
    employee.documents.push(newDocument);
    await employee.save();

    res.status(201).json({
      success: true,
      data: newDocument,
      message: 'Document uploaded successfully'
    });
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
      message: `Failed to upload document: ${err.message}`
    });
  }
};

// ==================== ATTENDANCE TRACKING ====================

/**
 * @swagger
 * /api/employee/attendance/check-in:
 *   post:
 *     summary: Check in for work
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
 *               location:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Check-in successful
 */
exports.checkIn = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { location, notes, workLocation = 'office', latitude, longitude } = req.body;

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (existingAttendance && existingAttendance.checkInAt) {
      return res.status(409).json({
        success: false,
        error: 'Already checked in',
        message: 'You have already checked in today'
      });
    }

    const now = new Date();
    const checkInHour = now.getHours();
    const checkInMinute = now.getMinutes();
    
    // Determine if late (after 9:15 AM)
    let status = 'present';
    if (workLocation === 'remote') {
      status = 'remote';
    } else if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 15)) {
      status = 'late';
    }

    const attendanceData = {
      employee: employeeId,
      date: today,
      checkInAt: now,
      workLocation,
      location: location || '',
      latitude: latitude || null,
      longitude: longitude || null,
      notes: notes || '',
      status,
      breakDuration: 0,
      workHours: 0
    };

    let attendance;
    if (existingAttendance) {
      attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id,
        attendanceData,
        { new: true }
      );
    } else {
      attendance = await Attendance.create(attendanceData);
    }

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Check-in recorded successfully'
    });
  } catch (err) {
    console.error('Error recording check-in:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to record check-in',
      message: `Failed to record check-in: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/attendance/check-out:
 *   post:
 *     summary: Check out from work
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
 *     responses:
 *       200:
 *         description: Check-out successful
 */
exports.checkOut = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { notes, overtime = 0 } = req.body;

    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!attendance || !attendance.checkInAt) {
      return res.status(400).json({
        success: false,
        error: 'Not checked in',
        message: 'You must check in before checking out'
      });
    }

    if (attendance.checkOutAt) {
      return res.status(409).json({
        success: false,
        error: 'Already checked out',
        message: 'You have already checked out today'
      });
    }

    // End any active break
    if (attendance.breakStartAt && !attendance.breakEndAt) {
      const breakEndTime = new Date();
      const breakDuration = Math.round((breakEndTime - attendance.breakStartAt) / (1000 * 60)); // in minutes
      attendance.breakEndAt = breakEndTime;
      attendance.breakDuration += breakDuration;
      attendance.status = 'present'; // Change from 'on-break' to 'present'
    }

    const now = new Date();
    attendance.checkOutAt = now;
    
    // Calculate work hours (total time minus break duration)
    const totalMinutes = Math.round((now - attendance.checkInAt) / (1000 * 60));
    const workMinutes = totalMinutes - attendance.breakDuration;
    attendance.workHours = Math.round((workMinutes / 60) * 10) / 10; // Round to 1 decimal place
    
    // Determine if half-day (less than 4 hours)
    if (attendance.workHours < 4 && attendance.status === 'present') {
      attendance.status = 'half-day';
    }
    
    attendance.overtime = overtime;
    if (notes) attendance.notes += ` | Check-out: ${notes}`;
    
    await attendance.save();

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Check-out recorded successfully'
    });
  } catch (err) {
    console.error('Error recording check-out:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to record check-out',
      message: `Failed to record check-out: ${err.message}`
    });
  }
};

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
exports.startBreak = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { notes } = req.body;

    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!attendance || !attendance.checkInAt) {
      return res.status(400).json({
        success: false,
        error: 'Not checked in',
        message: 'You must check in before starting a break'
      });
    }

    if (attendance.checkOutAt) {
      return res.status(400).json({
        success: false,
        error: 'Already checked out',
        message: 'Cannot start break after checking out'
      });
    }

    if (attendance.breakStartAt && !attendance.breakEndAt) {
      return res.status(409).json({
        success: false,
        error: 'Already on break',
        message: 'You are already on a break'
      });
    }

    const now = new Date();
    attendance.breakStartAt = now;
    attendance.status = 'on-break';
    if (notes) attendance.notes += ` | Break start: ${notes}`;
    
    await attendance.save();

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Break started successfully'
    });
  } catch (err) {
    console.error('Error starting break:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to start break',
      message: `Failed to start break: ${err.message}`
    });
  }
};

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
exports.endBreak = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { notes } = req.body;

    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!attendance || !attendance.checkInAt) {
      return res.status(400).json({
        success: false,
        error: 'Not checked in',
        message: 'You must check in before ending a break'
      });
    }

    if (!attendance.breakStartAt || attendance.breakEndAt) {
      return res.status(400).json({
        success: false,
        error: 'Not on break',
        message: 'You are not currently on a break'
      });
    }

    const now = new Date();
    const breakDuration = Math.round((now - attendance.breakStartAt) / (1000 * 60)); // in minutes
    
    attendance.breakEndAt = now;
    attendance.breakDuration += breakDuration;
    attendance.status = 'present'; // Change from 'on-break' to 'present'
    
    if (notes) attendance.notes += ` | Break end: ${notes}`;
    
    await attendance.save();

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Break ended successfully'
    });
  } catch (err) {
    console.error('Error ending break:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to end break',
      message: `Failed to end break: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/attendance/history:
 *   get:
 *     summary: Get attendance history
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for attendance history
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for attendance history
 *     responses:
 *       200:
 *         description: Attendance history retrieved successfully
 */
exports.getAttendanceHistory = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { startDate, endDate } = req.query;

    let query = { employee: employeeId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(100); // Limit to last 100 records

    // Calculate summary statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(record => record.checkInAt).length;
    const totalHours = attendance.reduce((sum, record) => sum + (record.workHours || 0), 0);
    const totalBreakTime = attendance.reduce((sum, record) => sum + (record.breakDuration || 0), 0);
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

    res.status(200).json({
      success: true,
      data: {
        records: attendance,
        summary: {
          totalDays,
          presentDays,
          absentDays: totalDays - presentDays,
          totalHours: Math.round(totalHours * 100) / 100,
          totalBreakTime: Math.round(totalBreakTime),
          averageHours: Math.round(averageHours * 100) / 100
        }
      },
      message: 'Attendance history retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving attendance history:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve attendance history',
      message: `Failed to retrieve attendance history: ${err.message}`
    });
  }
};

// ==================== EQUIPMENT REQUESTS ====================

/**
 * @swagger
 * /api/employee/equipment-requests:
 *   get:
 *     summary: Get employee equipment requests
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Approved, Rejected, Issued, Returned, Overdue]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Equipment requests retrieved successfully
 */
exports.getEquipmentRequests = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { status } = req.query;

    let query = { employee: employeeId };
    if (status) query.status = status;

    const requests = await EquipmentRequest.find(query)
      .populate('approvedBy', 'fullName email')
      .sort({ requestDate: -1 });

    res.status(200).json({
      success: true,
      data: requests,
      message: 'Equipment requests retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving equipment requests:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve equipment requests',
      message: `Failed to retrieve equipment requests: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/equipment-requests:
 *   post:
 *     summary: Submit equipment request
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - equipmentType
 *               - equipmentName
 *               - description
 *             properties:
 *               equipmentType:
 *                 type: string
 *                 enum: [Laptop, Desktop, Monitor, Keyboard, Mouse, Headset, Phone, Tablet, Other]
 *               equipmentName:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High, Urgent]
 *                 default: Medium
 *               expectedReturnDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Equipment request submitted successfully
 */
exports.submitEquipmentRequest = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { equipmentType, equipmentName, description, priority = 'Medium', expectedReturnDate } = req.body;

    if (!equipmentType || !equipmentName || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Equipment type, name, and description are required'
      });
    }

    const requestData = {
      employee: employeeId,
      equipmentType,
      equipmentName,
      description,
      priority,
      requestDate: new Date()
    };

    if (expectedReturnDate) {
      requestData.expectedReturnDate = new Date(expectedReturnDate);
    }

    const request = await EquipmentRequest.create(requestData);

    res.status(201).json({
      success: true,
      data: request,
      message: 'Equipment request submitted successfully'
    });
  } catch (err) {
    console.error('Error submitting equipment request:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to submit equipment request',
      message: `Failed to submit equipment request: ${err.message}`
    });
  }
};

// ==================== EXPENSE REQUESTS ====================

/**
 * @swagger
 * /api/employee/expense-requests:
 *   get:
 *     summary: Get employee expense requests
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Submitted, Under Review, Approved, Rejected, Paid]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Expense requests retrieved successfully
 */
exports.getExpenseRequests = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { status } = req.query;

    let query = { employee: employeeId };
    if (status) query.status = status;

    const requests = await ExpenseRequest.find(query)
      .populate('reviewedBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .sort({ requestDate: -1 });

    res.status(200).json({
      success: true,
      data: requests,
      message: 'Expense requests retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving expense requests:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve expense requests',
      message: `Failed to retrieve expense requests: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/expense-requests:
 *   post:
 *     summary: Submit expense request
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - items
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - date
 *                     - description
 *                     - category
 *                     - amount
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     description:
 *                       type: string
 *                     category:
 *                       type: string
 *                       enum: [Travel, Meals, Transportation, Office Supplies, Training, Equipment, Other]
 *                     amount:
 *                       type: number
 *                       minimum: 0
 *                     currency:
 *                       type: string
 *                       default: USD
 *     responses:
 *       201:
 *         description: Expense request submitted successfully
 */
exports.submitExpenseRequest = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { title, description, items } = req.body;

    if (!title || !description || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Title, description, and at least one expense item are required'
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Total expense amount must be greater than 0'
      });
    }

    const requestData = {
      employee: employeeId,
      title,
      description,
      totalAmount,
      currency: items[0]?.currency || 'USD',
      items: items.map(item => ({
        ...item,
        date: new Date(item.date),
        amount: parseFloat(item.amount)
      })),
      requestDate: new Date(),
      status: 'Draft'
    };

    const request = await ExpenseRequest.create(requestData);

    res.status(201).json({
      success: true,
      data: request,
      message: 'Expense request created successfully'
    });
  } catch (err) {
    console.error('Error submitting expense request:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to submit expense request',
      message: `Failed to submit expense request: ${err.message}`
    });
  }
};

// ==================== SALARY REQUESTS ====================

/**
 * @swagger
 * /api/employee/salary-requests:
 *   get:
 *     summary: Get employee salary requests
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: requestType
 *         schema:
 *           type: string
 *           enum: [Adjustment, Advance]
 *         description: Filter by request type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Submitted, Under Review, Approved, Rejected, Processed]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Salary requests retrieved successfully
 */
exports.getSalaryRequests = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { requestType, status } = req.query;

    let query = { employee: employeeId };
    if (requestType) query.requestType = requestType;
    if (status) query.status = status;

    const requests = await SalaryRequest.find(query)
      .populate('reviewedBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .sort({ requestDate: -1 });

    res.status(200).json({
      success: true,
      data: requests,
      message: 'Salary requests retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving salary requests:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve salary requests',
      message: `Failed to retrieve salary requests: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/salary-requests:
 *   post:
 *     summary: Submit salary request
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestType
 *               - title
 *               - description
 *               - currentSalary
 *               - requestedAmount
 *               - justification
 *             properties:
 *               requestType:
 *                 type: string
 *                 enum: [Adjustment, Advance]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               currentSalary:
 *                 type: number
 *                 minimum: 0
 *               requestedAmount:
 *                 type: number
 *                 minimum: 0
 *               justification:
 *                 type: string
 *               currency:
 *                 type: string
 *                 default: USD
 *               repaymentPlan:
 *                 type: object
 *                 properties:
 *                   installments:
 *                     type: number
 *                     default: 1
 *                   monthlyAmount:
 *                     type: number
 *                   startDate:
 *                     type: string
 *                     format: date
 *                   endDate:
 *                     type: string
 *                     format: date
 *     responses:
 *       201:
 *         description: Salary request submitted successfully
 */
exports.submitSalaryRequest = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { requestType, title, description, currentSalary, requestedAmount, justification, currency = 'USD', repaymentPlan } = req.body;

    if (!requestType || !title || !description || !currentSalary || !requestedAmount || !justification) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'All required fields must be provided'
      });
    }

    if (requestedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Requested amount must be greater than 0'
      });
    }

    const requestData = {
      employee: employeeId,
      requestType,
      title,
      description,
      currentSalary: parseFloat(currentSalary),
      requestedAmount: parseFloat(requestedAmount),
      currency,
      justification,
      requestDate: new Date(),
      status: 'Draft'
    };

    // Add repayment plan for salary advance requests
    if (requestType === 'Advance' && repaymentPlan) {
      requestData.repaymentPlan = {
        ...repaymentPlan,
        startDate: repaymentPlan.startDate ? new Date(repaymentPlan.startDate) : undefined,
        endDate: repaymentPlan.endDate ? new Date(repaymentPlan.endDate) : undefined
      };
    }

    const request = await SalaryRequest.create(requestData);

    res.status(201).json({
      success: true,
      data: request,
      message: 'Salary request created successfully'
    });
  } catch (err) {
    console.error('Error submitting salary request:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to submit salary request',
      message: `Failed to submit salary request: ${err.message}`
    });
  }
};

// ==================== WEEKLY REPORTS ====================

/**
 * @swagger
 * /api/employee/weekly-reports:
 *   get:
 *     summary: Get employee weekly reports
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Filter by year
 *       - in: query
 *         name: weekNumber
 *         schema:
 *           type: number
 *         description: Filter by week number
 *     responses:
 *       200:
 *         description: Weekly reports retrieved successfully
 */
exports.getWeeklyReports = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { year, weekNumber } = req.query;

    let query = { employee: employeeId };
    if (year) query.year = parseInt(year);
    if (weekNumber) query.weekNumber = parseInt(weekNumber);

    const reports = await WeeklyReport.find(query)
      .populate('reviewedBy', 'fullName email')
      .sort({ weekStartDate: -1 });

    res.status(200).json({
      success: true,
      data: reports,
      message: 'Weekly reports retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving weekly reports:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve weekly reports',
      message: `Failed to retrieve weekly reports: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/weekly-reports:
 *   post:
 *     summary: Submit weekly report
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - weekStartDate
 *               - weekEndDate
 *               - accomplishments
 *               - challenges
 *               - goalsForNextWeek
 *             properties:
 *               weekStartDate:
 *                 type: string
 *                 format: date
 *               weekEndDate:
 *                 type: string
 *                 format: date
 *               accomplishments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     task:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [Completed, In Progress, Pending]
 *                     hoursSpent:
 *                       type: number
 *               challenges:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     challenge:
 *                       type: string
 *                     description:
 *                       type: string
 *                     resolution:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [Resolved, In Progress, Escalated]
 *               goalsForNextWeek:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     goal:
 *                       type: string
 *                     priority:
 *                       type: string
 *                       enum: [High, Medium, Low]
 *               additionalNotes:
 *                 type: string
 *               totalHoursWorked:
 *                 type: number
 *     responses:
 *       201:
 *         description: Weekly report submitted successfully
 */
exports.submitWeeklyReport = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { weekStartDate, weekEndDate, accomplishments, challenges, goalsForNextWeek, additionalNotes, totalHoursWorked = 0 } = req.body;

    if (!weekStartDate || !weekEndDate || !accomplishments || !challenges || !goalsForNextWeek) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'All required fields must be provided'
      });
    }

    const startDate = new Date(weekStartDate);
    const endDate = new Date(weekEndDate);
    const year = startDate.getFullYear();
    
    // Calculate week number
    const weekNumber = getWeekNumber(startDate);

    // Check if report already exists for this week
    const existingReport = await WeeklyReport.findOne({
      employee: employeeId,
      year,
      weekNumber
    });

    if (existingReport) {
      return res.status(409).json({
        success: false,
        error: 'Report already exists',
        message: 'A weekly report for this week already exists'
      });
    }

    const reportData = {
      employee: employeeId,
      weekStartDate: startDate,
      weekEndDate: endDate,
      year,
      weekNumber,
      accomplishments: accomplishments.map(acc => ({
        ...acc,
        hoursSpent: acc.hoursSpent || 0
      })),
      challenges: challenges.map(challenge => ({
        ...challenge,
        status: challenge.status || 'In Progress'
      })),
      goalsForNextWeek: goalsForNextWeek.map(goal => ({
        ...goal,
        priority: goal.priority || 'Medium'
      })),
      additionalNotes: additionalNotes || '',
      totalHoursWorked: parseFloat(totalHoursWorked),
      status: 'Draft'
    };

    const report = await WeeklyReport.create(reportData);

    res.status(201).json({
      success: true,
      data: report,
      message: 'Weekly report created successfully'
    });
  } catch (err) {
    console.error('Error submitting weekly report:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to submit weekly report',
      message: `Failed to submit weekly report: ${err.message}`
    });
  }
};

// ==================== STAFF SURVEYS ====================

/**
 * @swagger
 * /api/employee/surveys/available:
 *   get:
 *     summary: Get available surveys for employee
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available surveys retrieved successfully
 */
exports.getAvailableSurveys = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const now = new Date();

    // Get employee info
    const employee = await Employee.findById(employeeId)
      .populate('department', 'name')
      .select('department');

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: 'No employee profile found for the current user'
      });
    }

    // Find surveys that are active and not expired
    let surveyQuery = {
      status: 'Active',
      endDate: { $gt: now }
    };

    // Check if employee is targeted by the survey
    const surveys = await StaffSurvey.find(surveyQuery)
      .populate('createdBy', 'fullName email')
      .populate('targetDepartments', 'name')
      .populate('selectedEmployees', 'fullName employeeId');

    const availableSurveys = surveys.filter(survey => {
      // Check if survey targets this employee
      if (survey.targetEmployees === 'All') return true;
      if (survey.targetEmployees === 'Department') {
        return survey.targetDepartments.some(dept => 
          dept._id.toString() === employee.department._id.toString()
        );
      }
      if (survey.targetEmployees === 'Selected') {
        return survey.selectedEmployees.some(emp => 
          emp._id.toString() === employeeId.toString()
        );
      }
      return false;
    });

    // Check which surveys the employee has already completed
    const completedSurveyIds = await StaffSurvey.find({
      _id: { $in: availableSurveys.map(s => s._id) },
      'responses.employee': employeeId
    }).select('_id');

    const completedIds = new Set(completedSurveyIds.map(s => s._id.toString()));

    const surveysWithStatus = availableSurveys.map(survey => ({
      ...survey.toObject(),
      isCompleted: completedIds.has(survey._id.toString()),
      progress: completedIds.has(survey._id.toString()) ? 100 : 0
    }));

    res.status(200).json({
      success: true,
      data: surveysWithStatus,
      message: 'Available surveys retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving available surveys:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve available surveys',
      message: `Failed to retrieve available surveys: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/surveys/{surveyId}/submit:
 *   post:
 *     summary: Submit survey response
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - responses
 *             properties:
 *               responses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - answer
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     answer:
 *                       type: string
 *     responses:
 *       200:
 *         description: Survey response submitted successfully
 */
exports.submitSurveyResponse = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { surveyId } = req.params;
    const { responses } = req.body;

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing responses',
        message: 'Survey responses are required'
      });
    }

    // Find the survey
    const survey = await StaffSurvey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found',
        message: 'The requested survey does not exist'
      });
    }

    // Check if survey is still active
    if (survey.status !== 'Active' || new Date() > survey.endDate) {
      return res.status(400).json({
        success: false,
        error: 'Survey not available',
        message: 'This survey is no longer available'
      });
    }

    // Check if already submitted (unless multiple submissions allowed)
    if (!survey.allowMultipleSubmissions) {
      const existingResponse = survey.responses.find(r => 
        r.employee.toString() === employeeId.toString()
      );
      
      if (existingResponse) {
        return res.status(409).json({
          success: false,
          error: 'Already submitted',
          message: 'You have already submitted a response for this survey'
        });
      }
    }

    // Validate responses against survey questions
    const questionIds = survey.questions.map(q => q._id.toString());
    const responseQuestionIds = responses.map(r => r.questionId);
    
    // Check if all required questions are answered
    const requiredQuestions = survey.questions.filter(q => q.required);
    const requiredQuestionIds = requiredQuestions.map(q => q._id.toString());
    const answeredRequiredQuestions = responses.filter(r => 
      requiredQuestionIds.includes(r.questionId)
    );

    if (answeredRequiredQuestions.length !== requiredQuestionIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Incomplete responses',
        message: 'All required questions must be answered'
      });
    }

    // Add responses to survey
    const surveyResponses = responses.map(response => ({
      employee: employeeId,
      questionId: response.questionId,
      answer: response.answer,
      submittedAt: new Date()
    }));

    survey.responses.push(...surveyResponses);
    survey.totalResponses = survey.responses.length;
    await survey.save();

    res.status(200).json({
      success: true,
      data: {
        surveyId: survey._id,
        responsesSubmitted: surveyResponses.length,
        totalQuestions: survey.questions.length
      },
      message: 'Survey response submitted successfully'
    });
  } catch (err) {
    console.error('Error submitting survey response:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to submit survey response',
      message: `Failed to submit survey response: ${err.message}`
    });
  }
};

// ==================== SETTINGS ====================

/**
 * @swagger
 * /api/employee/settings:
 *   get:
 *     summary: Get employee settings
 *     tags: [Employee Self-Service]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 */
exports.getSettings = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;

    const employee = await Employee.findById(employeeId)
      .select('preferences notifications settings');

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: 'No employee profile found for the current user'
      });
    }

    // Default settings if not set
    const settings = {
      notifications: {
        email: true,
        push: true,
        sms: false,
        leaveReminders: true,
        trainingReminders: true,
        performanceReviews: true,
        surveys: true
      },
      privacy: {
        showProfile: true,
        showContactInfo: true,
        showDepartment: true
      },
      preferences: {
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        theme: 'light'
      },
      ...employee.settings
    };

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Settings retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving settings:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve settings',
      message: `Failed to retrieve settings: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/employee/settings:
 *   put:
 *     summary: Update employee settings
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
 *               notifications:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                   push:
 *                     type: boolean
 *                   sms:
 *                     type: boolean
 *                   leaveReminders:
 *                     type: boolean
 *                   trainingReminders:
 *                     type: boolean
 *                   performanceReviews:
 *                     type: boolean
 *                   surveys:
 *                     type: boolean
 *               privacy:
 *                 type: object
 *                 properties:
 *                   showProfile:
 *                     type: boolean
 *                   showContactInfo:
 *                     type: boolean
 *                   showDepartment:
 *                     type: boolean
 *               preferences:
 *                 type: object
 *                 properties:
 *                   language:
 *                     type: string
 *                   timezone:
 *                     type: string
 *                   dateFormat:
 *                     type: string
 *                   theme:
 *                     type: string
 *                     enum: [light, dark, auto]
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId || req.user.id;
    const { notifications, privacy, preferences } = req.body;

    const updateData = {};
    if (notifications) updateData['settings.notifications'] = notifications;
    if (privacy) updateData['settings.privacy'] = privacy;
    if (preferences) updateData['settings.preferences'] = preferences;

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('settings');

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: 'No employee profile found for the current user'
      });
    }

    res.status(200).json({
      success: true,
      data: employee.settings,
      message: 'Settings updated successfully'
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
      message: `Failed to update settings: ${err.message}`
    });
  }
};

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
