const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Training = require('../models/Training');
const TrainingEnrollment = require('../models/TrainingEnrollment');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Compliance
 *     description: HR compliance and regulatory management
 */

// In-memory compliance requirements (in production, this would be a database model)
const complianceRequirements = [
  {
    id: '1',
    name: 'Anti-Harassment Training',
    description: 'Mandatory anti-harassment and discrimination training',
    type: 'training',
    frequency: 'annual',
    dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    isActive: true,
    applicableRoles: ['all'],
    legalBasis: 'Employment Law Section 15.2',
    consequences: 'Disciplinary action and potential legal liability'
  },
  {
    id: '2',
    name: 'Data Protection Training',
    description: 'GDPR and data protection compliance training',
    type: 'training',
    frequency: 'annual',
    dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: true,
    applicableRoles: ['all'],
    legalBasis: 'GDPR Article 39',
    consequences: 'Data breach liability and regulatory fines'
  },
  {
    id: '3',
    name: 'Safety Certification',
    description: 'Workplace safety and emergency procedures certification',
    type: 'certification',
    frequency: 'biennial',
    dueDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years from now
    isActive: true,
    applicableRoles: ['all'],
    legalBasis: 'Occupational Safety Act 2020',
    consequences: 'Workplace safety violations and insurance issues'
  },
  {
    id: '4',
    name: 'Financial Compliance Training',
    description: 'Anti-money laundering and financial compliance training',
    type: 'training',
    frequency: 'annual',
    dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: true,
    applicableRoles: ['finance', 'accounting', 'management'],
    legalBasis: 'Financial Services Act 2019',
    consequences: 'Regulatory sanctions and financial penalties'
  }
];

// Employee compliance tracking (in production, this would be a database model)
let complianceTracking = [];

/**
 * @swagger
 * /api/admin/compliance/requirements:
 *   get:
 *     summary: List all compliance requirements
 *     tags: [Admin Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [training, certification, policy, other]
 *         description: Filter by requirement type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Compliance requirements retrieved successfully
 */
exports.trackComplianceRequirements = async (req, res, next) => {
  try {
    const { type, isActive } = req.query;
    
    let filteredRequirements = complianceRequirements;
    
    if (type) {
      filteredRequirements = filteredRequirements.filter(req => req.type === type);
    }
    
    if (isActive !== undefined) {
      const activeFilter = isActive === 'true';
      filteredRequirements = filteredRequirements.filter(req => req.isActive === activeFilter);
    }

    // Add compliance status for each requirement
    const requirementsWithStatus = filteredRequirements.map(requirement => {
      const applicableEmployees = complianceTracking.filter(
        track => track.requirementId === requirement.id
      );
      
      const completedCount = applicableEmployees.filter(
        track => track.status === 'completed'
      ).length;
      
      const overdueCount = applicableEmployees.filter(
        track => track.status === 'overdue'
      ).length;

      return {
        ...requirement,
        complianceStats: {
          totalApplicable: applicableEmployees.length,
          completed: completedCount,
          overdue: overdueCount,
          pending: applicableEmployees.length - completedCount - overdueCount,
          completionRate: applicableEmployees.length > 0 ? 
            (completedCount / applicableEmployees.length) * 100 : 0
        }
      };
    });

    res.status(200).json({
      success: true,
      data: requirementsWithStatus,
      message: 'Compliance requirements retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving compliance requirements:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve compliance requirements',
      message: `Failed to retrieve compliance requirements: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/compliance/reports:
 *   get:
 *     summary: Generate compliance reports
 *     tags: [Admin Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Department ID to filter by
 *       - in: query
 *         name: requirementId
 *         schema:
 *           type: string
 *         description: Specific requirement ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, pending, overdue]
 *         description: Filter by compliance status
 *     responses:
 *       200:
 *         description: Compliance report generated successfully
 */
exports.generateComplianceReports = async (req, res, next) => {
  try {
    const { department, requirementId, status } = req.query;

    let query = {};
    if (department) {
      // Get employees in the department
      const departmentEmployees = await Employee.find({ department })
        .select('_id');
      const employeeIds = departmentEmployees.map(emp => emp._id.toString());
      
      query.employeeId = { $in: employeeIds };
    }
    if (requirementId) query.requirementId = requirementId;
    if (status) query.status = status;

    const filteredTracking = complianceTracking.filter(track => {
      if (department && !query.employeeId?.includes(track.employeeId)) return false;
      if (requirementId && track.requirementId !== requirementId) return false;
      if (status && track.status !== status) return false;
      return true;
    });

    // Get employee details for the report
    const employeeIds = [...new Set(filteredTracking.map(track => track.employeeId))];
    const employees = await Employee.find({ _id: { $in: employeeIds } })
      .populate('department', 'name')
      .select('fullName email employeeId department');

    // Generate comprehensive report
    const report = {
      generatedAt: new Date(),
      filters: { department, requirementId, status },
      summary: {
        totalEmployees: employeeIds.length,
        totalRequirements: complianceRequirements.length,
        overallComplianceRate: 0,
        criticalIssues: 0,
        upcomingDeadlines: 0
      },
      byRequirement: {},
      byEmployee: {},
      byDepartment: {},
      criticalAlerts: []
    };

    // Calculate compliance by requirement
    complianceRequirements.forEach(requirement => {
      const reqTracking = filteredTracking.filter(track => track.requirementId === requirement.id);
      const completed = reqTracking.filter(track => track.status === 'completed').length;
      const overdue = reqTracking.filter(track => track.status === 'overdue').length;
      
      report.byRequirement[requirement.id] = {
        requirement: requirement.name,
        totalApplicable: reqTracking.length,
        completed,
        overdue,
        pending: reqTracking.length - completed - overdue,
        completionRate: reqTracking.length > 0 ? (completed / reqTracking.length) * 100 : 0,
        dueDate: requirement.dueDate
      };

      if (overdue > 0) {
        report.criticalAlerts.push({
          type: 'overdue',
          requirement: requirement.name,
          count: overdue,
          severity: 'high'
        });
      }
    });

    // Calculate compliance by employee
    employees.forEach(employee => {
      const empTracking = filteredTracking.filter(track => track.employeeId === employee._id.toString());
      const completed = empTracking.filter(track => track.status === 'completed').length;
      
      report.byEmployee[employee._id.toString()] = {
        employee: {
          fullName: employee.fullName,
          email: employee.email,
          employeeId: employee.employeeId,
          department: employee.department?.name || 'N/A'
        },
        totalRequirements: empTracking.length,
        completed,
        pending: empTracking.length - completed,
        completionRate: empTracking.length > 0 ? (completed / empTracking.length) * 100 : 0
      };
    });

    // Calculate overall compliance rate
    const totalApplicable = filteredTracking.length;
    const totalCompleted = filteredTracking.filter(track => track.status === 'completed').length;
    report.summary.overallComplianceRate = totalApplicable > 0 ? (totalCompleted / totalApplicable) * 100 : 0;
    report.summary.criticalIssues = report.criticalAlerts.length;

    res.status(200).json({
      success: true,
      data: report,
      message: 'Compliance report generated successfully'
    });
  } catch (err) {
    console.error('Error generating compliance report:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report',
      message: `Failed to generate the compliance report: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/compliance/schedule-training:
 *   post:
 *     summary: Schedule mandatory training
 *     tags: [Admin Compliance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requirementId
 *               - employeeIds
 *               - dueDate
 *             properties:
 *               requirementId:
 *                 type: string
 *                 description: Compliance requirement ID
 *               employeeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Employee IDs to assign training to
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Training due date
 *               trainingType:
 *                 type: string
 *                 enum: [online, in-person, hybrid]
 *                 default: online
 *               location:
 *                 type: string
 *                 description: Training location (for in-person)
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       201:
 *         description: Training scheduled successfully
 */
exports.scheduleTraining = async (req, res, next) => {
  try {
    const { requirementId, employeeIds, dueDate, trainingType = 'online', location, notes } = req.body;

    if (!requirementId || !employeeIds || !Array.isArray(employeeIds) || !dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Requirement ID, employee IDs array, and due date are required'
      });
    }

    // Validate requirement exists
    const requirement = complianceRequirements.find(req => req.id === requirementId);
    if (!requirement) {
      return res.status(404).json({
        success: false,
        error: 'Requirement not found',
        message: 'No compliance requirement found with the provided ID'
      });
    }

    // Validate employees exist
    const employees = await Employee.find({ _id: { $in: employeeIds } })
      .select('fullName email employeeId');
    
    if (employees.length !== employeeIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee IDs',
        message: 'Some employee IDs are invalid or not found'
      });
    }

    const scheduledTrainings = [];
    const dueDateObj = new Date(dueDate);

    for (const employee of employees) {
      // Check if already scheduled
      const existingSchedule = complianceTracking.find(
        track => track.employeeId === employee._id.toString() && 
                track.requirementId === requirementId &&
                track.status === 'scheduled'
      );

      if (!existingSchedule) {
        const trainingSchedule = {
          id: (complianceTracking.length + 1).toString(),
          employeeId: employee._id.toString(),
          requirementId,
          type: 'training',
          status: 'scheduled',
          dueDate: dueDateObj,
          trainingType,
          location: location || null,
          notes: notes || '',
          scheduledAt: new Date(),
          scheduledBy: req.user.id
        };

        complianceTracking.push(trainingSchedule);
        scheduledTrainings.push({
          ...trainingSchedule,
          employee: {
            fullName: employee.fullName,
            email: employee.email,
            employeeId: employee.employeeId
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        requirement: {
          id: requirement.id,
          name: requirement.name,
          type: requirement.type
        },
        scheduledTrainings,
        totalScheduled: scheduledTrainings.length
      },
      message: 'Training scheduled successfully'
    });
  } catch (err) {
    console.error('Error scheduling training:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule training',
      message: `Failed to schedule the training: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/compliance/track-certifications:
 *   get:
 *     summary: Track employee certifications
 *     tags: [Admin Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Employee ID to filter by
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [valid, expired, expiring-soon]
 *         description: Filter by certification status
 *     responses:
 *       200:
 *         description: Certifications tracked successfully
 */
exports.trackCertifications = async (req, res, next) => {
  try {
    const { employeeId, status } = req.query;

    let query = { type: 'certification' };
    if (employeeId) query.employeeId = employeeId;

    let filteredTracking = complianceTracking.filter(track => {
      if (track.type !== 'certification') return false;
      if (employeeId && track.employeeId !== employeeId) return false;
      return true;
    });

    // Get employee details
    const employeeIds = [...new Set(filteredTracking.map(track => track.employeeId))];
    const employees = await Employee.find({ _id: { $in: employeeIds } })
      .select('fullName email employeeId');

    // Add status and expiry information
    const certificationsWithStatus = filteredTracking.map(track => {
      const requirement = complianceRequirements.find(req => req.id === track.requirementId);
      const employee = employees.find(emp => emp._id.toString() === track.employeeId);
      
      const now = new Date();
      const dueDate = new Date(track.dueDate);
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      
      let certStatus = 'valid';
      if (dueDate < now) {
        certStatus = 'expired';
      } else if (daysUntilDue <= 30) {
        certStatus = 'expiring-soon';
      }

      return {
        ...track,
        employee: {
          fullName: employee?.fullName || 'Unknown',
          email: employee?.email || 'Unknown',
          employeeId: employee?.employeeId || 'Unknown'
        },
        requirement: {
          name: requirement?.name || 'Unknown',
          description: requirement?.description || 'Unknown'
        },
        certificationStatus: certStatus,
        daysUntilExpiry: daysUntilDue,
        isExpired: dueDate < now,
        isExpiringSoon: daysUntilDue <= 30 && daysUntilDue > 0
      };
    });

    // Filter by status if specified
    if (status) {
      filteredTracking = certificationsWithStatus.filter(cert => cert.certificationStatus === status);
    } else {
      filteredTracking = certificationsWithStatus;
    }

    // Calculate summary statistics
    const summary = {
      totalCertifications: filteredTracking.length,
      valid: filteredTracking.filter(cert => cert.certificationStatus === 'valid').length,
      expired: filteredTracking.filter(cert => cert.certificationStatus === 'expired').length,
      expiringSoon: filteredTracking.filter(cert => cert.certificationStatus === 'expiring-soon').length
    };

    res.status(200).json({
      success: true,
      data: {
        certifications: filteredTracking,
        summary
      },
      message: 'Certifications tracked successfully'
    });
  } catch (err) {
    console.error('Error tracking certifications:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to track certifications',
      message: 'An error occurred while tracking certifications. Please try again.'
    });
  }
};

/**
 * @swagger
 * /api/admin/compliance/audit-trail:
 *   get:
 *     summary: Get compliance audit trail
 *     tags: [Admin Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Employee ID to filter by
 *       - in: query
 *         name: requirementId
 *         schema:
 *           type: string
 *         description: Requirement ID to filter by
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, failed, overdue]
 *         description: Filter by action type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for audit trail
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for audit trail
 *     responses:
 *       200:
 *         description: Audit trail retrieved successfully
 */
exports.auditTrail = async (req, res, next) => {
  try {
    const { employeeId, requirementId, action, startDate, endDate } = req.query;

    let filteredTracking = complianceTracking;

    if (employeeId) {
      filteredTracking = filteredTracking.filter(track => track.employeeId === employeeId);
    }
    if (requirementId) {
      filteredTracking = filteredTracking.filter(track => track.requirementId === requirementId);
    }
    if (action) {
      filteredTracking = filteredTracking.filter(track => track.status === action);
    }
    if (startDate) {
      const start = new Date(startDate);
      filteredTracking = filteredTracking.filter(track => new Date(track.scheduledAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      filteredTracking = filteredTracking.filter(track => new Date(track.scheduledAt) <= end);
    }

    // Sort by date (most recent first)
    filteredTracking.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

    // Get employee and requirement details
    const employeeIds = [...new Set(filteredTracking.map(track => track.employeeId))];
    const requirementIds = [...new Set(filteredTracking.map(track => track.requirementId))];

    const employees = await Employee.find({ _id: { $in: employeeIds } })
      .select('fullName email employeeId');
    
    const requirements = complianceRequirements.filter(req => requirementIds.includes(req.id));

    // Enrich audit trail with details
    const enrichedAuditTrail = filteredTracking.map(track => {
      const employee = employees.find(emp => emp._id.toString() === track.employeeId);
      const requirement = requirements.find(req => req.id === track.requirementId);

      return {
        ...track,
        employee: {
          fullName: employee?.fullName || 'Unknown',
          email: employee?.email || 'Unknown',
          employeeId: employee?.employeeId || 'Unknown'
        },
        requirement: {
          name: requirement?.name || 'Unknown',
          type: requirement?.type || 'Unknown'
        }
      };
    });

    res.status(200).json({
      success: true,
      data: {
        auditTrail: enrichedAuditTrail,
        summary: {
          totalRecords: enrichedAuditTrail.length,
          byAction: {
            scheduled: enrichedAuditTrail.filter(track => track.status === 'scheduled').length,
            completed: enrichedAuditTrail.filter(track => track.status === 'completed').length,
            failed: enrichedAuditTrail.filter(track => track.status === 'failed').length,
            overdue: enrichedAuditTrail.filter(track => track.status === 'overdue').length
          }
        }
      },
      message: 'Audit trail retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving audit trail:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit trail',
      message: `Failed to retrieve the audit trail: ${err.message}`
    });
  }
};


