const Invoice = require('../models/Invoice');
const JournalEntry = require('../models/JournalEntry');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const Account = require('../models/Account').Account;

/**
 * @swagger
 * tags:
 *   - name: Admin Invoices
 *     description: Admin invoice actions and postings
 */

/**
 * @swagger
 * /api/admin/accounting/invoices:
 *   get:
 *     summary: List invoices (admin)
 *     tags: [Admin Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, sent, paid, overdue, cancelled] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: OK }
 */
exports.listInvoices = async (req, res, next) => {
  try {
    const { organizationId, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (organizationId) filter.organizationId = organizationId;
    if (status) filter.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Invoice.countDocuments(filter)
    ]);
    res.status(200).json({ success: true, invoices: items, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/accounting/invoices/{id}/mark-paid:
 *   post:
 *     summary: Mark invoice paid and create a journal entry
 *     tags: [Admin Invoices]
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
 *             required: [debitAccountId, creditAccountId]
 *             properties:
 *               debitAccountId: { type: string, description: Account to debit (e.g., Cash/Bank) }
 *               creditAccountId: { type: string, description: Account to credit (e.g., Accounts Receivable) }
 *               description: { type: string }
 *     responses:
 *       200: { description: Invoice marked paid }
 */
exports.markInvoicePaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { debitAccountId, creditAccountId, description } = req.body;
    if (!debitAccountId || !creditAccountId) throw new BadRequestError('debitAccountId and creditAccountId required');
    const [invoice, debitAcc, creditAcc] = await Promise.all([
      Invoice.findById(id),
      Account.findById(debitAccountId),
      Account.findById(creditAccountId)
    ]);
    if (!invoice) throw new NotFoundError('invoice not found');
    if (!debitAcc || !creditAcc) throw new BadRequestError('invalid account provided');
    // Update invoice status
    invoice.status = 'paid';
    invoice.paidDate = new Date();
    await invoice.save();
    // Create balanced journal entry
    const amount = Number(invoice.totalAmount || 0);
    const entry = new JournalEntry({
      date: new Date(),
      currency: invoice.currency || 'USD',
      status: 'posted',
      source: 'invoice_payment',
      description: description || `Payment for invoice ${invoice.invoiceNumber}`,
      lines: [
        { account: debitAcc._id, debit: amount, credit: 0, description: `Invoice ${invoice.invoiceNumber} payment` },
        { account: creditAcc._id, debit: 0, credit: amount, description: `Invoice ${invoice.invoiceNumber} payment` }
      ],
      createdBy: req.user?._id
    });
    if (!entry.validateBalance()) throw new BadRequestError('journal not balanced');
    await entry.save();
    res.status(200).json({ success: true, invoice, journalEntry: entry });
  } catch (err) { next(err); }
};









