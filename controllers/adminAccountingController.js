const { Account, ACCOUNT_TYPES } = require('../models/Account');
const JournalEntry = require('../models/JournalEntry');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const ExchangeRate = require('../models/exchangeRate');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

/**
 * @swagger
 * tags:
 *   - name: Admin Accounting
 *     description: Super Admin accounting (Chart of Accounts, Journal Entries)
 */

/**
 * @swagger
 * /api/admin/accounting/accounts:
 *   get:
 *     summary: List accounts
 *     tags: [Admin Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [Assets, Liabilities, Equity, Revenue, Expenses] }
 *     responses:
 *       200: { description: OK }
 */
exports.listAccounts = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.type) q.type = req.query.type;
    const accounts = await Account.find(q).sort({ type: 1, code: 1 });
    res.status(200).json({ success: true, accounts });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/accounts:
 *   post:
 *     summary: Create subaccount
 *     tags: [Admin Accounting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code, type]
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               type: { type: string, enum: [Assets, Liabilities, Equity, Revenue, Expenses] }
 *               parent: { type: string }
 *     responses:
 *       201: { description: Created }
 */
exports.createAccount = async (req, res, next) => {
  try {
    const { name, code, type, parent } = req.body;
    if (!name || !code || !type) throw new BadRequestError('name, code, type required');
    if (!ACCOUNT_TYPES.includes(type)) throw new BadRequestError('invalid account type');
    const parentAcc = parent ? await Account.findById(parent) : null;
    if (parent && !parentAcc) throw new NotFoundError('parent not found');
    const acc = await Account.create({ name, code, type, parent: parentAcc?._id || null, isCore: false });
    res.status(201).json({ success: true, account: acc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/accounts/{id}:
 *   patch:
 *     summary: Update account (not allowed for core)
 *     tags: [Admin Accounting]
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
 *       404: { description: Not found }
 */
exports.updateAccount = async (req, res, next) => {
  try {
    const acc = await Account.findById(req.params.id);
    if (!acc) throw new NotFoundError('account not found');
    if (acc.isCore) throw new BadRequestError('core accounts cannot be modified');
    Object.assign(acc, req.body);
    await acc.save();
    res.status(200).json({ success: true, account: acc });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/accounts/{id}:
 *   delete:
 *     summary: Delete subaccount
 *     tags: [Admin Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       400: { description: Cannot delete core or parented accounts }
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const acc = await Account.findById(req.params.id);
    if (!acc) throw new NotFoundError('account not found');
    if (acc.isCore) throw new BadRequestError('core accounts cannot be deleted');
    const child = await Account.findOne({ parent: acc._id });
    if (child) throw new BadRequestError('cannot delete account with children');
    await Account.findByIdAndDelete(acc._id);
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/journal-entries:
 *   post:
 *     summary: Create journal entry (requires debits=credits)
 *     tags: [Admin Accounting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, currency, lines]
 *             properties:
 *               date: { type: string, format: date-time }
 *               currency: { type: string }
 *               description: { type: string }
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [account]
 *                   properties:
 *                     account: { type: string }
 *                     debit: { type: number }
 *                     credit: { type: number }
 *                     description: { type: string }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 */
exports.createJournalEntry = async (req, res, next) => {
  try {
    const payload = { ...req.body, createdBy: req.user?._id };
    // Validate accounts exist
    const accountIds = (payload.lines || []).map(l => l.account);
    const count = await Account.countDocuments({ _id: { $in: accountIds } });
    if (count !== accountIds.length) throw new BadRequestError('Invalid account in lines');
    const entry = new JournalEntry(payload);
    if (!entry.validateBalance()) throw new BadRequestError('Debits must equal credits');
    await entry.save();
    res.status(201).json({ success: true, entry });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/payroll/generate:
 *   post:
 *     summary: Generate monthly payroll with Nigeria PAYE
 *     tags: [Admin Accounting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [month, year]
 *             properties:
 *               month: { type: number }
 *               year: { type: number }
 *     responses:
 *       201: { description: Payroll generated }
 */
exports.generatePayroll = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) throw new BadRequestError('month and year are required');
    const employees = await Employee.find({ status: 'active' }).select('salary');
    const items = employees.map((e) => computeNigeriaPAYEForEmployee(e));
    const totals = items.reduce((acc, it) => ({
      gross: acc.gross + it.gross,
      pension: acc.pension + it.pension,
      nhf: acc.nhf + it.nhf,
      cra: acc.cra + it.cra,
      taxableIncome: acc.taxableIncome + it.taxableIncome,
      paye: acc.paye + it.paye,
      netPay: acc.netPay + it.netPay,
    }), { gross: 0, pension: 0, nhf: 0, cra: 0, taxableIncome: 0, paye: 0, netPay: 0 });
    const payroll = await Payroll.findOneAndUpdate(
      { month, year },
      { month, year, items, totals, currency: 'NGN' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ success: true, payroll });
  } catch (err) { next(err); }
};

function computeNigeriaPAYEForEmployee(employee) {
  const gross = employee.salary || 0;
  const pension = gross * 0.08; // example 8%
  const nhf = gross * 0.025; // 2.5%
  const cra = Math.max(200000, gross * 0.01) + (gross * 0.20);
  const taxableIncome = Math.max(0, gross - pension - nhf - cra);
  // Progressive PAYE bands (simplified): 7%, 11%, 15%, 19%, 21%, 24%
  let remaining = taxableIncome;
  const bands = [300000, 300000, 500000, 500000, 1600000];
  const rates = [0.07, 0.11, 0.15, 0.19, 0.21, 0.24];
  let paye = 0;
  for (let i = 0; i < bands.length && remaining > 0; i++) {
    const portion = Math.min(remaining, bands[i]);
    paye += portion * rates[i];
    remaining -= portion;
  }
  if (remaining > 0) paye += remaining * rates[rates.length - 1];
  const netPay = gross - pension - nhf - paye;
  return { employee: employee._id, gross, pension, nhf, cra, taxableIncome, paye, netPay };
}

/**
 * @swagger
 * /api/admin/accounting/exchange-rates:
 *   get:
 *     summary: List exchange rates
 *     tags: [Admin Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: baseCurrency
 *         schema: { type: string }
 *       - in: query
 *         name: targetCurrency
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.listExchangeRates = async (req, res, next) => {
  try {
    const { baseCurrency, targetCurrency } = req.query;
    const q = {};
    if (baseCurrency) q.baseCurrency = baseCurrency.toUpperCase();
    if (targetCurrency) q.targetCurrency = targetCurrency.toUpperCase();
    const rates = await ExchangeRate.find(q).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, rates });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/exchange-rates:
 *   post:
 *     summary: Upsert an exchange rate (global)
 *     tags: [Admin Accounting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [baseCurrency, targetCurrency, rate]
 *             properties:
 *               baseCurrency: { type: string }
 *               targetCurrency: { type: string }
 *               rate: { type: number }
 *     responses:
 *       200: { description: Saved }
 */
exports.upsertExchangeRate = async (req, res, next) => {
  try {
    const { baseCurrency, targetCurrency, rate } = req.body;
    if (!baseCurrency || !targetCurrency || typeof rate !== 'number') {
      throw new BadRequestError('baseCurrency, targetCurrency, rate required');
    }
    const query = {
      baseCurrency: baseCurrency.toUpperCase(),
      targetCurrency: targetCurrency.toUpperCase(),
      isGlobal: true
    };
    const update = { ...query, rate, source: 'user', isActive: true, lastApiUpdate: new Date(), cacheExpiry: null, isExpired: false };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const saved = await ExchangeRate.findOneAndUpdate(query, update, options);
    // After setting today's exchange rate, post any auto drafts for today
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const postResult = await JournalEntry.updateMany(
        {
          source: 'auto',
          status: 'draft',
          date: { $gte: startOfDay, $lte: endOfDay }
        },
        { $set: { status: 'auto' } }
      );
      console.log(`🔁 Posted ${postResult.modifiedCount || 0} auto draft journal entries for today`);
    } catch (autoErr) {
      console.warn('⚠️  Failed to auto-post drafts after rate upsert:', autoErr.message);
    }
    res.status(200).json({ success: true, rate: saved });
  } catch (err) { next(err); }
};



