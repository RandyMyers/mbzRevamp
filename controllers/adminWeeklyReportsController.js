const WeeklyReport = require('../models/WeeklyReport');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Admin Weekly Reports
 *     description: Manage staff weekly reports
 */

/**
 * @swagger
 * /api/admin/hr/weekly-reports:
 *   get:
 *     summary: List weekly reports
 *     tags: [Admin Weekly Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employee
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
exports.listWeeklyReports = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.employee) q.employee = req.query.employee;
    const items = await WeeklyReport.find(q).populate('employee reviewer').sort({ weekStart: -1 });
    res.status(200).json({ success: true, reports: items });
  } catch (err) { next(err); }
};

/**
 * @swagger
 * /api/admin/hr/weekly-reports/{id}/review:
 *   post:
 *     summary: Review a weekly report
 *     tags: [Admin Weekly Reports]
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
 *             required: [reviewNotes]
 *             properties:
 *               reviewNotes: { type: string }
 *     responses:
 *       200: { description: Reviewed }
 */
exports.reviewWeeklyReport = async (req, res, next) => {
  try {
    const { reviewNotes } = req.body;
    if (!reviewNotes) throw new BadRequestError('reviewNotes required');
    const doc = await WeeklyReport.findById(req.params.id);
    if (!doc) throw new NotFoundError('report not found');
    doc.status = 'reviewed';
    doc.reviewer = req.user?._id;
    doc.reviewNotes = reviewNotes;
    await doc.save();
    res.status(200).json({ success: true, report: doc });
  } catch (err) { next(err); }
};

/**
 * Enforce weekly report submission window: Monday 00:00 to Friday 17:00 (Africa/Lagos)
 * Helper that frontend can query to disable submission UI outside window.
 */
exports.getWeeklyReportWindow = async (req, res) => {
  try {
    const now = new Date();
    // Convert to Lagos time approximation using offset (+1 or +0 DST not considered). For accuracy, move to luxon/timezone lib later.
    const lagosOffsetMinutes = 60; // UTC+1
    const lagosNow = new Date(now.getTime() + lagosOffsetMinutes * 60000);
    const day = lagosNow.getUTCDay(); // 0=Sun..6=Sat
    const hours = lagosNow.getUTCHours();
    const minutes = lagosNow.getUTCMinutes();
    const inWindow = (day >= 1 && day <= 5) && (day < 5 || (day === 5 && (hours < 16 || (hours === 16 && minutes <= 59))));
    res.status(200).json({ success: true, inWindow });
  } catch (e) {
    res.status(200).json({ success: true, inWindow: true });
  }
};




