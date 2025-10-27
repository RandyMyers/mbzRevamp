const Employee = require('../models/Employee');
const Department = require('../models/Department');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Benefits
 *     description: Employee benefits management operations
 */

// In-memory benefits store (in production, this would be a database model)
const benefits = [
  {
    id: '1',
    name: 'Health Insurance',
    description: 'Comprehensive health insurance coverage',
    type: 'health',
    cost: 50000,
    currency: 'NGN',
    isActive: true,
    eligibilityCriteria: {
      minSalary: 100000,
      employmentType: ['full-time', 'part-time'],
      probationPeriod: false
    }
  },
  {
    id: '2',
    name: 'Life Insurance',
    description: 'Life insurance coverage',
    type: 'insurance',
    cost: 25000,
    currency: 'NGN',
    isActive: true,
    eligibilityCriteria: {
      minSalary: 50000,
      employmentType: ['full-time'],
      probationPeriod: false
    }
  },
  {
    id: '3',
    name: 'Transport Allowance',
    description: 'Monthly transport allowance',
    type: 'allowance',
    cost: 30000,
    currency: 'NGN',
    isActive: true,
    eligibilityCriteria: {
      minSalary: 0,
      employmentType: ['full-time', 'part-time', 'contract'],
      probationPeriod: true
    }
  },
  {
    id: '4',
    name: 'Housing Allowance',
    description: 'Monthly housing allowance',
    type: 'allowance',
    cost: 100000,
    currency: 'NGN',
    isActive: true,
    eligibilityCriteria: {
      minSalary: 200000,
      employmentType: ['full-time'],
      probationPeriod: false
    }
  }
];

// Employee benefits assignments (in production, this would be a database model)
let employeeBenefits = [];

/**
 * @swagger
 * /api/admin/benefits:
 *   get:
 *     summary: List all benefits
 *     tags: [Admin Benefits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by benefit type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Benefits retrieved successfully
 */
exports.listBenefits = async (req, res, next) => {
  try {
    const { type, isActive } = req.query;
    
    let filteredBenefits = benefits;
    
    if (type) {
      filteredBenefits = filteredBenefits.filter(benefit => benefit.type === type);
    }
    
    if (isActive !== undefined) {
      const activeFilter = isActive === 'true';
      filteredBenefits = filteredBenefits.filter(benefit => benefit.isActive === activeFilter);
    }

    res.status(200).json({
      success: true,
      data: filteredBenefits,
      message: 'Benefits retrieved successfully'
    });
  } catch (err) {
    console.error('Error listing benefits:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to list benefits',
      message: `Failed to retrieve benefits: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/benefits:
 *   post:
 *     summary: Create new benefit
 *     tags: [Admin Benefits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - cost
 *             properties:
 *               name:
 *                 type: string
 *                 description: Benefit name
 *               description:
 *                 type: string
 *                 description: Benefit description
 *               type:
 *                 type: string
 *                 enum: [health, insurance, allowance, retirement, other]
 *                 description: Benefit type
 *               cost:
 *                 type: number
 *                 description: Monthly cost
 *               currency:
 *                 type: string
 *                 default: NGN
 *                 description: Currency code
 *               eligibilityCriteria:
 *                 type: object
 *                 properties:
 *                   minSalary:
 *                     type: number
 *                   employmentType:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [full-time, part-time, contract, intern, consultant]
 *                   probationPeriod:
 *                     type: boolean
 *     responses:
 *       201:
 *         description: Benefit created successfully
 */
exports.createBenefit = async (req, res, next) => {
  try {
    const { name, description, type, cost, currency = 'NGN', eligibilityCriteria } = req.body;

    if (!name || !type || cost === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, type, and cost are required to create a benefit'
      });
    }

    if (cost < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cost',
        message: 'Cost must be a positive number'
      });
    }

    const validTypes = ['health', 'insurance', 'allowance', 'retirement', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid benefit type',
        message: `Benefit type must be one of: ${validTypes.join(', ')}`
      });
    }

    const newBenefit = {
      id: (benefits.length + 1).toString(),
      name,
      description: description || '',
      type,
      cost,
      currency,
      isActive: true,
      eligibilityCriteria: eligibilityCriteria || {
        minSalary: 0,
        employmentType: ['full-time', 'part-time', 'contract', 'intern', 'consultant'],
        probationPeriod: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    benefits.push(newBenefit);

    res.status(201).json({
      success: true,
      data: newBenefit,
      message: 'Benefit created successfully'
    });
  } catch (err) {
    console.error('Error creating benefit:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create benefit',
      message: `Failed to create the benefit: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/benefits/{id}:
 *   put:
 *     summary: Update benefit
 *     tags: [Admin Benefits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Benefit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [health, insurance, allowance, retirement, other]
 *               cost:
 *                 type: number
 *               currency:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               eligibilityCriteria:
 *                 type: object
 *     responses:
 *       200:
 *         description: Benefit updated successfully
 */
exports.updateBenefit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const benefitIndex = benefits.findIndex(benefit => benefit.id === id);
    if (benefitIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Benefit not found',
        message: 'No benefit found with the provided ID'
      });
    }

    if (updateData.cost !== undefined && updateData.cost < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cost',
        message: 'Cost must be a positive number'
      });
    }

    if (updateData.type) {
      const validTypes = ['health', 'insurance', 'allowance', 'retirement', 'other'];
      if (!validTypes.includes(updateData.type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid benefit type',
          message: `Benefit type must be one of: ${validTypes.join(', ')}`
        });
      }
    }

    benefits[benefitIndex] = {
      ...benefits[benefitIndex],
      ...updateData,
      updatedAt: new Date()
    };

    res.status(200).json({
      success: true,
      data: benefits[benefitIndex],
      message: 'Benefit updated successfully'
    });
  } catch (err) {
    console.error('Error updating benefit:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update benefit',
      message: `Failed to update the benefit: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/benefits/{id}:
 *   delete:
 *     summary: Delete benefit
 *     tags: [Admin Benefits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Benefit ID
 *     responses:
 *       200:
 *         description: Benefit deleted successfully
 */
exports.deleteBenefit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const benefitIndex = benefits.findIndex(benefit => benefit.id === id);
    if (benefitIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Benefit not found',
        message: 'No benefit found with the provided ID'
      });
    }

    // Check if benefit is assigned to any employees
    const assignedEmployees = employeeBenefits.filter(assignment => assignment.benefitId === id);
    if (assignedEmployees.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Benefit in use',
        message: `Cannot delete benefit. It is assigned to ${assignedEmployees.length} employee(s)`
      });
    }

    benefits.splice(benefitIndex, 1);

    res.status(200).json({
      success: true,
      message: 'Benefit deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting benefit:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete benefit',
      message: `Failed to delete the benefit: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/benefits/assign:
 *   post:
 *     summary: Assign benefit to employee
 *     tags: [Admin Benefits]
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
 *               - benefitId
 *             properties:
 *               employeeId:
 *                 type: string
 *                 description: Employee ID
 *               benefitId:
 *                 type: string
 *                 description: Benefit ID
 *               effectiveDate:
 *                 type: string
 *                 format: date
 *                 description: When the benefit becomes effective
 *     responses:
 *       201:
 *         description: Benefit assigned successfully
 */
exports.assignBenefit = async (req, res, next) => {
  try {
    const { employeeId, benefitId, effectiveDate } = req.body;

    if (!employeeId || !benefitId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Employee ID and Benefit ID are required'
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

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: 'No employee found with the provided ID'
      });
    }

    // Check if benefit exists
    const benefit = benefits.find(b => b.id === benefitId);
    if (!benefit) {
      return res.status(404).json({
        success: false,
        error: 'Benefit not found',
        message: 'No benefit found with the provided ID'
      });
    }

    if (!benefit.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Benefit inactive',
        message: 'Cannot assign an inactive benefit'
      });
    }

    // Check if already assigned
    const existingAssignment = employeeBenefits.find(
      assignment => assignment.employeeId === employeeId && assignment.benefitId === benefitId
    );
    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        error: 'Benefit already assigned',
        message: 'This benefit is already assigned to the employee'
      });
    }

    // Check eligibility
    const isEligible = checkBenefitEligibility(employee, benefit);
    if (!isEligible.eligible) {
      return res.status(400).json({
        success: false,
        error: 'Not eligible',
        message: isEligible.reason
      });
    }

    const assignment = {
      id: (employeeBenefits.length + 1).toString(),
      employeeId,
      benefitId,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      status: 'active',
      assignedAt: new Date(),
      assignedBy: req.user.id
    };

    employeeBenefits.push(assignment);

    res.status(201).json({
      success: true,
      data: {
        assignment,
        employee: {
          id: employee._id,
          fullName: employee.fullName,
          employeeId: employee.employeeId
        },
        benefit: {
          id: benefit.id,
          name: benefit.name,
          type: benefit.type,
          cost: benefit.cost
        }
      },
      message: 'Benefit assigned successfully'
    });
  } catch (err) {
    console.error('Error assigning benefit:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to assign benefit',
      message: `Failed to assign the benefit: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/benefits/remove:
 *   delete:
 *     summary: Remove benefit from employee
 *     tags: [Admin Benefits]
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
 *               - benefitId
 *             properties:
 *               employeeId:
 *                 type: string
 *                 description: Employee ID
 *               benefitId:
 *                 type: string
 *                 description: Benefit ID
 *               reason:
 *                 type: string
 *                 description: Reason for removal
 *     responses:
 *       200:
 *         description: Benefit removed successfully
 */
exports.removeBenefit = async (req, res, next) => {
  try {
    const { employeeId, benefitId, reason } = req.body;

    if (!employeeId || !benefitId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Employee ID and Benefit ID are required'
      });
    }

    const assignmentIndex = employeeBenefits.findIndex(
      assignment => assignment.employeeId === employeeId && assignment.benefitId === benefitId
    );

    if (assignmentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found',
        message: 'This benefit is not assigned to the employee'
      });
    }

    employeeBenefits[assignmentIndex].status = 'removed';
    employeeBenefits[assignmentIndex].removedAt = new Date();
    employeeBenefits[assignmentIndex].removedBy = req.user.id;
    employeeBenefits[assignmentIndex].reason = reason || 'No reason provided';

    res.status(200).json({
      success: true,
      message: 'Benefit removed successfully'
    });
  } catch (err) {
    console.error('Error removing benefit:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to remove benefit',
      message: `Failed to remove the benefit: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/benefits/eligibility/{employeeId}:
 *   get:
 *     summary: Check employee benefit eligibility
 *     tags: [Admin Benefits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Eligibility checked successfully
 */
exports.benefitEligibility = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    // Validate ObjectId format
    if (!employeeId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID',
        message: 'The employee ID provided is not in the correct format'
      });
    }

    const employee = await Employee.findById(employeeId)
      .populate('department', 'name');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: 'No employee found with the provided ID'
      });
    }

    const eligibilityResults = benefits.map(benefit => {
      const eligibility = checkBenefitEligibility(employee, benefit);
      return {
        benefit: {
          id: benefit.id,
          name: benefit.name,
          type: benefit.type,
          cost: benefit.cost
        },
        eligible: eligibility.eligible,
        reason: eligibility.reason,
        criteria: benefit.eligibilityCriteria
      };
    });

    res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          fullName: employee.fullName,
          employeeId: employee.employeeId,
          salary: employee.salary,
          department: employee.department?.name || 'N/A'
        },
        eligibility: eligibilityResults
      },
      message: 'Eligibility checked successfully'
    });
  } catch (err) {
    console.error('Error checking eligibility:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to check eligibility',
      message: `Failed to check eligibility: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/benefits/costs:
 *   get:
 *     summary: Calculate benefit costs
 *     tags: [Admin Benefits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Department ID to filter by
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *         description: Month to calculate for
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Year to calculate for
 *     responses:
 *       200:
 *         description: Benefit costs calculated successfully
 */
exports.benefitCosts = async (req, res, next) => {
  try {
    const { department, month, year } = req.query;

    let query = { status: 'active' };
    if (department) {
      // Get employees in the department
      const departmentEmployees = await Employee.find({ department })
        .select('_id');
      const employeeIds = departmentEmployees.map(emp => emp._id.toString());
      
      query.employeeId = { $in: employeeIds };
    }

    const activeAssignments = employeeBenefits.filter(assignment => 
      assignment.status === 'active' && 
      (!department || query.employeeId?.includes(assignment.employeeId))
    );

    const costBreakdown = {};
    let totalCost = 0;

    for (const assignment of activeAssignments) {
      const benefit = benefits.find(b => b.id === assignment.benefitId);
      if (benefit) {
        if (!costBreakdown[benefit.type]) {
          costBreakdown[benefit.type] = {
            count: 0,
            totalCost: 0,
            benefits: []
          };
        }
        
        costBreakdown[benefit.type].count += 1;
        costBreakdown[benefit.type].totalCost += benefit.cost;
        costBreakdown[benefit.type].benefits.push({
          benefitId: benefit.id,
          benefitName: benefit.name,
          cost: benefit.cost,
          employeeId: assignment.employeeId
        });
        
        totalCost += benefit.cost;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        period: {
          month: month || new Date().getMonth() + 1,
          year: year || new Date().getFullYear()
        },
        totalCost,
        costBreakdown,
        summary: {
          totalAssignments: activeAssignments.length,
          totalBenefits: Object.keys(costBreakdown).length,
          averageCostPerEmployee: activeAssignments.length > 0 ? totalCost / activeAssignments.length : 0
        }
      },
      message: 'Benefit costs calculated successfully'
    });
  } catch (err) {
    console.error('Error calculating benefit costs:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate benefit costs',
      message: `Failed to calculate benefit costs: ${err.message}`
    });
  }
};

// Helper function to check benefit eligibility
function checkBenefitEligibility(employee, benefit) {
  const criteria = benefit.eligibilityCriteria;
  
  // Check minimum salary
  if (employee.salary < criteria.minSalary) {
    return {
      eligible: false,
      reason: `Minimum salary requirement not met. Required: ${criteria.minSalary}, Current: ${employee.salary}`
    };
  }
  
  // Check employment type
  if (!criteria.employmentType.includes(employee.employmentType || 'full-time')) {
    return {
      eligible: false,
      reason: `Employment type not eligible. Required: ${criteria.employmentType.join(', ')}, Current: ${employee.employmentType || 'full-time'}`
    };
  }
  
  // Check probation period
  if (!criteria.probationPeriod && employee.employmentStatus === 'probation') {
    return {
      eligible: false,
      reason: 'Employee is still on probation period'
    };
  }
  
  return {
    eligible: true,
    reason: 'Employee meets all eligibility criteria'
  };
}


