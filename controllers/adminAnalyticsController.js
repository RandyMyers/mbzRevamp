const User = require('../models/users');
const Task = require('../models/task');
const SupportTicket = require('../models/support');
const Payment = require('../models/payment');

/**
 * @swagger
 * tags:
 *   - name: Admin Analytics
 *     description: Super Admin analytics and overview
 */

/**
 * @swagger
 * /api/admin/analytics/overview:
 *   get:
 *     summary: Get super admin dashboard overview metrics
 *     tags: [Admin Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                     pendingTasks:
 *                       type: integer
 *                     openSupportTickets:
 *                       type: integer
 *                     revenueToDate:
 *                       type: number
 */
exports.getOverview = async (req, res, next) => {
  try {
    const [totalUsers, pendingTasks, openSupportTickets, revenueAgg] = await Promise.all([
      User.countDocuments({}),
      Task.countDocuments({ status: 'pending' }),
      SupportTicket.countDocuments({ status: { $in: ['open', 'pending'] } }),
      Payment.aggregate([
        { $match: { status: { $in: ['successful', 'paid', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const revenueToDate = Array.isArray(revenueAgg) && revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        pendingTasks,
        openSupportTickets,
        revenueToDate
      }
    });
  } catch (err) {
    next(err);
  }
};









