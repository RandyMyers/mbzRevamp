const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: User Preferences
 *     description: user preferences operations
 */

const userPreferencesController = require('../controllers/userPreferencesController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Get user preferences

/**
 * @swagger
 * /api/user-preferences/:
 *   get:
 *     summary: Get Item
 *     tags: [User Preferences]
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
router.get('/', userPreferencesController.getUserPreferences);

// Update user display currency

/**
 * @swagger
 * /api/user-preferences/display-currency:
 *   put:
 *     summary: Update Display-currency
 *     tags: [User Preferences]
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
router.put('/display-currency', userPreferencesController.updateDisplayCurrency);

// Update organization analytics currency

/**
 * @swagger
 * /api/user-preferences/analytics-currency:
 *   put:
 *     summary: Update Analytics-currency
 *     tags: [User Preferences]
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
router.put('/analytics-currency', userPreferencesController.updateAnalyticsCurrency);

// Get currency conversion preview

/**
 * @swagger
 * /api/user-preferences/currency-conversion:
 *   get:
 *     summary: Get Currency-conversion
 *     tags: [User Preferences]
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
router.get('/currency-conversion', userPreferencesController.getCurrencyConversionPreview);

// Get currency statistics

/**
 * @swagger
 * /api/user-preferences/currency-stats:
 *   get:
 *     summary: Get Currency-stats
 *     tags: [User Preferences]
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
router.get('/currency-stats', userPreferencesController.getCurrencyStats);

// Get available currencies

/**
 * @swagger
 * /api/user-preferences/available-currencies:
 *   get:
 *     summary: Get Available-currencies
 *     tags: [User Preferences]
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
router.get('/available-currencies', userPreferencesController.getAvailableCurrencies);

module.exports = router;  
