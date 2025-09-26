const EquipmentRequest = require('../models/EquipmentRequest');
const ExpenseReimbursement = require('../models/ExpenseReimbursement');
const SalaryRequest = require('../models/SalaryRequest');
const User = require('../models/users');
const Organization = require('../models/organization');

/**
 * @swagger
 * components:
 *   schemas:
 *     EquipmentRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         employeeId:
 *           type: string
 *         organizationId:
 *           type: string
 *         equipmentType:
 *           type: string
 *           enum: [laptop, desktop, monitor, keyboard, mouse, headset, phone, tablet, other]
 *         equipmentName:
 *           type: string
 *         description:
 *           type: string
 *         reason:
 *           type: string
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, fulfilled, cancelled]
 *         requestedDate:
 *           type: string
 *           format: date-time
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *               originalName:
 *                 type: string
 *               url:
 *                 type: string
 */

/**
 * @swagger
 * /api/self-service/equipment-requests:
 *   post:
 *     summary: Create equipment request
 *     tags: [Self Service]
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
 *               - reason
 *             properties:
 *               equipmentType:
 *                 type: string
 *                 enum: [laptop, desktop, monitor, keyboard, mouse, headset, phone, tablet, other]
 *               equipmentName:
 *                 type: string
 *               description:
 *                 type: string
 *               reason:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *     responses:
 *       201:
 *         description: Equipment request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/EquipmentRequest'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
const createEquipmentRequest = async (req, res) => {
  try {
    const { equipmentType, equipmentName, description, reason, priority = 'medium' } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const equipmentRequest = new EquipmentRequest({
      employeeId: userId,
      organizationId,
      equipmentType,
      equipmentName,
      description,
      reason,
      priority
    });

    await equipmentRequest.save();
    await equipmentRequest.populate('employeeId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: equipmentRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/self-service/equipment-requests:
 *   get:
 *     summary: Get employee's equipment requests
 *     tags: [Self Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, fulfilled, cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Equipment requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EquipmentRequest'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
const getEquipmentRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { employeeId: userId, organizationId };
    if (status) {
      query.status = status;
    }

    const equipmentRequests = await EquipmentRequest.find(query)
      .populate('employeeId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .sort({ requestedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await EquipmentRequest.countDocuments(query);

    res.json({
      success: true,
      data: equipmentRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/self-service/equipment-requests/{id}:
 *   get:
 *     summary: Get equipment request by ID
 *     tags: [Self Service]
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
 *         description: Equipment request retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/EquipmentRequest'
 *       404:
 *         description: Equipment request not found
 *       403:
 *         description: Access denied
 */
const getEquipmentRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const equipmentRequest = await EquipmentRequest.findOne({
      _id: id,
      employeeId: userId,
      organizationId
    })
      .populate('employeeId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName');

    if (!equipmentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Equipment request not found'
      });
    }

    res.json({
      success: true,
      data: equipmentRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/self-service/equipment-requests/{id}:
 *   put:
 *     summary: Update equipment request
 *     tags: [Self Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               equipmentType:
 *                 type: string
 *               equipmentName:
 *                 type: string
 *               description:
 *                 type: string
 *               reason:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       200:
 *         description: Equipment request updated successfully
 *       404:
 *         description: Equipment request not found
 *       403:
 *         description: Access denied or cannot update
 */
const updateEquipmentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const updateData = req.body;

    const equipmentRequest = await EquipmentRequest.findOne({
      _id: id,
      employeeId: userId,
      organizationId
    });

    if (!equipmentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Equipment request not found'
      });
    }

    if (equipmentRequest.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Cannot update equipment request that is not pending'
      });
    }

    Object.assign(equipmentRequest, updateData);
    await equipmentRequest.save();

    res.json({
      success: true,
      data: equipmentRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/self-service/equipment-requests/{id}:
 *   delete:
 *     summary: Cancel equipment request
 *     tags: [Self Service]
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
 *         description: Equipment request cancelled successfully
 *       404:
 *         description: Equipment request not found
 *       403:
 *         description: Access denied or cannot cancel
 */
const cancelEquipmentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const equipmentRequest = await EquipmentRequest.findOne({
      _id: id,
      employeeId: userId,
      organizationId
    });

    if (!equipmentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Equipment request not found'
      });
    }

    if (equipmentRequest.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Cannot cancel equipment request that is not pending'
      });
    }

    equipmentRequest.status = 'cancelled';
    await equipmentRequest.save();

    res.json({
      success: true,
      message: 'Equipment request cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     ExpenseReimbursement:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         employeeId:
 *           type: string
 *         organizationId:
 *           type: string
 *         expenseType:
 *           type: string
 *           enum: [travel, meals, accommodation, transport, office_supplies, training, client_entertainment, other]
 *         description:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         expenseDate:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, paid, cancelled]
 *         receipts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *               originalName:
 *                 type: string
 *               url:
 *                 type: string
 */

/**
 * @swagger
 * /api/self-service/expense-reimbursements:
 *   post:
 *     summary: Create expense reimbursement request
 *     tags: [Self Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expenseType
 *               - description
 *               - amount
 *               - expenseDate
 *             properties:
 *               expenseType:
 *                 type: string
 *                 enum: [travel, meals, accommodation, transport, office_supplies, training, client_entertainment, other]
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: NGN
 *               expenseDate:
 *                 type: string
 *                 format: date
 *               receipts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     originalName:
 *                       type: string
 *                     url:
 *                       type: string
 *     responses:
 *       201:
 *         description: Expense reimbursement request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ExpenseReimbursement'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
const createExpenseReimbursement = async (req, res) => {
  try {
    const { expenseType, description, amount, currency = 'NGN', expenseDate, receipts = [] } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const expenseReimbursement = new ExpenseReimbursement({
      employeeId: userId,
      organizationId,
      expenseType,
      description,
      amount,
      currency,
      expenseDate,
      receipts
    });

    await expenseReimbursement.save();
    await expenseReimbursement.populate('employeeId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: expenseReimbursement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/self-service/expense-reimbursements:
 *   get:
 *     summary: Get employee's expense reimbursement requests
 *     tags: [Self Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, paid, cancelled]
 *       - in: query
 *         name: expenseType
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Expense reimbursement requests retrieved successfully
 */
const getExpenseReimbursements = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const { status, expenseType, page = 1, limit = 10 } = req.query;

    const query = { employeeId: userId, organizationId };
    if (status) query.status = status;
    if (expenseType) query.expenseType = expenseType;

    const expenseReimbursements = await ExpenseReimbursement.find(query)
      .populate('employeeId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .sort({ submittedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ExpenseReimbursement.countDocuments(query);

    res.json({
      success: true,
      data: expenseReimbursements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/self-service/expense-reimbursements/{id}:
 *   get:
 *     summary: Get expense reimbursement request by ID
 *     tags: [Self Service]
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
 *         description: Expense reimbursement request retrieved successfully
 *       404:
 *         description: Expense reimbursement request not found
 *       403:
 *         description: Access denied
 */
const getExpenseReimbursementById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const expenseReimbursement = await ExpenseReimbursement.findOne({
      _id: id,
      employeeId: userId,
      organizationId
    })
      .populate('employeeId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName');

    if (!expenseReimbursement) {
      return res.status(404).json({
        success: false,
        message: 'Expense reimbursement request not found'
      });
    }

    res.json({
      success: true,
      data: expenseReimbursement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/self-service/expense-reimbursements/{id}:
 *   put:
 *     summary: Update expense reimbursement request
 *     tags: [Self Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expenseType:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               expenseDate:
 *                 type: string
 *               receipts:
 *                 type: array
 *     responses:
 *       200:
 *         description: Expense reimbursement request updated successfully
 *       404:
 *         description: Expense reimbursement request not found
 *       403:
 *         description: Access denied or cannot update
 */
const updateExpenseReimbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const updateData = req.body;

    const expenseReimbursement = await ExpenseReimbursement.findOne({
      _id: id,
      employeeId: userId,
      organizationId
    });

    if (!expenseReimbursement) {
      return res.status(404).json({
        success: false,
        message: 'Expense reimbursement request not found'
      });
    }

    if (expenseReimbursement.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Cannot update expense reimbursement request that is not pending'
      });
    }

    Object.assign(expenseReimbursement, updateData);
    await expenseReimbursement.save();

    res.json({
      success: true,
      data: expenseReimbursement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/self-service/expense-reimbursements/{id}:
 *   delete:
 *     summary: Cancel expense reimbursement request
 *     tags: [Self Service]
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
 *         description: Expense reimbursement request cancelled successfully
 *       404:
 *         description: Expense reimbursement request not found
 *       403:
 *         description: Access denied or cannot cancel
 */
const cancelExpenseReimbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const expenseReimbursement = await ExpenseReimbursement.findOne({
      _id: id,
      employeeId: userId,
      organizationId
    });

    if (!expenseReimbursement) {
      return res.status(404).json({
        success: false,
        message: 'Expense reimbursement request not found'
      });
    }

    if (expenseReimbursement.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Cannot cancel expense reimbursement request that is not pending'
      });
    }

    expenseReimbursement.status = 'cancelled';
    await expenseReimbursement.save();

    res.json({
      success: true,
      message: 'Expense reimbursement request cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     SalaryRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         employeeId:
 *           type: string
 *         organizationId:
 *           type: string
 *         requestType:
 *           type: string
 *           enum: [adjustment, advance, bonus, overtime, other]
 *         currentSalary:
 *           type: number
 *         requestedAmount:
 *           type: number
 *         reason:
 *           type: string
 *         description:
 *           type: string
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled]
 *         repaymentPlan:
 *           type: string
 *           enum: [lump_sum, monthly, quarterly, custom]
 *         repaymentPeriod:
 *           type: number
 */

/**
 * @swagger
 * /api/self-service/salary-requests:
 *   post:
 *     summary: Create salary request
 *     tags: [Self Service]
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
 *               - currentSalary
 *               - requestedAmount
 *               - reason
 *               - description
 *             properties:
 *               requestType:
 *                 type: string
 *                 enum: [adjustment, advance, bonus, overtime, other]
 *               currentSalary:
 *                 type: number
 *               requestedAmount:
 *                 type: number
 *               reason:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               repaymentPlan:
 *                 type: string
 *                 enum: [lump_sum, monthly, quarterly, custom]
 *               repaymentPeriod:
 *                 type: number
 *     responses:
 *       201:
 *         description: Salary request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SalaryRequest'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
const createSalaryRequest = async (req, res) => {
  try {
    const { requestType, currentSalary, requestedAmount, reason, description, priority = 'medium', repaymentPlan, repaymentPeriod } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const salaryRequest = new SalaryRequest({
      employeeId: userId,
      organizationId,
      requestType,
      currentSalary,
      requestedAmount,
      reason,
      description,
      priority,
      repaymentPlan,
      repaymentPeriod
    });

    await salaryRequest.save();
    await salaryRequest.populate('employeeId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: salaryRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/self-service/salary-requests:
 *   get:
 *     summary: Get employee's salary requests
 *     tags: [Self Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled]
 *       - in: query
 *         name: requestType
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Salary requests retrieved successfully
 */
const getSalaryRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const { status, requestType, page = 1, limit = 10 } = req.query;

    const query = { employeeId: userId, organizationId };
    if (status) query.status = status;
    if (requestType) query.requestType = requestType;

    const salaryRequests = await SalaryRequest.find(query)
      .populate('employeeId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .sort({ submittedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SalaryRequest.countDocuments(query);

    res.json({
      success: true,
      data: salaryRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/self-service/salary-requests/{id}:
 *   get:
 *     summary: Get salary request by ID
 *     tags: [Self Service]
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
 *         description: Salary request retrieved successfully
 *       404:
 *         description: Salary request not found
 *       403:
 *         description: Access denied
 */
const getSalaryRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const salaryRequest = await SalaryRequest.findOne({
      _id: id,
      employeeId: userId,
      organizationId
    })
      .populate('employeeId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName');

    if (!salaryRequest) {
      return res.status(404).json({
        success: false,
        message: 'Salary request not found'
      });
    }

    res.json({
      success: true,
      data: salaryRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/self-service/salary-requests/{id}:
 *   put:
 *     summary: Update salary request
 *     tags: [Self Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestType:
 *                 type: string
 *               currentSalary:
 *                 type: number
 *               requestedAmount:
 *                 type: number
 *               reason:
 *                 type: string
 *               description:
 *                 type: string
 *               repaymentPlan:
 *                 type: string
 *               repaymentPeriod:
 *                 type: number
 *     responses:
 *       200:
 *         description: Salary request updated successfully
 *       404:
 *         description: Salary request not found
 *       403:
 *         description: Access denied or cannot update
 */
const updateSalaryRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const updateData = req.body;

    const salaryRequest = await SalaryRequest.findOne({
      _id: id,
      employeeId: userId,
      organizationId
    });

    if (!salaryRequest) {
      return res.status(404).json({
        success: false,
        message: 'Salary request not found'
      });
    }

    if (salaryRequest.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Cannot update salary request that is not pending'
      });
    }

    Object.assign(salaryRequest, updateData);
    await salaryRequest.save();

    res.json({
      success: true,
      data: salaryRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/self-service/salary-requests/{id}:
 *   delete:
 *     summary: Cancel salary request
 *     tags: [Self Service]
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
 *         description: Salary request cancelled successfully
 *       404:
 *         description: Salary request not found
 *       403:
 *         description: Access denied or cannot cancel
 */
const cancelSalaryRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const salaryRequest = await SalaryRequest.findOne({
      _id: id,
      employeeId: userId,
      organizationId
    });

    if (!salaryRequest) {
      return res.status(404).json({
        success: false,
        message: 'Salary request not found'
      });
    }

    if (salaryRequest.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Cannot cancel salary request that is not pending'
      });
    }

    salaryRequest.status = 'cancelled';
    await salaryRequest.save();

    res.json({
      success: true,
      message: 'Salary request cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createEquipmentRequest,
  getEquipmentRequests,
  getEquipmentRequestById,
  updateEquipmentRequest,
  cancelEquipmentRequest,
  createExpenseReimbursement,
  getExpenseReimbursements,
  getExpenseReimbursementById,
  updateExpenseReimbursement,
  cancelExpenseReimbursement,
  createSalaryRequest,
  getSalaryRequests,
  getSalaryRequestById,
  updateSalaryRequest,
  cancelSalaryRequest
};
