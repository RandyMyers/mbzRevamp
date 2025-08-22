const mongoose = require('mongoose');
const JournalEntry = require('../models/JournalEntry');
const { Account } = require('../models/Account');

/**
 * @swagger
 * tags:
 *   - name: Admin Reports
 *     description: Financial reports (trial balance, income statement, balance sheet)
 */

function parseDate(d, fallback) {
  const dt = d ? new Date(d) : fallback;
  return isNaN(dt) ? fallback : dt;
}

async function aggregateLines(match) {
  return JournalEntry.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    { $lookup: { from: 'accounts', localField: 'lines.account', foreignField: '_id', as: 'acc' } },
    { $unwind: '$acc' },
    { $group: {
        _id: '$acc._id',
        accountName: { $first: '$acc.name' },
        accountCode: { $first: '$acc.code' },
        accountType: { $first: '$acc.type' },
        debit: { $sum: { $ifNull: ['$lines.debit', 0] } },
        credit: { $sum: { $ifNull: ['$lines.credit', 0] } },
      }
    },
    { $sort: { accountCode: 1 } }
  ]);
}

/**
 * @swagger
 * /api/admin/accounting/reports/trial-balance:
 *   get:
 *     summary: Trial balance as of a date
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: asOf
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: OK }
 */
exports.getTrialBalance = async (req, res, next) => {
  try {
    const asOf = parseDate(req.query.asOf, new Date());
    const data = await aggregateLines({ date: { $lte: asOf }, status: { $in: ['posted', 'auto'] } });
    const rows = data.map(r => ({
      accountId: r._id,
      name: r.accountName,
      code: r.accountCode,
      type: r.accountType,
      debit: r.debit,
      credit: r.credit,
      balance: r.debit - r.credit,
    }));
    const totals = rows.reduce((a, r) => ({ debit: a.debit + r.debit, credit: a.credit + r.credit }), { debit: 0, credit: 0 });
    res.status(200).json({ success: true, asOf, rows, totals });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/reports/income-statement:
 *   get:
 *     summary: Income statement for a period
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: OK }
 */
exports.getIncomeStatement = async (req, res, next) => {
  try {
    const start = parseDate(req.query.startDate, new Date(new Date().getFullYear(), 0, 1));
    const end = parseDate(req.query.endDate, new Date());
    const data = await aggregateLines({ date: { $gte: start, $lte: end }, status: { $in: ['posted', 'auto'] } });
    const revenue = data.filter(d => d.accountType === 'Revenue')
      .reduce((a, r) => a + (r.credit - r.debit), 0);
    const expenses = data.filter(d => d.accountType === 'Expenses')
      .reduce((a, r) => a + (r.debit - r.credit), 0);
    const netProfit = revenue - expenses;
    res.status(200).json({ success: true, period: { start, end }, revenue, expenses, netProfit });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/reports/balance-sheet:
 *   get:
 *     summary: Balance sheet as of a date
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: asOf
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: OK }
 */
exports.getBalanceSheet = async (req, res, next) => {
  try {
    const asOf = parseDate(req.query.asOf, new Date());
    const data = await aggregateLines({ date: { $lte: asOf }, status: { $in: ['posted', 'auto'] } });
    const sectionSum = (type) => data.filter(d => d.accountType === type)
      .reduce((a, r) => a + (r.debit - r.credit), 0);
    const assets = sectionSum('Assets');
    const liabilities = data.filter(d => d.accountType === 'Liabilities')
      .reduce((a, r) => a + (r.credit - r.debit), 0);
    const equity = data.filter(d => d.accountType === 'Equity')
      .reduce((a, r) => a + (r.credit - r.debit), 0);
    res.status(200).json({ success: true, asOf, assets, liabilities, equity });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/reports/cash-flow:
 *   get:
 *     summary: Cash flow statement for a period
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: OK }
 */
exports.getCashFlow = async (req, res, next) => {
  try {
    const start = parseDate(req.query.startDate, new Date(new Date().getFullYear(), 0, 1));
    const end = parseDate(req.query.endDate, new Date());
    const data = await aggregateLines({ date: { $gte: start, $lte: end }, status: { $in: ['posted', 'auto'] } });
    // Simplified: use account types to infer cash-related changes (improve by mapping bank/cash accounts by code range)
    const cashInflows = data
      .filter(d => d.accountType === 'Assets')
      .reduce((a, r) => a + Math.max(0, r.credit - r.debit), 0);
    const cashOutflows = data
      .filter(d => d.accountType === 'Assets')
      .reduce((a, r) => a + Math.max(0, r.debit - r.credit), 0);
    const netCash = cashInflows - cashOutflows;
    res.status(200).json({ success: true, period: { start, end }, cashInflows, cashOutflows, netCash });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/reports/subaccount:
 *   get:
 *     summary: Subaccount breakdown report for a period
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [Assets, Liabilities, Equity, Revenue, Expenses] }
 *     responses:
 *       200: { description: OK }
 */
exports.getSubaccountReport = async (req, res, next) => {
  try {
    const start = parseDate(req.query.startDate, new Date(new Date().getFullYear(), 0, 1));
    const end = parseDate(req.query.endDate, new Date());
    const typeFilter = req.query.type;
    const data = await aggregateLines({ date: { $gte: start, $lte: end }, status: { $in: ['posted', 'auto'] } });
    const filtered = typeFilter ? data.filter(d => d.accountType === typeFilter) : data;
    const rows = filtered.map(r => ({
      accountId: r._id,
      name: r.accountName,
      code: r.accountCode,
      type: r.accountType,
      debit: r.debit,
      credit: r.credit,
      balance: r.debit - r.credit,
    }));
    res.status(200).json({ success: true, period: { start, end }, rows });
  } catch (err) { next(err); }
};




