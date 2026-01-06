const PaymentMethod = require('../models/paymentMethod');
const PaymentGatewayKey = require('../models/paymentGatewayKey');
const axios = require('axios');
const logEvent = require('../helper/logEvent');

/**
 * Payment Method Service
 * Handles CRUD operations for saved payment methods and recurring charges
 */

/**
 * Save or update a payment method from a successful payment
 * @param {Object} data - Payment method data from gateway
 */
exports.savePaymentMethod = async (data) => {
  try {
    const {
      userId,
      gateway,
      // Paystack fields
      authCode,
      customerCode,
      // Flutterwave fields
      token,
      // Squad fields
      squadToken,
      squadCustomerId,
      // Card display fields
      lastFour,
      brand,
      expMonth,
      expYear,
      bank,
      email
    } = data;

    if (!userId || !gateway) {
      throw new Error('userId and gateway are required');
    }

    // Check if user already has a card saved from this gateway with same last4
    let existingMethod = await PaymentMethod.findOne({
      userId,
      cardGateway: gateway,
      cardLastFour: lastFour
    });

    if (existingMethod) {
      // Update existing payment method
      existingMethod.lastUsedAt = new Date();

      // Update tokens based on gateway
      if (gateway === 'paystack') {
        existingMethod.paystackAuthCode = authCode || existingMethod.paystackAuthCode;
        existingMethod.paystackCustomerCode = customerCode || existingMethod.paystackCustomerCode;
        existingMethod.paystackEmail = email || existingMethod.paystackEmail;
      } else if (gateway === 'flutterwave') {
        existingMethod.flutterwaveToken = token || existingMethod.flutterwaveToken;
        existingMethod.flutterwaveEmail = email || existingMethod.flutterwaveEmail;
      } else if (gateway === 'squad') {
        existingMethod.squadToken = squadToken || existingMethod.squadToken;
        existingMethod.squadCustomerId = squadCustomerId || existingMethod.squadCustomerId;
      }

      await existingMethod.save();
      console.log(`Updated existing payment method for user ${userId}`);
      return existingMethod;
    }

    // Create new payment method
    const paymentMethod = new PaymentMethod({
      userId,
      methodType: 'Card',
      currency: 'NGN', // Default for Nigerian gateways
      cardGateway: gateway,
      cardLastFour: lastFour,
      cardBrand: brand,
      cardExpMonth: expMonth,
      cardExpYear: expYear,
      cardBank: bank,
      lastUsedAt: new Date(),
      isActive: true,
      nickname: `${brand || 'Card'} ****${lastFour}`
    });

    // Set gateway-specific tokens
    if (gateway === 'paystack') {
      paymentMethod.paystackAuthCode = authCode;
      paymentMethod.paystackCustomerCode = customerCode;
      paymentMethod.paystackEmail = email;
    } else if (gateway === 'flutterwave') {
      paymentMethod.flutterwaveToken = token;
      paymentMethod.flutterwaveEmail = email;
    } else if (gateway === 'squad') {
      paymentMethod.squadToken = squadToken;
      paymentMethod.squadCustomerId = squadCustomerId;
    }

    // Check if this is user's first card - make it default
    const existingCards = await PaymentMethod.countDocuments({
      userId,
      methodType: 'Card',
      isActive: true
    });

    if (existingCards === 0) {
      paymentMethod.isDefault = true;
    }

    await paymentMethod.save();

    await logEvent({
      action: 'payment_method_saved',
      user: userId,
      resource: 'PaymentMethod',
      resourceId: paymentMethod._id,
      details: {
        gateway,
        lastFour,
        brand,
        isDefault: paymentMethod.isDefault
      }
    });

    console.log(`Saved new payment method for user ${userId}: ${brand} ****${lastFour}`);
    return paymentMethod;

  } catch (error) {
    console.error('Error saving payment method:', error.message);
    throw error;
  }
};

/**
 * Get all payment methods for a user
 */
exports.getUserPaymentMethods = async (userId) => {
  try {
    const methods = await PaymentMethod.find({
      userId,
      methodType: 'Card',
      isActive: true
    }).sort({ isDefault: -1, lastUsedAt: -1 });

    return methods;
  } catch (error) {
    console.error('Error getting payment methods:', error.message);
    throw error;
  }
};

/**
 * Get a specific payment method by ID
 */
exports.getPaymentMethodById = async (methodId, userId) => {
  try {
    const method = await PaymentMethod.findOne({
      _id: methodId,
      userId,
      isActive: true
    });

    return method;
  } catch (error) {
    console.error('Error getting payment method:', error.message);
    throw error;
  }
};

/**
 * Set a payment method as default
 */
exports.setDefaultPaymentMethod = async (userId, methodId) => {
  try {
    // Remove default from all user's cards
    await PaymentMethod.updateMany(
      { userId, methodType: 'Card' },
      { $set: { isDefault: false } }
    );

    // Set the specified card as default
    const method = await PaymentMethod.findOneAndUpdate(
      { _id: methodId, userId },
      { $set: { isDefault: true } },
      { new: true }
    );

    if (!method) {
      throw new Error('Payment method not found');
    }

    await logEvent({
      action: 'default_payment_method_set',
      user: userId,
      resource: 'PaymentMethod',
      resourceId: methodId
    });

    return method;
  } catch (error) {
    console.error('Error setting default payment method:', error.message);
    throw error;
  }
};

/**
 * Delete (deactivate) a payment method
 */
exports.deletePaymentMethod = async (userId, methodId) => {
  try {
    const method = await PaymentMethod.findOneAndUpdate(
      { _id: methodId, userId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!method) {
      throw new Error('Payment method not found');
    }

    // If deleted card was default, set another card as default
    if (method.isDefault) {
      const anotherCard = await PaymentMethod.findOne({
        userId,
        methodType: 'Card',
        isActive: true
      });

      if (anotherCard) {
        anotherCard.isDefault = true;
        await anotherCard.save();
      }
    }

    await logEvent({
      action: 'payment_method_deleted',
      user: userId,
      resource: 'PaymentMethod',
      resourceId: methodId
    });

    return method;
  } catch (error) {
    console.error('Error deleting payment method:', error.message);
    throw error;
  }
};

/**
 * Get user's default payment method
 */
exports.getDefaultPaymentMethod = async (userId) => {
  try {
    const method = await PaymentMethod.findOne({
      userId,
      methodType: 'Card',
      isActive: true,
      isDefault: true
    });

    return method;
  } catch (error) {
    console.error('Error getting default payment method:', error.message);
    throw error;
  }
};

/**
 * Charge a saved payment method
 * @param {Object} paymentMethod - The payment method document
 * @param {Number} amount - Amount to charge (in the currency's base unit)
 * @param {String} currency - Currency code (NGN, USD, etc.)
 * @param {String} email - Customer email for the charge
 * @param {String} description - Description/reference for the charge
 * @returns {Object} - { success: boolean, data?: any, message?: string }
 */
exports.chargePaymentMethod = async (paymentMethod, amount, currency, email, description) => {
  try {
    const gateway = paymentMethod.cardGateway;

    // Get gateway credentials
    const gatewayKey = await PaymentGatewayKey.findOne({
      type: gateway,
      isActive: true
    });

    if (!gatewayKey) {
      return {
        success: false,
        message: `${gateway} gateway not configured`
      };
    }

    let result;

    switch (gateway) {
      case 'paystack':
        result = await chargePaystackAuthorization(
          paymentMethod,
          amount,
          email || paymentMethod.paystackEmail,
          gatewayKey.secretKey,
          description
        );
        break;

      case 'flutterwave':
        result = await chargeFlutterwaveToken(
          paymentMethod,
          amount,
          currency,
          email || paymentMethod.flutterwaveEmail,
          gatewayKey.secretKey,
          description
        );
        break;

      case 'squad':
        result = await chargeSquadToken(
          paymentMethod,
          amount,
          email,
          gatewayKey.secretKey,
          description
        );
        break;

      default:
        return {
          success: false,
          message: `Unsupported gateway: ${gateway}`
        };
    }

    // Update last used time
    paymentMethod.lastUsedAt = new Date();
    await paymentMethod.save();

    return result;

  } catch (error) {
    console.error('Error charging payment method:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Charge Paystack authorization
 */
async function chargePaystackAuthorization(paymentMethod, amount, email, secretKey, description) {
  try {
    const amountInKobo = Math.round(amount * 100);

    const response = await axios.post(
      'https://api.paystack.co/transaction/charge_authorization',
      {
        authorization_code: paymentMethod.paystackAuthCode,
        email: email,
        amount: amountInKobo,
        reference: `renewal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          description: description || 'Subscription renewal',
          custom_fields: [
            {
              display_name: 'Type',
              variable_name: 'type',
              value: 'renewal'
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status && response.data.data.status === 'success') {
      return {
        success: true,
        data: response.data.data,
        reference: response.data.data.reference
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Payment failed',
        data: response.data.data
      };
    }

  } catch (error) {
    console.error('Paystack charge error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
}

/**
 * Charge Flutterwave token
 */
async function chargeFlutterwaveToken(paymentMethod, amount, currency, email, secretKey, description) {
  try {
    const txRef = `renewal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = await axios.post(
      'https://api.flutterwave.com/v3/tokenized-charges',
      {
        token: paymentMethod.flutterwaveToken,
        email: email,
        amount: amount,
        currency: currency || 'NGN',
        tx_ref: txRef,
        narration: description || 'Subscription renewal'
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status === 'success') {
      return {
        success: true,
        data: response.data.data,
        reference: txRef
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Payment failed',
        data: response.data.data
      };
    }

  } catch (error) {
    console.error('Flutterwave charge error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
}

/**
 * Charge Squad token
 * Note: Squad's recurring charge API may differ - check their documentation
 */
async function chargeSquadToken(paymentMethod, amount, email, secretKey, description) {
  try {
    // Squad uses a different approach - this is a placeholder
    // Implement based on Squad's actual recurring payment API
    const txRef = `renewal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = await axios.post(
      'https://api.squadco.com/transaction/recurring',
      {
        token: paymentMethod.squadToken,
        email: email,
        amount: Math.round(amount * 100), // Squad uses kobo
        transaction_ref: txRef,
        narration: description || 'Subscription renewal'
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        reference: txRef
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Payment failed',
        data: response.data.data
      };
    }

  } catch (error) {
    console.error('Squad charge error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
}
