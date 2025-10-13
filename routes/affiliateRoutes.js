const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Affiliates
 *     description: affiliates operations
 */

const { protect, restrictTo } = require('../middleware/authMiddleware');
const { isAffiliate, hasAffiliatePermission } = require('../middleware/affiliateAuth');
const affiliateController = require('../controllers/affiliateController');
const referralController = require('../controllers/referralController');
const commissionController = require('../controllers/commissionController');
const payoutController = require('../controllers/payoutController');
const marketingMaterialController = require('../controllers/marketingMaterialController');

// Affiliate Management Routes
router.use(protect); // All affiliate routes require authentication

// Admin only routes
router.use(restrictTo('admin')); // Restrict all affiliate management routes to admin only

// Affiliate CRUD routes
router.route('/')
  .get(affiliateController.getAllAffiliates)
  .post(affiliateController.createAffiliate);

router.route('/:id')
  .get(affiliateController.getAffiliate)
  .patch(affiliateController.updateAffiliate)
  .delete(affiliateController.deleteAffiliate);

// Affiliate status management

/**
 * @swagger
 * /api/affiliates/:id/status:
 *   patch:
 *     summary: Update Status
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/:id/status', affiliateController.updateAffiliateStatus);

/**
 * @swagger
 * /api/affiliates/:id/commission-rate:
 *   patch:
 *     summary: Update Commission-rate
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/:id/commission-rate', affiliateController.updateCommissionRate);

// Referral routes
router.route('/:affiliateId/referrals')
  .get(referralController.getAffiliateReferrals)
  .post(referralController.createReferral);

router.route('/:affiliateId/referrals/:id')
  .get(referralController.getReferral)
  .patch(referralController.updateReferral);

// Commission routes
router.route('/:affiliateId/commissions')
  .get(commissionController.getAffiliateCommissions)
  .post(commissionController.createCommission);

router.route('/:affiliateId/commissions/:id')
  .get(commissionController.getCommission)
  .patch(commissionController.updateCommission);

// Payout routes
router.route('/:affiliateId/payouts')
  .get(payoutController.getAffiliatePayouts)
  .post(payoutController.createPayout);

router.route('/:affiliateId/payouts/:id')
  .get(payoutController.getPayout)
  .patch(payoutController.updatePayout);

// Marketing Material routes
router.route('/:affiliateId/materials')
  .get(marketingMaterialController.getAffiliateMaterials)
  .post(marketingMaterialController.createMaterial);

router.route('/:affiliateId/materials/:id')
  .get(marketingMaterialController.getMaterial)
  .patch(marketingMaterialController.updateMaterial)
  .delete(marketingMaterialController.deleteMaterial);

// Affiliate Dashboard Routes (for affiliates themselves)
router.use('/dashboard', isAffiliate); // Require affiliate authentication


/**
 * @swagger
 * /api/affiliates/dashboard/overview:
 *   get:
 *     summary: Get Overview
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/dashboard/overview', affiliateController.getDashboardOverview);

/**
 * @swagger
 * /api/affiliates/dashboard/referrals:
 *   get:
 *     summary: Get Referrals
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/dashboard/referrals', referralController.getMyReferrals);

/**
 * @swagger
 * /api/affiliates/dashboard/commissions:
 *   get:
 *     summary: Get Commissions
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/dashboard/commissions', commissionController.getMyCommissions);

/**
 * @swagger
 * /api/affiliates/dashboard/payouts:
 *   get:
 *     summary: Get Payouts
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/dashboard/payouts', payoutController.getMyPayouts);

/**
 * @swagger
 * /api/affiliates/dashboard/materials:
 *   get:
 *     summary: Get Materials
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/dashboard/materials', marketingMaterialController.getMyMaterials);

// Affiliate Profile Routes

/**
 * @swagger
 * /api/affiliates/profile:
 *   get:
 *     summary: Get Profile
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/profile', isAffiliate, affiliateController.getMyProfile);

/**
 * @swagger
 * /api/affiliates/profile:
 *   patch:
 *     summary: Update Profile
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/profile', isAffiliate, affiliateController.updateMyProfile);

// Affiliate Settings Routes

/**
 * @swagger
 * /api/affiliates/settings:
 *   get:
 *     summary: Get Settings
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/settings', isAffiliate, affiliateController.getMySettings);

/**
 * @swagger
 * /api/affiliates/settings:
 *   patch:
 *     summary: Update Settings
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/settings', isAffiliate, affiliateController.updateMySettings);

// Affiliate Payout Settings

/**
 * @swagger
 * /api/affiliates/payout-settings:
 *   get:
 *     summary: Get Payout-settings
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/payout-settings', isAffiliate, affiliateController.getPayoutSettings);

/**
 * @swagger
 * /api/affiliates/payout-settings:
 *   patch:
 *     summary: Update Payout-settings
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/payout-settings', isAffiliate, affiliateController.updatePayoutSettings);

// Affiliate Marketing Material Management

/**
 * @swagger
 * /api/affiliates/materials:
 *   post:
 *     summary: Create Materials
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/materials', isAffiliate, marketingMaterialController.createMyMaterial);

/**
 * @swagger
 * /api/affiliates/materials/:id:
 *   patch:
 *     summary: Update Materials
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/materials/:id', isAffiliate, marketingMaterialController.updateMyMaterial);

/**
 * @swagger
 * /api/affiliates/materials/:id:
 *   delete:
 *     summary: Delete Materials
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/materials/:id', isAffiliate, marketingMaterialController.deleteMyMaterial);

// Affiliate Performance Routes

/**
 * @swagger
 * /api/affiliates/performance:
 *   get:
 *     summary: Get Performance
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/performance', isAffiliate, affiliateController.getMyPerformance);

/**
 * @swagger
 * /api/affiliates/performance/referrals:
 *   get:
 *     summary: Get Referrals
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/performance/referrals', isAffiliate, referralController.getMyReferralStats);

/**
 * @swagger
 * /api/affiliates/performance/commissions:
 *   get:
 *     summary: Get Commissions
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/performance/commissions', isAffiliate, commissionController.getMyCommissionStats);

// Affiliate Reports Routes

/**
 * @swagger
 * /api/affiliates/reports:
 *   get:
 *     summary: Get Reports
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/reports', isAffiliate, affiliateController.getMyReports);

/**
 * @swagger
 * /api/affiliates/reports/referrals:
 *   get:
 *     summary: Get Referrals
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/reports/referrals', isAffiliate, referralController.getMyReferralReport);

/**
 * @swagger
 * /api/affiliates/reports/commissions:
 *   get:
 *     summary: Get Commissions
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/reports/commissions', isAffiliate, commissionController.getMyCommissionReport);

/**
 * @swagger
 * /api/affiliates/reports/payouts:
 *   get:
 *     summary: Get Payouts
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operation completed successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/reports/payouts', isAffiliate, payoutController.getMyPayoutReport);

module.exports = router; 
