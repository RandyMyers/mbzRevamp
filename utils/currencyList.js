/**
 * Currency List Utility
 * 
 * Provides comprehensive list of supported currencies from currency.txt
 * and Exchange Rate API integration
 */

const fs = require('fs');
const path = require('path');

/**
 * Extract currencies from currency.txt file
 * @returns {Array} Array of currency objects with code and name
 */
const extractCurrenciesFromFile = () => {
  try {
    const currencyFilePath = path.join(__dirname, '../currency.txt');
    const fileContent = fs.readFileSync(currencyFilePath, 'utf8');
    
    // Extract currency codes and names from the file
    const currencyPattern = /^([A-Z]{3})\s+([^,\n]+?)(?:\s+([^,\n]+))?$/gm;
    const currencies = [];
    
    let match;
    while ((match = currencyPattern.exec(fileContent)) !== null) {
      const [, code, name, country] = match;
      currencies.push({
        code: code.trim(),
        name: name.trim(),
        country: country ? country.trim() : null
      });
    }
    
    return currencies;
  } catch (error) {
    console.error('Error reading currency.txt:', error);
    return [];
  }
};

/**
 * Get comprehensive list of supported currencies
 * @returns {Array} Array of currency objects
 */
const getSupportedCurrencies = () => {
  const currencies = extractCurrenciesFromFile();
  
  // Add any missing common currencies that might not be in the file
  const additionalCurrencies = [
    { code: 'USD', name: 'United States Dollar', country: 'United States' },
    { code: 'EUR', name: 'Euro', country: 'European Union' },
    { code: 'GBP', name: 'Pound Sterling', country: 'United Kingdom' },
    { code: 'NGN', name: 'Nigerian Naira', country: 'Nigeria' },
    { code: 'CAD', name: 'Canadian Dollar', country: 'Canada' },
    { code: 'AUD', name: 'Australian Dollar', country: 'Australia' },
    { code: 'JPY', name: 'Japanese Yen', country: 'Japan' },
    { code: 'CHF', name: 'Swiss Franc', country: 'Switzerland' }
  ];
  
  // Combine and deduplicate
  const allCurrencies = [...currencies];
  
  additionalCurrencies.forEach(currency => {
    if (!allCurrencies.find(c => c.code === currency.code)) {
      allCurrencies.push(currency);
    }
  });
  
  // Sort by currency code
  return allCurrencies.sort((a, b) => a.code.localeCompare(b.code));
};

/**
 * Get currency codes only
 * @returns {Array} Array of currency codes
 */
const getCurrencyCodes = () => {
  return getSupportedCurrencies().map(currency => currency.code);
};

/**
 * Get currency by code
 * @param {string} code - Currency code
 * @returns {Object|null} Currency object or null if not found
 */
const getCurrencyByCode = (code) => {
  const currencies = getSupportedCurrencies();
  return currencies.find(currency => currency.code === code.toUpperCase()) || null;
};

/**
 * Validate currency code
 * @param {string} code - Currency code to validate
 * @returns {boolean} True if valid currency code
 */
const isValidCurrencyCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  
  const currencyRegex = /^[A-Z]{3}$/;
  if (!currencyRegex.test(code)) return false;
  
  return getCurrencyByCode(code) !== null;
};

/**
 * Get popular currencies (most commonly used)
 * @returns {Array} Array of popular currency objects
 */
const getPopularCurrencies = () => {
  const popularCodes = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 
    'NGN', 'INR', 'BRL', 'MXN', 'KRW', 'SGD', 'HKD', 'NZD'
  ];
  
  return popularCodes.map(code => getCurrencyByCode(code)).filter(Boolean);
};

/**
 * Get currencies by region
 * @param {string} region - Region name (e.g., 'Europe', 'Asia', 'Africa')
 * @returns {Array} Array of currency objects for the region
 */
const getCurrenciesByRegion = (region) => {
  const regionMap = {
    'Europe': ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK'],
    'Asia': ['JPY', 'CNY', 'KRW', 'SGD', 'HKD', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'INR', 'VND'],
    'Africa': ['NGN', 'ZAR', 'EGP', 'KES', 'GHS', 'MAD', 'TND', 'UGX', 'TZS', 'ETB', 'DZD', 'SDG'],
    'Americas': ['USD', 'CAD', 'BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'PYG', 'BOB', 'GTQ'],
    'Oceania': ['AUD', 'NZD', 'FJD', 'PGK', 'WST', 'VUV', 'SBD', 'TOP', 'TVD', 'KID']
  };
  
  const codes = regionMap[region] || [];
  return codes.map(code => getCurrencyByCode(code)).filter(Boolean);
};

module.exports = {
  getSupportedCurrencies,
  getCurrencyCodes,
  getCurrencyByCode,
  isValidCurrencyCode,
  getPopularCurrencies,
  getCurrenciesByRegion,
  extractCurrenciesFromFile
};