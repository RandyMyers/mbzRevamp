/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Payment processing endpoints
 *
 * /api/payments/initiate:
 *   post:
 *     tags: [Payments]
 *     summary: Initiate a payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, planId, gateway, amount, currency]
 *             properties:
 *               userId: { type: string }
 *               planId: { type: string }
 *               gateway: { type: string }
 *               amount: { type: number }
 *               currency: { type: string }
 *     responses:
 *       200: { description: Payment reference }
 *       400: { description: Missing fields }
 *       500: { description: Server error }
 *
 * /api/payments/upload-proof:
 *   post:
 *     tags: [Payments]
 *     summary: Upload payment proof
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               screenshot:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: Upload URL }
 *       400: { description: No file uploaded }
 *       500: { description: Server error }
 *
 * /api/payments/initiate-squad:
 *   post:
 *     tags: [Payments]
 *     summary: Initiate Squad payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, planId, amount, currency, email]
 *             properties:
 *               userId: { type: string }
 *               planId: { type: string }
 *               amount: { type: number }
 *               currency: { type: string }
 *               email: { type: string, format: email }
 *               name: { type: string }
 *     responses:
 *       200: { description: Checkout URL }
 *       500: { description: Server error }
 */
const Payment = require('../models/payment');
const Referral = require('../models/Referral');
const Commission = require('../models/Commission');
const CommissionRuleSet = require('../models/CommissionRuleSet');
const Subscription = require('../models/subscriptions');
const SubscriptionPlan = require('../models/subscriptionPlans');
const Affiliate = require('../models/Affiliate');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const PaymentGatewayKey = require('../models/paymentGatewayKey');
const axios = require('axios');
const crypto = require('crypto');
const logEvent = require('../helper/logEvent');
const Invoice = require('../models/Invoice');
const User = require('../models/users');

// ============================================
// INVOICE GENERATION HELPER
// ============================================

/**
 * Generate an invoice for a successful subscription payment
 */
const generateSubscriptionInvoice = async (payment, subscription, plan, user) => {
  try {
    if (!payment || !plan || !user) {
      console.warn('Missing data for invoice generation');
      return null;
    }

    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber(user.organization);

    // Create invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      userId: user._id,
      organizationId: user.organization,
      customerName: user.fullName || user.email,
      customerEmail: user.email,
      subtotal: payment.amount,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: payment.amount,
      currency: payment.currency || 'USD',
      issueDate: new Date(),
      dueDate: new Date(), // Already paid
      paidDate: new Date(),
      status: 'paid',
      type: 'subscription',
      items: [{
        name: `${plan.name} Subscription`,
        description: `${plan.billingInterval || 'Monthly'} subscription to ${plan.name} plan`,
        quantity: 1,
        unitPrice: payment.amount,
        totalPrice: payment.amount,
        taxRate: 0
      }],
      notes: `Payment Reference: ${payment.reference}`,
      terms: 'Thank you for your subscription!',
      companyInfo: {
        name: 'MBZ Technology',
        email: 'billing@mbztechnology.com'
      },
      createdBy: user._id
    });

    console.log(`✅ Generated invoice ${invoiceNumber} for payment ${payment.reference}`);

    await logEvent({
      action: 'invoice_generated',
      user: user._id,
      resource: 'Invoice',
      resourceId: invoice._id,
      details: {
        invoiceNumber,
        paymentId: payment._id,
        subscriptionId: subscription?._id,
        amount: payment.amount
      },
      organization: user.organization
    });

    return invoice;

  } catch (error) {
    console.error('Error generating invoice:', error.message);
    return null;
  }
};

// ============================================
// WEBHOOK SIGNATURE VERIFICATION HELPERS
// ============================================

/**
 * Verify Flutterwave webhook signature
 * Flutterwave uses a secret hash sent in the 'verif-hash' header
 * Using crypto.timingSafeEqual to prevent timing attacks
 */
const verifyFlutterwaveSignature = (secretHash, headerHash) => {
  if (!secretHash || !headerHash) return false;
  // Use constant-time comparison to prevent timing attacks
  try {
    const secretBuffer = Buffer.from(secretHash);
    const headerBuffer = Buffer.from(headerHash);
    if (secretBuffer.length !== headerBuffer.length) return false;
    return crypto.timingSafeEqual(secretBuffer, headerBuffer);
  } catch {
    return false;
  }
};

/**
 * Verify Paystack webhook signature
 * Paystack uses HMAC SHA512 with the secret key
 * Using crypto.timingSafeEqual to prevent timing attacks
 */
const verifyPaystackSignature = (payload, signature, secretKey) => {
  if (!signature || !secretKey) return false;
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(JSON.stringify(payload))
    .digest('hex');
  // Use constant-time comparison to prevent timing attacks
  try {
    const hashBuffer = Buffer.from(hash);
    const signatureBuffer = Buffer.from(signature);
    if (hashBuffer.length !== signatureBuffer.length) return false;
    return crypto.timingSafeEqual(hashBuffer, signatureBuffer);
  } catch {
    return false;
  }
};

/**
 * Verify Squad webhook signature
 * Squad uses HMAC SHA512 with the secret key
 * Using crypto.timingSafeEqual to prevent timing attacks
 */
const verifySquadSignature = (payload, signature, secretKey) => {
  if (!signature || !secretKey) return false;
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(JSON.stringify(payload))
    .digest('hex');
  // Use constant-time comparison to prevent timing attacks
  try {
    const hashBuffer = Buffer.from(hash.toLowerCase());
    const signatureBuffer = Buffer.from(signature.toLowerCase());
    if (hashBuffer.length !== signatureBuffer.length) return false;
    return crypto.timingSafeEqual(hashBuffer, signatureBuffer);
  } catch {
    return false;
  }
};

// POST /api/payments/initiate
// Body: { userId, planId, gateway, amount, currency }
exports.initiatePayment = async (req, res) => {
  try {
    const { userId, planId, gateway, amount, currency } = req.body;
    console.log(req.body);
    if (!userId || !planId || !gateway || !amount || !currency) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const reference = uuidv4();
    const payment = await Payment.create({
      userId,
      planId,
      gateway,
      amount,
      currency,
      reference,
      status: 'pending',
    });
    await logEvent({
      action: 'initiate_payment',
      user: req.user._id,
      resource: 'Payment',
      resourceId: payment._id,
      details: { ...payment.toObject() },
      organization: req.user.organization
    });
    return res.json({ reference, paymentId: payment._id });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/payments/upload-proof
// Accepts a file (screenshot) and uploads to Cloudinary, returns the URL
exports.uploadPaymentProof = async (req, res) => {
  try {
    if (!req.files || !req.files.screenshot) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const file = req.files.screenshot;
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'payment_proofs',
    });
    return res.status(200).json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload payment proof' });
  }
};

// POST /api/payments/initiate-squad
// Body: { userId, planId, amount, currency, email, name }
exports.initiateSquadPayment = async (req, res) => {
  try {
    const { userId, planId, amount, currency, email, name } = req.body;
    console.log(req.body);
    if (!userId || !planId || !amount || !currency || !email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Get Squad keys from DB
    const gatewayKey = await PaymentGatewayKey.findOne({ type: 'squad', isActive: true });
    console.log(gatewayKey.publicKey, gatewayKey.secretKey);
    if (!gatewayKey) {
      return res.status(500).json({ message: 'Squad gateway keys not found' });
    }
    // Prepare request
    const squadAmount = Math.round(amount * 100); // NGN in kobo
    const CallBack_URL =  'https://mbztechnology.com';
    const payload = {
      amount: squadAmount,
      email,
      key: gatewayKey.publicKey,
      currency,
      initiate_type: 'inline',
      CallBack_URL,
      customer_name: name,
      payment_channels: ['card'],
      
    };
    const squadRes = await axios.post(
      'https://sandbox-api.squadco.com/payment/Initiate',
      payload,
      {
        headers: {
          Authorization: `Bearer ${gatewayKey.secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = squadRes.data;
    if (data.status !== 200 || !data.data?.checkout_url) {
      return res.status(500).json({ message: 'Failed to initiate Squad payment', squadResponse: data });
    }
    // Optionally, create a payment record here with status 'pending' and store transaction_ref
    await logEvent({
      action: 'initiate_squad_payment',
      user: req.user._id,
      resource: 'Payment',
      resourceId: data.data.transaction_ref,
      details: { ...data.data },
      organization: req.user.organization
    });
    return res.json({ checkout_url: data.data.checkout_url, transaction_ref: data.data.transaction_ref });
  } catch (err) {
    if (err.response) {
      console.log(err.response);
      return res.status(500).json({ message: 'Squad error', error: err.response.data });
    }
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// In processPayment (after processing the payment)
exports.processPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    // Process the payment
    payment.status = 'processed';
    await payment.save();
    await logEvent({
      action: 'process_payment',
      user: req.user._id,
      resource: 'Payment',
      resourceId: payment._id,
      details: { ...payment.toObject() },
      organization: req.user.organization
    });
    // === Affiliate Commission Engine (first payment conversion) ===
    try {
      // Resolve user and plan
      const userId = payment.user || payment.userId || null;
      let planId = payment.plan || payment.planId || null;
      if (!planId && userId) {
        const activeSub = await Subscription.findOne({ user: userId, status: 'active' }).select('plan');
        planId = activeSub ? activeSub.plan : null;
      }
      const plan = planId ? await SubscriptionPlan.findById(planId) : null;

      // Find referral for this user (pending)
      const referral = userId ? await Referral.findOne({ referredUserId: userId, status: 'pending' }) : null;
      if (referral && plan) {
        // Determine commission percent by billing interval from active rule set
        const rule = await CommissionRuleSet.findOne({ isActive: true });
        let commissionPercent = 0;
        const interval = (plan.billingInterval || '').toLowerCase();
        if (interval === 'monthly') {
          commissionPercent = rule?.monthlyPercent ?? 10;
        } else if (interval === 'quarterly' || interval === 'quarterly') {
          commissionPercent = rule?.quarterly?.firstPeriodPercent ?? 12;
        } else if (interval === 'yearly') {
          commissionPercent = rule?.yearly?.firstPeriodPercent ?? 15;
        } else {
          commissionPercent = rule?.monthlyPercent ?? 10;
        }
        const commissionAmount = Math.max(0, (payment.amount * commissionPercent) / 100);

        // Create Commission record
        const commission = await Commission.create({
          affiliateId: referral.affiliateId,
          referralId: referral._id,
          amount: commissionAmount,
          status: 'pending',
          metadata: {
            conversionValue: payment.amount,
            commissionRate: commissionPercent,
            currency: payment.currency
          }
        });

        // Update referral as converted with computed commission
        referral.status = 'converted';
        referral.conversionValue = payment.amount;
        referral.commission = commissionAmount;
        referral.convertedAt = new Date();
        await referral.save();

        // Update affiliate earnings (pending)
        const affiliate = await Affiliate.findById(referral.affiliateId);
        if (affiliate) {
          await affiliate.updateEarnings(commissionAmount);
        }
      }
    } catch (affErr) {
      console.warn('⚠️  Commission calculation failed:', affErr.message);
    }

    return res.json({ message: 'Payment processed successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// In paymentFailed (after payment fails)
exports.paymentFailed = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    const { reason } = req.body;
    payment.status = 'failed';
    await payment.save();
    await logEvent({
      action: 'payment_failed',
      user: req.user._id,
      resource: 'Payment',
      resourceId: payment._id,
      details: { reason },
      organization: req.user.organization
    });
    return res.json({ message: 'Payment failed', reason });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// In refundPayment (after refunding the payment)
exports.refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    const { refundAmount, reason } = req.body;
    payment.status = 'refunded';
    payment.refundAmount = refundAmount;
    await payment.save();
    await logEvent({
      action: 'refund_payment',
      user: req.user._id,
      resource: 'Payment',
      resourceId: payment._id,
      details: { refundAmount, reason },
      organization: req.user.organization
    });
    return res.json({ message: 'Payment refunded successfully', refundAmount, reason });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify payment and activate subscription
 *     description: Verifies payment success and activates the associated subscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentId, paymentReference, gateway]
 *             properties:
 *               paymentId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Payment ID
 *                 example: "507f1f77bcf86cd799439011"
 *               paymentReference:
 *                 type: string
 *                 description: Payment reference from gateway
 *                 example: "FLW-123456789"
 *               gateway:
 *                 type: string
 *                 enum: [flutterwave, paystack, squad, bank]
 *                 description: Payment gateway used
 *                 example: "flutterwave"
 *               gatewayResponse:
 *                 type: object
 *                 description: Gateway response data
 *               amount:
 *                 type: number
 *                 description: Actual amount paid
 *                 example: 10.00
 *     responses:
 *       200:
 *         description: Payment verified and subscription activated
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
 *                   example: "Payment verified and subscription activated"
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found
 *       400:
 *         description: Payment already verified or invalid
 *       500:
 *         description: Server error
 */
/**
 * Verify payment with the actual gateway API
 */
const verifyWithGateway = async (gateway, reference, gatewayKey) => {
  try {
    switch (gateway.toLowerCase()) {
      case 'flutterwave': {
        // Use verify_by_reference endpoint since we have tx_ref, not transaction_id
        const response = await axios.get(
          `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
          {
            headers: {
              Authorization: `Bearer ${gatewayKey.secretKey}`,
            },
          }
        );
        console.log('Flutterwave verification response:', response.data);
        if (response.data.status === 'success' && response.data.data.status === 'successful') {
          return {
            verified: true,
            amount: response.data.data.amount,
            currency: response.data.data.currency,
            data: response.data.data,
          };
        }
        return { verified: false, error: response.data.message || 'Payment not successful' };
      }

      case 'paystack': {
        const response = await axios.get(
          `https://api.paystack.co/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${gatewayKey.secretKey}`,
            },
          }
        );
        if (response.data.status && response.data.data.status === 'success') {
          return {
            verified: true,
            amount: response.data.data.amount / 100, // Paystack returns amount in kobo
            currency: response.data.data.currency,
            data: response.data.data,
          };
        }
        return { verified: false, error: 'Payment not successful' };
      }

      case 'squad': {
        // Detect sandbox mode from secret key
        const isSandbox = gatewayKey.secretKey?.startsWith('sandbox_') ||
                          gatewayKey.publicKey?.startsWith('sandbox_');
        const squadBaseUrl = isSandbox
          ? 'https://sandbox-api-d.squadco.com'
          : 'https://api-d.squadco.com';

        console.log(`[Squad Verify] Using ${isSandbox ? 'sandbox' : 'production'} API`);
        console.log(`[Squad Verify] URL: ${squadBaseUrl}/transaction/verify/${reference}`);

        const response = await axios.get(
          `${squadBaseUrl}/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${gatewayKey.secretKey}`,
            },
          }
        );

        console.log('[Squad Verify] Response:', JSON.stringify(response.data, null, 2));

        // Squad returns transaction_status in lowercase ('success') not 'Success'
        const txStatus = response.data.data?.transaction_status?.toLowerCase();
        if (response.data.success && txStatus === 'success') {
          return {
            verified: true,
            amount: response.data.data.transaction_amount / 100, // Squad returns in kobo
            currency: response.data.data.transaction_currency_id,
            data: response.data.data,
          };
        }
        return { verified: false, error: response.data.message || 'Payment not successful' };
      }

      case 'bank':
        // Bank transfers require manual verification
        return { verified: false, requiresManualVerification: true };

      default:
        return { verified: false, error: `Unknown gateway: ${gateway}` };
    }
  } catch (error) {
    console.error(`Gateway verification error (${gateway}):`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    });
    return {
      verified: false,
      error: error.response?.data?.message || error.message,
      statusCode: error.response?.status
    };
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, paymentReference, gateway, amount } = req.body;

    if (!paymentId || !paymentReference || !gateway) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: paymentId, paymentReference, gateway'
      });
    }

    // Find the payment record
    const payment = await Payment.findById(paymentId).populate('subscription');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if payment is already verified
    if (payment.status === 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment already verified'
      });
    }

    // Get gateway keys
    const gatewayKey = await PaymentGatewayKey.findOne({ type: gateway.toLowerCase(), isActive: true });
    if (!gatewayKey && gateway.toLowerCase() !== 'bank') {
      return res.status(400).json({
        success: false,
        message: `${gateway} gateway not configured`
      });
    }

    // CRITICAL: Verify payment with the actual gateway API (don't trust client)
    console.log(`[Verify Payment] Gateway: ${gateway}, Reference: ${paymentReference}, PaymentID: ${paymentId}`);
    const verification = await verifyWithGateway(gateway, paymentReference, gatewayKey);

    if (!verification.verified) {
      if (verification.requiresManualVerification) {
        // Bank transfer - mark as pending manual review
        payment.status = 'pending_review';
        payment.reference = paymentReference;
        await payment.save();

        return res.json({
          success: true,
          message: 'Bank transfer submitted for manual verification',
          requiresManualVerification: true,
          payment: payment
        });
      }

      // Failed verification
      await logEvent({
        action: 'payment_verification_failed',
        user: payment.user,
        resource: 'Payment',
        resourceId: payment._id,
        details: {
          gateway: gateway,
          paymentReference: paymentReference,
          error: verification.error
        },
        organization: req.user?.organization
      });

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        error: verification.error
      });
    }

    // Verify amount matches (with tolerance for currency conversion)
    const expectedAmount = payment.amount;
    const verifiedAmount = verification.amount;
    const paymentCurrency = payment.currency || 'USD';
    const verifiedCurrency = verification.currency || 'NGN';

    // Log amounts for debugging
    console.log(`[Amount Check] Expected: ${expectedAmount} ${paymentCurrency}, Verified: ${verifiedAmount} ${verifiedCurrency}`);

    // If currencies match, do strict comparison
    // If currencies differ (USD payment verified in NGN), skip strict amount check
    // This handles currency conversion cases where we charge in NGN but store in USD
    let amountMismatch = false;

    if (paymentCurrency === verifiedCurrency) {
      // Same currency - use 1% tolerance
      const tolerance = 0.01;
      amountMismatch = Math.abs(verifiedAmount - expectedAmount) / expectedAmount > tolerance;
    } else {
      // Different currencies (e.g., USD stored, NGN verified)
      // For Nigerian gateways, we convert USD to NGN at ~1550 rate
      // Verify the NGN amount is reasonable (between 1000x and 2000x the USD amount)
      // This is a sanity check, not exact validation
      if (paymentCurrency === 'USD' && (verifiedCurrency === 'NGN' || verifiedCurrency === 'NGN')) {
        const minExpectedNGN = expectedAmount * 1000; // Minimum reasonable rate
        const maxExpectedNGN = expectedAmount * 2000; // Maximum reasonable rate
        amountMismatch = verifiedAmount < minExpectedNGN || verifiedAmount > maxExpectedNGN;

        if (amountMismatch) {
          console.log(`[Amount Check] Cross-currency check failed: ${verifiedAmount} NGN not in range [${minExpectedNGN}, ${maxExpectedNGN}]`);
        }
      } else {
        // For other currency pairs, skip strict check and log warning
        console.log(`[Amount Check] Skipping strict check for ${paymentCurrency} -> ${verifiedCurrency} conversion`);
        amountMismatch = false;
      }
    }

    if (amountMismatch) {
      await logEvent({
        action: 'payment_amount_mismatch',
        user: payment.user,
        resource: 'Payment',
        resourceId: payment._id,
        details: {
          expectedAmount: expectedAmount,
          expectedCurrency: paymentCurrency,
          verifiedAmount: verifiedAmount,
          verifiedCurrency: verifiedCurrency,
          gateway: gateway
        },
        organization: req.user?.organization
      });

      return res.status(400).json({
        success: false,
        message: 'Payment amount mismatch',
        expected: expectedAmount,
        received: verifiedAmount
      });
    }

    // Payment verified successfully - update status
    payment.status = 'success';
    payment.paymentData = verification.data;
    payment.reference = paymentReference;
    payment.amount = verifiedAmount;
    payment.verifiedAt = new Date();
    await payment.save();

    // Save card token for future charges (from verification response)
    if (payment.user && verification.data) {
      try {
        const paymentMethodService = require('../services/paymentMethodService');
        let savedMethod = null;

        // Debug: Log what card data we received from the gateway
        console.log(`[Card Save Debug] Gateway: ${gateway}`);
        console.log(`[Card Save Debug] Full verification data keys:`, Object.keys(verification.data));
        if (gateway.toLowerCase() === 'flutterwave') {
          console.log(`[Card Save Debug] Flutterwave card data:`, JSON.stringify(verification.data.card, null, 2));
        } else if (gateway.toLowerCase() === 'paystack') {
          console.log(`[Card Save Debug] Paystack authorization:`, JSON.stringify(verification.data.authorization, null, 2));
        } else if (gateway.toLowerCase() === 'squad') {
          console.log(`[Card Save Debug] Squad full data:`, JSON.stringify(verification.data, null, 2));
          console.log(`[Card Save Debug] Squad card_details:`, JSON.stringify(verification.data.card_details, null, 2));
          console.log(`[Card Save Debug] Squad payment_information:`, JSON.stringify(verification.data.payment_information, null, 2));
        }

        if (gateway.toLowerCase() === 'flutterwave' && verification.data.card && verification.data.card.token) {
          savedMethod = await paymentMethodService.savePaymentMethod({
            userId: payment.user,
            gateway: 'flutterwave',
            token: verification.data.card.token,
            lastFour: verification.data.card.last_4digits,
            brand: verification.data.card.type,
            expMonth: verification.data.card.expiry ? verification.data.card.expiry.split('/')[0] : null,
            expYear: verification.data.card.expiry ? verification.data.card.expiry.split('/')[1] : null,
            email: verification.data.customer?.email
          });
          console.log(`Flutterwave card saved from verification for user ${payment.user}: ${verification.data.card.type} ****${verification.data.card.last_4digits}`);
        } else if (gateway.toLowerCase() === 'paystack' && verification.data.authorization) {
          savedMethod = await paymentMethodService.savePaymentMethod({
            userId: payment.user,
            gateway: 'paystack',
            authCode: verification.data.authorization.authorization_code,
            customerCode: verification.data.customer?.customer_code,
            lastFour: verification.data.authorization.last4,
            brand: verification.data.authorization.card_type,
            expMonth: verification.data.authorization.exp_month,
            expYear: verification.data.authorization.exp_year,
            bank: verification.data.authorization.bank,
            email: verification.data.customer?.email
          });
          console.log(`Paystack card saved from verification for user ${payment.user}: ${verification.data.authorization.card_type} ****${verification.data.authorization.last4}`);
        } else if (gateway.toLowerCase() === 'squad') {
          // Squad may return card data in different locations depending on API version
          const cardDetails = verification.data.card_details ||
                              verification.data.payment_information?.card_details ||
                              verification.data.payment_information;
          const customerEmail = verification.data.customer_email ||
                                verification.data.email ||
                                verification.data.meta?.email;

          // Squad uses transaction_ref as the token for recurring charges
          const squadToken = verification.data.transaction_ref ||
                             cardDetails?.token ||
                             paymentReference;

          console.log(`[Squad Card Save] Card details found:`, JSON.stringify(cardDetails, null, 2));
          console.log(`[Squad Card Save] Using token: ${squadToken}, email: ${customerEmail}`);

          // Save the payment method with whatever data we have
          // Squad requires transaction_ref for tokenized charges
          savedMethod = await paymentMethodService.savePaymentMethod({
            userId: payment.user,
            gateway: 'squad',
            squadToken: squadToken,
            squadCustomerId: verification.data.customer_id || verification.data.meta?.customer_id,
            lastFour: cardDetails?.last_4digits || cardDetails?.last4 || null,
            brand: cardDetails?.card_type || cardDetails?.type || null,
            bank: cardDetails?.issuing_bank || cardDetails?.bank || null,
            email: customerEmail
          });
          console.log(`Squad card saved from verification for user ${payment.user}`);
        } else {
          console.log(`[Card Save Debug] No card data found to save. Gateway: ${gateway}`);
          console.log(`[Card Save Debug] Flutterwave has card?: ${!!verification.data.card}, has token?: ${!!verification.data.card?.token}`);
          console.log(`[Card Save Debug] Paystack has authorization?: ${!!verification.data.authorization}`);
          console.log(`[Card Save Debug] Squad data:`, JSON.stringify(verification.data, null, 2));
        }

        // Link payment method to subscription for auto-renewal
        if (savedMethod && payment.subscription) {
          const subscription = await Subscription.findById(payment.subscription);
          if (subscription) {
            subscription.savedPaymentMethod = savedMethod._id;
            await subscription.save();
          }
        }
      } catch (cardSaveError) {
        console.error('Error saving card from verification:', cardSaveError.message);
        // Don't fail the verification if card saving fails
      }
    }

    // Find and activate the subscription
    const subscription = await Subscription.findById(payment.subscription).populate('plan');
    if (subscription) {
      subscription.status = 'active';
      subscription.isActive = true;
      subscription.paymentStatus = 'Paid';
      subscription.activatedAt = new Date();
      await subscription.save();

      // Handle upgrade: deactivate the previous subscription
      if (subscription.isUpgrade && subscription.previousSubscription) {
        const previousSubscription = await Subscription.findById(subscription.previousSubscription);
        if (previousSubscription) {
          previousSubscription.status = 'canceled';
          previousSubscription.isActive = false;
          previousSubscription.upgradeStatus = 'upgraded';
          previousSubscription.canceledAt = new Date();
          await previousSubscription.save();

          console.log(`Upgrade completed: Deactivated previous subscription ${previousSubscription._id}`);
        }
      }

      // IMPORTANT: Deactivate ALL other subscriptions for this user
      // Enforce single active subscription per user
      const deactivateResult = await Subscription.updateMany(
        {
          user: subscription.user,
          _id: { $ne: subscription._id },
          status: 'active'
        },
        {
          $set: {
            status: 'canceled',
            isActive: false,
            canceledAt: new Date()
          }
        }
      );

      if (deactivateResult.modifiedCount > 0) {
        console.log(`Deactivated ${deactivateResult.modifiedCount} other subscription(s) for user ${subscription.user}`);
      }
    }

    // Generate invoice for the successful payment
    let invoice = null;
    if (payment.user) {
      const user = await User.findById(payment.user);
      const plan = subscription?.plan || await SubscriptionPlan.findById(payment.planId);
      if (user && plan) {
        invoice = await generateSubscriptionInvoice(payment, subscription, plan, user);
      }
    }

    // Log the event
    await logEvent({
      action: 'payment_verified',
      user: payment.user,
      resource: 'Payment',
      resourceId: payment._id,
      details: {
        gateway: gateway,
        paymentReference: paymentReference,
        verifiedAmount: verifiedAmount,
        subscriptionId: subscription?._id,
        invoiceId: invoice?._id
      },
      organization: req.user?.organization
    });

    res.json({
      success: true,
      message: 'Payment verified and subscription activated',
      subscription: subscription,
      payment: payment,
      invoice: invoice
    });

  } catch (err) {
    console.error('Error verifying payment:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

/**
 * @swagger
 * /api/payments/webhook/flutterwave:
 *   post:
 *     tags: [Payments]
 *     summary: Flutterwave payment webhook
 *     description: Handles Flutterwave payment webhook notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: "charge.completed"
 *               data:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "123456"
 *                   tx_ref:
 *                     type: string
 *                     example: "FLW-123456789"
 *                   amount:
 *                     type: number
 *                     example: 1000
 *                   currency:
 *                     type: string
 *                     example: "NGN"
 *                   status:
 *                     type: string
 *                     example: "successful"
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook data
 *       500:
 *         description: Server error
 */
exports.handleFlutterwaveWebhook = async (req, res) => {
  try {
    // Step 1: Verify webhook signature
    const signatureHash = req.headers['verif-hash'];
    const gatewayKey = await PaymentGatewayKey.findOne({ type: 'flutterwave', isActive: true });

    if (!gatewayKey) {
      console.error('Flutterwave gateway keys not configured');
      return res.status(500).json({ status: 'error', message: 'Gateway not configured' });
    }

    // Use webhookSecret if set, otherwise fall back to secretKey
    const secretHash = gatewayKey.webhookSecret || gatewayKey.secretKey;

    if (!verifyFlutterwaveSignature(secretHash, signatureHash)) {
      console.error('Flutterwave webhook signature verification failed');
      await logEvent({
        action: 'flutterwave_webhook_signature_failed',
        resource: 'Payment',
        details: { receivedHash: signatureHash ? 'present' : 'missing' }
      });
      return res.status(401).json({ status: 'error', message: 'Invalid signature' });
    }

    // Step 2: Process the webhook
    const { event, data } = req.body;

    if (event === 'charge.completed' && data.status === 'successful') {
      // Find payment by reference
      const payment = await Payment.findOne({ reference: data.tx_ref }).populate({
        path: 'subscription',
        populate: { path: 'plan' }
      });

      if (payment && payment.status === 'pending') {
        // Update payment status
        payment.status = 'success';
        payment.paymentData = data;
        payment.verifiedAt = new Date();
        await payment.save();

        // Activate subscription
        if (payment.subscription) {
          const subscription = payment.subscription;
          subscription.status = 'active';
          subscription.isActive = true;
          subscription.paymentStatus = 'Paid';
          subscription.activatedAt = new Date();
          await subscription.save();

          // IMPORTANT: Deactivate ALL other subscriptions for this user
          // Enforce single active subscription per user
          await Subscription.updateMany(
            {
              user: subscription.user,
              _id: { $ne: subscription._id },
              status: 'active'
            },
            {
              $set: {
                status: 'canceled',
                isActive: false,
                canceledAt: new Date()
              }
            }
          );

          // Save card token for future charges (Flutterwave)
          if (data.card && data.card.token && payment.user) {
            try {
              const paymentMethodService = require('../services/paymentMethodService');
              const savedMethod = await paymentMethodService.savePaymentMethod({
                userId: payment.user,
                gateway: 'flutterwave',
                token: data.card.token,
                lastFour: data.card.last_4digits,
                brand: data.card.type,
                expMonth: data.card.expiry ? data.card.expiry.split('/')[0] : null,
                expYear: data.card.expiry ? data.card.expiry.split('/')[1] : null,
                email: data.customer?.email
              });

              // Link payment method to subscription for auto-renewal
              if (savedMethod) {
                subscription.savedPaymentMethod = savedMethod._id;
                await subscription.save();
              }

              console.log(`Flutterwave card saved for user ${payment.user}: ${data.card.type} ****${data.card.last_4digits}`);
            } catch (cardSaveError) {
              console.error('Error saving Flutterwave card:', cardSaveError.message);
              // Don't fail the webhook if card saving fails
            }
          }
        }

        // Generate invoice
        if (payment.user) {
          const user = await User.findById(payment.user);
          const plan = payment.subscription?.plan;
          if (user && plan) {
            await generateSubscriptionInvoice(payment, payment.subscription, plan, user);
          }
        }

        // Log the event
        await logEvent({
          action: 'flutterwave_payment_success',
          user: payment.user,
          resource: 'Payment',
          resourceId: payment._id,
          details: {
            tx_ref: data.tx_ref,
            amount: data.amount,
            currency: data.currency
          },
          organization: req.user?.organization
        });
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('Flutterwave webhook error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

/**
 * @swagger
 * /api/payments/webhook/paystack:
 *   post:
 *     tags: [Payments]
 *     summary: Paystack payment webhook
 *     description: Handles Paystack payment webhook notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: "charge.success"
 *               data:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "123456"
 *                   reference:
 *                     type: string
 *                     example: "PAYSTACK-123456789"
 *                   amount:
 *                     type: number
 *                     example: 100000
 *                   currency:
 *                     type: string
 *                     example: "NGN"
 *                   status:
 *                     type: string
 *                     example: "success"
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook data
 *       500:
 *         description: Server error
 */
exports.handlePaystackWebhook = async (req, res) => {
  try {
    // Step 1: Verify webhook signature
    const signature = req.headers['x-paystack-signature'];
    const gatewayKey = await PaymentGatewayKey.findOne({ type: 'paystack', isActive: true });

    if (!gatewayKey) {
      console.error('Paystack gateway keys not configured');
      return res.status(500).json({ status: 'error', message: 'Gateway not configured' });
    }

    // Use webhookSecret if set, otherwise fall back to secretKey
    const secretKey = gatewayKey.webhookSecret || gatewayKey.secretKey;

    if (!verifyPaystackSignature(req.body, signature, secretKey)) {
      console.error('Paystack webhook signature verification failed');
      await logEvent({
        action: 'paystack_webhook_signature_failed',
        resource: 'Payment',
        details: { receivedSignature: signature ? 'present' : 'missing' }
      });
      return res.status(401).json({ status: 'error', message: 'Invalid signature' });
    }

    // Step 2: Process the webhook
    const { event, data } = req.body;

    if (event === 'charge.success' && data.status === 'success') {
      // Find payment by reference
      const payment = await Payment.findOne({ reference: data.reference }).populate({
        path: 'subscription',
        populate: { path: 'plan' }
      });

      if (payment && payment.status === 'pending') {
        // Update payment status
        payment.status = 'success';
        payment.paymentData = data;
        payment.verifiedAt = new Date();
        await payment.save();

        // Activate subscription
        if (payment.subscription) {
          const subscription = payment.subscription;
          subscription.status = 'active';
          subscription.isActive = true;
          subscription.paymentStatus = 'Paid';
          subscription.activatedAt = new Date();
          await subscription.save();

          // IMPORTANT: Deactivate ALL other subscriptions for this user
          // Enforce single active subscription per user
          await Subscription.updateMany(
            {
              user: subscription.user,
              _id: { $ne: subscription._id },
              status: 'active'
            },
            {
              $set: {
                status: 'canceled',
                isActive: false,
                canceledAt: new Date()
              }
            }
          );

          // Save card authorization for future charges (Paystack)
          if (data.authorization && payment.user) {
            try {
              const paymentMethodService = require('../services/paymentMethodService');
              const savedMethod = await paymentMethodService.savePaymentMethod({
                userId: payment.user,
                gateway: 'paystack',
                authCode: data.authorization.authorization_code,
                customerCode: data.customer?.customer_code,
                lastFour: data.authorization.last4,
                brand: data.authorization.card_type,
                expMonth: data.authorization.exp_month,
                expYear: data.authorization.exp_year,
                bank: data.authorization.bank,
                email: data.customer?.email
              });

              // Link payment method to subscription for auto-renewal
              if (savedMethod) {
                subscription.savedPaymentMethod = savedMethod._id;
                await subscription.save();
              }

              console.log(`Paystack card saved for user ${payment.user}: ${data.authorization.card_type} ****${data.authorization.last4}`);
            } catch (cardSaveError) {
              console.error('Error saving Paystack card:', cardSaveError.message);
              // Don't fail the webhook if card saving fails
            }
          }
        }

        // Generate invoice
        if (payment.user) {
          const user = await User.findById(payment.user);
          const plan = payment.subscription?.plan;
          if (user && plan) {
            await generateSubscriptionInvoice(payment, payment.subscription, plan, user);
          }
        }

        // Log the event
        await logEvent({
          action: 'paystack_payment_success',
          user: payment.user,
          resource: 'Payment',
          resourceId: payment._id,
          details: {
            reference: data.reference,
            amount: data.amount,
            currency: data.currency
          },
          organization: req.user?.organization
        });
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('Paystack webhook error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

/**
 * @swagger
 * /api/payments/webhook/squad:
 *   post:
 *     tags: [Payments]
 *     summary: Squad payment webhook
 *     description: Handles Squad payment webhook notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: "payment.completed"
 *               data:
 *                 type: object
 *                 properties:
 *                   transaction_ref:
 *                     type: string
 *                     example: "SQUAD-123456789"
 *                   amount:
 *                     type: number
 *                     example: 100000
 *                   currency:
 *                     type: string
 *                     example: "NGN"
 *                   status:
 *                     type: string
 *                     example: "success"
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook data
 *       500:
 *         description: Server error
 */
exports.handleSquadWebhook = async (req, res) => {
  try {
    // Step 1: Verify webhook signature
    const signature = req.headers['x-squad-encrypted-body'];
    const gatewayKey = await PaymentGatewayKey.findOne({ type: 'squad', isActive: true });

    if (!gatewayKey) {
      console.error('Squad gateway keys not configured');
      return res.status(500).json({ status: 'error', message: 'Gateway not configured' });
    }

    // Use webhookSecret if set, otherwise fall back to secretKey
    const secretKey = gatewayKey.webhookSecret || gatewayKey.secretKey;

    if (!verifySquadSignature(req.body, signature, secretKey)) {
      console.error('Squad webhook signature verification failed');
      await logEvent({
        action: 'squad_webhook_signature_failed',
        resource: 'Payment',
        details: { receivedSignature: signature ? 'present' : 'missing' }
      });
      return res.status(401).json({ status: 'error', message: 'Invalid signature' });
    }

    // Step 2: Process the webhook
    const { Event: event, Body: data } = req.body; // Squad uses capitalized keys

    // Squad event types: "charge_successful", "transfer_failed", etc.
    if ((event === 'charge_successful' || event === 'payment.completed') && data) {
      // Find payment by reference
      const transactionRef = data.transaction_ref || data.transaction_reference;
      const payment = await Payment.findOne({ reference: transactionRef }).populate({
        path: 'subscription',
        populate: { path: 'plan' }
      });

      if (payment && payment.status === 'pending') {
        // Update payment status
        payment.status = 'success';
        payment.paymentData = data;
        payment.verifiedAt = new Date();
        await payment.save();

        // Activate subscription
        if (payment.subscription) {
          const subscription = payment.subscription;
          subscription.status = 'active';
          subscription.isActive = true;
          subscription.paymentStatus = 'Paid';
          subscription.activatedAt = new Date();
          await subscription.save();

          // IMPORTANT: Deactivate ALL other subscriptions for this user
          // Enforce single active subscription per user
          await Subscription.updateMany(
            {
              user: subscription.user,
              _id: { $ne: subscription._id },
              status: 'active'
            },
            {
              $set: {
                status: 'canceled',
                isActive: false,
                canceledAt: new Date()
              }
            }
          );

          // Save card token for future charges (Squad)
          // Note: Squad's response may include card/token data - adjust based on actual response
          if (data.customer_id && payment.user) {
            try {
              const paymentMethodService = require('../services/paymentMethodService');
              const savedMethod = await paymentMethodService.savePaymentMethod({
                userId: payment.user,
                gateway: 'squad',
                squadToken: data.transaction_ref, // Squad may use different token field
                squadCustomerId: data.customer_id,
                lastFour: data.card?.last_4digits || data.last4 || null,
                brand: data.card?.type || data.card_type || null,
                email: data.customer_email || data.email
              });

              // Link payment method to subscription for auto-renewal
              if (savedMethod) {
                subscription.savedPaymentMethod = savedMethod._id;
                await subscription.save();
              }

              console.log(`Squad card saved for user ${payment.user}`);
            } catch (cardSaveError) {
              console.error('Error saving Squad card:', cardSaveError.message);
              // Don't fail the webhook if card saving fails
            }
          }
        }

        // Generate invoice
        if (payment.user) {
          const user = await User.findById(payment.user);
          const plan = payment.subscription?.plan;
          if (user && plan) {
            await generateSubscriptionInvoice(payment, payment.subscription, plan, user);
          }
        }

        // Log the event
        await logEvent({
          action: 'squad_payment_success',
          user: payment.user,
          resource: 'Payment',
          resourceId: payment._id,
          details: {
            transaction_ref: transactionRef,
            amount: data.amount,
            currency: data.currency
          },
          organization: req.user?.organization
        });
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('Squad webhook error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ============================================
// FLUTTERWAVE INLINE CHECKOUT CONFIG
// ============================================

/**
 * @swagger
 * /api/payments/flutterwave-config:
 *   get:
 *     tags: [Payments]
 *     summary: Get Flutterwave configuration for inline checkout
 *     description: Returns public key and configuration needed for Flutterwave inline checkout
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paymentId
 *         schema:
 *           type: string
 *         description: Payment ID to get config for
 *     responses:
 *       200:
 *         description: Flutterwave config retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 publicKey:
 *                   type: string
 *                   example: "FLWPUBK_TEST-xxx"
 *                 config:
 *                   type: object
 *                   properties:
 *                     tx_ref:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *       404:
 *         description: Gateway keys not found
 *       500:
 *         description: Server error
 */
exports.getFlutterwaveConfig = async (req, res) => {
  try {
    const { paymentId } = req.query;
    const user = req.user;

    // Get Flutterwave keys from DB
    const gatewayKey = await PaymentGatewayKey.findOne({ type: 'flutterwave', isActive: true });
    if (!gatewayKey) {
      return res.status(404).json({
        success: false,
        message: 'Flutterwave gateway keys not configured'
      });
    }

    // If paymentId is provided, get payment details
    let paymentConfig = null;
    if (paymentId) {
      const payment = await Payment.findById(paymentId).populate('plan subscription');
      if (payment) {
        paymentConfig = {
          tx_ref: payment.reference,
          amount: payment.amount,
          currency: payment.currency || 'NGN',
          payment_options: 'card,banktransfer,ussd',
          customer: {
            email: user?.email || '',
            name: user?.fullName || user?.name || '',
            phone_number: user?.phone || ''
          },
          customizations: {
            title: 'MBZ Technology',
            description: `Subscription payment - ${payment.plan?.name || 'Plan'}`,
            logo: 'https://elapix.store/logo.png'
          }
        };
      }
    }

    res.json({
      success: true,
      publicKey: gatewayKey.publicKey,
      config: paymentConfig
    });

  } catch (err) {
    console.error('Error getting Flutterwave config:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

/**
 * @swagger
 * /api/payments/gateway-public-key/{type}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment gateway public key
 *     description: Returns the public key for a specific payment gateway
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [flutterwave, paystack, squad]
 *         description: Gateway type
 *     responses:
 *       200:
 *         description: Public key retrieved successfully
 *       404:
 *         description: Gateway not found
 */
exports.getGatewayPublicKey = async (req, res) => {
  try {
    const { type } = req.params;

    const gatewayKey = await PaymentGatewayKey.findOne({ type: type.toLowerCase(), isActive: true });
    if (!gatewayKey) {
      return res.status(404).json({
        success: false,
        message: `${type} gateway keys not configured`
      });
    }

    res.json({
      success: true,
      gateway: type,
      publicKey: gatewayKey.publicKey,
      name: gatewayKey.name
    });

  } catch (err) {
    console.error('Error getting gateway public key:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// ============================================
// BANK TRANSFER DETAILS
// ============================================

/**
 * @swagger
 * /api/payments/bank-details/{currency}:
 *   get:
 *     tags: [Payments]
 *     summary: Get bank account details for transfers
 *     description: Returns bank account details for a specific currency
 *     parameters:
 *       - in: path
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *           enum: [USD, EUR, GBP, NGN]
 *         description: Currency for bank transfer
 *     responses:
 *       200:
 *         description: Bank details retrieved successfully
 *       404:
 *         description: Bank details not found for currency
 */
exports.getBankDetails = async (req, res) => {
  try {
    const { currency } = req.params;

    // Bank details configuration - these should ideally be in environment variables or database
    const bankDetails = {
      NGN: {
        bankName: 'Guaranty Trust Bank (GTBank)',
        accountName: 'MBZ Technology Ltd',
        accountNumber: '0123456789',
        bankCode: '058',
        currency: 'NGN',
        instructions: 'Please include your payment reference in the transfer narration.'
      },
      USD: {
        bankName: 'Wise (TransferWise)',
        accountName: 'MBZ Technology Ltd',
        accountNumber: '8310000000',
        routingNumber: '084009519',
        swiftCode: 'TRWIUS33',
        currency: 'USD',
        instructions: 'For international transfers, use the SWIFT code. Include your payment reference.'
      },
      EUR: {
        bankName: 'Wise (TransferWise)',
        accountName: 'MBZ Technology Ltd',
        iban: 'BE00 0000 0000 0000',
        bic: 'TRWIBEB1',
        currency: 'EUR',
        instructions: 'Use SEPA transfer for lower fees. Include your payment reference.'
      },
      GBP: {
        bankName: 'Wise (TransferWise)',
        accountName: 'MBZ Technology Ltd',
        accountNumber: '00000000',
        sortCode: '23-14-70',
        currency: 'GBP',
        instructions: 'Include your payment reference in the transfer reference.'
      }
    };

    const currencyUpper = currency.toUpperCase();
    const details = bankDetails[currencyUpper];

    if (!details) {
      return res.status(404).json({
        success: false,
        message: `Bank details not available for ${currency}. Supported currencies: NGN, USD, EUR, GBP`
      });
    }

    res.json({
      success: true,
      bankDetails: details
    });

  } catch (err) {
    console.error('Error getting bank details:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
}; 