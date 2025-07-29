const User = require('../models/users');
const Organization = require('../models/organization');
const currencyUtils = require('../utils/currencyUtils');
const currencyList = require('../utils/currencyList');
const mongoose = require('mongoose');

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

    const user = await User.findByIdAndUpdate(
      userId,
      { displayCurrency },
      { new: true, runValidators: true }
    ).select('displayCurrency');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.json({
      success: true,
      data: {
        displayCurrency: user.displayCurrency
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

    const organization = await Organization.findByIdAndUpdate(
      organizationId,
      { analyticsCurrency },
      { new: true, runValidators: true }
    ).select('analyticsCurrency defaultCurrency name');

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: "Organization not found"
      });
    }

    res.json({
      success: true,
      data: {
        analyticsCurrency: organization.analyticsCurrency,
        defaultCurrency: organization.defaultCurrency,
        organizationName: organization.name
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