/**
 * Exchange Rate API Service
 * 
 * Handles communication with the Exchange Rate API v6
 * Provides rate fetching, caching, and error handling
 */

const axios = require('axios');
const ExchangeRate = require('../models/exchangeRate');
const mongoose = require('mongoose');
require('dotenv').config();

class ExchangeRateApiService {
  constructor() {
    // Reload environment variables
    require('dotenv').config();
    
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY;
    this.baseUrl = process.env.EXCHANGE_RATE_API_URL || 'https://v6.exchangerate-api.com/v6';
    this.cacheTtl = parseInt(process.env.EXCHANGE_RATE_CACHE_TTL) || 3600; // 1 hour default
    
    if (!this.apiKey) {
      console.warn('⚠️  EXCHANGE_RATE_API_KEY not found in environment variables');
    } else {
      console.log(`✅ API Key loaded: ${this.apiKey.substring(0, 8)}...`);
    }
    
    // Configure axios defaults
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000, // 10 seconds
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Fetch latest exchange rates for a base currency
   * @param {string} baseCurrency - Base currency code (e.g., 'USD')
   * @returns {Promise<Object>} - API response with conversion rates
   */
  async fetchLatestRates(baseCurrency = 'USD') {
    try {
      console.log(`🔄 Fetching latest rates for ${baseCurrency}...`);
      
      if (!this.apiKey) {
        throw new Error('API key not configured');
      }

      const response = await this.api.get(`/latest/${baseCurrency}`);
      
      if (response.data.result === 'success') {
        console.log(`✅ Successfully fetched rates for ${baseCurrency}`);
        return response.data;
      } else {
        throw new Error(`API Error: ${response.data['error-type'] || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching latest rates for ${baseCurrency}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch specific pair conversion rate
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @param {number} amount - Optional amount to convert
   * @returns {Promise<Object>} - API response with conversion rate
   */
  async fetchPairRate(fromCurrency, toCurrency, amount = null) {
    try {
      console.log(`🔄 Fetching pair rate: ${fromCurrency} → ${toCurrency}${amount ? ` (${amount})` : ''}`);
      
      if (!this.apiKey) {
        throw new Error('API key not configured');
      }

      let url = `/${this.apiKey}/pair/${fromCurrency}/${toCurrency}`;
      if (amount) {
        url += `/${amount}`;
      }

      const response = await this.api.get(url);
      
      if (response.data.result === 'success') {
        console.log(`✅ Successfully fetched pair rate: ${fromCurrency} → ${toCurrency}`);
        return response.data;
      } else {
        throw new Error(`API Error: ${response.data['error-type'] || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching pair rate ${fromCurrency} → ${toCurrency}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch supported currency codes
   * @returns {Promise<Array>} - Array of supported currency codes
   */
  async fetchSupportedCurrencies() {
    try {
      console.log('🔄 Fetching supported currencies...');
      
      if (!this.apiKey) {
        throw new Error('API key not configured');
      }

      const response = await this.api.get(`/codes`);
      
      if (response.data.result === 'success') {
        console.log(`✅ Successfully fetched ${response.data.supported_codes.length} supported currencies`);
        return response.data.supported_codes;
      } else {
        throw new Error(`API Error: ${response.data['error-type'] || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error fetching supported currencies:', error.message);
      throw error;
    }
  }

  /**
   * Check API quota and usage
   * @returns {Promise<Object>} - Quota information
   */
  async checkApiQuota() {
    try {
      console.log('🔄 Checking API quota...');
      
      if (!this.apiKey) {
        throw new Error('API key not configured');
      }

      const response = await this.api.get(`/quota`);
      
      if (response.data.result === 'success') {
        console.log(`✅ Quota check successful: ${response.data.quota_used}/${response.data.quota_limit} requests used`);
        return response.data;
      } else {
        throw new Error(`API Error: ${response.data['error-type'] || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error checking API quota:', error.message);
      throw error;
    }
  }

  /**
   * Cache exchange rates in database
   * @param {Object} apiResponse - API response object
   * @param {string} source - Source of the rates ('api', 'api_cached', etc.)
   * @returns {Promise<Array>} - Array of cached rate documents
   */
  async cacheRates(apiResponse, source = 'api') {
    try {
      console.log(`🔄 Caching exchange rates (source: ${source})...`);
      
      if (!apiResponse || !apiResponse.conversion_rates) {
        throw new Error('Invalid API response for caching');
      }

      const baseCurrency = apiResponse.base_code;
      const conversionRates = apiResponse.conversion_rates;
      const cacheExpiry = new Date(Date.now() + (this.cacheTtl * 1000));
      
      const ratesToCache = [];
      
      for (const [targetCurrency, rate] of Object.entries(conversionRates)) {
        if (targetCurrency === baseCurrency) continue; // Skip self-conversion
        
        const rateData = {
          baseCurrency: baseCurrency.toUpperCase(),
          targetCurrency: targetCurrency.toUpperCase(),
          rate: parseFloat(rate),
          source: source,
          isGlobal: true, // API rates are global
          isActive: true,
          lastApiUpdate: new Date(),
          cacheExpiry: cacheExpiry,
          isExpired: false,
          apiResponse: {
            timeLastUpdate: apiResponse.time_last_update_utc ? new Date(apiResponse.time_last_update_utc) : new Date(),
            timeNextUpdate: apiResponse.time_next_update_utc ? new Date(apiResponse.time_next_update_utc) : cacheExpiry,
            baseCode: baseCurrency,
            targetCode: targetCurrency
          }
        };

        // Use upsert to avoid duplicates
        const result = await ExchangeRate.findOneAndUpdate(
          { 
            baseCurrency: rateData.baseCurrency, 
            targetCurrency: rateData.targetCurrency,
            isGlobal: true 
          },
          rateData,
          { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true
          }
        );
        
        ratesToCache.push(result);
      }
      
      console.log(`✅ Successfully cached ${ratesToCache.length} exchange rates`);
      return ratesToCache;
    } catch (error) {
      console.error('❌ Error caching exchange rates:', error.message);
      throw error;
    }
  }

  /**
   * Get cached rate from database
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {Promise<Object|null>} - Cached rate or null if not found/expired
   */
  async getCachedRate(fromCurrency, toCurrency) {
    try {
      const rate = await ExchangeRate.findValidRate(null, fromCurrency.toUpperCase(), toCurrency.toUpperCase());
      return rate && !rate.isExpired ? rate : null;
    } catch (error) {
      console.error('❌ Error getting cached rate:', error.message);
      return null;
    }
  }

  /**
   * Convert amount between currencies using cached rates or API
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {Promise<Object>} - Conversion result
   */
  async convertAmount(amount, fromCurrency, toCurrency) {
    try {
      console.log(`🔄 Converting ${amount} ${fromCurrency} to ${toCurrency}...`);
      
      // First try to get cached rate
      let rate = await this.getCachedRate(fromCurrency, toCurrency);
      
      if (!rate) {
        console.log(`📡 No valid cached rate found, fetching from API...`);
        
        // Fetch from API
        const apiResponse = await this.fetchPairRate(fromCurrency, toCurrency, amount);
        
        // Cache the rates
        await this.cacheRates(apiResponse, 'api');
        
        // Get the cached rate
        rate = await this.getCachedRate(fromCurrency, toCurrency);
        
        if (!rate) {
          throw new Error('Failed to cache and retrieve rate');
        }
      }
      
      const convertedAmount = amount * rate.rate;
      
      console.log(`✅ Conversion successful: ${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`);
      
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: convertedAmount,
        targetCurrency: toCurrency,
        rate: rate.rate,
        rateSource: rate.source,
        lastUpdated: rate.lastApiUpdate
      };
    } catch (error) {
      console.error(`❌ Error converting amount:`, error.message);
      throw error;
    }
  }

  /**
   * Convert multiple amounts in batch
   * @param {Array} conversions - Array of conversion objects
   * @returns {Promise<Array>} - Array of conversion results
   */
  async batchConvert(conversions) {
    try {
      console.log(`🔄 Batch converting ${conversions.length} amounts...`);
      
      const results = [];
      
      for (const conversion of conversions) {
        try {
          const result = await this.convertAmount(
            conversion.amount,
            conversion.fromCurrency,
            conversion.toCurrency
          );
          results.push({ ...conversion, result });
        } catch (error) {
          console.error(`❌ Error in batch conversion:`, error.message);
          results.push({ 
            ...conversion, 
            error: error.message,
            result: null 
          });
        }
      }
      
      console.log(`✅ Batch conversion completed: ${results.filter(r => !r.error).length}/${conversions.length} successful`);
      return results;
    } catch (error) {
      console.error('❌ Error in batch conversion:', error.message);
      throw error;
    }
  }
}

module.exports = new ExchangeRateApiService(); 
 