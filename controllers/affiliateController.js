const Affiliate = require('../models/Affiliate');
const User = require('../models/users');
const Referral = require('../models/Referral');
const Commission = require('../models/Commission');
const Payout = require('../models/Payout');
const MarketingMaterial = require('../models/MarketingMaterial');
const { generateTrackingCode } = require('../utils/affiliateUtils');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * @swagger
 * /api/affiliates:
 *   get:
 *     summary: Get all affiliates with pagination and filters
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of affiliates per page
 *         example: 10
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pending, active, suspended, terminated]
 *         description: Filter by affiliate status
 *         example: "active"
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search by affiliate name or email
 *         example: "john"
 *     responses:
 *       200:
 *         description: Affiliates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 affiliates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Affiliate'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 totalAffiliates:
 *                   type: integer
 *                   example: 50
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */

// Get all affiliates with pagination and filters
exports.getAffiliates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'user.fullName': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    const affiliates = await Affiliate.find(query)
      .populate('userId', 'fullName email')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Affiliate.countDocuments(query);

    res.json({
      affiliates,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalAffiliates: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/affiliates/{id}:
 *   get:
 *     summary: Get single affiliate by ID
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Affiliate ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Affiliate retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Affiliate'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Affiliate not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Affiliate not found"
 *       500:
 *         description: Server error
 */
// Get single affiliate by ID
exports.getAffiliate = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id)
      .populate('userId', 'fullName email')
      .populate('marketingMaterials');

    if (!affiliate) {
      return next(new NotFoundError('Affiliate not found'));
    }

    res.json(affiliate);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/affiliates:
 *   post:
 *     summary: Create new affiliate
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - commissionRate
 *             properties:
 *               userId:
 *                 type: string
 *                 format: ObjectId
 *                 description: User ID to make an affiliate
 *                 example: "507f1f77bcf86cd799439011"
 *               commissionRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Commission rate percentage
 *                 example: 15
 *               paymentDetails:
 *                 type: object
 *                 properties:
 *                   paymentMethod:
 *                     type: string
 *                     enum: [bank_transfer, paypal, stripe]
 *                     description: Payment method
 *                     example: "paypal"
 *                   paypalEmail:
 *                     type: string
 *                     description: PayPal email address
 *                     example: "affiliate@example.com"
 *               metadata:
 *                 type: object
 *                 properties:
 *                   website:
 *                     type: string
 *                     description: Affiliate website URL
 *                     example: "https://example.com"
 *                   description:
 *                     type: string
 *                     description: Affiliate description
 *                     example: "Professional affiliate marketer"
 *     responses:
 *       201:
 *         description: Affiliate created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Affiliate'
 *       400:
 *         description: Bad request - User already an affiliate or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User is already an affiliate"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
// Create new affiliate
exports.createAffiliate = async (req, res, next) => {
  try {
    const { userId, commissionRate, paymentDetails } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already an affiliate
    const existingAffiliate = await Affiliate.findOne({ userId });
    if (existingAffiliate) {
      return res.status(400).json({ message: 'User is already an affiliate' });
    }

    const affiliate = new Affiliate({
      userId,
      commissionRate,
      paymentDetails,
      trackingCode: await generateTrackingCode(),
      status: 'pending'
    });

    await affiliate.save();

    res.status(201).json(affiliate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/affiliates/{id}:
 *   put:
 *     summary: Update affiliate
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Affiliate ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commissionRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: New commission rate percentage
 *                 example: 20
 *               status:
 *                 type: string
 *                 enum: [pending, active, suspended, terminated]
 *                 description: New affiliate status
 *                 example: "active"
 *               paymentDetails:
 *                 type: object
 *                 properties:
 *                   paymentMethod:
 *                     type: string
 *                     enum: [bank_transfer, paypal, stripe]
 *                     description: Payment method
 *                   paypalEmail:
 *                     type: string
 *                     description: PayPal email address
 *     responses:
 *       200:
 *         description: Affiliate updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Affiliate'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Affiliate not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Affiliate not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
// Update affiliate
exports.updateAffiliate = async (req, res) => {
  try {
    const { commissionRate, status, paymentDetails } = req.body;

    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    if (commissionRate) affiliate.commissionRate = commissionRate;
    if (status) affiliate.status = status;
    if (paymentDetails) affiliate.paymentDetails = paymentDetails;

    await affiliate.save();

    res.json(affiliate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/affiliates/{id}:
 *   delete:
 *     summary: Delete affiliate
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Affiliate ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Affiliate deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Affiliate deleted successfully"
 *       400:
 *         description: Bad request - Cannot delete affiliate with pending commissions or payouts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cannot delete affiliate with pending commissions or payouts"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Affiliate not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Affiliate not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
// Delete affiliate
exports.deleteAffiliate = async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    // Check if there are any pending commissions or payouts
    const pendingCommissions = await Commission.countDocuments({
      affiliateId: affiliate._id,
      status: 'pending'
    });

    const pendingPayouts = await Payout.countDocuments({
      affiliateId: affiliate._id,
      status: 'pending'
    });

    if (pendingCommissions > 0 || pendingPayouts > 0) {
      return res.status(400).json({
        message: 'Cannot delete affiliate with pending commissions or payouts'
      });
    }

    await affiliate.remove();
    res.json({ message: 'Affiliate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/affiliates/{id}/stats:
 *   get:
 *     summary: Get affiliate statistics
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Affiliate ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Affiliate statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalReferrals:
 *                   type: integer
 *                   description: Total number of referrals
 *                   example: 150
 *                 activeReferrals:
 *                   type: integer
 *                   description: Number of active referrals
 *                   example: 120
 *                 conversionRate:
 *                   type: number
 *                   description: Conversion rate percentage
 *                   example: 80.0
 *                 totalCommissions:
 *                   type: integer
 *                   description: Total number of commissions
 *                   example: 120
 *                 pendingCommissions:
 *                   type: integer
 *                   description: Number of pending commissions
 *                   example: 15
 *                 totalPayouts:
 *                   type: integer
 *                   description: Number of completed payouts
 *                   example: 105
 *                 earnings:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Total earnings
 *                       example: 5000.00
 *                     pending:
 *                       type: number
 *                       description: Pending earnings
 *                       example: 750.00
 *                     paid:
 *                       type: number
 *                       description: Paid earnings
 *                       example: 4250.00
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Affiliate not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Affiliate not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
// Get affiliate statistics
exports.getAffiliateStats = async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    const [
      totalReferrals,
      activeReferrals,
      totalCommissions,
      pendingCommissions,
      totalPayouts
    ] = await Promise.all([
      Referral.countDocuments({ affiliateId: affiliate._id }),
      Referral.countDocuments({ affiliateId: affiliate._id, status: 'converted' }),
      Commission.countDocuments({ affiliateId: affiliate._id }),
      Commission.countDocuments({ affiliateId: affiliate._id, status: 'pending' }),
      Payout.countDocuments({ affiliateId: affiliate._id, status: 'completed' })
    ]);

    const stats = {
      totalReferrals,
      activeReferrals,
      conversionRate: totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0,
      totalCommissions,
      pendingCommissions,
      totalPayouts,
      earnings: affiliate.earnings
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/affiliates/{id}/performance:
 *   get:
 *     summary: Get affiliate performance metrics
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Affiliate ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: timeRange
 *         required: false
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Time range for performance data
 *         example: "30d"
 *     responses:
 *       200:
 *         description: Affiliate performance metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 referrals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         description: Date of referral
 *                       count:
 *                         type: integer
 *                         description: Number of referrals
 *                       value:
 *                         type: number
 *                         description: Conversion value
 *                 commissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         description: Date of commission
 *                       amount:
 *                         type: number
 *                         description: Commission amount
 *                 payouts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         description: Date of payout
 *                       amount:
 *                         type: number
 *                         description: Payout amount
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Affiliate not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Affiliate not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
// Get affiliate performance metrics
exports.getAffiliatePerformance = async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

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

    const [referrals, commissions, payouts] = await Promise.all([
      Referral.find({
        affiliateId: affiliate._id,
        createdAt: { $gte: startDate }
      }).sort({ createdAt: 1 }),
      Commission.find({
        affiliateId: affiliate._id,
        createdAt: { $gte: startDate }
      }).sort({ createdAt: 1 }),
      Payout.find({
        affiliateId: affiliate._id,
        createdAt: { $gte: startDate }
      }).sort({ createdAt: 1 })
    ]);

    const performance = {
      referrals: referrals.map(r => ({
        date: r.createdAt,
        count: 1,
        value: r.conversionValue || 0
      })),
      commissions: commissions.map(c => ({
        date: c.createdAt,
        amount: c.amount
      })),
      payouts: payouts.map(p => ({
        date: p.createdAt,
        amount: p.amount
      }))
    };

    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/affiliates/{id}/settings:
 *   put:
 *     summary: Update affiliate settings
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Affiliate ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: object
 *                 properties:
 *                   minimumPayout:
 *                     type: number
 *                     description: Minimum payout amount
 *                     example: 1000
 *                   autoPayout:
 *                     type: boolean
 *                     description: Enable automatic payouts
 *                     example: false
 *                   notifications:
 *                     type: object
 *                     properties:
 *                       newReferral:
 *                         type: boolean
 *                         description: Notify on new referral
 *                         example: true
 *                       conversion:
 *                         type: boolean
 *                         description: Notify on conversion
 *                         example: true
 *                       payout:
 *                         type: boolean
 *                         description: Notify on payout
 *                         example: true
 *     responses:
 *       200:
 *         description: Affiliate settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Affiliate'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Affiliate not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Affiliate not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
// Update affiliate settings
exports.updateAffiliateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const affiliate = await Affiliate.findById(req.params.id);
    
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    affiliate.settings = {
      ...affiliate.settings,
      ...settings
    };

    await affiliate.save();
    res.json(affiliate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/affiliates/{id}/materials:
 *   get:
 *     summary: Get affiliate marketing materials
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Affiliate ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Marketing materials retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     format: ObjectId
 *                     description: Material ID
 *                   title:
 *                     type: string
 *                     description: Material title
 *                   type:
 *                     type: string
 *                     description: Material type
 *                   url:
 *                     type: string
 *                     description: Material URL
 *                   metadata:
 *                     type: object
 *                     description: Additional material metadata
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Affiliate not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Affiliate not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
// Get affiliate marketing materials
exports.getAffiliateMaterials = async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id)
      .populate('marketingMaterials');
    
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    res.json(affiliate.marketingMaterials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/affiliates/{id}/materials:
 *   post:
 *     summary: Add marketing material to affiliate
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Affiliate ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - url
 *             properties:
 *               title:
 *                 type: string
 *                 description: Material title
 *                 example: "Product Banner"
 *               type:
 *                 type: string
 *                 description: Material type
 *                 example: "banner"
 *               url:
 *                 type: string
 *                 description: Material URL
 *                 example: "https://example.com/banner.jpg"
 *               metadata:
 *                 type: object
 *                 description: Additional material metadata
 *                 example: { "size": "728x90", "format": "jpg" }
 *     responses:
 *       201:
 *         description: Marketing material added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   format: ObjectId
 *                   description: Material ID
 *                 title:
 *                   type: string
 *                   description: Material title
 *                 type:
 *                   type: string
 *                   description: Material type
 *                 url:
 *                   type: string
 *                   description: Material URL
 *                 metadata:
 *                   type: object
 *                   description: Additional material metadata
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Affiliate not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Affiliate not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
// Add marketing material to affiliate
exports.addMarketingMaterial = async (req, res) => {
  try {
    const { title, type, url, metadata } = req.body;
    const affiliate = await Affiliate.findById(req.params.id);
    
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    const material = new MarketingMaterial({
      title,
      type,
      url,
      metadata,
      createdBy: req.user._id
    });

    await material.save();
    affiliate.marketingMaterials.push(material._id);
    await affiliate.save();

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/affiliates/all:
 *   get:
 *     summary: Get all affiliates (admin only)
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All affiliates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 results:
 *                   type: integer
 *                   description: Number of affiliates
 *                   example: 25
 *                 data:
 *                   type: object
 *                   properties:
 *                     affiliates:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Affiliate'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 */
// Get all affiliates
exports.getAllAffiliates = async (req, res, next) => {
  try {
    const affiliates = await Affiliate.find()
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: affiliates.length,
      data: {
        affiliates
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/affiliates/{id}/status:
 *   put:
 *     summary: Update affiliate status
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Affiliate ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 description: New affiliate status
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Affiliate status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     affiliate:
 *                       $ref: '#/components/schemas/Affiliate'
 *       400:
 *         description: Bad request - Invalid status value
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid status value"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Affiliate not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No affiliate found with that ID"
 *       500:
 *         description: Server error
 */
// Update affiliate status
exports.updateAffiliateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return next(new BadRequestError('Invalid status value'));
    }

    const affiliate = await Affiliate.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true
      }
    );

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        affiliate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/affiliates/{id}/commission-rate:
 *   put:
 *     summary: Update affiliate commission rate
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Affiliate ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commissionRate
 *             properties:
 *               commissionRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: New commission rate percentage
 *                 example: 20
 *     responses:
 *       200:
 *         description: Commission rate updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     affiliate:
 *                       $ref: '#/components/schemas/Affiliate'
 *       400:
 *         description: Bad request - Commission rate must be between 0 and 100
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Commission rate must be between 0 and 100"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Affiliate not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No affiliate found with that ID"
 *       500:
 *         description: Server error
 */
// Update commission rate
exports.updateCommissionRate = async (req, res, next) => {
  try {
    const { commissionRate } = req.body;

    if (commissionRate < 0 || commissionRate > 100) {
      return next(new BadRequestError('Commission rate must be between 0 and 100'));
    }

    const affiliate = await Affiliate.findByIdAndUpdate(
      req.params.id,
      { commissionRate },
      {
        new: true,
        runValidators: true
      }
    );

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        affiliate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/affiliates/dashboard/overview:
 *   get:
 *     summary: Get affiliate dashboard overview
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       description: Dashboard statistics
 *                       properties:
 *                         totalReferrals:
 *                           type: integer
 *                           description: Total number of referrals
 *                         activeReferrals:
 *                           type: integer
 *                           description: Number of active referrals
 *                         conversionRate:
 *                           type: number
 *                           description: Conversion rate percentage
 *                         totalEarnings:
 *                           type: number
 *                           description: Total earnings
 *                         pendingEarnings:
 *                           type: number
 *                           description: Pending earnings
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: No affiliate found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No affiliate found for this user"
 *       500:
 *         description: Server error
 */
// Get dashboard overview
exports.getDashboardOverview = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    // Get summary statistics
    const stats = await affiliate.getStats();

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/affiliates/profile:
 *   get:
 *     summary: Get affiliate profile (current user)
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Affiliate profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     affiliate:
 *                       $ref: '#/components/schemas/Affiliate'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: No affiliate found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No affiliate found for this user"
 *       500:
 *         description: Server error
 */
// Get affiliate profile
exports.getMyProfile = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        affiliate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/affiliates/profile:
 *   put:
 *     summary: Update affiliate profile (current user)
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metadata:
 *                 type: object
 *                 properties:
 *                   website:
 *                     type: string
 *                     description: Affiliate website URL
 *                     example: "https://example.com"
 *                   description:
 *                     type: string
 *                     description: Affiliate description
 *                     example: "Professional affiliate marketer"
 *                   socialMedia:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Social media profiles
 *                     example: ["https://twitter.com/affiliate", "https://linkedin.com/in/affiliate"]
 *               paymentDetails:
 *                 type: object
 *                 properties:
 *                   paymentMethod:
 *                     type: string
 *                     enum: [bank_transfer, paypal, stripe]
 *                     description: Payment method
 *                   paypalEmail:
 *                     type: string
 *                     description: PayPal email address
 *     responses:
 *       200:
 *         description: Affiliate profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     affiliate:
 *                       $ref: '#/components/schemas/Affiliate'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: No affiliate found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No affiliate found for this user"
 *       500:
 *         description: Server error
 */
// Update affiliate profile
exports.updateMyProfile = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        affiliate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/affiliates/settings:
 *   get:
 *     summary: Get affiliate settings (current user)
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Affiliate settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     settings:
 *                       type: object
 *                       properties:
 *                         minimumPayout:
 *                           type: number
 *                           description: Minimum payout amount
 *                           example: 1000
 *                         autoPayout:
 *                           type: boolean
 *                           description: Enable automatic payouts
 *                           example: false
 *                         notifications:
 *                           type: object
 *                           properties:
 *                             newReferral:
 *                               type: boolean
 *                               description: Notify on new referral
 *                               example: true
 *                             conversion:
 *                               type: boolean
 *                               description: Notify on conversion
 *                               example: true
 *                             payout:
 *                               type: boolean
 *                               description: Notify on payout
 *                               example: true
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: No affiliate found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No affiliate found for this user"
 *       500:
 *         description: Server error
 */
// Get affiliate settings
exports.getMySettings = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        settings: affiliate.settings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/affiliates/settings:
 *   put:
 *     summary: Update affiliate settings (current user)
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minimumPayout:
 *                 type: number
 *                 description: Minimum payout amount
 *                 example: 1000
 *               autoPayout:
 *                 type: boolean
 *                 description: Enable automatic payouts
 *                 example: false
 *               notifications:
 *                 type: object
 *                 properties:
 *                   newReferral:
 *                     type: boolean
 *                     description: Notify on new referral
 *                     example: true
 *                   conversion:
 *                     type: boolean
 *                     description: Notify on conversion
 *                     example: true
 *                   payout:
 *                     type: boolean
 *                     description: Notify on payout
 *                     example: true
 *     responses:
 *       200:
 *         description: Affiliate settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     settings:
 *                       type: object
 *                       description: Updated affiliate settings
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: No affiliate found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No affiliate found for this user"
 *       500:
 *         description: Server error
 */
// Update affiliate settings
exports.updateMySettings = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { settings: req.body } },
      {
        new: true,
        runValidators: true
      }
    );

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        settings: affiliate.settings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/affiliates/payout-settings:
 *   get:
 *     summary: Get affiliate payout settings (current user)
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payout settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     payoutSettings:
 *                       type: object
 *                       properties:
 *                         paymentMethod:
 *                           type: string
 *                           enum: [bank_transfer, paypal, stripe]
 *                           description: Payment method
 *                           example: "paypal"
 *                         bankName:
 *                           type: string
 *                           description: Bank name
 *                           example: "Chase Bank"
 *                         accountNumber:
 *                           type: string
 *                           description: Bank account number
 *                           example: "****1234"
 *                         accountName:
 *                           type: string
 *                           description: Account holder name
 *                           example: "John Doe"
 *                         swiftCode:
 *                           type: string
 *                           description: SWIFT/BIC code
 *                           example: "CHASUS33"
 *                         paypalEmail:
 *                           type: string
 *                           description: PayPal email address
 *                           example: "affiliate@example.com"
 *                         stripeAccountId:
 *                           type: string
 *                           description: Stripe account ID
 *                           example: "acct_1234567890"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: No affiliate found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No affiliate found for this user"
 *       500:
 *         description: Server error
 */
// Get payout settings
exports.getPayoutSettings = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        payoutSettings: affiliate.payoutSettings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/affiliates/payout-settings:
 *   put:
 *     summary: Update affiliate payout settings (current user)
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [bank_transfer, paypal, stripe]
 *                 description: Payment method
 *                 example: "paypal"
 *               bankName:
 *                 type: string
 *                 description: Bank name
 *                 example: "Chase Bank"
 *               accountNumber:
 *                 type: string
 *                 description: Bank account number
 *                 example: "1234567890"
 *               accountName:
 *                 type: string
 *                 description: Account holder name
 *                 example: "John Doe"
 *               swiftCode:
 *                 type: string
 *                 description: SWIFT/BIC code
 *                 example: "CHASUS33"
 *               paypalEmail:
 *                 type: string
 *                 description: PayPal email address
 *                 example: "affiliate@example.com"
 *               stripeAccountId:
 *                 type: string
 *                 description: Stripe account ID
 *                 example: "acct_1234567890"
 *     responses:
 *       200:
 *         description: Payout settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     payoutSettings:
 *                       type: object
 *                       description: Updated payout settings
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: No affiliate found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No affiliate found for this user"
 *       500:
 *         description: Server error
 */
// Update payout settings
exports.updatePayoutSettings = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { payoutSettings: req.body } },
      {
        new: true,
        runValidators: true
      }
    );

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        payoutSettings: affiliate.payoutSettings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/affiliates/performance:
 *   get:
 *     summary: Get affiliate performance metrics (current user)
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     performance:
 *                       type: object
 *                       description: Performance metrics data
 *                       properties:
 *                         totalReferrals:
 *                           type: integer
 *                           description: Total number of referrals
 *                           example: 150
 *                         activeReferrals:
 *                           type: integer
 *                           description: Number of active referrals
 *                           example: 120
 *                         conversionRate:
 *                           type: number
 *                           description: Conversion rate percentage
 *                           example: 80.0
 *                         totalEarnings:
 *                           type: number
 *                           description: Total earnings
 *                           example: 5000.00
 *                         pendingEarnings:
 *                           type: number
 *                           description: Pending earnings
 *                           example: 750.00
 *                         averageOrderValue:
 *                           type: number
 *                           description: Average order value
 *                           example: 125.50
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: No affiliate found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No affiliate found for this user"
 *       500:
 *         description: Server error
 */
// Get performance metrics
exports.getMyPerformance = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    const performance = await affiliate.getPerformance();

    res.status(200).json({
      status: 'success',
      data: {
        performance
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/affiliates/reports:
 *   get:
 *     summary: Get affiliate reports (current user)
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reports:
 *                       type: object
 *                       description: Affiliate reports data
 *                       properties:
 *                         referralReport:
 *                           type: object
 *                           description: Referral performance report
 *                           properties:
 *                             totalReferrals:
 *                               type: integer
 *                               description: Total referrals
 *                               example: 150
 *                             monthlyReferrals:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   month:
 *                                     type: string
 *                                     description: Month
 *                                     example: "2024-01"
 *                                   count:
 *                                     type: integer
 *                                     description: Referral count
 *                                     example: 25
 *                         earningsReport:
 *                           type: object
 *                           description: Earnings performance report
 *                           properties:
 *                             totalEarnings:
 *                               type: number
 *                               description: Total earnings
 *                               example: 5000.00
 *                             monthlyEarnings:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   month:
 *                                     type: string
 *                                     description: Month
 *                                     example: "2024-01"
 *                                   amount:
 *                                     type: number
 *                                     description: Earnings amount
 *                                     example: 850.00
 *                         conversionReport:
 *                           type: object
 *                           description: Conversion performance report
 *                           properties:
 *                             overallRate:
 *                               type: number
 *                               description: Overall conversion rate
 *                               example: 80.0
 *                             monthlyRates:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   month:
 *                                     type: string
 *                                     description: Month
 *                                     example: "2024-01"
 *                                   rate:
 *                                     type: number
 *                                     description: Conversion rate
 *                                     example: 85.0
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: No affiliate found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No affiliate found for this user"
 *       500:
 *         description: Server error
 */
// Get reports
exports.getMyReports = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    const reports = await affiliate.getReports();

    res.status(200).json({
      status: 'success',
      data: {
        reports
      }
    });
  } catch (error) {
    next(error);
  }
}; 