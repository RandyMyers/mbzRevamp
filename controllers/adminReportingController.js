const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Payroll = require('../models/Payroll');
const LeaveRequest = require('../models/LeaveRequest');
const PerformanceReview = require('../models/PerformanceReview');
const Training = require('../models/Training');
const TrainingEnrollment = require('../models/TrainingEnrollment');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Reporting
 *     description: HR analytics and comprehensive reporting
 */

/**
 * @swagger
 * /api/admin/reports/hr-overview:
 *   get:
 *     summary: Generate comprehensive HR overview report
 *     tags: [Admin Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Report start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Report end date
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Department ID to filter by
 *     responses:
 *       200:
 *         description: HR overview report generated successfully
 */
exports.generateHRReports = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    const end = endDate ? new Date(endDate) : new Date();

    let employeeQuery = {};
    if (department) {
      employeeQuery.department = department;
    }

    // Get all employees with department info
    const employees = await Employee.find(employeeQuery)
      .populate('department', 'name')
      .select('fullName email employeeId department status salary hireDate terminationDate gender maritalStatus');

    // Get departments for analysis
    const departments = await Department.find().select('name');

    // Calculate key metrics
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.status === 'active').length;
    const terminatedEmployees = employees.filter(emp => emp.status === 'terminated').length;
    const suspendedEmployees = employees.filter(emp => emp.status === 'suspended').length;

    // Demographics
    const genderDistribution = employees.reduce((acc, emp) => {
      acc[emp.gender || 'Unknown'] = (acc[emp.gender || 'Unknown'] || 0) + 1;
      return acc;
    }, {});

    const maritalStatusDistribution = employees.reduce((acc, emp) => {
      acc[emp.maritalStatus || 'Unknown'] = (acc[emp.maritalStatus || 'Unknown'] || 0) + 1;
      return acc;
    }, {});

    // Department distribution
    const departmentDistribution = employees.reduce((acc, emp) => {
      const deptName = emp.department?.name || 'Unassigned';
      acc[deptName] = (acc[deptName] || 0) + 1;
      return acc;
    }, {});

    // Salary analysis
    const salaries = employees.filter(emp => emp.salary > 0).map(emp => emp.salary);
    const salaryStats = {
      average: salaries.length > 0 ? salaries.reduce((sum, sal) => sum + sal, 0) / salaries.length : 0,
      median: salaries.length > 0 ? salaries.sort((a, b) => a - b)[Math.floor(salaries.length / 2)] : 0,
      min: salaries.length > 0 ? Math.min(...salaries) : 0,
      max: salaries.length > 0 ? Math.max(...salaries) : 0
    };

    // Tenure analysis
    const now = new Date();
    const tenureData = employees.map(emp => {
      const hireDate = new Date(emp.hireDate);
      const tenureMonths = Math.floor((now - hireDate) / (1000 * 60 * 60 * 24 * 30));
      return {
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        tenureMonths,
        tenureYears: Math.floor(tenureMonths / 12)
      };
    });

    const averageTenure = tenureData.length > 0 ? 
      tenureData.reduce((sum, emp) => sum + emp.tenureMonths, 0) / tenureData.length : 0;

    // Recent hires (last 6 months)
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    const recentHires = employees.filter(emp => new Date(emp.hireDate) >= sixMonthsAgo).length;

    // Recent terminations (last 6 months)
    const recentTerminations = employees.filter(emp => 
      emp.terminationDate && new Date(emp.terminationDate) >= sixMonthsAgo
    ).length;

    // Turnover rate
    const turnoverRate = totalEmployees > 0 ? (recentTerminations / totalEmployees) * 100 : 0;

    const report = {
      period: {
        startDate: start,
        endDate: end
      },
      summary: {
        totalEmployees,
        activeEmployees,
        terminatedEmployees,
        suspendedEmployees,
        recentHires,
        recentTerminations,
        turnoverRate: Math.round(turnoverRate * 100) / 100
      },
      demographics: {
        genderDistribution,
        maritalStatusDistribution,
        departmentDistribution
      },
      compensation: {
        salaryStats,
        totalPayroll: salaries.reduce((sum, sal) => sum + sal, 0)
      },
      tenure: {
        averageTenureMonths: Math.round(averageTenure * 100) / 100,
        averageTenureYears: Math.round((averageTenure / 12) * 100) / 100,
        tenureDistribution: {
          '0-1 years': tenureData.filter(emp => emp.tenureYears < 1).length,
          '1-3 years': tenureData.filter(emp => emp.tenureYears >= 1 && emp.tenureYears < 3).length,
          '3-5 years': tenureData.filter(emp => emp.tenureYears >= 3 && emp.tenureYears < 5).length,
          '5+ years': tenureData.filter(emp => emp.tenureYears >= 5).length
        }
      },
      departments: departments.map(dept => ({
        id: dept._id,
        name: dept.name,
        employeeCount: departmentDistribution[dept.name] || 0
      }))
    };

    res.status(200).json({
      success: true,
      data: report,
      message: 'HR overview report generated successfully'
    });
  } catch (err) {
    console.error('Error generating HR report:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate HR report',
      message: `Failed to generate the HR report: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/reports/employee-analytics:
 *   get:
 *     summary: Generate detailed employee analytics
 *     tags: [Admin Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Department ID to filter by
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [performance, attendance, training, satisfaction]
 *         description: Specific metric to analyze
 *     responses:
 *       200:
 *         description: Employee analytics generated successfully
 */
exports.employeeAnalytics = async (req, res, next) => {
  try {
    const { department, metric } = req.query;

    let employeeQuery = { status: 'active' };
    if (department) {
      employeeQuery.department = department;
    }

    const employees = await Employee.find(employeeQuery)
      .populate('department', 'name')
      .select('fullName email employeeId department salary hireDate');

    let analytics = {};

    if (!metric || metric === 'performance') {
      // Performance analytics
      const performanceReviews = await PerformanceReview.find({
        employee: { $in: employees.map(emp => emp._id) }
      }).populate('employee', 'fullName employeeId');

      const performanceData = employees.map(emp => {
        const reviews = performanceReviews.filter(review => 
          review.employee._id.toString() === emp._id.toString()
        );
        
        const avgRating = reviews.length > 0 ? 
          reviews.reduce((sum, review) => sum + (review.overallRating || 0), 0) / reviews.length : 0;

        return {
          employeeId: emp.employeeId,
          fullName: emp.fullName,
          department: emp.department?.name || 'N/A',
          averageRating: Math.round(avgRating * 100) / 100,
          reviewCount: reviews.length,
          lastReviewDate: reviews.length > 0 ? 
            Math.max(...reviews.map(r => new Date(r.createdAt))) : null
        };
      });

      analytics.performance = {
        averageRating: performanceData.length > 0 ? 
          performanceData.reduce((sum, emp) => sum + emp.averageRating, 0) / performanceData.length : 0,
        topPerformers: performanceData
          .filter(emp => emp.averageRating > 0)
          .sort((a, b) => b.averageRating - a.averageRating)
          .slice(0, 10),
        needsImprovement: performanceData
          .filter(emp => emp.averageRating > 0 && emp.averageRating < 3)
          .sort((a, b) => a.averageRating - b.averageRating),
        distribution: {
          'Excellent (4.5-5.0)': performanceData.filter(emp => emp.averageRating >= 4.5).length,
          'Good (3.5-4.4)': performanceData.filter(emp => emp.averageRating >= 3.5 && emp.averageRating < 4.5).length,
          'Satisfactory (2.5-3.4)': performanceData.filter(emp => emp.averageRating >= 2.5 && emp.averageRating < 3.5).length,
          'Needs Improvement (1.0-2.4)': performanceData.filter(emp => emp.averageRating >= 1.0 && emp.averageRating < 2.5).length,
          'No Reviews': performanceData.filter(emp => emp.averageRating === 0).length
        }
      };
    }

    if (!metric || metric === 'training') {
      // Training analytics
      const trainingEnrollments = await TrainingEnrollment.find({
        employeeId: { $in: employees.map(emp => emp._id) }
      }).populate('trainingId', 'title category');

      const trainingData = employees.map(emp => {
        const enrollments = trainingEnrollments.filter(enrollment => 
          enrollment.employeeId.toString() === emp._id.toString()
        );
        
        const completed = enrollments.filter(enrollment => enrollment.status === 'Completed').length;
        const inProgress = enrollments.filter(enrollment => enrollment.status === 'In Progress').length;
        const total = enrollments.length;

        return {
          employeeId: emp.employeeId,
          fullName: emp.fullName,
          department: emp.department?.name || 'N/A',
          totalTrainings: total,
          completedTrainings: completed,
          inProgressTrainings: inProgress,
          completionRate: total > 0 ? (completed / total) * 100 : 0
        };
      });

      analytics.training = {
        averageCompletionRate: trainingData.length > 0 ? 
          trainingData.reduce((sum, emp) => sum + emp.completionRate, 0) / trainingData.length : 0,
        topLearners: trainingData
          .filter(emp => emp.totalTrainings > 0)
          .sort((a, b) => b.completedTrainings - a.completedTrainings)
          .slice(0, 10),
        trainingDistribution: {
          'High Performers (80%+)': trainingData.filter(emp => emp.completionRate >= 80).length,
          'Good (60-79%)': trainingData.filter(emp => emp.completionRate >= 60 && emp.completionRate < 80).length,
          'Average (40-59%)': trainingData.filter(emp => emp.completionRate >= 40 && emp.completionRate < 60).length,
          'Needs Support (<40%)': trainingData.filter(emp => emp.completionRate < 40 && emp.completionRate > 0).length,
          'No Training': trainingData.filter(emp => emp.completionRate === 0).length
        }
      };
    }

    res.status(200).json({
      success: true,
      data: {
        period: new Date(),
        totalEmployees: employees.length,
        analytics
      },
      message: 'Employee analytics generated successfully'
    });
  } catch (err) {
    console.error('Error generating employee analytics:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate employee analytics',
      message: `Failed to generate employee analytics: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/reports/turnover-analysis:
 *   get:
 *     summary: Generate turnover analysis report
 *     tags: [Admin Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [monthly, quarterly, yearly]
 *           default: yearly
 *         description: Analysis period
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Department ID to filter by
 *     responses:
 *       200:
 *         description: Turnover analysis generated successfully
 */
exports.turnoverAnalysis = async (req, res, next) => {
  try {
    const { period = 'yearly', department } = req.query;

    let employeeQuery = {};
    if (department) {
      employeeQuery.department = department;
    }

    const employees = await Employee.find(employeeQuery)
      .populate('department', 'name')
      .select('fullName email employeeId department hireDate terminationDate terminationReason status');

    const now = new Date();
    let periodStart, periodEnd;
    
    switch (period) {
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 12, 1);
        periodEnd = now;
        break;
      case 'quarterly':
        periodStart = new Date(now.getFullYear() - 4, 0, 1);
        periodEnd = now;
        break;
      case 'yearly':
      default:
        periodStart = new Date(now.getFullYear() - 5, 0, 1);
        periodEnd = now;
        break;
    }

    // Calculate turnover by period
    const turnoverData = [];
    const currentDate = new Date(periodStart);
    
    while (currentDate <= periodEnd) {
      let periodEndDate;
      
      switch (period) {
        case 'monthly':
          periodEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          break;
        case 'quarterly':
          periodEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0);
          break;
        case 'yearly':
        default:
          periodEndDate = new Date(currentDate.getFullYear() + 1, 0, 0);
          break;
      }

      // Count employees at start of period
      const employeesAtStart = employees.filter(emp => 
        new Date(emp.hireDate) <= currentDate && 
        (!emp.terminationDate || new Date(emp.terminationDate) > currentDate)
      ).length;

      // Count new hires during period
      const newHires = employees.filter(emp => 
        new Date(emp.hireDate) >= currentDate && new Date(emp.hireDate) <= periodEndDate
      ).length;

      // Count terminations during period
      const terminations = employees.filter(emp => 
        emp.terminationDate && 
        new Date(emp.terminationDate) >= currentDate && 
        new Date(emp.terminationDate) <= periodEndDate
      );

      // Calculate turnover rate
      const averageHeadcount = (employeesAtStart + (employeesAtStart + newHires - terminations.length)) / 2;
      const turnoverRate = averageHeadcount > 0 ? (terminations.length / averageHeadcount) * 100 : 0;

      turnoverData.push({
        period: currentDate.toISOString().split('T')[0],
        employeesAtStart,
        newHires,
        terminations: terminations.length,
        turnoverRate: Math.round(turnoverRate * 100) / 100,
        terminationReasons: terminations.reduce((acc, emp) => {
          const reason = emp.terminationReason || 'Unknown';
          acc[reason] = (acc[reason] || 0) + 1;
          return acc;
        }, {})
      });

      // Move to next period
      switch (period) {
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
        case 'yearly':
        default:
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }

    // Calculate overall statistics
    const totalTerminations = employees.filter(emp => emp.terminationDate).length;
    const totalHires = employees.length;
    const averageTurnoverRate = turnoverData.length > 0 ? 
      turnoverData.reduce((sum, period) => sum + period.turnoverRate, 0) / turnoverData.length : 0;

    // Department-wise turnover
    const departmentTurnover = employees.reduce((acc, emp) => {
      const deptName = emp.department?.name || 'Unassigned';
      if (!acc[deptName]) {
        acc[deptName] = { total: 0, terminated: 0, turnoverRate: 0 };
      }
      acc[deptName].total++;
      if (emp.terminationDate) {
        acc[deptName].terminated++;
      }
      return acc;
    }, {});

    Object.keys(departmentTurnover).forEach(dept => {
      const deptData = departmentTurnover[dept];
      deptData.turnoverRate = deptData.total > 0 ? (deptData.terminated / deptData.total) * 100 : 0;
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        analysisPeriod: {
          start: periodStart,
          end: periodEnd
        },
        summary: {
          totalEmployees: totalHires,
          totalTerminations,
          averageTurnoverRate: Math.round(averageTurnoverRate * 100) / 100
        },
        turnoverTrend: turnoverData,
        departmentBreakdown: departmentTurnover,
        topDepartmentsByTurnover: Object.entries(departmentTurnover)
          .sort(([,a], [,b]) => b.turnoverRate - a.turnoverRate)
          .slice(0, 5)
      },
      message: 'Turnover analysis generated successfully'
    });
  } catch (err) {
    console.error('Error generating turnover analysis:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate turnover analysis',
      message: `Failed to generate the turnover analysis: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/reports/performance-metrics:
 *   get:
 *     summary: Generate performance metrics report
 *     tags: [Admin Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Year to analyze
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Department ID to filter by
 *     responses:
 *       200:
 *         description: Performance metrics generated successfully
 */
exports.performanceMetrics = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear(), department } = req.query;

    let employeeQuery = { status: 'active' };
    if (department) {
      employeeQuery.department = department;
    }

    const employees = await Employee.find(employeeQuery)
      .populate('department', 'name')
      .select('fullName email employeeId department');

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    // Get performance reviews for the year
    const performanceReviews = await PerformanceReview.find({
      employee: { $in: employees.map(emp => emp._id) },
      createdAt: { $gte: yearStart, $lte: yearEnd }
    }).populate('employee', 'fullName employeeId department');

    // Calculate performance metrics
    const performanceData = employees.map(emp => {
      const reviews = performanceReviews.filter(review => 
        review.employee._id.toString() === emp._id.toString()
      );
      
      const avgRating = reviews.length > 0 ? 
        reviews.reduce((sum, review) => sum + (review.overallRating || 0), 0) / reviews.length : 0;

      const goals = reviews.reduce((acc, review) => {
        if (review.goals) {
          acc.total += review.goals.length;
          acc.achieved += review.goals.filter(goal => goal.achieved).length;
        }
        return acc;
      }, { total: 0, achieved: 0 });

      const goalAchievementRate = goals.total > 0 ? (goals.achieved / goals.total) * 100 : 0;

      return {
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        department: emp.department?.name || 'N/A',
        averageRating: Math.round(avgRating * 100) / 100,
        reviewCount: reviews.length,
        goalAchievementRate: Math.round(goalAchievementRate * 100) / 100,
        lastReviewDate: reviews.length > 0 ? 
          Math.max(...reviews.map(r => new Date(r.createdAt))) : null
      };
    });

    // Overall performance statistics
    const reviewedEmployees = performanceData.filter(emp => emp.reviewCount > 0);
    const averageRating = reviewedEmployees.length > 0 ? 
      reviewedEmployees.reduce((sum, emp) => sum + emp.averageRating, 0) / reviewedEmployees.length : 0;

    const performanceDistribution = {
      'Excellent (4.5-5.0)': performanceData.filter(emp => emp.averageRating >= 4.5).length,
      'Good (3.5-4.4)': performanceData.filter(emp => emp.averageRating >= 3.5 && emp.averageRating < 4.5).length,
      'Satisfactory (2.5-3.4)': performanceData.filter(emp => emp.averageRating >= 2.5 && emp.averageRating < 3.5).length,
      'Needs Improvement (1.0-2.4)': performanceData.filter(emp => emp.averageRating >= 1.0 && emp.averageRating < 2.5).length,
      'No Reviews': performanceData.filter(emp => emp.averageRating === 0).length
    };

    // Department-wise performance
    const departmentPerformance = employees.reduce((acc, emp) => {
      const deptName = emp.department?.name || 'Unassigned';
      if (!acc[deptName]) {
        acc[deptName] = { employees: [], totalRating: 0, reviewCount: 0 };
      }
      
      const empData = performanceData.find(p => p.employeeId === emp.employeeId);
      if (empData && empData.reviewCount > 0) {
        acc[deptName].employees.push(empData);
        acc[deptName].totalRating += empData.averageRating;
        acc[deptName].reviewCount += empData.reviewCount;
      }
      
      return acc;
    }, {});

    Object.keys(departmentPerformance).forEach(dept => {
      const deptData = departmentPerformance[dept];
      deptData.averageRating = deptData.employees.length > 0 ? 
        deptData.totalRating / deptData.employees.length : 0;
      deptData.employeeCount = deptData.employees.length;
    });

    res.status(200).json({
      success: true,
      data: {
        year,
        summary: {
          totalEmployees: employees.length,
          reviewedEmployees: reviewedEmployees.length,
          reviewCoverage: employees.length > 0 ? (reviewedEmployees.length / employees.length) * 100 : 0,
          averageRating: Math.round(averageRating * 100) / 100
        },
        performanceDistribution,
        departmentBreakdown: departmentPerformance,
        topPerformers: performanceData
          .filter(emp => emp.averageRating > 0)
          .sort((a, b) => b.averageRating - a.averageRating)
          .slice(0, 10),
        needsImprovement: performanceData
          .filter(emp => emp.averageRating > 0 && emp.averageRating < 3)
          .sort((a, b) => a.averageRating - b.averageRating)
      },
      message: 'Performance metrics generated successfully'
    });
  } catch (err) {
    console.error('Error generating performance metrics:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance metrics',
      message: `Failed to generate performance metrics: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/reports/cost-analysis:
 *   get:
 *     summary: Generate HR cost analysis report
 *     tags: [Admin Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Year to analyze
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Department ID to filter by
 *     responses:
 *       200:
 *         description: Cost analysis generated successfully
 */
exports.costAnalysis = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear(), department } = req.query;

    // Get payroll data for the year
    const payrolls = await Payroll.find({ year })
      .populate({
        path: 'items.employee',
        select: 'fullName employeeId department',
        populate: {
          path: 'department',
          select: 'name'
        }
      });

    let totalCosts = {
      gross: 0,
      net: 0,
      deductions: 0,
      benefits: 0
    };

    let departmentCosts = {};
    let monthlyBreakdown = [];

    payrolls.forEach(payroll => {
      totalCosts.gross += payroll.totals.gross;
      totalCosts.net += payroll.totals.netPay;
      totalCosts.deductions += (payroll.totals.gross - payroll.totals.netPay);

      // Department breakdown
      payroll.items.forEach(item => {
        const deptName = item.employee.department?.name || 'Unassigned';
        if (!departmentCosts[deptName]) {
          departmentCosts[deptName] = {
            gross: 0,
            net: 0,
            employeeCount: 0
          };
        }
        departmentCosts[deptName].gross += item.gross;
        departmentCosts[deptName].net += item.netPay;
        departmentCosts[deptName].employeeCount++;
      });

      // Monthly breakdown
      monthlyBreakdown.push({
        month: payroll.month,
        gross: payroll.totals.gross,
        net: payroll.totals.netPay,
        deductions: payroll.totals.gross - payroll.totals.netPay,
        employeeCount: payroll.items.length
      });
    });

    // Calculate averages
    const totalEmployees = Object.values(departmentCosts).reduce((sum, dept) => sum + dept.employeeCount, 0);
    const averageCostPerEmployee = totalEmployees > 0 ? totalCosts.gross / totalEmployees : 0;

    // Department cost analysis
    const departmentAnalysis = Object.entries(departmentCosts).map(([deptName, costs]) => ({
      department: deptName,
      totalCost: costs.gross,
      netCost: costs.net,
      employeeCount: costs.employeeCount,
      averageCostPerEmployee: costs.employeeCount > 0 ? costs.gross / costs.employeeCount : 0,
      costPercentage: totalCosts.gross > 0 ? (costs.gross / totalCosts.gross) * 100 : 0
    })).sort((a, b) => b.totalCost - a.totalCost);

    res.status(200).json({
      success: true,
      data: {
        year,
        summary: {
          totalCosts,
          totalEmployees,
          averageCostPerEmployee: Math.round(averageCostPerEmployee * 100) / 100,
          costBreakdown: {
            salary: totalCosts.gross,
            benefits: totalCosts.benefits,
            deductions: totalCosts.deductions,
            netPay: totalCosts.net
          }
        },
        monthlyBreakdown,
        departmentAnalysis,
        topDepartmentsByCost: departmentAnalysis.slice(0, 5),
        costTrends: {
          averageMonthlyCost: monthlyBreakdown.length > 0 ? 
            monthlyBreakdown.reduce((sum, month) => sum + month.gross, 0) / monthlyBreakdown.length : 0,
          highestMonth: monthlyBreakdown.length > 0 ? 
            monthlyBreakdown.reduce((max, month) => month.gross > max.gross ? month : max) : null,
          lowestMonth: monthlyBreakdown.length > 0 ? 
            monthlyBreakdown.reduce((min, month) => month.gross < min.gross ? month : min) : null
        }
      },
      message: 'Cost analysis generated successfully'
    });
  } catch (err) {
    console.error('Error generating cost analysis:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate cost analysis',
      message: `Failed to generate the cost analysis: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/reports/demographic-reports:
 *   get:
 *     summary: Generate demographic reports
 *     tags: [Admin Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Department ID to filter by
 *     responses:
 *       200:
 *         description: Demographic report generated successfully
 */
exports.demographicReports = async (req, res, next) => {
  try {
    const { department } = req.query;

    let employeeQuery = { status: 'active' };
    if (department) {
      employeeQuery.department = department;
    }

    const employees = await Employee.find(employeeQuery)
      .populate('department', 'name')
      .select('fullName email employeeId department gender maritalStatus hireDate salary');

    const now = new Date();
    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0
    };

    const tenureGroups = {
      '0-1 years': 0,
      '1-3 years': 0,
      '3-5 years': 0,
      '5-10 years': 0,
      '10+ years': 0
    };

    const salaryRanges = {
      '0-50k': 0,
      '50k-100k': 0,
      '100k-200k': 0,
      '200k-500k': 0,
      '500k+': 0
    };

    employees.forEach(emp => {
      // Age calculation (assuming we have dateOfBirth field)
      const hireDate = new Date(emp.hireDate);
      const tenureYears = (now - hireDate) / (1000 * 60 * 60 * 24 * 365);
      
      if (tenureYears < 1) tenureGroups['0-1 years']++;
      else if (tenureYears < 3) tenureGroups['1-3 years']++;
      else if (tenureYears < 5) tenureGroups['3-5 years']++;
      else if (tenureYears < 10) tenureGroups['5-10 years']++;
      else tenureGroups['10+ years']++;

      // Salary ranges
      const salary = emp.salary || 0;
      if (salary < 50000) salaryRanges['0-50k']++;
      else if (salary < 100000) salaryRanges['50k-100k']++;
      else if (salary < 200000) salaryRanges['100k-200k']++;
      else if (salary < 500000) salaryRanges['200k-500k']++;
      else salaryRanges['500k+']++;
    });

    // Gender distribution
    const genderDistribution = employees.reduce((acc, emp) => {
      acc[emp.gender || 'Unknown'] = (acc[emp.gender || 'Unknown'] || 0) + 1;
      return acc;
    }, {});

    // Marital status distribution
    const maritalStatusDistribution = employees.reduce((acc, emp) => {
      acc[emp.maritalStatus || 'Unknown'] = (acc[emp.maritalStatus || 'Unknown'] || 0) + 1;
      return acc;
    }, {});

    // Department distribution
    const departmentDistribution = employees.reduce((acc, emp) => {
      const deptName = emp.department?.name || 'Unassigned';
      acc[deptName] = (acc[deptName] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalEmployees: employees.length,
        genderDistribution,
        maritalStatusDistribution,
        ageGroups,
        tenureGroups,
        salaryRanges,
        departmentDistribution,
        diversityMetrics: {
          genderDiversity: Object.keys(genderDistribution).length,
          departmentDiversity: Object.keys(departmentDistribution).length,
          salaryRange: {
            min: Math.min(...employees.map(emp => emp.salary || 0)),
            max: Math.max(...employees.map(emp => emp.salary || 0)),
            median: employees.map(emp => emp.salary || 0).sort((a, b) => a - b)[Math.floor(employees.length / 2)]
          }
        }
      },
      message: 'Demographic report generated successfully'
    });
  } catch (err) {
    console.error('Error generating demographic report:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate demographic report',
      message: `Failed to generate the demographic report: ${err.message}`
    });
  }
};


