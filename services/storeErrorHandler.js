const dotenv = require('dotenv');
dotenv.config();

/**
 * Store Error Handler Service
 * 
 * Provides comprehensive error handling and user-friendly messages
 * for store connection and sync issues
 */
class StoreErrorHandler {
  
  /**
   * Parse and categorize errors from store operations
   * @param {Error} error - The error object
   * @param {Object} store - Store object with URL and details
   * @param {string} operation - Operation being performed (sync, connection, etc.)
   * @returns {Object} Categorized error with user-friendly message
   */
  static parseStoreError(error, store = {}, operation = 'operation') {
    const errorInfo = {
      originalError: error,
      operation: operation,
      storeUrl: store.url || 'Unknown',
      storeName: store.name || 'Unknown Store',
      timestamp: new Date(),
      userFriendlyMessage: '',
      technicalDetails: '',
      suggestedActions: [],
      errorType: 'unknown',
      severity: 'error'
    };

    // SSL Certificate Errors
    if (error.code === 'CERT_HAS_EXPIRED') {
      errorInfo.errorType = 'ssl_expired';
      errorInfo.severity = 'error';
      errorInfo.userFriendlyMessage = `SSL Certificate Expired for ${errorInfo.storeName}`;
      errorInfo.technicalDetails = `The SSL certificate for ${errorInfo.storeUrl} has expired and needs to be renewed.`;
      errorInfo.suggestedActions = [
        'Contact your hosting provider to renew the SSL certificate',
        'Check your domain registrar for certificate renewal options',
        'Consider using a free SSL service like Let\'s Encrypt',
        'Verify your website is accessible via HTTPS after renewal'
      ];
    }
    // SSL Certificate Authority Errors
    else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || 
             error.code === 'CERT_UNTRUSTED' || 
             error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
      errorInfo.errorType = 'ssl_invalid';
      errorInfo.severity = 'error';
      errorInfo.userFriendlyMessage = `SSL Certificate Issues for ${errorInfo.storeName}`;
      errorInfo.technicalDetails = `The SSL certificate for ${errorInfo.storeUrl} is invalid or not trusted.`;
      errorInfo.suggestedActions = [
        'Install a valid SSL certificate from a trusted Certificate Authority',
        'Check if your SSL certificate is properly configured',
        'Verify your domain name matches the certificate',
        'Consider using a trusted SSL provider like Cloudflare or Let\'s Encrypt'
      ];
    }
    // DNS Resolution Errors
    else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      errorInfo.errorType = 'dns_error';
      errorInfo.severity = 'error';
      errorInfo.userFriendlyMessage = `Website Not Found for ${errorInfo.storeName}`;
      errorInfo.technicalDetails = `Cannot resolve the domain name ${errorInfo.storeUrl}. The website may be down or the domain may not exist.`;
      errorInfo.suggestedActions = [
        'Check if your website is accessible in a web browser',
        'Verify your domain name is spelled correctly',
        'Contact your hosting provider to check server status',
        'Check your DNS settings with your domain registrar'
      ];
    }
    // Connection Refused (Server Down)
    else if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      errorInfo.errorType = 'server_down';
      errorInfo.severity = 'error';
      errorInfo.userFriendlyMessage = `Server Unavailable for ${errorInfo.storeName}`;
      errorInfo.technicalDetails = `Cannot connect to ${errorInfo.storeUrl}. The server may be down or not responding.`;
      errorInfo.suggestedActions = [
        'Check if your website is accessible in a web browser',
        'Contact your hosting provider to check server status',
        'Verify your server is running and accessible',
        'Check for any scheduled maintenance windows'
      ];
    }
    // Timeout Errors
    else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorInfo.errorType = 'timeout';
      errorInfo.severity = 'warning';
      errorInfo.userFriendlyMessage = `Connection Timeout for ${errorInfo.storeName}`;
      errorInfo.technicalDetails = `Connection to ${errorInfo.storeUrl} timed out. The server may be slow or overloaded.`;
      errorInfo.suggestedActions = [
        'Try again in a few minutes',
        'Check your internet connection',
        'Contact your hosting provider about server performance',
        'Consider upgrading your hosting plan if timeouts persist'
      ];
    }
    // Authentication Errors
    else if (error.response && error.response.status === 401) {
      errorInfo.errorType = 'auth_error';
      errorInfo.severity = 'error';
      errorInfo.userFriendlyMessage = `Authentication Failed for ${errorInfo.storeName}`;
      errorInfo.technicalDetails = `Invalid API credentials for ${errorInfo.storeUrl}.`;
      errorInfo.suggestedActions = [
        'Verify your WooCommerce API Key and Secret are correct',
        'Check if your API keys have the necessary permissions',
        'Regenerate your API keys in WooCommerce admin',
        'Ensure your API keys are not expired or disabled'
      ];
    }
    // Forbidden Access
    else if (error.response && error.response.status === 403) {
      errorInfo.errorType = 'permission_error';
      errorInfo.severity = 'error';
      errorInfo.userFriendlyMessage = `Access Denied for ${errorInfo.storeName}`;
      errorInfo.technicalDetails = `Insufficient permissions to access ${errorInfo.storeUrl}.`;
      errorInfo.suggestedActions = [
        'Check your API key permissions in WooCommerce',
        'Ensure your API keys have read/write access',
        'Verify your WooCommerce REST API is enabled',
        'Check if your user account has admin privileges'
      ];
    }
    // Not Found (404)
    else if (error.response && error.response.status === 404) {
      errorInfo.errorType = 'not_found';
      errorInfo.severity = 'error';
      errorInfo.userFriendlyMessage = `API Endpoint Not Found for ${errorInfo.storeName}`;
      errorInfo.technicalDetails = `The WooCommerce API endpoint is not accessible at ${errorInfo.storeUrl}.`;
      errorInfo.suggestedActions = [
        'Verify your WooCommerce REST API is enabled',
        'Check if your website URL is correct',
        'Ensure WooCommerce plugin is installed and activated',
        'Check if your website has permalink issues'
      ];
    }
    // Server Errors (500+)
    else if (error.response && error.response.status >= 500) {
      errorInfo.errorType = 'server_error';
      errorInfo.severity = 'error';
      errorInfo.userFriendlyMessage = `Server Error for ${errorInfo.storeName}`;
      errorInfo.technicalDetails = `The server at ${errorInfo.storeUrl} is experiencing internal errors.`;
      errorInfo.suggestedActions = [
        'Try again in a few minutes',
        'Contact your hosting provider about server issues',
        'Check your website\'s error logs',
        'Verify your WooCommerce installation is working'
      ];
    }
    // Network Errors
    else if (error.code === 'ENETUNREACH' || error.code === 'EHOSTUNREACH') {
      errorInfo.errorType = 'network_error';
      errorInfo.severity = 'error';
      errorInfo.userFriendlyMessage = `Network Error for ${errorInfo.storeName}`;
      errorInfo.technicalDetails = `Cannot reach the server at ${errorInfo.storeUrl}.`;
      errorInfo.suggestedActions = [
        'Check your internet connection',
        'Try again in a few minutes',
        'Contact your hosting provider',
        'Verify the website URL is correct'
      ];
    }
    // Generic Error
    else {
      errorInfo.errorType = 'unknown';
      errorInfo.severity = 'error';
      errorInfo.userFriendlyMessage = `Connection Error for ${errorInfo.storeName}`;
      errorInfo.technicalDetails = error.message || 'An unknown error occurred while connecting to your store.';
      errorInfo.suggestedActions = [
        'Check if your website is accessible in a web browser',
        'Verify your store configuration settings',
        'Try again in a few minutes',
        'Contact support if the issue persists'
      ];
    }

    return errorInfo;
  }

  /**
   * Create a user-friendly error message for display
   * @param {Object} errorInfo - Parsed error information
   * @returns {string} User-friendly error message
   */
  static createUserMessage(errorInfo) {
    let message = errorInfo.userFriendlyMessage;
    
    if (errorInfo.operation) {
      message += ` during ${errorInfo.operation}`;
    }
    
    return message;
  }

  /**
   * Create detailed error information for logging
   * @param {Object} errorInfo - Parsed error information
   * @returns {Object} Detailed error information
   */
  static createDetailedError(errorInfo) {
    return {
      message: errorInfo.userFriendlyMessage,
      details: errorInfo.technicalDetails,
      suggestions: errorInfo.suggestedActions,
      type: errorInfo.errorType,
      severity: errorInfo.severity,
      storeUrl: errorInfo.storeUrl,
      storeName: errorInfo.storeName,
      operation: errorInfo.operation,
      timestamp: errorInfo.timestamp
    };
  }

  /**
   * Log error with appropriate level and details
   * @param {Object} errorInfo - Parsed error information
   * @param {string} context - Additional context information
   */
  static logError(errorInfo, context = '') {
    const logMessage = `❌ [STORE ERROR] ${errorInfo.userFriendlyMessage}`;
    const logDetails = {
      context: context,
      store: errorInfo.storeName,
      url: errorInfo.storeUrl,
      operation: errorInfo.operation,
      errorType: errorInfo.errorType,
      severity: errorInfo.severity,
      technicalDetails: errorInfo.technicalDetails,
      suggestedActions: errorInfo.suggestedActions
    };

    if (errorInfo.severity === 'error') {
      console.error(logMessage, logDetails);
    } else {
      console.warn(logMessage, logDetails);
    }
  }

  /**
   * Check if error is retryable
   * @param {Object} errorInfo - Parsed error information
   * @returns {boolean} Whether the error is retryable
   */
  static isRetryable(errorInfo) {
    const retryableTypes = [
      'timeout',
      'server_error',
      'network_error'
    ];
    
    return retryableTypes.includes(errorInfo.errorType);
  }

  /**
   * Get retry delay in milliseconds
   * @param {Object} errorInfo - Parsed error information
   * @param {number} attempt - Current attempt number (1-based)
   * @returns {number} Delay in milliseconds
   */
  static getRetryDelay(errorInfo, attempt = 1) {
    const baseDelay = 5000; // 5 seconds
    const maxDelay = 60000; // 1 minute
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    
    return Math.min(exponentialDelay, maxDelay);
  }

  /**
   * Create error response for API endpoints
   * @param {Object} errorInfo - Parsed error information
   * @param {number} statusCode - HTTP status code
   * @returns {Object} Error response object
   */
  static createErrorResponse(errorInfo, statusCode = 500) {
    return {
      success: false,
      error: errorInfo.userFriendlyMessage,
      details: errorInfo.technicalDetails,
      suggestions: errorInfo.suggestedActions,
      errorType: errorInfo.errorType,
      severity: errorInfo.severity,
      storeUrl: errorInfo.storeUrl,
      storeName: errorInfo.storeName,
      operation: errorInfo.operation,
      timestamp: errorInfo.timestamp,
      statusCode: statusCode
    };
  }

  /**
   * Create success response with warnings
   * @param {Object} successData - Success data
   * @param {Array} warnings - Array of warning messages
   * @returns {Object} Success response with warnings
   */
  static createSuccessResponseWithWarnings(successData, warnings = []) {
    return {
      success: true,
      ...successData,
      warnings: warnings,
      timestamp: new Date()
    };
  }
}

module.exports = StoreErrorHandler;








