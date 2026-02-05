/**
 * Bank Transfer Payment Controller
 * Handles bank transfer payments with manual verification
 */

const BankTransferPayment = require('../models/bankTransferPayment');
const Subscription = require('../models/subscriptions');
const SubscriptionPlan = require('../models/subscriptionPlans');
const User = require('../models/users');
const Payment = require('../models/payment');
const cloudinary = require('cloudinary').v2;
const logEvent = require('../helper/logEvent');
const sendGridService = require('../services/sendGridService');

// Bank account details (could be moved to config/DB)
const BANK_DETAILS = {
  bankName: 'Guaranty Trust Bank',
  accountName: 'MBZ Technology LTD',
  accountNumber: '0950155006'
};

/**
 * Get bank details and user's short_id for transfer
 * GET /api/bank-transfer/details
 */
exports.getBankDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('short_id email fullName');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Ensure user has a short_id
    if (!user.short_id) {
      // Generate one if missing
      await user.save(); // This will trigger the pre-save hook
    }

    return res.status(200).json({
      success: true,
      bankDetails: BANK_DETAILS,
      customerReference: user.short_id,
      customerName: user.fullName,
      customerEmail: user.email
    });
  } catch (error) {
    console.error('Error getting bank details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get bank details'
    });
  }
};

/**
 * Submit bank transfer with receipt
 * POST /api/bank-transfer/submit
 * Body: { planId, amount, currency, billingInterval, receiptUrl, bankName, transferDate, senderName, notes }
 */
exports.submitBankTransfer = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      planId,
      amount,
      currency = 'NGN',
      billingInterval = 'monthly',
      receiptUrl,
      receiptPublicId,
      bankName,
      transferDate,
      senderName,
      senderAccountNumber,
      notes
    } = req.body;

    // Validate required fields
    if (!planId || !amount || !receiptUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: planId, amount, and receiptUrl are required'
      });
    }

    // Get user with short_id
    const user = await User.findById(userId).select('short_id email fullName');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate plan exists
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check for existing pending transfer for the same plan
    const existingPending = await BankTransferPayment.findOne({
      user: userId,
      plan: planId,
      status: 'pending'
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending bank transfer for this plan. Please wait for it to be reviewed.',
        pendingTransferId: existingPending._id
      });
    }

    // Create bank transfer payment record
    const bankTransfer = new BankTransferPayment({
      user: userId,
      plan: planId,
      amount,
      currency,
      billingInterval,
      customerReference: user.short_id,
      receiptUrl,
      receiptPublicId,
      bankName,
      transferDate: transferDate ? new Date(transferDate) : null,
      senderName,
      senderAccountNumber,
      notes,
      status: 'pending'
    });

    await bankTransfer.save();

    // Log the event
    await logEvent({
      action: 'bank_transfer_submitted',
      user: userId,
      resource: 'BankTransferPayment',
      resourceId: bankTransfer._id,
      details: {
        planId,
        planName: plan.name,
        amount,
        currency,
        customerReference: user.short_id
      }
    });

    // Send confirmation email to user
    try {
      const content = `
        <h2>Hi ${user.fullName || 'there'},</h2>
        <p>We have received your bank transfer payment submission for the <strong>${plan.name}</strong> plan.</p>
        <div class="info-box">
          <h3>📋 Payment Details:</h3>
          <ul>
            <li><strong>Plan:</strong> ${plan.name}</li>
            <li><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</li>
            <li><strong>Reference:</strong> ${user.short_id}</li>
            <li><strong>Status:</strong> Pending Verification</li>
          </ul>
        </div>
        <p>Our team will verify your payment and activate your subscription within <strong>24 hours</strong>.</p>
        <div class="divider"></div>
        <p>If you have any questions, please contact our support team.</p>
      `;

      const htmlContent = sendGridService.generateEmailTemplate({
        title: 'Bank Transfer Received - Pending Verification',
        heading: '💰 Bank Transfer Received',
        content: content
      });

      await sendGridService.sendEmail({
        to: user.email,
        subject: 'Bank Transfer Received - Pending Verification',
        html: htmlContent
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }

    return res.status(201).json({
      success: true,
      message: 'Bank transfer submitted successfully. It will be reviewed within 24 hours.',
      transfer: {
        id: bankTransfer._id,
        status: bankTransfer.status,
        customerReference: user.short_id,
        amount,
        plan: plan.name
      }
    });
  } catch (error) {
    console.error('Error submitting bank transfer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit bank transfer'
    });
  }
};

/**
 * Upload receipt to cloudinary
 * POST /api/bank-transfer/upload-receipt
 */
exports.uploadReceipt = async (req, res) => {
  try {
    if (!req.files || !req.files.receipt) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a receipt image.'
      });
    }

    const file = req.files.receipt;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or PDF.'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'bank_transfer_receipts',
      resource_type: 'auto'
    });

    return res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload receipt'
    });
  }
};

/**
 * Get user's bank transfer history
 * GET /api/bank-transfer/history
 */
exports.getUserTransfers = async (req, res) => {
  try {
    const userId = req.user._id;

    const transfers = await BankTransferPayment.find({ user: userId })
      .populate('plan', 'name price')
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      transfers
    });
  } catch (error) {
    console.error('Error getting user transfers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get transfer history'
    });
  }
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * Get all pending bank transfers (Admin)
 * GET /api/bank-transfer/admin/pending
 */
exports.getPendingTransfers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const transfers = await BankTransferPayment.find({ status: 'pending' })
      .populate('user', 'fullName email short_id')
      .populate('plan', 'name price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await BankTransferPayment.countDocuments({ status: 'pending' });

    return res.status(200).json({
      success: true,
      transfers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting pending transfers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get pending transfers'
    });
  }
};

/**
 * Get all bank transfers with filters (Admin)
 * GET /api/bank-transfer/admin/all
 */
exports.getAllTransfers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const transfers = await BankTransferPayment.find(query)
      .populate('user', 'fullName email short_id')
      .populate('plan', 'name price')
      .populate('reviewedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await BankTransferPayment.countDocuments(query);

    return res.status(200).json({
      success: true,
      transfers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting all transfers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get transfers'
    });
  }
};

/**
 * Approve bank transfer (Admin)
 * POST /api/bank-transfer/admin/:id/approve
 */
exports.approveTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const transfer = await BankTransferPayment.findById(id)
      .populate('user', 'fullName email organization')
      .populate('plan', 'name price features');

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    if (transfer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Transfer has already been ${transfer.status}`
      });
    }

    // Calculate end date based on billing interval
    const startDate = new Date();
    let endDate = new Date();
    switch (transfer.billingInterval) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    // Deactivate any existing active subscriptions for this user
    await Subscription.updateMany(
      { user: transfer.user._id, isActive: true },
      { isActive: false, status: 'canceled' }
    );

    // Create payment record
    const payment = new Payment({
      user: transfer.user._id,
      plan: transfer.plan._id,
      gateway: 'bank_transfer',
      amount: transfer.amount,
      currency: transfer.currency,
      status: 'success',
      reference: `BT-${transfer.customerReference}-${Date.now()}`,
      paymentData: {
        type: 'bank_transfer',
        customerReference: transfer.customerReference,
        receiptUrl: transfer.receiptUrl,
        approvedBy: adminId
      },
      verifiedAt: new Date()
    });
    await payment.save();

    // Create new subscription
    const subscription = new Subscription({
      user: transfer.user._id,
      plan: transfer.plan._id,
      status: 'active',
      isActive: true,
      startDate,
      endDate,
      billingInterval: transfer.billingInterval,
      currency: transfer.currency,
      paymentStatus: 'Paid',
      payment: payment._id,
      paymentMethod: 'bank_transfer',
      autoRenew: false // Bank transfers don't auto-renew
    });
    await subscription.save();

    // Update transfer status
    transfer.status = 'approved';
    transfer.reviewedBy = adminId;
    transfer.reviewedAt = new Date();
    transfer.subscription = subscription._id;
    await transfer.save();

    // Log the event
    await logEvent({
      action: 'bank_transfer_approved',
      user: adminId,
      resource: 'BankTransferPayment',
      resourceId: transfer._id,
      details: {
        userId: transfer.user._id,
        planId: transfer.plan._id,
        planName: transfer.plan.name,
        amount: transfer.amount,
        subscriptionId: subscription._id
      }
    });

    // Send approval email to user
    try {
      const formattedEndDate = endDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const content = `
        <h2>Hi ${transfer.user.fullName || 'there'},</h2>
        <p>Great news! Your bank transfer payment has been verified and approved. 🎉</p>
        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px 20px; margin: 20px 0; border-radius: 4px;">
          <strong style="color: #155724;">✅ Your subscription is now active!</strong>
        </div>
        <div class="info-box">
          <h3>📋 Subscription Details:</h3>
          <ul>
            <li><strong>Plan:</strong> ${transfer.plan.name}</li>
            <li><strong>Amount:</strong> ${transfer.currency} ${transfer.amount.toLocaleString()}</li>
            <li><strong>Valid Until:</strong> ${formattedEndDate}</li>
          </ul>
        </div>
        <p>Enjoy your new features and thank you for your payment!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://app.mbztechnology.com'}/dashboard" class="button">
            Go to Dashboard
          </a>
        </div>
      `;

      const htmlContent = sendGridService.generateEmailTemplate({
        title: `Payment Approved - ${transfer.plan.name} Plan Activated!`,
        heading: '✅ Payment Approved!',
        content: content
      });

      await sendGridService.sendEmail({
        to: transfer.user.email,
        subject: `Payment Approved - ${transfer.plan.name} Plan Activated!`,
        html: htmlContent
      });
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
    }

    return res.status(200).json({
      success: true,
      message: 'Bank transfer approved and subscription activated',
      transfer: {
        id: transfer._id,
        status: transfer.status
      },
      subscription: {
        id: subscription._id,
        plan: transfer.plan.name,
        endDate
      }
    });
  } catch (error) {
    console.error('Error approving transfer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve transfer'
    });
  }
};

/**
 * Reject bank transfer (Admin)
 * POST /api/bank-transfer/admin/:id/reject
 */
exports.rejectTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const transfer = await BankTransferPayment.findById(id)
      .populate('user', 'fullName email')
      .populate('plan', 'name price');

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    if (transfer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Transfer has already been ${transfer.status}`
      });
    }

    // Update transfer status
    transfer.status = 'rejected';
    transfer.reviewedBy = adminId;
    transfer.reviewedAt = new Date();
    transfer.rejectionReason = reason;
    await transfer.save();

    // Log the event
    await logEvent({
      action: 'bank_transfer_rejected',
      user: adminId,
      resource: 'BankTransferPayment',
      resourceId: transfer._id,
      details: {
        userId: transfer.user._id,
        planId: transfer.plan._id,
        planName: transfer.plan.name,
        amount: transfer.amount,
        reason
      }
    });

    // Send rejection email to user
    try {
      const content = `
        <h2>Hi ${transfer.user.fullName || 'there'},</h2>
        <p>Unfortunately, we were unable to verify your bank transfer payment for the <strong>${transfer.plan.name}</strong> plan.</p>
        <div class="warning-box">
          <h3>⚠️ Reason:</h3>
          <p>${reason}</p>
        </div>
        <div class="info-box">
          <h3>What to do next:</h3>
          <ul>
            <li>Verify that you used the correct customer reference: <strong>${transfer.customerReference}</strong></li>
            <li>Ensure the transfer was made to the correct account</li>
            <li>Upload a clearer receipt image if needed</li>
          </ul>
        </div>
        <p>If you have any questions or believe this is an error, please contact our support team.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://app.mbztechnology.com'}/dashboard/billing" class="button">
            Try Again
          </a>
        </div>
      `;

      const htmlContent = sendGridService.generateEmailTemplate({
        title: 'Bank Transfer Payment - Action Required',
        heading: '⚠️ Payment Could Not Be Verified',
        content: content
      });

      await sendGridService.sendEmail({
        to: transfer.user.email,
        subject: 'Bank Transfer Payment - Action Required',
        html: htmlContent
      });
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
    }

    return res.status(200).json({
      success: true,
      message: 'Bank transfer rejected',
      transfer: {
        id: transfer._id,
        status: transfer.status,
        rejectionReason: reason
      }
    });
  } catch (error) {
    console.error('Error rejecting transfer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject transfer'
    });
  }
};

/**
 * Get transfer details (Admin)
 * GET /api/bank-transfer/admin/:id
 */
exports.getTransferDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await BankTransferPayment.findById(id)
      .populate('user', 'fullName email short_id organization')
      .populate('plan', 'name price features')
      .populate('reviewedBy', 'fullName email')
      .populate('subscription');

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    return res.status(200).json({
      success: true,
      transfer
    });
  } catch (error) {
    console.error('Error getting transfer details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get transfer details'
    });
  }
};
