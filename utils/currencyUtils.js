const ExchangeRate = require('../models/exchangeRate');
const Organization = require('../models/organization');
const User = require('../models/users');
const mongoose = require('mongoose');
const exchangeRateApiService = require('../services/exchangeRateApiService');

/**
 * Get the display currency for a user or organization
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<string>} - Display currency code
 */
const getDisplayCurrency = async (userId, organizationId) => {
  try {
    console.log(`\n🔍 Getting display currency...`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Organization ID: ${organizationId}`);
    
    // First try to get user's preferred currency
    if (userId) {
      console.log(`   🔍 Looking for user's preferred currency...`);
      const user = await User.findById(userId);
      if (user && user.displayCurrency) {
        console.log(`   ✅ Found user's preferred currency: ${user.displayCurrency}`);
        return user.displayCurrency;
      }
      console.log(`   ❌ No user preferred currency found`);
    }

    // Fall back to organization's analytics currency
    if (organizationId) {
      console.log(`   🔍 Looking for organization's analytics currency...`);
      const organization = await Organization.findById(organizationId);
      if (organization && organization.analyticsCurrency) {
        console.log(`   ✅ Found organization's analytics currency: ${organization.analyticsCurrency}`);
        return organization.analyticsCurrency;
      }
      console.log(`   ❌ No organization analytics currency found`);
      
      // Fall back to default currency if analytics currency not set
      if (organization && organization.defaultCurrency) {
        console.log(`   ✅ Found organization's default currency: ${organization.defaultCurrency}`);
        return organization.defaultCurrency;
      }
      console.log(`   ❌ No organization default currency found`);
    }

    // Default fallback
    console.log(`   ✅ Using default fallback currency: USD`);
    return 'USD';
  } catch (error) {
    console.error('❌ Error getting display currency:', error);
    console.log(`   ✅ Using default fallback currency on error: USD`);
    return 'USD';
  }
};

/**
 * Get organization's analytics currency
 * @param {string} organizationId - Organization ID
 * @returns {Promise<string>} - Analytics currency code
 */
const getOrganizationAnalyticsCurrency = async (organizationId) => {
  try {
    if (!organizationId) return 'USD';
    
    const organization = await Organization.findById(organizationId);
    if (organization && organization.analyticsCurrency) {
      return organization.analyticsCurrency;
    }
    
    // Fall back to default currency
    if (organization && organization.defaultCurrency) {
      return organization.defaultCurrency;
    }
    
    return 'USD';
  } catch (error) {
    console.error('Error getting organization analytics currency:', error);
    return 'USD';
  }
};

/**
 * Get exchange rate for organization-specific conversion
 * @param {string} organizationId - Organization ID
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number|null>} - Exchange rate or null if not found
 */
const getExchangeRate = async (organizationId, fromCurrency, toCurrency) => {
  try {
    console.log(`\n🔍 Looking up exchange rate: ${fromCurrency} → ${toCurrency}`);
    console.log(`   Organization ID: ${organizationId}`);
    
    if (!fromCurrency || !toCurrency) {
      console.log(`   ❌ Missing required parameters`);
      return null;
    }

    // If same currency, return 1
    if (fromCurrency === toCurrency) {
      console.log(`   ✅ Same currency, rate = 1`);
      return 1;
    }

    // Step 1: Try organization-specific rate first
    if (organizationId) {
      console.log(`   🔍 Looking for organization-specific rate...`);
      let exchangeRate = await ExchangeRate.findOne({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency,
        isActive: true,
        isGlobal: false
      });

      if (exchangeRate && !exchangeRate.needsRefresh()) {
        console.log(`   ✅ Found valid organization-specific rate: ${exchangeRate.rate}`);
        return exchangeRate.rate;
      }
      console.log(`   ❌ No valid organization-specific rate found`);

      // Try reverse organization-specific rate
      console.log(`   🔍 Looking for reverse organization-specific rate...`);
      exchangeRate = await ExchangeRate.findOne({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        baseCurrency: toCurrency,
        targetCurrency: fromCurrency,
        isActive: true,
        isGlobal: false
      });

      if (exchangeRate && !exchangeRate.needsRefresh()) {
        const reverseRate = 1 / exchangeRate.rate;
        console.log(`   ✅ Found valid reverse organization-specific rate: ${exchangeRate.rate} → ${reverseRate}`);
        return reverseRate;
      }
      console.log(`   ❌ No valid reverse organization-specific rate found`);
    }

    // Step 2: Try global/system rate using new model method
    console.log(`   🔍 Looking for global/system rate...`);
    let exchangeRate = await ExchangeRate.findValidRate(organizationId, fromCurrency, toCurrency);
    
    if (exchangeRate && !exchangeRate.needsRefresh()) {
      console.log(`   ✅ Found valid global/system rate: ${exchangeRate.rate}`);
      return exchangeRate.rate;
    }
    console.log(`   ❌ No valid global/system rate found`);

    // Step 3: Try API service for fresh rates
    try {
      console.log(`   🔄 Attempting to fetch fresh rate from API...`);
      const apiResponse = await exchangeRateApiService.fetchPairRate(fromCurrency, toCurrency);
      
      if (apiResponse && apiResponse.conversion_rate) {
        console.log(`   ✅ Successfully fetched API rate: ${apiResponse.conversion_rate}`);
        
        // Cache the new rate globally
        await exchangeRateApiService.cacheRates({
          base_code: fromCurrency,
          conversion_rates: { [toCurrency]: apiResponse.conversion_rate },
          time_last_update_utc: apiResponse.time_last_update_utc,
          time_next_update_utc: apiResponse.time_next_update_utc
        }, 'api');
        
        return apiResponse.conversion_rate;
      }
    } catch (apiError) {
      console.log(`   ⚠️  API fetch failed: ${apiError.message}`);
    }

    // Step 4: Use expired cached rate as fallback
    if (exchangeRate) {
      console.log(`   ⚠️  Using expired cached rate: ${exchangeRate.rate}`);
      return exchangeRate.rate;
    }

    console.log(`   ❌ No exchange rate found for ${fromCurrency} → ${toCurrency}`);
    return null;
  } catch (error) {
    console.error('❌ Error getting exchange rate:', error);
    return null;
  }
};

/**
 * Convert amount from source currency to target currency
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {string} organizationId - Organization ID for org-specific rates
 * @returns {Promise<number>} - Converted amount
 */
const convertCurrency = async (amount, fromCurrency, toCurrency, organizationId = null) => {
  try {
    console.log(`\n🔄 Converting ${amount} ${fromCurrency} to ${toCurrency}`);
    console.log(`   Organization ID: ${organizationId}`);
    
    // If same currency, return original amount
    if (fromCurrency === toCurrency) {
      console.log(`   ✅ Same currency, no conversion needed: ${amount} ${fromCurrency}`);
      return amount;
    }

    const rate = await getExchangeRate(organizationId, fromCurrency, toCurrency);
    console.log(`   💱 Exchange rate: ${rate}`);
    
    if (rate === null) {
      // If no exchange rate found, return original amount with warning
      console.warn(`⚠️  No exchange rate found for ${fromCurrency} to ${toCurrency} for organization ${organizationId}`);
      console.log(`   ⚠️  Returning original amount: ${amount} ${fromCurrency}`);
      return amount;
    }

    const convertedAmount = amount * rate;
    console.log(`   📊 Calculation: ${amount} × ${rate} = ${convertedAmount} ${toCurrency}`);
    console.log(`   ✅ Conversion complete: ${convertedAmount} ${toCurrency}`);
    
    return convertedAmount;
  } catch (error) {
    console.error('❌ Error converting currency:', error);
    console.log(`   ⚠️  Returning original amount on error: ${amount} ${fromCurrency}`);
    return amount; // Return original amount on error
  }
};

/**
 * Convert multiple amounts with different currencies to a target currency
 * @param {Array} amounts - Array of objects with amount and currency
 * @param {string} targetCurrency - Target currency code
 * @param {string} organizationId - Organization ID for org-specific rates
 * @returns {Promise<number>} - Total converted amount
 */
const convertMultipleCurrencies = async (amounts, targetCurrency, organizationId = null) => {
  try {
    let totalConverted = 0;

    for (const item of amounts) {
      const { amount, currency } = item;
      if (amount && currency) {
        const convertedAmount = await convertCurrency(amount, currency, targetCurrency, organizationId);
        totalConverted += convertedAmount;
      }
    }

    return totalConverted;
  } catch (error) {
    console.error('Error converting multiple currencies:', error);
    return 0;
  }
};

/**
 * Enhanced aggregation pipeline for multi-currency revenue calculations
 * @param {string} organizationId - Organization ID
 * @param {string} targetCurrency - Target currency for conversion
 * @param {Object} additionalFilters - Additional MongoDB filters
 * @returns {Array} - MongoDB aggregation pipeline
 */
const createMultiCurrencyRevenuePipeline = (organizationId, targetCurrency, additionalFilters = {}) => {
  return [
    {
      $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        status: { $nin: ['cancelled', 'refunded'] },
        total: { $exists: true, $ne: "" },
        ...additionalFilters
      }
    },
    {
      $addFields: {
        numericTotal: {
          $cond: [
            { $eq: [{ $type: "$total" }, "string"] },
            { $toDouble: "$total" },
            "$total"
          ]
        },
        orderCurrency: {
          $ifNull: ["$currency", "USD"] // Default to USD if no currency specified
        }
      }
    },
    {
      $match: {
        numericTotal: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: "$orderCurrency",
        totalAmount: { $sum: "$numericTotal" },
        orderCount: { $sum: 1 }
      }
    }
  ];
};

/**
 * Process multi-currency aggregation results and convert to target currency
 * @param {Array} aggregationResults - Results from multi-currency aggregation
 * @param {string} targetCurrency - Target currency for conversion
 * @param {string} organizationId - Organization ID for org-specific rates
 * @returns {Promise<Object>} - Processed results with converted totals
 */
const processMultiCurrencyResults = async (aggregationResults, targetCurrency, organizationId = null) => {
  try {
    console.log('🔄 Processing multi-currency results...');
    console.log('📊 Input aggregation results:', JSON.stringify(aggregationResults, null, 2));
    console.log('💰 Target currency:', targetCurrency);
    console.log('🏢 Organization ID:', organizationId);
    
    let totalConverted = 0;
    let totalOrders = 0;
    const currencyBreakdown = {};

    for (const result of aggregationResults) {
      const { _id: currency, totalAmount, orderCount } = result;
      
      console.log(`\n💱 Processing currency: ${currency}`);
      console.log(`   Original amount: ${totalAmount} ${currency}`);
      console.log(`   Order count: ${orderCount}`);
      
      const convertedAmount = await convertCurrency(totalAmount, currency, targetCurrency, organizationId);
      console.log(`   Converted amount: ${convertedAmount} ${targetCurrency}`);
      
      totalConverted += convertedAmount;
      totalOrders += orderCount;
      
      currencyBreakdown[currency] = {
        originalAmount: totalAmount,
        convertedAmount,
        orderCount
      };
      
      console.log(`   Running total: ${totalConverted} ${targetCurrency}`);
    }

    console.log('\n📋 Final currency breakdown:', JSON.stringify(currencyBreakdown, null, 2));
    console.log(`✅ Total converted: ${totalConverted} ${targetCurrency}`);
    console.log(`📦 Total orders: ${totalOrders}`);

    return {
      totalConverted,
      totalOrders,
      targetCurrency,
      currencyBreakdown
    };
  } catch (error) {
    console.error('❌ Error processing multi-currency results:', error);
    return {
      totalConverted: 0,
      totalOrders: 0,
      targetCurrency,
      currencyBreakdown: {}
    };
  }
};

/**
 * Get currency statistics for an organization
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} - Currency statistics
 */
const getCurrencyStats = async (organizationId) => {
  try {
    const stats = await require('../models/order').aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          status: { $nin: ['cancelled', 'refunded'] },
          currency: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: "$currency",
          totalAmount: { $sum: { $toDouble: "$total" } },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    return stats;
  } catch (error) {
    console.error('Error getting currency stats:', error);
    return [];
  }
};

/**
 * Convert order amounts to target currency for analytics
 * @param {Array} orders - Array of order objects
 * @param {string} targetCurrency - Target currency code
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Array>} - Orders with converted amounts
 */
const convertOrderAmounts = async (orders, targetCurrency, organizationId) => {
  try {
    const convertedOrders = [];

    for (const order of orders) {
      const convertedOrder = { ...order };
      
      if (order.total && order.currency) {
        convertedOrder.convertedTotal = await convertCurrency(
          parseFloat(order.total), 
          order.currency, 
          targetCurrency, 
          organizationId
        );
        convertedOrder.targetCurrency = targetCurrency;
      }

      // Convert line items if they exist
      if (order.line_items && Array.isArray(order.line_items)) {
        convertedOrder.line_items = await Promise.all(
          order.line_items.map(async (item) => {
            const convertedItem = { ...item };
            if (item.subtotal && order.currency) {
              convertedItem.convertedSubtotal = await convertCurrency(
                parseFloat(item.subtotal),
                order.currency,
                targetCurrency,
                organizationId
              );
            }
            return convertedItem;
          })
        );
      }

      convertedOrders.push(convertedOrder);
    }

    return convertedOrders;
  } catch (error) {
    console.error('Error converting order amounts:', error);
    return orders; // Return original orders on error
  }
};

module.exports = {
  getDisplayCurrency,
  getOrganizationAnalyticsCurrency,
  getExchangeRate,
  convertCurrency,
  convertMultipleCurrencies,
  createMultiCurrencyRevenuePipeline,
  processMultiCurrencyResults,
  getCurrencyStats,
  convertOrderAmounts
}; 