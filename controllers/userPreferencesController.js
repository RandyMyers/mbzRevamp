const User = require('../models/users');
const Organization = require('../models/organization');
const currencyUtils = require('../utils/currencyUtils');
const currencyList = require('../utils/currencyList');
const CurrencyMigrationService = require('../services/currencyMigrationService');
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserPreferences:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             displayCurrency:
 *               type: string
 *               description: User's preferred display currency
 *               example: "USD"
 *             organization:
 *               type: object
 *               properties:
 *                 defaultCurrency:
 *                   type: string
 *                   description: Organization's default currency
 *                   example: "USD"
 *                 analyticsCurrency:
 *                   type: string
 *                   description: Currency used for analytics
 *                   example: "USD"
 *                 name:
 *                   type: string
 *                   description: Organization name
 *                   example: "My Company"
 *         availableCurrencies:
 *           type: array
 *           items:
 *             type: string
 *           description: List of available currency codes
 *           example: ["USD", "EUR", "GBP", "NGN"]
 *         popularCurrencies:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Currency code
 *                 example: "USD"
 *               name:
 *                 type: string
 *                 description: Currency name
 *                 example: "US Dollar"
 *         totalSupportedCurrencies:
 *           type: number
 *           description: Total number of supported currencies
 *           example: 150
 *         organizationSettings:
 *           type: object
 *           properties:
 *             defaultCurrency:
 *               type: string
 *               description: Organization default currency
 *               example: "USD"
 *             analyticsCurrency:
 *               type: string
 *               description: Analytics currency
 *               example: "USD"
 *     
 *     CurrencyUpdate:
 *       type: object
 *       required:
 *         - userId
 *         - displayCurrency
 *       properties:
 *         userId:
 *           type: string
 *           format: ObjectId
 *           description: User ID
 *           example: "507f1f77bcf86cd799439011"
 *         displayCurrency:
 *           type: string
 *           description: New display currency code
 *           example: "EUR"
 *     
 *     AnalyticsCurrencyUpdate:
 *       type: object
 *       required:
 *         - organizationId
 *         - analyticsCurrency
 *       properties:
 *         organizationId:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID
 *           example: "507f1f77bcf86cd799439011"
 *         analyticsCurrency:
 *           type: string
 *           description: New analytics currency code
 *           example: "EUR"
 *     
 *     CurrencyConversionPreview:
 *       type: object
 *       required:
 *         - organizationId
 *         - amount
 *         - fromCurrency
 *         - toCurrency
 *       properties:
 *         organizationId:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID
 *           example: "507f1f77bcf86cd799439011"
 *         amount:
 *           type: number
 *           description: Amount to convert
 *           example: 100.50
 *         fromCurrency:
 *           type: string
 *           description: Source currency code
 *           example: "USD"
 *         toCurrency:
 *           type: string
 *           description: Target currency code
 *           example: "EUR"
 *     
 *     CurrencyStats:
 *       type: object
 *       properties:
 *         totalCurrencies:
 *           type: number
 *           description: Total number of currencies
 *           example: 25
 *         activeCurrencies:
 *           type: number
 *           description: Number of active currencies
 *           example: 20
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         exchangeRates:
 *           type: object
 *           description: Exchange rate statistics
 *     
 *     AvailableCurrencies:
 *       type: object
 *       properties:
 *         availableCurrencies:
 *           type: array
 *           items:
 *             type: string
 *           description: All available currency codes
 *           example: ["USD", "EUR", "GBP", "NGN"]
 *         popularCurrencies:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Currency code
 *                 example: "USD"
 *               name:
 *                 type: string
 *                 description: Currency name
 *                 example: "US Dollar"
 *         regionalCurrencies:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Currency code
 *                 example: "NGN"
 *               name:
 *                 type: string
 *                 description: Currency name
 *                 example: "Nigerian Naira"
 *         exchangeRateCurrencies:
 *           type: array
 *           items:
 *             type: string
 *           description: Currencies with exchange rates
 *           example: ["USD", "EUR"]
 *         orderCurrencies:
 *           type: array
 *           items:
 *             type: string
 *           description: Currencies used in orders
 *           example: ["USD", "NGN"]
 *         totalSupported:
 *           type: number
 *           description: Total supported currencies
 *           example: 150
 *         totalAvailable:
 *           type: number
 *           description: Total available currencies
 *           example: 25
 */

/**
 * @swagger
 * /api/user-preferences:
 *   get:
 *     summary: Get user preferences including currency settings
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: User ID to get preferences for
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID for context
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserPreferences'
 *       400:
 *         description: Bad request - Missing userId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "User ID is required"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch user preferences"
 */

// Get user preferences
exports.getUserPreferences = async (req, res) => {
  try {
    const { userId, organizationId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }

    const user = await User.findById(userId)
      .select('displayCurrency organization')
      .populate('organization', 'defaultCurrency analyticsCurrency name');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Get available currencies from exchange rates
    const ExchangeRate = require('../models/exchangeRate');
    const availableCurrencies = await ExchangeRate.distinct('baseCurrency', {
      organizationId: organizationId ? new mongoose.Types.ObjectId(organizationId) : null
    });

    // Get comprehensive currency list from currency.txt
    const allSupportedCurrencies = currencyList.getSupportedCurrencies();
    const popularCurrencies = currencyList.getPopularCurrencies();
    
    // Combine database currencies with comprehensive list
    const allCurrencies = [...new Set([...availableCurrencies, ...allSupportedCurrencies.map(c => c.code)])].sort();

    res.json({
      success: true,
      data: {
        user: {
          displayCurrency: user.displayCurrency,
          organization: user.organization
        },
        availableCurrencies: allCurrencies,
        popularCurrencies: popularCurrencies.map(c => ({ code: c.code, name: c.name })),
        totalSupportedCurrencies: allSupportedCurrencies.length,
        organizationSettings: {
          defaultCurrency: user.organization?.defaultCurrency || 'USD',
          analyticsCurrency: user.organization?.analyticsCurrency || 'USD'
        }
      }
    });
  } catch (error) {
    console.error('Get User Preferences Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user preferences"
    });
  }
};

/**
 * @swagger
 * /api/user-preferences/update-display-currency:
 *   put:
 *     summary: Update user's display currency preference
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CurrencyUpdate'
 *     responses:
 *       200:
 *         description: Display currency updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     displayCurrency:
 *                       type: string
 *                       description: Updated display currency
 *                       example: "EUR"
 *       400:
 *         description: Bad request - Missing required fields or invalid currency
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "User ID and display currency are required"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to update display currency"
 */

// Update user display currency
exports.updateDisplayCurrency = async (req, res) => {
  try {
    const { userId, displayCurrency } = req.body;

    if (!userId || !displayCurrency) {
      return res.status(400).json({
        success: false,
        error: "User ID and display currency are required"
      });
    }

    // Validate currency code using comprehensive list
    if (!currencyList.isValidCurrencyCode(displayCurrency)) {
      return res.status(400).json({
        success: false,
        error: "Invalid currency code. Please select from the supported currencies list."
      });
    }

    // Get current user to check if currency is actually changing
    const currentUser = await User.findById(userId).select('displayCurrency organizationId');
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Check if currency is actually changing
    const isCurrencyChanging = currentUser.displayCurrency !== displayCurrency;
    
    // Update user's display currency
    const user = await User.findByIdAndUpdate(
      userId,
      { displayCurrency },
      { new: true, runValidators: true }
    ).select('displayCurrency');

    let migrationResults = null;
    
    // If currency is changing, migrate existing data
    if (isCurrencyChanging) {
      try {
        console.log(`🔄 Currency changed from ${currentUser.displayCurrency} to ${displayCurrency}, starting data migration...`);
        migrationResults = await CurrencyMigrationService.convertUserData(userId, displayCurrency);
        console.log(`✅ Data migration completed: ${migrationResults.totalConverted} items converted`);
      } catch (migrationError) {
        console.error('❌ Data migration failed:', migrationError);
        // Don't fail the request, just log the error
        // User preference is still updated
      }
    }

    res.json({
      success: true,
      data: {
        displayCurrency: user.displayCurrency,
        migrationResults: migrationResults ? {
          totalConverted: migrationResults.totalConverted,
          totalFailed: migrationResults.totalFailed,
          products: migrationResults.products,
          orders: migrationResults.orders
        } : null,
        currencyChanged: isCurrencyChanging
      }
    });
  } catch (error) {
    console.error('Update Display Currency Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update display currency"
    });
  }
};

/**
 * @swagger
 * /api/user-preferences/update-analytics-currency:
 *   put:
 *     summary: Update organization's analytics currency
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnalyticsCurrencyUpdate'
 *     responses:
 *       200:
 *         description: Analytics currency updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     analyticsCurrency:
 *                       type: string
 *                       description: Updated analytics currency
 *                       example: "EUR"
 *                     defaultCurrency:
 *                       type: string
 *                       description: Organization default currency
 *                       example: "USD"
 *                     organizationName:
 *                       type: string
 *                       description: Organization name
 *                       example: "My Company"
 *       400:
 *         description: Bad request - Missing required fields or invalid currency format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Organization ID and analytics currency are required"
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Organization not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to update analytics currency"
 */

// Update organization analytics currency
exports.updateAnalyticsCurrency = async (req, res) => {
  try {
    const { organizationId, analyticsCurrency } = req.body;

    if (!organizationId || !analyticsCurrency) {
      return res.status(400).json({
        success: false,
        error: "Organization ID and analytics currency are required"
      });
    }

    // Validate currency code
    const currencyRegex = /^[A-Z]{3}$/;
    if (!currencyRegex.test(analyticsCurrency)) {
      return res.status(400).json({
        success: false,
        error: "Currency code must be 3 uppercase letters (e.g., USD, EUR, NGN)"
      });
    }

    // Get current organization to check if currency is actually changing
    const currentOrganization = await Organization.findById(organizationId).select('analyticsCurrency defaultCurrency name');
    if (!currentOrganization) {
      return res.status(404).json({
        success: false,
        error: "Organization not found"
      });
    }

    // Check if currency is actually changing
    const isCurrencyChanging = currentOrganization.analyticsCurrency !== analyticsCurrency;
    
    // Update organization's analytics currency
    const organization = await Organization.findByIdAndUpdate(
      organizationId,
      { analyticsCurrency },
      { new: true, runValidators: true }
    ).select('analyticsCurrency defaultCurrency name');

    let migrationResults = null;
    
    // If currency is changing, migrate all organization data
    if (isCurrencyChanging) {
      try {
        console.log(`🔄 Organization currency changed from ${currentOrganization.analyticsCurrency} to ${analyticsCurrency}, starting data migration...`);
        migrationResults = await CurrencyMigrationService.convertOrganizationData(organizationId, analyticsCurrency);
        console.log(`✅ Organization data migration completed: ${migrationResults.totalConverted} items converted`);
      } catch (migrationError) {
        console.error('❌ Organization data migration failed:', migrationError);
        // Don't fail the request, just log the error
        // Organization preference is still updated
      }
    }

    res.json({
      success: true,
      data: {
        analyticsCurrency: organization.analyticsCurrency,
        defaultCurrency: organization.defaultCurrency,
        organizationName: organization.name,
        migrationResults: migrationResults ? {
          totalConverted: migrationResults.totalConverted,
          totalFailed: migrationResults.totalFailed,
          userResults: migrationResults.userResults
        } : null,
        currencyChanged: isCurrencyChanging
      }
    });
  } catch (error) {
    console.error('Update Analytics Currency Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update analytics currency"
    });
  }
};

/**
 * @swagger
 * /api/user-preferences/currency-conversion-preview:
 *   get:
 *     summary: Get currency conversion preview for a given amount
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Amount to convert
 *       - in: query
 *         name: fromCurrency
 *         required: true
 *         schema:
 *           type: string
 *         description: Source currency code
 *       - in: query
 *         name: toCurrency
 *         required: true
 *         schema:
 *           type: string
 *         description: Target currency code
 *     responses:
 *       200:
 *         description: Currency conversion preview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     originalAmount:
 *                       type: number
 *                       description: Original amount
 *                       example: 100.50
 *                     originalCurrency:
 *                       type: string
 *                       description: Source currency
 *                       example: "USD"
 *                     convertedAmount:
 *                       type: number
 *                       description: Converted amount
 *                       example: 85.42
 *                     targetCurrency:
 *                       type: string
 *                       description: Target currency
 *                       example: "EUR"
 *                     exchangeRate:
 *                       type: string
 *                       description: Exchange rate used
 *                       example: "0.85"
 *       400:
 *         description: Bad request - Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Organization ID, amount, from currency, and to currency are required"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to get currency conversion preview"
 */

// Get currency conversion preview
exports.getCurrencyConversionPreview = async (req, res) => {
  try {
    const { organizationId, amount, fromCurrency, toCurrency } = req.query;

    if (!organizationId || !amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        error: "Organization ID, amount, from currency, and to currency are required"
      });
    }

    const convertedAmount = await currencyUtils.convertCurrency(
      parseFloat(amount),
      fromCurrency,
      toCurrency,
      organizationId
    );

    // Get exchange rate for display
    const exchangeRate = await currencyUtils.getExchangeRate(
      organizationId,
      fromCurrency,
      toCurrency
    );

    res.json({
      success: true,
      data: {
        originalAmount: parseFloat(amount),
        originalCurrency: fromCurrency,
        convertedAmount,
        targetCurrency: toCurrency,
        exchangeRate: exchangeRate || 'Rate not available'
      }
    });
  } catch (error) {
    console.error('Currency Conversion Preview Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get currency conversion preview"
    });
  }
};

/**
 * @swagger
 * /api/user-preferences/currency-stats:
 *   get:
 *     summary: Get currency statistics for an organization
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Currency statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CurrencyStats'
 *       400:
 *         description: Bad request - Missing organizationId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Organization ID is required"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to get currency statistics"
 */

// Get currency statistics for organization
exports.getCurrencyStats = async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const currencyStats = await currencyUtils.getCurrencyStats(organizationId);

    res.json({
      success: true,
      data: currencyStats
    });
  } catch (error) {
    console.error('Get Currency Stats Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get currency statistics"
    });
  }
};

/**
 * @swagger
 * /api/user-preferences/available-currencies:
 *   get:
 *     summary: Get available currencies for an organization
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Organization ID
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Region to get currencies for (optional)
 *     responses:
 *       200:
 *         description: Available currencies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AvailableCurrencies'
 *       400:
 *         description: Bad request - Missing organizationId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Organization ID is required"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to get available currencies"
 */

// Get available currencies for organization
exports.getAvailableCurrencies = async (req, res) => {
  try {
    const { organizationId, region } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const ExchangeRate = require('../models/exchangeRate');
    
    // Get currencies from exchange rates
    const exchangeRateCurrencies = await ExchangeRate.distinct('baseCurrency', {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      isActive: true
    });

    // Get currencies from orders
    const Order = require('../models/order');
    const orderCurrencies = await Order.distinct('currency', {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      currency: { $exists: true, $ne: null }
    });

    // Get comprehensive currency list
    const allSupportedCurrencies = currencyList.getSupportedCurrencies();
    const popularCurrencies = currencyList.getPopularCurrencies();
    
    // Get regional currencies if specified
    let regionalCurrencies = [];
    if (region) {
      regionalCurrencies = currencyList.getCurrenciesByRegion(region);
    }

    // Combine and deduplicate
    const allCurrencies = [...new Set([
      ...exchangeRateCurrencies, 
      ...orderCurrencies,
      ...allSupportedCurrencies.map(c => c.code)
    ])].sort();

    res.json({
      success: true,
      data: {
        availableCurrencies: allCurrencies,
        popularCurrencies: popularCurrencies.map(c => ({ code: c.code, name: c.name })),
        regionalCurrencies: regionalCurrencies.map(c => ({ code: c.code, name: c.name })),
        exchangeRateCurrencies,
        orderCurrencies,
        totalSupported: allSupportedCurrencies.length,
        totalAvailable: allCurrencies.length
      }
    });
  } catch (error) {
    console.error('Get Available Currencies Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get available currencies"
    });
  }
}; 