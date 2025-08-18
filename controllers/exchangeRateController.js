/**
 * @swagger
 * tags:
 *   - name: Exchange Rates
 *     description: Manage organization exchange rates
 *
 * /api/exchange-rates:
 *   get:
 *     tags: [Exchange Rates]
 *     summary: Get exchange rates (by organization)
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: baseCurrency
 *         schema: { type: string }
 *       - in: query
 *         name: targetCurrency
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Rates list }
 *       400: { description: Missing organizationId }
 *       500: { description: Server error }
 *   post:
 *     tags: [Exchange Rates]
 *     summary: Create an exchange rate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationId, baseCurrency, targetCurrency, rate]
 *             properties:
 *               organizationId: { type: string }
 *               baseCurrency: { type: string }
 *               targetCurrency: { type: string }
 *               rate: { type: number }
 *               isCustom: { type: boolean }
 *               source: { type: string }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 *
 * /api/exchange-rates/convert:
 *   get:
 *     tags: [Exchange Rates]
 *     summary: Convert currency amount
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: amount
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: fromCurrency
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: toCurrency
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Conversion result }
 *       400: { description: Missing parameters }
 *       500: { description: Server error }
 *
 * /api/exchange-rates/bulk:
 *   post:
 *     tags: [Exchange Rates]
 *     summary: Bulk create exchange rates
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationId, rates]
 *             properties:
 *               organizationId: { type: string }
 *               rates: { type: array, items: { type: object } }
 *     responses:
 *       200: { description: Bulk result }
 *       400: { description: Validation error }
 *
 * /api/exchange-rates/{id}:
 *   get:
 *     tags: [Exchange Rates]
 *     summary: Get a specific exchange rate
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Rate }
 *       404: { description: Not found }
 *       400: { description: Missing organizationId }
 *   put:
 *     tags: [Exchange Rates]
 *     summary: Update an exchange rate
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
 *               organizationId: { type: string }
 *               rate: { type: number }
 *               isActive: { type: boolean }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *       400: { description: Missing organizationId }
 *   delete:
 *     tags: [Exchange Rates]
 *     summary: Delete an exchange rate
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 *       400: { description: Missing organizationId }
 */
const ExchangeRate = require('../models/exchangeRate');
const mongoose = require('mongoose');
const exchangeRateApiService = require('../services/exchangeRateApiService');
const rateSyncService = require('../services/rateSyncService');

// Get all exchange rates for an organization
exports.getExchangeRates = async (req, res) => {
  try {
    const { organizationId, baseCurrency, targetCurrency, isActive } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const filter = {
      organizationId: new mongoose.Types.ObjectId(organizationId)
    };

    // Add optional filters
    if (baseCurrency) filter.baseCurrency = baseCurrency;
    if (targetCurrency) filter.targetCurrency = targetCurrency;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const exchangeRates = await ExchangeRate.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: exchangeRates
    });
  } catch (error) {
    console.error('Get Exchange Rates Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch exchange rates"
    });
  }
};

// Get a specific exchange rate
exports.getExchangeRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const exchangeRate = await ExchangeRate.findOne({
      _id: id,
      organizationId: new mongoose.Types.ObjectId(organizationId)
    });

    if (!exchangeRate) {
      return res.status(404).json({
        success: false,
        error: "Exchange rate not found"
      });
    }

    res.json({
      success: true,
      data: exchangeRate
    });
  } catch (error) {
    console.error('Get Exchange Rate Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch exchange rate"
    });
  }
};

// Create a new exchange rate
exports.createExchangeRate = async (req, res) => {
  try {
    const { organizationId, baseCurrency, targetCurrency, rate, isCustom = false, source = 'user' } = req.body;

    if (!organizationId || !baseCurrency || !targetCurrency || !rate) {
      return res.status(400).json({
        success: false,
        error: "Organization ID, base currency, target currency, and rate are required"
      });
    }

    // Validate currency codes
    const currencyRegex = /^[A-Z]{3}$/;
    if (!currencyRegex.test(baseCurrency) || !currencyRegex.test(targetCurrency)) {
      return res.status(400).json({
        success: false,
        error: "Currency codes must be 3 uppercase letters (e.g., USD, EUR, NGN)"
      });
    }

    // Check if same currency
    if (baseCurrency === targetCurrency) {
      return res.status(400).json({
        success: false,
        error: "Base currency and target currency cannot be the same"
      });
    }

    // Check if rate already exists
    const existingRate = await ExchangeRate.findOne({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      baseCurrency,
      targetCurrency
    });

    if (existingRate) {
      return res.status(409).json({
        success: false,
        error: "Exchange rate already exists for this currency pair"
      });
    }

    const exchangeRate = new ExchangeRate({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      baseCurrency,
      targetCurrency,
      rate: parseFloat(rate),
      isCustom,
      source
    });

    await exchangeRate.save();

    res.status(201).json({
      success: true,
      data: exchangeRate
    });
  } catch (error) {
    console.error('Create Exchange Rate Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to create exchange rate"
    });
  }
};

// Update an exchange rate
exports.updateExchangeRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId, rate, isActive } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const updateData = {};
    if (rate !== undefined) updateData.rate = parseFloat(rate);
    if (isActive !== undefined) updateData.isActive = isActive;

    const exchangeRate = await ExchangeRate.findOneAndUpdate(
      {
        _id: id,
        organizationId: new mongoose.Types.ObjectId(organizationId)
      },
      updateData,
      { new: true, runValidators: true }
    );

    if (!exchangeRate) {
      return res.status(404).json({
        success: false,
        error: "Exchange rate not found"
      });
    }

    res.json({
      success: true,
      data: exchangeRate
    });
  } catch (error) {
    console.error('Update Exchange Rate Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update exchange rate"
    });
  }
};

// Delete an exchange rate
exports.deleteExchangeRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const exchangeRate = await ExchangeRate.findOneAndDelete({
      _id: id,
      organizationId: new mongoose.Types.ObjectId(organizationId)
    });

    if (!exchangeRate) {
      return res.status(404).json({
        success: false,
        error: "Exchange rate not found"
      });
    }

    res.json({
      success: true,
      message: "Exchange rate deleted successfully"
    });
  } catch (error) {
    console.error('Delete Exchange Rate Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to delete exchange rate"
    });
  }
};

// Bulk create exchange rates
exports.bulkCreateExchangeRates = async (req, res) => {
  try {
    const { organizationId, rates } = req.body;

    if (!organizationId || !rates || !Array.isArray(rates)) {
      return res.status(400).json({
        success: false,
        error: "Organization ID and rates array are required"
      });
    }

    const exchangeRates = [];
    const errors = [];

    for (const rateData of rates) {
      try {
        const { baseCurrency, targetCurrency, rate, isCustom = false, source = 'user' } = rateData;

        if (!baseCurrency || !targetCurrency || !rate) {
          errors.push(`Missing required fields for rate: ${JSON.stringify(rateData)}`);
          continue;
        }

        // Validate currency codes
        const currencyRegex = /^[A-Z]{3}$/;
        if (!currencyRegex.test(baseCurrency) || !currencyRegex.test(targetCurrency)) {
          errors.push(`Invalid currency codes for rate: ${JSON.stringify(rateData)}`);
          continue;
        }

        // Check if same currency
        if (baseCurrency === targetCurrency) {
          errors.push(`Base and target currency cannot be the same: ${JSON.stringify(rateData)}`);
          continue;
        }

        // Check if rate already exists
        const existingRate = await ExchangeRate.findOne({
          organizationId: new mongoose.Types.ObjectId(organizationId),
          baseCurrency,
          targetCurrency
        });

        if (existingRate) {
          errors.push(`Exchange rate already exists for ${baseCurrency} to ${targetCurrency}`);
          continue;
        }

        const exchangeRate = new ExchangeRate({
          organizationId: new mongoose.Types.ObjectId(organizationId),
          baseCurrency,
          targetCurrency,
          rate: parseFloat(rate),
          isCustom,
          source
        });

        exchangeRates.push(exchangeRate);
      } catch (error) {
        errors.push(`Error processing rate: ${JSON.stringify(rateData)} - ${error.message}`);
      }
    }

    if (exchangeRates.length > 0) {
      await ExchangeRate.insertMany(exchangeRates);
    }

    res.json({
      success: true,
      data: {
        created: exchangeRates.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Bulk Create Exchange Rates Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to create exchange rates"
    });
  }
};

// Get currency conversion
exports.convertCurrency = async (req, res) => {
  try {
    const { organizationId, amount, fromCurrency, toCurrency } = req.query;

    if (!organizationId || !amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        error: "Organization ID, amount, from currency, and to currency are required"
      });
    }

    const currencyUtils = require('../utils/currencyUtils');
    const convertedAmount = await currencyUtils.convertCurrency(
      parseFloat(amount),
      fromCurrency,
      toCurrency,
      organizationId
    );

    res.json({
      success: true,
      data: {
        originalAmount: parseFloat(amount),
        originalCurrency: fromCurrency,
        convertedAmount,
        targetCurrency: toCurrency
      }
    });
  } catch (error) {
    console.error('Convert Currency Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to convert currency"
    });
  }
};

// ===== API INTEGRATION ENDPOINTS =====

// Import rates from API
exports.importApiRates = async (req, res) => {
  try {
    const { baseCurrency = 'USD', organizationId } = req.body;

    if (!process.env.EXCHANGE_RATE_API_KEY) {
      return res.status(400).json({
        success: false,
        error: "Exchange Rate API key not configured"
      });
    }

    console.log(`🔄 Importing API rates for ${baseCurrency}...`);

    // Fetch rates from API
    const apiResponse = await exchangeRateApiService.fetchLatestRates(baseCurrency);
    
    // Cache rates in database
    const cachedRates = await exchangeRateApiService.cacheRates(apiResponse, 'api');

    res.json({
      success: true,
      data: {
        baseCurrency,
        importedRates: cachedRates.length,
        lastUpdate: apiResponse.time_last_update_utc,
        nextUpdate: apiResponse.time_next_update_utc,
        rates: cachedRates.slice(0, 10) // Show first 10 rates
      }
    });
  } catch (error) {
    console.error('Import API Rates Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to import API rates",
      details: error.message
    });
  }
};

// Get API quota information
exports.getApiQuota = async (req, res) => {
  try {
    if (!process.env.EXCHANGE_RATE_API_KEY) {
      return res.status(400).json({
        success: false,
        error: "Exchange Rate API key not configured"
      });
    }

    const quota = await exchangeRateApiService.checkApiQuota();

    res.json({
      success: true,
      data: {
        requestsRemaining: quota.requests_remaining,
        planQuota: quota.plan_quota,
        usagePercentage: (quota.requests_remaining / quota.plan_quota) * 100,
        planType: quota.plan_type || 'Free'
      }
    });
  } catch (error) {
    console.error('Get API Quota Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get API quota",
      details: error.message
    });
  }
};

// Get supported currencies from API
exports.getSupportedCurrencies = async (req, res) => {
  try {
    if (!process.env.EXCHANGE_RATE_API_KEY) {
      return res.status(400).json({
        success: false,
        error: "Exchange Rate API key not configured"
      });
    }

    const currencies = await exchangeRateApiService.fetchSupportedCurrencies();

    res.json({
      success: true,
      data: {
        totalCurrencies: currencies.length,
        currencies: currencies.slice(0, 50) // Limit to first 50 for response size
      }
    });
  } catch (error) {
    console.error('Get Supported Currencies Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get supported currencies",
      details: error.message
    });
  }
};

// Manual sync trigger
exports.triggerManualSync = async (req, res) => {
  try {
    const { baseCurrency = 'USD' } = req.body;

    if (!process.env.EXCHANGE_RATE_API_KEY) {
      return res.status(400).json({
        success: false,
        error: "Exchange Rate API key not configured"
      });
    }

    console.log(`🔄 Manual sync triggered for ${baseCurrency}...`);

    const success = await rateSyncService.manualSync(baseCurrency);

    if (success) {
      res.json({
        success: true,
        message: `Manual sync completed for ${baseCurrency}`,
        data: {
          baseCurrency,
          timestamp: new Date()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Manual sync failed for ${baseCurrency}`
      });
    }
  } catch (error) {
    console.error('Manual Sync Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to trigger manual sync",
      details: error.message
    });
  }
};

// Get sync status
exports.getSyncStatus = async (req, res) => {
  try {
    const status = await rateSyncService.getSyncStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get Sync Status Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get sync status",
      details: error.message
    });
  }
};

// Get rate history
exports.getRateHistory = async (req, res) => {
  try {
    const { baseCurrency, targetCurrency, organizationId, limit = 50 } = req.query;

    const filter = {};
    
    if (baseCurrency) filter.baseCurrency = baseCurrency;
    if (targetCurrency) filter.targetCurrency = targetCurrency;
    if (organizationId) {
      filter.$or = [
        { organizationId: new mongoose.Types.ObjectId(organizationId) },
        { isGlobal: true }
      ];
    } else {
      filter.isGlobal = true;
    }

    const history = await ExchangeRate.find(filter)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .select('baseCurrency targetCurrency rate source isGlobal lastApiUpdate cacheExpiry isExpired');

    res.json({
      success: true,
      data: {
        total: history.length,
        history
      }
    });
  } catch (error) {
    console.error('Get Rate History Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get rate history"
    });
  }
};

// Override rate manually (admin only)
exports.overrideRate = async (req, res) => {
  try {
    const { baseCurrency, targetCurrency, rate, organizationId, reason } = req.body;

    if (!baseCurrency || !targetCurrency || !rate) {
      return res.status(400).json({
        success: false,
        error: "Base currency, target currency, and rate are required"
      });
    }

    // Validate currency codes
    const currencyRegex = /^[A-Z]{3}$/;
    if (!currencyRegex.test(baseCurrency) || !currencyRegex.test(targetCurrency)) {
      return res.status(400).json({
        success: false,
        error: "Currency codes must be 3 uppercase letters"
      });
    }

    // Check if same currency
    if (baseCurrency === targetCurrency) {
      return res.status(400).json({
        success: false,
        error: "Base currency and target currency cannot be the same"
      });
    }

    // Find existing rate
    let existingRate = await ExchangeRate.findOne({
      baseCurrency,
      targetCurrency,
      $or: [
        { organizationId: organizationId ? new mongoose.Types.ObjectId(organizationId) : null },
        { isGlobal: true }
      ]
    });

    if (existingRate) {
      // Update existing rate
      existingRate.rate = parseFloat(rate);
      existingRate.source = 'manual_override';
      existingRate.isCustom = true;
      existingRate.lastApiUpdate = new Date();
      existingRate.cacheExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      existingRate.isExpired = false;
      
      if (reason) {
        existingRate.overrideReason = reason;
      }

      await existingRate.save();
    } else {
      // Create new rate
      existingRate = new ExchangeRate({
        baseCurrency,
        targetCurrency,
        rate: parseFloat(rate),
        organizationId: organizationId ? new mongoose.Types.ObjectId(organizationId) : null,
        isGlobal: !organizationId,
        isCustom: true,
        source: 'manual_override',
        isActive: true,
        lastApiUpdate: new Date(),
        cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isExpired: false,
        overrideReason: reason
      });

      await existingRate.save();
    }

    res.json({
      success: true,
      data: existingRate,
      message: "Rate overridden successfully"
    });
  } catch (error) {
    console.error('Override Rate Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to override rate"
    });
  }
}; 