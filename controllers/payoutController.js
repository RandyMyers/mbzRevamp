/**
 * @swagger
 * tags:
 *   - name: Payouts
 *     description: Affiliate payouts management
 *
 * /api/payouts:
 *   get:
 *     tags: [Payouts]
 *     summary: Get payouts (paginated, filterable)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: affiliateId
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *     responses:
 *       200: { description: Payouts list }
 *       500: { description: Server error }
 *   post:
 *     tags: [Payouts]
 *     summary: Create payout for affiliate (moves pending commissions)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [affiliateId, amount]
 *             properties:
 *               affiliateId: { type: string }
 *               amount: { type: number }
 *               paymentMethod: { type: string }
 *               paymentDetails: { type: object }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 *
 * /api/payouts/{id}:
 *   get:
 *     tags: [Payouts]
 *     summary: Get payout by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Payout }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Payouts]
 *     summary: Update a payout
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
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *
 * /api/payouts/{id}/process:
 *   post:
 *     tags: [Payouts]
 *     summary: Mark payout as processing (simulated)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Processing started }
 *       404: { description: Not found }
 *       400: { description: Invalid state }
 *
 * /api/payouts/{id}/complete:
 *   post:
 *     tags: [Payouts]
 *     summary: Complete a payout
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
 *             properties:
 *               transactionId: { type: string }
 *     responses:
 *       200: { description: Completed }
 *       404: { description: Not found }
 *       400: { description: Invalid state }
 *
 * /api/payouts/{id}/fail:
 *   post:
 *     tags: [Payouts]
 *     summary: Mark payout as failed
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
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200: { description: Failed }
 *       404: { description: Not found }
 *       400: { description: Invalid state }
 *
 * /api/payouts/stats:
 *   get:
 *     tags: [Payouts]
 *     summary: Get payout stats (filterable by time/affiliate)
 *     parameters:
 *       - in: query
 *         name: affiliateId
 *         schema: { type: string }
 *       - in: query
 *         name: timeRange
 *         schema: { type: string, enum: [7d, 30d, 90d], default: 30d }
 *     responses:
 *       200: { description: Stats }
 *       500: { description: Server error }
 */
const Payout = require('../models/Payout');
const Affiliate = require('../models/Affiliate');
const Commission = require('../models/Commission');
const { NotFoundError, BadRequestError } = require('../utils/errors');

// Get all payouts with pagination and filters
exports.getPayouts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const affiliateId = req.query.affiliateId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query = {};
    if (status) query.status = status;
    if (affiliateId) query.affiliateId = affiliateId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const payouts = await Payout.find(query)
      .populate('affiliateId', 'trackingCode')
      .populate('commissionIds')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Payout.countDocuments(query);

    res.json({
      payouts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPayouts: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single payout by ID
exports.getPayout = async (req, res, next) => {
  try {
    const payout = await Payout.findById(req.params.id)
      .populate('affiliateId', 'trackingCode')
      .populate('commissionIds');

    if (!payout) {
      return next(new NotFoundError('No payout found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        payout
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new payout
exports.createPayout = async (req, res, next) => {
  try {
    const { affiliateId, amount, paymentMethod, paymentDetails } = req.body;

    const affiliate = await Affiliate.findById(affiliateId);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    // Check if affiliate has enough pending earnings
    if (affiliate.earnings.pending < amount) {
      return res.status(400).json({ message: 'Insufficient pending earnings' });
    }

    // Get pending commissions
    const pendingCommissions = await Commission.find({
      affiliateId,
      status: 'pending'
    }).limit(10); // Limit to prevent too many commissions in one payout

    if (pendingCommissions.length === 0) {
      return res.status(400).json({ message: 'No pending commissions found' });
    }

    const payout = new Payout({
      affiliateId,
      amount,
      paymentMethod,
      paymentDetails,
      commissionIds: pendingCommissions.map(c => c._id),
      status: 'pending'
    });

    await payout.save();

    // Update commission statuses
    await Commission.updateMany(
      { _id: { $in: pendingCommissions.map(c => c._id) } },
      { $set: { status: 'paid', payoutId: payout._id } }
    );

    // Update affiliate earnings
    await affiliate.processPayout(amount);

    res.status(201).json({
      status: 'success',
      data: {
        payout
      }
    });
  } catch (error) {
    next(error);
  }
};

// Process payout
exports.processPayout = async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id);

    if (!payout) {
      return res.status(404).json({ message: 'Payout not found' });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({ message: 'Payout is not in pending status' });
    }

    payout.status = 'processing';
    payout.processedAt = new Date();
    await payout.save();

    // Here you would typically integrate with a payment processor
    // For now, we'll simulate a successful payment
    setTimeout(async () => {
      payout.status = 'completed';
      payout.completedAt = new Date();
      await payout.save();
    }, 2000);

    res.json(payout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complete payout
exports.completePayout = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const payout = await Payout.findById(req.params.id);

    if (!payout) {
      return res.status(404).json({ message: 'Payout not found' });
    }

    if (payout.status !== 'processing') {
      return res.status(400).json({ message: 'Payout is not in processing status' });
    }

    payout.status = 'completed';
    payout.completedAt = new Date();
    payout.paymentDetails.transactionId = transactionId;
    await payout.save();

    res.json(payout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fail payout
exports.failPayout = async (req, res) => {
  try {
    const { reason } = req.body;
    const payout = await Payout.findById(req.params.id);

    if (!payout) {
      return res.status(404).json({ message: 'Payout not found' });
    }

    if (payout.status !== 'processing') {
      return res.status(400).json({ message: 'Payout is not in processing status' });
    }

    payout.status = 'failed';
    payout.failedAt = new Date();
    payout.failureReason = reason;
    await payout.save();

    // Revert commission statuses
    await Commission.updateMany(
      { _id: { $in: payout.commissionIds } },
      { $set: { status: 'pending', payoutId: null } }
    );

    // Revert affiliate earnings
    const affiliate = await Affiliate.findById(payout.affiliateId);
    if (affiliate) {
      affiliate.earnings.pending += payout.amount;
      affiliate.earnings.paid -= payout.amount;
      await affiliate.save();
    }

    res.json(payout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payout statistics
exports.getPayoutStats = async (req, res) => {
  try {
    const affiliateId = req.query.affiliateId;
    const timeRange = req.query.timeRange || '30d';
    const startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const query = { createdAt: { $gte: startDate } };
    if (affiliateId) query.affiliateId = affiliateId;

    const [totalPayouts, pendingPayouts, completedPayouts, failedPayouts] = await Promise.all([
      Payout.countDocuments(query),
      Payout.countDocuments({ ...query, status: 'pending' }),
      Payout.countDocuments({ ...query, status: 'completed' }),
      Payout.countDocuments({ ...query, status: 'failed' })
    ]);

    const [totalAmount, pendingAmount, completedAmount, failedAmount] = await Promise.all([
      Payout.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payout.aggregate([
        { $match: { ...query, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payout.aggregate([
        { $match: { ...query, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payout.aggregate([
        { $match: { ...query, status: 'failed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const stats = {
      totalPayouts,
      pendingPayouts,
      completedPayouts,
      failedPayouts,
      totalAmount: totalAmount[0]?.total || 0,
      pendingAmount: pendingAmount[0]?.total || 0,
      completedAmount: completedAmount[0]?.total || 0,
      failedAmount: failedAmount[0]?.total || 0
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payout timeline
exports.getPayoutTimeline = async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id)
      .populate('affiliateId', 'trackingCode')
      .populate('commissionIds');

    if (!payout) {
      return res.status(404).json({ message: 'Payout not found' });
    }

    const timeline = [
      {
        date: payout.createdAt,
        event: 'Payout Created',
        details: {
          amount: payout.amount,
          paymentMethod: payout.paymentMethod
        }
      }
    ];

    if (payout.status === 'processing') {
      timeline.push({
        date: payout.processedAt,
        event: 'Payout Processing Started'
      });
    }

    if (payout.status === 'completed') {
      timeline.push({
        date: payout.completedAt,
        event: 'Payout Completed',
        details: {
          transactionId: payout.paymentDetails.transactionId
        }
      });
    } else if (payout.status === 'failed') {
      timeline.push({
        date: payout.failedAt,
        event: 'Payout Failed',
        details: {
          reason: payout.failureReason
        }
      });
    }

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get affiliate payouts
exports.getAffiliatePayouts = async (req, res, next) => {
  try {
    const payouts = await Payout.find({ affiliateId: req.params.affiliateId });
    
    res.status(200).json({
      status: 'success',
      results: payouts.length,
      data: {
        payouts
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update payout
exports.updatePayout = async (req, res, next) => {
  try {
    const payout = await Payout.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!payout) {
      return next(new NotFoundError('No payout found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        payout
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get my payouts (for affiliate)
exports.getMyPayouts = async (req, res, next) => {
  try {
    const payouts = await Payout.find({ affiliateId: req.user.affiliateId });
    
    res.status(200).json({
      status: 'success',
      results: payouts.length,
      data: {
        payouts
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get payout report
exports.getMyPayoutReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { affiliateId: req.user.affiliateId };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const payouts = await Payout.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: payouts.length,
      data: {
        payouts
      }
    });
  } catch (error) {
    next(error);
  }
}; 