const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Exchange Rates
 *     description: exchange rates operations
 */

const exchangeRateController = require('../controllers/exchangeRateController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Get all exchange rates for an organization

/**
 * @swagger
 * /api/exchange-rates/:
 *   get:
 *     summary: Get Item
 *     tags: [Exchange Rates]
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
router.get('/', exchangeRateController.getExchangeRates);

// Convert currency (must come before /:id route)

/**
 * @swagger
 * /api/exchange-rates/convert:
 *   get:
 *     summary: Get Convert
 *     tags: [Exchange Rates]
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
router.get('/convert', exchangeRateController.convertCurrency);

// Get a specific exchange rate

/**
 * @swagger
 * /api/exchange-rates/:id:
 *   get:
 *     summary: Get Item
 *     tags: [Exchange Rates]
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
router.get('/:id', exchangeRateController.getExchangeRate);

// Create a new exchange rate

/**
 * @swagger
 * /api/exchange-rates/:
 *   post:
 *     summary: Create Item
 *     tags: [Exchange Rates]
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
router.post('/', exchangeRateController.createExchangeRate);

// Bulk create exchange rates

/**
 * @swagger
 * /api/exchange-rates/bulk:
 *   post:
 *     summary: Create Bulk
 *     tags: [Exchange Rates]
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
router.post('/bulk', exchangeRateController.bulkCreateExchangeRates);

// Update an exchange rate

/**
 * @swagger
 * /api/exchange-rates/:id:
 *   put:
 *     summary: Update Item
 *     tags: [Exchange Rates]
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
router.put('/:id', exchangeRateController.updateExchangeRate);

// Delete an exchange rate

/**
 * @swagger
 * /api/exchange-rates/:id:
 *   delete:
 *     summary: Delete Item
 *     tags: [Exchange Rates]
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
router.delete('/:id', exchangeRateController.deleteExchangeRate);

module.exports = router;
