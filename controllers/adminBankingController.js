const BankAccount = require('../models/BankAccount');
const BankTransaction = require('../models/BankTransaction');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Banking
 *     description: Super Admin bank accounts and transactions
 */

/**
 * @swagger
 * /api/admin/accounting/bank-accounts:
 *   get:
 *     summary: List bank accounts
 *     tags: [Admin Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.listBankAccounts = async (req, res, next) => {
  try {
    const { currency } = req.query;
    const q = {};
    if (currency) q.currency = currency;
    const accounts = await BankAccount.find(q).sort({ createdAt: -1 });
    res.status(200).json({ success: true, accounts });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/bank-accounts:
 *   post:
 *     summary: Create bank account
 *     tags: [Admin Banking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, bankName, currency, accountNumber]
 *             properties:
 *               name: { type: string }
 *               bankName: { type: string }
 *               currency: { type: string }
 *               accountNumber: { type: string }
 *               accountType: { type: string }
 *     responses:
 *       201: { description: Created }
 */
exports.createBankAccount = async (req, res, next) => {
  try {
    const payload = { ...req.body, createdBy: req.user?._id };
    if (!payload.name || !payload.bankName || !payload.currency || !payload.accountNumber) {
      throw new BadRequestError('name, bankName, currency, accountNumber required');
    }
    const acc = await BankAccount.create(payload);
    res.status(201).json({ success: true, account: acc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/bank-accounts/{id}:
 *   patch:
 *     summary: Update bank account
 *     tags: [Admin Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: Updated }
 */
exports.updateBankAccount = async (req, res, next) => {
  try {
    const acc = await BankAccount.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!acc) throw new NotFoundError('bank account not found');
    res.status(200).json({ success: true, account: acc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/bank-accounts/{id}:
 *   delete:
 *     summary: Delete bank account
 *     tags: [Admin Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
exports.deleteBankAccount = async (req, res, next) => {
  try {
    await BankAccount.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/bank-accounts/{id}/transactions:
 *   get:
 *     summary: List bank transactions for an account
 *     tags: [Admin Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.listBankTransactions = async (req, res, next) => {
  try {
    const items = await BankTransaction.find({ bankAccount: req.params.id }).sort({ date: -1 });
    res.status(200).json({ success: true, transactions: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/bank-accounts/{id}/transactions:
 *   post:
 *     summary: Create bank transaction
 *     tags: [Admin Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type]
 *             properties:
 *               date: { type: string, format: date-time }
 *               amount: { type: number }
 *               type: { type: string, enum: [credit, debit] }
 *               description: { type: string }
 *               reference: { type: string }
 *     responses:
 *       201: { description: Created }
 */
exports.createBankTransaction = async (req, res, next) => {
  try {
    const { amount, type } = req.body;
    if (typeof amount !== 'number' || !['credit', 'debit'].includes(type)) {
      throw new BadRequestError('amount and valid type required');
    }
    const tx = await BankTransaction.create({ ...req.body, bankAccount: req.params.id, createdBy: req.user?._id });
    res.status(201).json({ success: true, transaction: tx });
  } catch (err) { next(err); }
};

















