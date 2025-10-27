const Employee = require('../models/Employee');
const Department = require('../models/Department');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Offboarding
 *     description: Employee offboarding and exit process management
 */

// In-memory offboarding records (in production, this would be a database model)
let offboardingRecords = [];

/**
 * @swagger
 * /api/admin/offboarding/initiate:
 *   post:
 *     summary: Initiate offboarding process for employee
 *     tags: [Admin Offboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - reason
 *             properties:
 *               employeeId:
 *                 type: string
 *                 description: Employee ID
 *               reason:
 *                 type: string
 *                 enum: [resignation, termination, retirement, contract-end, other]
 *                 description: Reason for offboarding
 *               lastWorkingDay:
 *                 type: string
 *                 format: date
 *                 description: Last working day
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               initiatedBy:
 *                 type: string
 *                 description: Person who initiated the process
 *     responses:
 *       201:
 *         description: Offboarding process initiated successfully
 */
exports.initiateOffboarding = async (req, res, next) => {
  try {
    const { employeeId, reason, lastWorkingDay, notes, initiatedBy } = req.body;

    if (!employeeId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Employee ID and reason are required to initiate offboarding'
      });
    }

    // Validate ObjectId format
    if (!employeeId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID',
        message: 'The employee ID provided is not in the correct format'
      });
    }

    const validReasons = ['resignation', 'termination', 'retirement', 'contract-end', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reason',
        message: `Reason must be one of: ${validReasons.join(', ')}`
      });
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId)
      .populate('department', 'name');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: 'No employee found with the provided ID'
      });
    }

    // Check if offboarding already initiated
    const existingOffboarding = offboardingRecords.find(
      record => record.employeeId === employeeId && record.status !== 'completed'
    );
    
    if (existingOffboarding) {
      return res.status(409).json({
        success: false,
        error: 'Offboarding already initiated',
        message: 'Offboarding process has already been initiated for this employee'
      });
    }

    const offboardingRecord = {
      id: (offboardingRecords.length + 1).toString(),
      employeeId,
      employee: {
        fullName: employee.fullName,
        email: employee.email,
        employeeId: employee.employeeId,
        department: employee.department?.name || 'N/A'
      },
      reason,
      lastWorkingDay: lastWorkingDay ? new Date(lastWorkingDay) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: notes || '',
      initiatedBy: initiatedBy || req.user.id,
      initiatedAt: new Date(),
      status: 'initiated',
      tasks: [
        {
          id: '1',
          name: 'Collect Company Assets',
          description: 'Collect laptop, ID card, access cards, and other company assets',
          status: 'pending',
          assignedTo: 'hr-manager',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        },
        {
          id: '2',
          name: 'Conduct Exit Interview',
          description: 'Schedule and conduct exit interview with employee',
          status: 'pending',
          assignedTo: 'hr-manager',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        },
        {
          id: '3',
          name: 'Revoke System Access',
          description: 'Disable all system accounts and access permissions',
          status: 'pending',
          assignedTo: 'it-admin',
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 21 days
        },
        {
          id: '4',
          name: 'Process Final Payroll',
          description: 'Calculate and process final salary and benefits',
          status: 'pending',
          assignedTo: 'payroll-admin',
          dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000) // 28 days
        },
        {
          id: '5',
          name: 'Update Employee Records',
          description: 'Update employee status and archive records',
          status: 'pending',
          assignedTo: 'hr-manager',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      ],
      assets: [],
      exitInterview: null,
      finalPayroll: null,
      completedAt: null
    };

    offboardingRecords.push(offboardingRecord);

    // Update employee status
    employee.status = 'terminated';
    employee.terminationDate = offboardingRecord.lastWorkingDay;
    employee.terminationReason = reason;
    await employee.save();

    res.status(201).json({
      success: true,
      data: offboardingRecord,
      message: 'Offboarding process initiated successfully'
    });
  } catch (err) {
    console.error('Error initiating offboarding:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate offboarding',
      message: 'An error occurred while initiating the offboarding process. Please try again.'
    });
  }
};

/**
 * @swagger
 * /api/admin/offboarding/collect-assets:
 *   post:
 *     summary: Record collection of company assets
 *     tags: [Admin Offboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - offboardingId
 *               - assets
 *             properties:
 *               offboardingId:
 *                 type: string
 *                 description: Offboarding record ID
 *               assets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     serialNumber:
 *                       type: string
 *                     condition:
 *                       type: string
 *                       enum: [good, fair, poor, damaged]
 *                     notes:
 *                       type: string
 *     responses:
 *       200:
 *         description: Assets collected successfully
 */
exports.collectCompanyAssets = async (req, res, next) => {
  try {
    const { offboardingId, assets } = req.body;

    if (!offboardingId || !assets || !Array.isArray(assets)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Offboarding ID and assets array are required'
      });
    }

    const offboardingRecord = offboardingRecords.find(record => record.id === offboardingId);
    if (!offboardingRecord) {
      return res.status(404).json({
        success: false,
        error: 'Offboarding record not found',
        message: 'No offboarding record found with the provided ID'
      });
    }

    if (offboardingRecord.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Process completed',
        message: 'Cannot modify completed offboarding process'
      });
    }

    // Add collection timestamp and collector info
    const collectedAssets = assets.map(asset => ({
      ...asset,
      collectedAt: new Date(),
      collectedBy: req.user.id
    }));

    offboardingRecord.assets = collectedAssets;

    // Update task status
    const assetTask = offboardingRecord.tasks.find(task => task.id === '1');
    if (assetTask) {
      assetTask.status = 'completed';
      assetTask.completedAt = new Date();
      assetTask.completedBy = req.user.id;
    }

    res.status(200).json({
      success: true,
      data: {
        offboardingId: offboardingRecord.id,
        assets: collectedAssets,
        taskStatus: assetTask?.status || 'pending'
      },
      message: 'Assets collected successfully'
    });
  } catch (err) {
    console.error('Error collecting assets:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to collect assets',
      message: 'An error occurred while recording asset collection. Please try again.'
    });
  }
};

/**
 * @swagger
 * /api/admin/offboarding/exit-interview:
 *   post:
 *     summary: Conduct exit interview
 *     tags: [Admin Offboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - offboardingId
 *               - responses
 *             properties:
 *               offboardingId:
 *                 type: string
 *                 description: Offboarding record ID
 *               responses:
 *                 type: object
 *                 properties:
 *                   reasonForLeaving:
 *                     type: string
 *                   satisfactionRating:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 5
 *                   wouldRecommend:
 *                     type: boolean
 *                   feedback:
 *                     type: string
 *                   suggestions:
 *                     type: string
 *               conductedBy:
 *                 type: string
 *                 description: Person who conducted the interview
 *     responses:
 *       200:
 *         description: Exit interview completed successfully
 */
exports.conductExitInterview = async (req, res, next) => {
  try {
    const { offboardingId, responses, conductedBy } = req.body;

    if (!offboardingId || !responses) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Offboarding ID and responses are required'
      });
    }

    const offboardingRecord = offboardingRecords.find(record => record.id === offboardingId);
    if (!offboardingRecord) {
      return res.status(404).json({
        success: false,
        error: 'Offboarding record not found',
        message: 'No offboarding record found with the provided ID'
      });
    }

    if (offboardingRecord.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Process completed',
        message: 'Cannot modify completed offboarding process'
      });
    }

    const exitInterview = {
      conductedAt: new Date(),
      conductedBy: conductedBy || req.user.id,
      responses: {
        reasonForLeaving: responses.reasonForLeaving || '',
        satisfactionRating: responses.satisfactionRating || 0,
        wouldRecommend: responses.wouldRecommend || false,
        feedback: responses.feedback || '',
        suggestions: responses.suggestions || ''
      }
    };

    offboardingRecord.exitInterview = exitInterview;

    // Update task status
    const interviewTask = offboardingRecord.tasks.find(task => task.id === '2');
    if (interviewTask) {
      interviewTask.status = 'completed';
      interviewTask.completedAt = new Date();
      interviewTask.completedBy = req.user.id;
    }

    res.status(200).json({
      success: true,
      data: {
        offboardingId: offboardingRecord.id,
        exitInterview,
        taskStatus: interviewTask?.status || 'pending'
      },
      message: 'Exit interview completed successfully'
    });
  } catch (err) {
    console.error('Error conducting exit interview:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to conduct exit interview',
      message: `Failed to conduct the exit interview: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/offboarding/revoke-access:
 *   post:
 *     summary: Revoke employee system access
 *     tags: [Admin Offboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - offboardingId
 *               - systems
 *             properties:
 *               offboardingId:
 *                 type: string
 *                 description: Offboarding record ID
 *               systems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     systemName:
 *                       type: string
 *                     accessType:
 *                       type: string
 *                     revokedAt:
 *                       type: string
 *                       format: date-time
 *                     notes:
 *                       type: string
 *     responses:
 *       200:
 *         description: Access revoked successfully
 */
exports.revokeAccess = async (req, res, next) => {
  try {
    const { offboardingId, systems } = req.body;

    if (!offboardingId || !systems || !Array.isArray(systems)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Offboarding ID and systems array are required'
      });
    }

    const offboardingRecord = offboardingRecords.find(record => record.id === offboardingId);
    if (!offboardingRecord) {
      return res.status(404).json({
        success: false,
        error: 'Offboarding record not found',
        message: 'No offboarding record found with the provided ID'
      });
    }

    if (offboardingRecord.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Process completed',
        message: 'Cannot modify completed offboarding process'
      });
    }

    // Add revocation timestamp and revoker info
    const revokedSystems = systems.map(system => ({
      ...system,
      revokedAt: system.revokedAt ? new Date(system.revokedAt) : new Date(),
      revokedBy: req.user.id
    }));

    offboardingRecord.revokedSystems = revokedSystems;

    // Update task status
    const accessTask = offboardingRecord.tasks.find(task => task.id === '3');
    if (accessTask) {
      accessTask.status = 'completed';
      accessTask.completedAt = new Date();
      accessTask.completedBy = req.user.id;
    }

    res.status(200).json({
      success: true,
      data: {
        offboardingId: offboardingRecord.id,
        revokedSystems,
        taskStatus: accessTask?.status || 'pending'
      },
      message: 'System access revoked successfully'
    });
  } catch (err) {
    console.error('Error revoking access:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke access',
      message: `Failed to revoke system access: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/offboarding/final-payroll:
 *   post:
 *     summary: Process final payroll for offboarding employee
 *     tags: [Admin Offboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - offboardingId
 *               - finalSalary
 *             properties:
 *               offboardingId:
 *                 type: string
 *                 description: Offboarding record ID
 *               finalSalary:
 *                 type: number
 *                 description: Final salary amount
 *               bonuses:
 *                 type: number
 *                 description: Any bonuses or incentives
 *               deductions:
 *                 type: number
 *                 description: Any final deductions
 *               notes:
 *                 type: string
 *                 description: Payroll notes
 *     responses:
 *       200:
 *         description: Final payroll processed successfully
 */
exports.finalPayroll = async (req, res, next) => {
  try {
    const { offboardingId, finalSalary, bonuses = 0, deductions = 0, notes } = req.body;

    if (!offboardingId || finalSalary === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Offboarding ID and final salary are required'
      });
    }

    const offboardingRecord = offboardingRecords.find(record => record.id === offboardingId);
    if (!offboardingRecord) {
      return res.status(404).json({
        success: false,
        error: 'Offboarding record not found',
        message: 'No offboarding record found with the provided ID'
      });
    }

    if (offboardingRecord.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Process completed',
        message: 'Cannot modify completed offboarding process'
      });
    }

    const netPay = finalSalary + bonuses - deductions;

    const finalPayroll = {
      processedAt: new Date(),
      processedBy: req.user.id,
      finalSalary,
      bonuses,
      deductions,
      netPay,
      notes: notes || '',
      status: 'processed'
    };

    offboardingRecord.finalPayroll = finalPayroll;

    // Update task status
    const payrollTask = offboardingRecord.tasks.find(task => task.id === '4');
    if (payrollTask) {
      payrollTask.status = 'completed';
      payrollTask.completedAt = new Date();
      payrollTask.completedBy = req.user.id;
    }

    res.status(200).json({
      success: true,
      data: {
        offboardingId: offboardingRecord.id,
        finalPayroll,
        taskStatus: payrollTask?.status || 'pending'
      },
      message: 'Final payroll processed successfully'
    });
  } catch (err) {
    console.error('Error processing final payroll:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to process final payroll',
      message: `Failed to process the final payroll: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/offboarding/complete:
 *   post:
 *     summary: Complete offboarding process
 *     tags: [Admin Offboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - offboardingId
 *             properties:
 *               offboardingId:
 *                 type: string
 *                 description: Offboarding record ID
 *               completionNotes:
 *                 type: string
 *                 description: Final completion notes
 *     responses:
 *       200:
 *         description: Offboarding process completed successfully
 */
exports.completeOffboarding = async (req, res, next) => {
  try {
    const { offboardingId, completionNotes } = req.body;

    if (!offboardingId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Offboarding ID is required'
      });
    }

    const offboardingRecord = offboardingRecords.find(record => record.id === offboardingId);
    if (!offboardingRecord) {
      return res.status(404).json({
        success: false,
        error: 'Offboarding record not found',
        message: 'No offboarding record found with the provided ID'
      });
    }

    if (offboardingRecord.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Process already completed',
        message: 'Offboarding process has already been completed'
      });
    }

    // Check if all tasks are completed
    const incompleteTasks = offboardingRecord.tasks.filter(task => task.status !== 'completed');
    if (incompleteTasks.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Tasks incomplete',
        message: `Cannot complete offboarding. ${incompleteTasks.length} task(s) still pending: ${incompleteTasks.map(t => t.name).join(', ')}`
      });
    }

    offboardingRecord.status = 'completed';
    offboardingRecord.completedAt = new Date();
    offboardingRecord.completedBy = req.user.id;
    offboardingRecord.completionNotes = completionNotes || '';

    // Update final task status
    const finalTask = offboardingRecord.tasks.find(task => task.id === '5');
    if (finalTask) {
      finalTask.status = 'completed';
      finalTask.completedAt = new Date();
      finalTask.completedBy = req.user.id;
    }

    res.status(200).json({
      success: true,
      data: offboardingRecord,
      message: 'Offboarding process completed successfully'
    });
  } catch (err) {
    console.error('Error completing offboarding:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to complete offboarding',
      message: 'An error occurred while completing the offboarding process. Please try again.'
    });
  }
};

/**
 * @swagger
 * /api/admin/offboarding/records:
 *   get:
 *     summary: Get offboarding records
 *     tags: [Admin Offboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [initiated, in-progress, completed]
 *         description: Filter by status
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *         description: Filter by reason
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of records to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: Offboarding records retrieved successfully
 */
exports.getOffboardingRecords = async (req, res, next) => {
  try {
    const { status, reason, limit = 10, page = 1 } = req.query;

    let filteredRecords = offboardingRecords;

    if (status) {
      filteredRecords = filteredRecords.filter(record => record.status === status);
    }

    if (reason) {
      filteredRecords = filteredRecords.filter(record => record.reason === reason);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedRecords = filteredRecords
      .sort((a, b) => new Date(b.initiatedAt) - new Date(a.initiatedAt))
      .slice(skip, skip + parseInt(limit));

    const totalRecords = filteredRecords.length;
    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        records: paginatedRecords,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      },
      message: 'Offboarding records retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving offboarding records:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve offboarding records',
      message: `Failed to retrieve offboarding records: ${err.message}`
    });
  }
};


