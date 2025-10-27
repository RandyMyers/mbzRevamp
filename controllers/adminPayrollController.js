const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Payroll
 *     description: Payroll management operations
 */

/**
 * @swagger
 * /api/admin/payroll/process:
 *   post:
 *     summary: Process monthly payroll for all employees
 *     tags: [Admin Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *               - year
 *             properties:
 *               month:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 12
 *                 description: Month (1-12)
 *               year:
 *                 type: number
 *                 description: Year (e.g., 2024)
 *               currency:
 *                 type: string
 *                 default: NGN
 *                 description: Currency code
 *     responses:
 *       201:
 *         description: Payroll processed successfully
 *       400:
 *         description: Bad request - Invalid input
 *       409:
 *         description: Payroll already exists for this month/year
 */
exports.processPayroll = async (req, res, next) => {
  try {
    const { month, year, currency = 'NGN' } = req.body;

    // Validate input
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Month and year are required to process payroll'
      });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        error: 'Invalid month',
        message: 'Month must be between 1 and 12'
      });
    }

    // Check if payroll already exists for this month/year
    const existingPayroll = await Payroll.findOne({ month, year });
    if (existingPayroll) {
      return res.status(409).json({
        success: false,
        error: 'Payroll already exists',
        message: `Payroll for ${month}/${year} has already been processed`
      });
    }

    // Get all active employees
    const employees = await Employee.find({ status: 'active' })
      .populate('department', 'name')
      .select('fullName email salary department employeeId');

    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No employees found',
        message: 'No active employees found to process payroll'
      });
    }

    // Calculate payroll for each employee
    const payrollItems = [];
    let totalGross = 0;
    let totalPension = 0;
    let totalNhf = 0;
    let totalCra = 0;
    let totalTaxableIncome = 0;
    let totalPaye = 0;
    let totalNetPay = 0;

    for (const employee of employees) {
      const gross = employee.salary || 0;
      
      // Calculate deductions (Nigerian tax system)
      const pension = gross * 0.08; // 8% pension contribution
      const nhf = gross * 0.025; // 2.5% NHF contribution
      const cra = gross * 0.01; // 1% CRA contribution
      
      const taxableIncome = gross - pension - nhf - cra;
      
      // Calculate PAYE (Progressive tax rates)
      let paye = 0;
      if (taxableIncome > 300000) {
        paye = (300000 * 0.07) + ((taxableIncome - 300000) * 0.11);
      } else if (taxableIncome > 200000) {
        paye = (200000 * 0.05) + ((taxableIncome - 200000) * 0.07);
      } else if (taxableIncome > 100000) {
        paye = (100000 * 0.03) + ((taxableIncome - 100000) * 0.05);
      } else if (taxableIncome > 30000) {
        paye = (taxableIncome - 30000) * 0.03;
      }
      
      const netPay = taxableIncome - paye;

      payrollItems.push({
        employee: employee._id,
        gross,
        pension,
        nhf,
        cra,
        taxableIncome,
        paye,
        netPay
      });

      // Add to totals
      totalGross += gross;
      totalPension += pension;
      totalNhf += nhf;
      totalCra += cra;
      totalTaxableIncome += taxableIncome;
      totalPaye += paye;
      totalNetPay += netPay;
    }

    // Create payroll record
    const payroll = await Payroll.create({
      month,
      year,
      currency,
      items: payrollItems,
      totals: {
        gross: totalGross,
        pension: totalPension,
        nhf: totalNhf,
        cra: totalCra,
        taxableIncome: totalTaxableIncome,
        paye: totalPaye,
        netPay: totalNetPay
      }
    });

    res.status(201).json({
      success: true,
      data: payroll,
      message: `Payroll processed successfully for ${month}/${year}`,
      summary: {
        totalEmployees: employees.length,
        totalGross: totalGross,
        totalNetPay: totalNetPay,
        totalDeductions: totalGross - totalNetPay
      }
    });
  } catch (err) {
    console.error('Error processing payroll:', err);
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
      error: 'Failed to process payroll',
      message: `Failed to process payroll: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/payroll/reports:
 *   get:
 *     summary: Generate payroll reports
 *     tags: [Admin Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Year to generate report for
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *         description: Specific month (optional)
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Department ID to filter by
 *     responses:
 *       200:
 *         description: Payroll report generated successfully
 */
exports.generatePayrollReport = async (req, res, next) => {
  try {
    const { year, month, department } = req.query;

    let query = {};
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);

    const payrolls = await Payroll.find(query)
      .populate({
        path: 'items.employee',
        select: 'fullName email employeeId department',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .sort({ year: -1, month: -1 });

    if (payrolls.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No payroll data found',
        message: 'No payroll records found for the specified criteria'
      });
    }

    // Filter by department if specified
    let filteredPayrolls = payrolls;
    if (department) {
      filteredPayrolls = payrolls.map(payroll => ({
        ...payroll.toObject(),
        items: payroll.items.filter(item => 
          item.employee.department && item.employee.department._id.toString() === department
        )
      })).filter(payroll => payroll.items.length > 0);
    }

    // Calculate summary statistics
    const summary = {
      totalPayrolls: filteredPayrolls.length,
      totalEmployees: filteredPayrolls.reduce((sum, payroll) => sum + payroll.items.length, 0),
      totalGross: filteredPayrolls.reduce((sum, payroll) => sum + payroll.totals.gross, 0),
      totalNetPay: filteredPayrolls.reduce((sum, payroll) => sum + payroll.totals.netPay, 0),
      totalDeductions: filteredPayrolls.reduce((sum, payroll) => 
        sum + (payroll.totals.gross - payroll.totals.netPay), 0
      ),
      averageGross: 0,
      averageNetPay: 0
    };

    if (summary.totalEmployees > 0) {
      summary.averageGross = summary.totalGross / summary.totalEmployees;
      summary.averageNetPay = summary.totalNetPay / summary.totalEmployees;
    }

    res.status(200).json({
      success: true,
      data: {
        payrolls: filteredPayrolls,
        summary
      },
      message: 'Payroll report generated successfully'
    });
  } catch (err) {
    console.error('Error generating payroll report:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate payroll report',
      message: `Failed to generate the payroll report: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/payroll/employees/{id}/salary:
 *   put:
 *     summary: Update employee salary
 *     tags: [Admin Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - salary
 *             properties:
 *               salary:
 *                 type: number
 *                 description: New salary amount
 *               effectiveDate:
 *                 type: string
 *                 format: date
 *                 description: When the salary change takes effect
 *     responses:
 *       200:
 *         description: Employee salary updated successfully
 */
exports.updateEmployeeSalary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { salary, effectiveDate } = req.body;

    if (!salary || salary < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid salary',
        message: 'Salary must be a positive number'
      });
    }

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID',
        message: 'The employee ID provided is not in the correct format'
      });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: 'No employee found with the provided ID'
      });
    }

    const oldSalary = employee.salary;
    employee.salary = salary;
    
    if (effectiveDate) {
      employee.salaryEffectiveDate = new Date(effectiveDate);
    }

    await employee.save();

    res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          fullName: employee.fullName,
          employeeId: employee.employeeId,
          oldSalary,
          newSalary: salary,
          effectiveDate: employee.salaryEffectiveDate
        }
      },
      message: 'Employee salary updated successfully'
    });
  } catch (err) {
    console.error('Error updating employee salary:', err);
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
      error: 'Failed to update employee salary',
      message: `Failed to update the employee salary: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/payroll/calculate-taxes:
 *   post:
 *     summary: Calculate taxes for given salary
 *     tags: [Admin Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grossSalary
 *             properties:
 *               grossSalary:
 *                 type: number
 *                 description: Gross salary amount
 *               includeDeductions:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to include statutory deductions
 *     responses:
 *       200:
 *         description: Tax calculation completed
 */
exports.calculateTaxes = async (req, res, next) => {
  try {
    const { grossSalary, includeDeductions = true } = req.body;

    if (!grossSalary || grossSalary < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid salary',
        message: 'Gross salary must be a positive number'
      });
    }

    let pension = 0;
    let nhf = 0;
    let cra = 0;
    let taxableIncome = grossSalary;

    if (includeDeductions) {
      pension = grossSalary * 0.08; // 8% pension contribution
      nhf = grossSalary * 0.025; // 2.5% NHF contribution
      cra = grossSalary * 0.01; // 1% CRA contribution
      taxableIncome = grossSalary - pension - nhf - cra;
    }

    // Calculate PAYE (Progressive tax rates)
    let paye = 0;
    if (taxableIncome > 300000) {
      paye = (300000 * 0.07) + ((taxableIncome - 300000) * 0.11);
    } else if (taxableIncome > 200000) {
      paye = (200000 * 0.05) + ((taxableIncome - 200000) * 0.07);
    } else if (taxableIncome > 100000) {
      paye = (100000 * 0.03) + ((taxableIncome - 100000) * 0.05);
    } else if (taxableIncome > 30000) {
      paye = (taxableIncome - 30000) * 0.03;
    }

    const netPay = taxableIncome - paye;
    const totalDeductions = grossSalary - netPay;

    res.status(200).json({
      success: true,
      data: {
        grossSalary,
        deductions: {
          pension,
          nhf,
          cra,
          totalStatutoryDeductions: pension + nhf + cra
        },
        taxableIncome,
        paye,
        netPay,
        totalDeductions,
        breakdown: {
          grossSalary,
          statutoryDeductions: pension + nhf + cra,
          taxableIncome,
          paye,
          netPay
        }
      },
      message: 'Tax calculation completed successfully'
    });
  } catch (err) {
    console.error('Error calculating taxes:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate taxes',
      message: `Failed to calculate taxes: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/payroll/payslips/{payrollId}:
 *   get:
 *     summary: Generate payslips for a specific payroll
 *     tags: [Admin Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payrollId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payroll ID
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Specific employee ID (optional)
 *     responses:
 *       200:
 *         description: Payslips generated successfully
 */
exports.generatePayslips = async (req, res, next) => {
  try {
    const { payrollId } = req.params;
    const { employeeId } = req.query;

    const payroll = await Payroll.findById(payrollId)
      .populate({
        path: 'items.employee',
        select: 'fullName email employeeId department',
        populate: {
          path: 'department',
          select: 'name'
        }
      });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        error: 'Payroll not found',
        message: 'No payroll found with the provided ID'
      });
    }

    let payslips = payroll.items;

    // Filter by specific employee if requested
    if (employeeId) {
      payslips = payroll.items.filter(item => 
        item.employee._id.toString() === employeeId
      );
      
      if (payslips.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Employee not found in payroll',
          message: 'The specified employee was not found in this payroll'
        });
      }
    }

    // Format payslips with additional information
    const formattedPayslips = payslips.map(item => ({
      payrollId: payroll._id,
      month: payroll.month,
      year: payroll.year,
      currency: payroll.currency,
      employee: {
        id: item.employee._id,
        fullName: item.employee.fullName,
        email: item.employee.email,
        employeeId: item.employee.employeeId,
        department: item.employee.department?.name || 'N/A'
      },
      earnings: {
        gross: item.gross
      },
      deductions: {
        pension: item.pension,
        nhf: item.nhf,
        cra: item.cra,
        paye: item.paye,
        totalDeductions: item.gross - item.netPay
      },
      netPay: item.netPay,
      generatedAt: new Date()
    }));

    res.status(200).json({
      success: true,
      data: {
        payroll: {
          id: payroll._id,
          month: payroll.month,
          year: payroll.year,
          currency: payroll.currency
        },
        payslips: formattedPayslips,
        summary: {
          totalPayslips: formattedPayslips.length,
          totalGross: formattedPayslips.reduce((sum, payslip) => sum + payslip.earnings.gross, 0),
          totalNetPay: formattedPayslips.reduce((sum, payslip) => sum + payslip.netPay, 0)
        }
      },
      message: 'Payslips generated successfully'
    });
  } catch (err) {
    console.error('Error generating payslips:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid payroll ID',
        message: 'The payroll ID provided is not in the correct format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to generate payslips',
      message: `Failed to generate payslips: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/payroll/history:
 *   get:
 *     summary: Get payroll history
 *     tags: [Admin Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Year to filter by
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
 *         description: Payroll history retrieved successfully
 */
exports.payrollHistory = async (req, res, next) => {
  try {
    const { year, limit = 10, page = 1 } = req.query;
    
    let query = {};
    if (year) query.year = parseInt(year);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payrolls = await Payroll.find(query)
      .select('month year currency totals createdAt')
      .sort({ year: -1, month: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalPayrolls = await Payroll.countDocuments(query);
    const totalPages = Math.ceil(totalPayrolls / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        payrolls,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPayrolls,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      },
      message: 'Payroll history retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving payroll history:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payroll history',
      message: `Failed to retrieve payroll history: ${err.message}`
    });
  }
};


