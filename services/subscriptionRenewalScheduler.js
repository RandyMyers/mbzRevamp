const cron = require('node-cron');
const Subscription = require('../models/subscriptions');
const User = require('../models/users');
const SubscriptionPlan = require('../models/subscriptionPlans');
const PaymentMethod = require('../models/paymentMethod');
const Payment = require('../models/payment');
const sendGridService = require('./sendGridService');
const paymentMethodService = require('./paymentMethodService');
const logEvent = require('../helper/logEvent');

/**
 * Subscription Renewal Scheduler
 * - Sends renewal reminders at 7 days, 3 days, and 1 day before expiry
 * - Processes automatic renewals for subscriptions with autoRenew enabled
 * - Marks expired subscriptions as inactive
 * - Handles trial expiration notifications
 */

let isInitialized = false;

/**
 * Initialize the subscription renewal scheduler
 * Runs every hour to check for expiring subscriptions
 */
exports.initializeRenewalScheduler = () => {
  if (isInitialized) {
    console.log('⚠️ Subscription Renewal Scheduler already initialized');
    return;
  }

  console.log('🔔 Initializing Subscription Renewal Scheduler...');

  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('⏰ Running subscription renewal checks...');
      await processScheduledDowngrades();  // Process scheduled downgrades first
      await processAutoRenewals();  // Process auto-renewals
      await processRenewalReminders();
      await processExpiredSubscriptions();
      await processTrialExpirations();
    } catch (error) {
      console.error('❌ Error in subscription renewal scheduler:', error.message);
    }
  });

  isInitialized = true;
  console.log('✅ Subscription Renewal Scheduler initialized - checking every hour');
};

/**
 * Process scheduled downgrades that are due
 * When a user schedules a downgrade, it takes effect at the end of their current billing period
 * This function auto-charges their saved card for the new (lower) plan price
 */
async function processScheduledDowngrades() {
  const now = new Date();

  try {
    // Find subscriptions with scheduled downgrades that are due (endDate has passed)
    const subscriptionsToDowngrade = await Subscription.find({
      scheduledDowngrade: { $ne: null },
      scheduledDowngradeDate: { $lte: now },
      status: 'active'
    })
    .populate('user', 'fullName email')
    .populate('plan', 'name price')
    .populate('scheduledDowngrade', 'name price')
    .populate('savedPaymentMethod');

    if (subscriptionsToDowngrade.length === 0) {
      return;
    }

    console.log(`📉 Processing ${subscriptionsToDowngrade.length} scheduled downgrade(s)...`);

    for (const subscription of subscriptionsToDowngrade) {
      try {
        const newPlan = subscription.scheduledDowngrade;
        const oldPlan = subscription.plan;

        if (!newPlan) {
          console.error(`❌ Scheduled downgrade plan not found for subscription ${subscription._id}`);
          continue;
        }

        let paymentSuccess = false;
        let paymentRecord = null;

        // Get user's saved payment method
        let paymentMethod = subscription.savedPaymentMethod;
        if (!paymentMethod || !paymentMethod.isActive) {
          paymentMethod = await paymentMethodService.getDefaultPaymentMethod(subscription.user._id);
        }

        // Auto-charge saved card if available and autoRenew is enabled
        if (paymentMethod && subscription.autoRenew !== false) {
          console.log(`💳 Charging ${subscription.user?.email} for downgrade to ${newPlan.name}: $${newPlan.price}`);

          const chargeResult = await paymentMethodService.chargePaymentMethod(
            paymentMethod,
            newPlan.price,
            subscription.currency || 'NGN',
            subscription.user.email,
            `${newPlan.name} Plan - Downgrade from ${oldPlan.name}`
          );

          if (chargeResult.success) {
            paymentSuccess = true;

            // Create payment record
            paymentRecord = new Payment({
              user: subscription.user._id,
              plan: newPlan._id,
              gateway: paymentMethod.cardGateway,
              amount: newPlan.price,
              currency: subscription.currency || 'NGN',
              status: 'success',
              reference: chargeResult.reference,
              paymentData: chargeResult.data,
              verifiedAt: new Date()
            });
            await paymentRecord.save();

            console.log(`✅ Downgrade payment successful for ${subscription.user?.email}`);
          } else {
            console.log(`⚠️ Downgrade payment failed for ${subscription.user?.email}: ${chargeResult.message}`);
          }
        }

        // Calculate new end date
        const newEndDate = calculateNewEndDate({
          endDate: now,
          billingInterval: subscription.billingInterval
        });

        // Create new subscription with the downgraded plan
        const newSubscription = new Subscription({
          user: subscription.user._id,
          plan: newPlan._id,
          status: paymentSuccess ? 'active' : 'pending',
          isActive: paymentSuccess,
          startDate: now,
          endDate: newEndDate,
          billingInterval: subscription.billingInterval,
          currency: subscription.currency,
          paymentStatus: paymentSuccess ? 'Paid' : 'Pending',
          autoRenew: subscription.autoRenew,
          savedPaymentMethod: paymentMethod?._id,
          paymentMethod: subscription.paymentMethod,
          payment: paymentRecord?._id
        });
        await newSubscription.save();

        // Deactivate old subscription
        subscription.status = 'downgraded';
        subscription.isActive = false;
        subscription.scheduledDowngrade = null;
        subscription.scheduledDowngradeDate = null;
        await subscription.save();

        // Log the event
        await logEvent({
          action: 'subscription_downgraded',
          user: subscription.user._id,
          resource: 'Subscription',
          resourceId: newSubscription._id,
          details: {
            previousPlan: oldPlan.name,
            newPlan: newPlan.name,
            previousSubscriptionId: subscription._id,
            paymentSuccess,
            amount: newPlan.price,
            currency: subscription.currency
          }
        });

        // Send appropriate email notification
        if (paymentSuccess) {
          await sendDowngradeCompleteEmail(subscription, oldPlan, newPlan, newEndDate);
        } else {
          await sendDowngradePaymentRequiredEmail(subscription, newPlan);
        }

        console.log(`✅ Downgrade processed for ${subscription.user?.email}: ${oldPlan.name} → ${newPlan.name}`);

      } catch (downgradeError) {
        console.error(`❌ Error processing downgrade for subscription ${subscription._id}:`, downgradeError.message);
        // Don't throw - continue with next subscription
      }
    }
  } catch (error) {
    console.error('❌ Error in processScheduledDowngrades:', error.message);
  }
}

/**
 * Send email when downgrade is complete and paid
 */
async function sendDowngradeCompleteEmail(subscription, oldPlan, newPlan, newEndDate) {
  if (!subscription.user?.email) return;

  try {
    const formattedEndDate = new Date(newEndDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    await sendGridService.sendEmail({
      to: subscription.user.email,
      subject: `Your plan has been changed to ${newPlan.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Plan Change Complete</h2>
          <p>Hi ${subscription.user.fullName || 'there'},</p>
          <p>Your subscription has been successfully changed from <strong>${oldPlan.name}</strong> to <strong>${newPlan.name}</strong>.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>New Plan:</strong> ${newPlan.name}</p>
            <p style="margin: 5px 0 0;"><strong>Amount Charged:</strong> $${newPlan.price.toFixed(2)}</p>
            <p style="margin: 5px 0 0;"><strong>Next Renewal:</strong> ${formattedEndDate}</p>
          </div>
          <p>Thank you for being a valued customer!</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://app.mbztechnology.com'}/dashboard/billing"
               style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Subscription
            </a>
          </p>
        </div>
      `
    });
  } catch (emailError) {
    console.error('Error sending downgrade complete email:', emailError.message);
  }
}

/**
 * Send email when downgrade occurred but payment is pending
 */
async function sendDowngradePaymentRequiredEmail(subscription, newPlan) {
  if (!subscription.user?.email) return;

  try {
    await sendGridService.sendEmail({
      to: subscription.user.email,
      subject: `Action Required: Complete payment for your ${newPlan.name} plan`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Payment Required</h2>
          <p>Hi ${subscription.user.fullName || 'there'},</p>
          <p>Your subscription has been changed to <strong>${newPlan.name}</strong>, but we couldn't process the payment automatically.</p>
          <div style="background: #FEF3C7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <p style="margin: 0;"><strong>New Plan:</strong> ${newPlan.name}</p>
            <p style="margin: 5px 0 0;"><strong>Amount Due:</strong> $${newPlan.price.toFixed(2)}</p>
          </div>
          <p>Please complete the payment to activate your subscription.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://app.mbztechnology.com'}/dashboard/billing"
               style="background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Complete Payment
            </a>
          </p>
        </div>
      `
    });
  } catch (emailError) {
    console.error('Error sending downgrade payment required email:', emailError.message);
  }
}

/**
 * Process automatic renewals for subscriptions with autoRenew enabled
 * Retries failed charges up to 3 times (once per day)
 */
async function processAutoRenewals() {
  const now = new Date();

  try {
    // Find subscriptions that need renewal:
    // - End date has passed or is today
    // - autoRenew is enabled
    // - Status is active or pending_renewal
    // - Less than 3 renewal attempts
    const subscriptionsToRenew = await Subscription.find({
      endDate: { $lte: now },
      autoRenew: true,
      status: { $in: ['active', 'pending_renewal'] },
      renewalAttempts: { $lt: 3 }
    })
    .populate('user', 'fullName email')
    .populate('plan', 'name price currency billingInterval')
    .populate('savedPaymentMethod');

    if (subscriptionsToRenew.length === 0) {
      return;
    }

    console.log(`💳 Processing ${subscriptionsToRenew.length} auto-renewal(s)...`);

    for (const subscription of subscriptionsToRenew) {
      try {
        // Check if we already tried today (retry once per day)
        if (subscription.lastRenewalAttempt) {
          const hoursSinceLastAttempt = (now - subscription.lastRenewalAttempt) / (1000 * 60 * 60);
          if (hoursSinceLastAttempt < 24) {
            continue; // Skip - already tried today
          }
        }

        // Get user's saved payment method (prefer linked one, fall back to default)
        let paymentMethod = subscription.savedPaymentMethod;
        if (!paymentMethod || !paymentMethod.isActive) {
          paymentMethod = await paymentMethodService.getDefaultPaymentMethod(subscription.user._id);
        }

        if (!paymentMethod) {
          // No saved card - send email to add payment method
          console.log(`⚠️ No payment method for user ${subscription.user?.email} - skipping auto-renewal`);
          await sendNoPaymentMethodEmail(subscription);
          continue;
        }

        // Increment attempt counter
        subscription.renewalAttempts += 1;
        subscription.lastRenewalAttempt = now;

        // Calculate amount based on billing interval
        let amount = subscription.plan.price;
        if (subscription.billingInterval === 'quarterly') {
          amount = subscription.plan.price * 3 * 0.9; // 10% discount
        } else if (subscription.billingInterval === 'yearly') {
          amount = subscription.plan.price * 12 * 0.8; // 20% discount
        }

        // Attempt to charge the saved card
        console.log(`💳 Attempting renewal for ${subscription.user?.email}: $${amount} ${subscription.currency}`);

        const chargeResult = await paymentMethodService.chargePaymentMethod(
          paymentMethod,
          amount,
          subscription.currency,
          subscription.user.email,
          `Subscription renewal - ${subscription.plan.name}`
        );

        if (chargeResult.success) {
          // SUCCESS - Extend subscription
          const newEndDate = calculateNewEndDate(subscription);

          // Create payment record
          const payment = new Payment({
            user: subscription.user._id,
            subscription: subscription._id,
            gateway: paymentMethod.cardGateway,
            amount: amount,
            currency: subscription.currency,
            status: 'success',
            reference: chargeResult.reference,
            paymentData: chargeResult.data,
            verifiedAt: new Date()
          });
          await payment.save();

          // Update subscription
          subscription.endDate = newEndDate;
          subscription.renewalAttempts = 0; // Reset for next cycle
          subscription.status = 'active';
          subscription.paymentStatus = 'Paid';
          subscription.renewalFailureReason = null;
          subscription.payment = payment._id;
          await subscription.save();

          // Send success email
          await sendRenewalSuccessEmail(subscription, payment);

          await logEvent({
            action: 'subscription_auto_renewed',
            user: subscription.user._id,
            resource: 'Subscription',
            resourceId: subscription._id,
            details: {
              amount,
              currency: subscription.currency,
              newEndDate,
              paymentReference: chargeResult.reference
            }
          });

          console.log(`✅ Auto-renewal successful for ${subscription.user?.email}`);

        } else {
          // FAILED - Handle failure
          subscription.renewalFailureReason = chargeResult.message;
          subscription.status = 'pending_renewal';
          await subscription.save();

          if (subscription.renewalAttempts >= 3) {
            // Final attempt failed - mark as expired
            subscription.status = 'expired';
            subscription.isActive = false;
            await subscription.save();

            await sendFinalRenewalFailureEmail(subscription);

            await logEvent({
              action: 'subscription_renewal_failed_final',
              user: subscription.user._id,
              resource: 'Subscription',
              resourceId: subscription._id,
              details: {
                attempts: subscription.renewalAttempts,
                lastError: chargeResult.message
              }
            });

            console.log(`❌ Final renewal attempt failed for ${subscription.user?.email} - subscription expired`);

          } else {
            // Will retry tomorrow
            await sendRenewalRetryEmail(subscription, 3 - subscription.renewalAttempts);

            console.log(`⚠️ Renewal failed for ${subscription.user?.email} - will retry (${subscription.renewalAttempts}/3 attempts)`);
          }
        }

      } catch (renewalError) {
        console.error(`❌ Error processing renewal for ${subscription.user?.email}:`, renewalError.message);
        // Don't throw - continue with next subscription
      }
    }
  } catch (error) {
    console.error('❌ Error in processAutoRenewals:', error.message);
  }
}

/**
 * Calculate new end date based on billing interval
 */
function calculateNewEndDate(subscription) {
  const currentEndDate = new Date(subscription.endDate || new Date());
  const now = new Date();

  // Start from the later of current end date or now (in case subscription lapsed)
  const baseDate = currentEndDate > now ? currentEndDate : now;
  const newEndDate = new Date(baseDate);

  switch (subscription.billingInterval) {
    case 'monthly':
      newEndDate.setMonth(newEndDate.getMonth() + 1);
      break;
    case 'quarterly':
      newEndDate.setMonth(newEndDate.getMonth() + 3);
      break;
    case 'yearly':
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      break;
    default:
      newEndDate.setMonth(newEndDate.getMonth() + 1);
  }

  return newEndDate;
}

/**
 * Send email when no payment method is available for auto-renewal
 */
async function sendNoPaymentMethodEmail(subscription) {
  if (!subscription.user?.email) return;

  try {
    await sendGridService.sendEmail({
      to: subscription.user.email,
      subject: `Action Required: Add payment method to renew your ${subscription.plan?.name} subscription`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Payment Method Required</h2>
          <p>Hi ${subscription.user.fullName || 'there'},</p>
          <p>Your <strong>${subscription.plan?.name}</strong> subscription has expired, but we couldn't renew it automatically because you don't have a saved payment method.</p>
          <p>To continue enjoying uninterrupted service, please add a payment method or renew manually.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://app.mbztechnology.com'}/dashboard/billing"
               style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Add Payment Method
            </a>
          </p>
        </div>
      `
    });
  } catch (emailError) {
    console.error('Error sending no payment method email:', emailError.message);
  }
}

/**
 * Send renewal success email
 */
async function sendRenewalSuccessEmail(subscription, payment) {
  if (!subscription.user?.email) return;

  try {
    const newEndDate = new Date(subscription.endDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    await sendGridService.sendEmail({
      to: subscription.user.email,
      subject: `Your ${subscription.plan?.name} subscription has been renewed`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Subscription Renewed Successfully</h2>
          <p>Hi ${subscription.user.fullName || 'there'},</p>
          <p>Great news! Your <strong>${subscription.plan?.name}</strong> subscription has been automatically renewed.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Plan:</strong> ${subscription.plan?.name}</p>
            <p style="margin: 5px 0 0;"><strong>Amount Charged:</strong> $${payment.amount.toFixed(2)} ${payment.currency}</p>
            <p style="margin: 5px 0 0;"><strong>New Expiry Date:</strong> ${newEndDate}</p>
          </div>
          <p>Thank you for being a valued customer!</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://app.mbztechnology.com'}/dashboard/billing"
               style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Subscription
            </a>
          </p>
        </div>
      `
    });
  } catch (emailError) {
    console.error('Error sending renewal success email:', emailError.message);
  }
}

/**
 * Send email when renewal will be retried
 */
async function sendRenewalRetryEmail(subscription, attemptsRemaining) {
  if (!subscription.user?.email) return;

  try {
    await sendGridService.sendEmail({
      to: subscription.user.email,
      subject: `Payment Failed - We'll retry your ${subscription.plan?.name} subscription renewal`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Payment Failed</h2>
          <p>Hi ${subscription.user.fullName || 'there'},</p>
          <p>We tried to renew your <strong>${subscription.plan?.name}</strong> subscription, but the payment failed.</p>
          <p><strong>Reason:</strong> ${subscription.renewalFailureReason || 'Payment declined'}</p>
          <p>Don't worry! We'll automatically retry in 24 hours. You have <strong>${attemptsRemaining}</strong> retry attempt(s) remaining.</p>
          <p>To avoid service interruption, please ensure your payment method is up to date.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://app.mbztechnology.com'}/dashboard/billing"
               style="background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Update Payment Method
            </a>
          </p>
        </div>
      `
    });
  } catch (emailError) {
    console.error('Error sending renewal retry email:', emailError.message);
  }
}

/**
 * Send email when all renewal attempts have failed
 */
async function sendFinalRenewalFailureEmail(subscription) {
  if (!subscription.user?.email) return;

  try {
    await sendGridService.sendEmail({
      to: subscription.user.email,
      subject: `Your ${subscription.plan?.name} subscription has expired`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Subscription Expired</h2>
          <p>Hi ${subscription.user.fullName || 'there'},</p>
          <p>Unfortunately, we were unable to renew your <strong>${subscription.plan?.name}</strong> subscription after multiple attempts.</p>
          <p><strong>Last Error:</strong> ${subscription.renewalFailureReason || 'Payment declined'}</p>
          <p>Your subscription has now expired. To regain access to all features, please renew manually with a valid payment method.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://app.mbztechnology.com'}/dashboard/billing"
               style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Renew Now
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">
            If you believe this is an error, please contact our support team.
          </p>
        </div>
      `
    });
  } catch (emailError) {
    console.error('Error sending final renewal failure email:', emailError.message);
  }
}

/**
 * Send renewal reminder emails
 */
async function processRenewalReminders() {
  const now = new Date();

  // 7-day reminder
  await sendRenewalReminder(now, 7, 'sevenDaysSent');

  // 3-day reminder
  await sendRenewalReminder(now, 3, 'threeDaysSent');

  // 1-day reminder
  await sendRenewalReminder(now, 1, 'oneDaySent');
}

/**
 * Send renewal reminder for a specific number of days before expiry
 */
async function sendRenewalReminder(now, daysBeforeExpiry, reminderField) {
  const targetDate = new Date(now.getTime() + daysBeforeExpiry * 24 * 60 * 60 * 1000);
  const targetDateStart = new Date(targetDate.setHours(0, 0, 0, 0));
  const targetDateEnd = new Date(targetDate.setHours(23, 59, 59, 999));

  try {
    const subscriptions = await Subscription.find({
      endDate: {
        $gte: targetDateStart,
        $lte: targetDateEnd
      },
      status: 'active',
      isActive: true,
      [`renewalReminders.${reminderField}`]: { $ne: true }
    })
    .populate('user', 'fullName email')
    .populate('plan', 'name price billingInterval');

    if (subscriptions.length === 0) return;

    console.log(`📧 Sending ${daysBeforeExpiry}-day renewal reminders to ${subscriptions.length} subscriber(s)`);

    for (const subscription of subscriptions) {
      try {
        if (!subscription.user?.email) continue;

        const renewalAmount = subscription.plan?.price || 0;
        const planName = subscription.plan?.name || 'Your Plan';
        const expiryDate = new Date(subscription.endDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Send renewal reminder email
        await sendGridService.sendEmail({
          to: subscription.user.email,
          subject: `Your ${planName} subscription expires in ${daysBeforeExpiry} day${daysBeforeExpiry > 1 ? 's' : ''}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Subscription Renewal Reminder</h2>
              <p>Hi ${subscription.user.fullName || 'there'},</p>
              <p>Your <strong>${planName}</strong> subscription will expire on <strong>${expiryDate}</strong>.</p>
              <p>To continue enjoying uninterrupted service, please renew your subscription.</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Plan:</strong> ${planName}</p>
                <p style="margin: 5px 0 0;"><strong>Renewal Amount:</strong> $${renewalAmount.toFixed(2)} USD</p>
                <p style="margin: 5px 0 0;"><strong>Expiry Date:</strong> ${expiryDate}</p>
              </div>
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'https://app.mbztechnology.com'}/dashboard/billing"
                   style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Renew Now
                </a>
              </p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                If you have any questions, please contact our support team.
              </p>
            </div>
          `
        });

        // Mark reminder as sent
        await Subscription.findByIdAndUpdate(subscription._id, {
          [`renewalReminders.${reminderField}`]: true
        });

        console.log(`✅ Sent ${daysBeforeExpiry}-day reminder to ${subscription.user.email}`);

        await logEvent({
          action: 'subscription_renewal_reminder_sent',
          user: subscription.user._id,
          resource: 'Subscription',
          resourceId: subscription._id,
          details: { daysBeforeExpiry, email: subscription.user.email }
        });

      } catch (emailError) {
        console.error(`❌ Error sending reminder to ${subscription.user?.email}:`, emailError.message);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing ${daysBeforeExpiry}-day reminders:`, error.message);
  }
}

/**
 * Mark expired subscriptions as inactive
 */
async function processExpiredSubscriptions() {
  const now = new Date();

  try {
    // Find subscriptions that have expired but are still marked as active
    const expiredSubscriptions = await Subscription.find({
      endDate: { $lt: now },
      status: 'active',
      isActive: true
    })
    .populate('user', 'fullName email')
    .populate('plan', 'name');

    if (expiredSubscriptions.length === 0) return;

    console.log(`⏰ Processing ${expiredSubscriptions.length} expired subscription(s)`);

    for (const subscription of expiredSubscriptions) {
      try {
        // Update subscription status
        await Subscription.findByIdAndUpdate(subscription._id, {
          status: 'expired',
          isActive: false,
          'renewalReminders.expiredSent': true
        });

        // Send expiration notification if not already sent
        if (!subscription.renewalReminders?.expiredSent && subscription.user?.email) {
          const planName = subscription.plan?.name || 'Your Plan';

          await sendGridService.sendEmail({
            to: subscription.user.email,
            subject: `Your ${planName} subscription has expired`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Subscription Expired</h2>
                <p>Hi ${subscription.user.fullName || 'there'},</p>
                <p>Your <strong>${planName}</strong> subscription has expired.</p>
                <p>To regain access to all features, please renew your subscription.</p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'https://app.mbztechnology.com'}/dashboard/billing"
                     style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Renew Subscription
                  </a>
                </p>
                <p style="color: #666; font-size: 12px;">
                  If you believe this is an error, please contact our support team.
                </p>
              </div>
            `
          });

          console.log(`📧 Sent expiration notification to ${subscription.user.email}`);
        }

        await logEvent({
          action: 'subscription_expired',
          user: subscription.user?._id,
          resource: 'Subscription',
          resourceId: subscription._id,
          details: { planName: subscription.plan?.name }
        });

        console.log(`✅ Marked subscription ${subscription._id} as expired`);

      } catch (subError) {
        console.error(`❌ Error processing expired subscription ${subscription._id}:`, subError.message);
      }
    }
  } catch (error) {
    console.error('❌ Error processing expired subscriptions:', error.message);
  }
}

/**
 * Handle trial subscription expirations
 */
async function processTrialExpirations() {
  const now = new Date();

  try {
    // Find trial subscriptions that have expired
    const expiredTrials = await Subscription.find({
      isTrial: true,
      trialEnd: { $lt: now },
      trialConverted: { $ne: true },
      status: 'active'
    })
    .populate('user', 'fullName email')
    .populate('plan', 'name price');

    if (expiredTrials.length === 0) return;

    console.log(`⏰ Processing ${expiredTrials.length} expired trial(s)`);

    for (const subscription of expiredTrials) {
      try {
        // Mark trial as expired
        await Subscription.findByIdAndUpdate(subscription._id, {
          status: 'expired',
          isActive: false
        });

        // Send trial expiration email
        if (subscription.user?.email) {
          const planName = subscription.plan?.name || 'Your Plan';
          const planPrice = subscription.plan?.price || 0;

          await sendGridService.sendEmail({
            to: subscription.user.email,
            subject: `Your free trial of ${planName} has ended`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Free Trial Ended</h2>
                <p>Hi ${subscription.user.fullName || 'there'},</p>
                <p>Your free trial of <strong>${planName}</strong> has ended.</p>
                <p>We hope you enjoyed exploring our features! To continue using all premium features, upgrade to a paid plan.</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Plan:</strong> ${planName}</p>
                  <p style="margin: 5px 0 0;"><strong>Price:</strong> $${planPrice.toFixed(2)} USD/month</p>
                </div>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'https://app.mbztechnology.com'}/dashboard/billing"
                     style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Upgrade Now
                  </a>
                </p>
              </div>
            `
          });

          console.log(`📧 Sent trial expiration notification to ${subscription.user.email}`);
        }

        await logEvent({
          action: 'trial_expired',
          user: subscription.user?._id,
          resource: 'Subscription',
          resourceId: subscription._id,
          details: { planName: subscription.plan?.name }
        });

      } catch (trialError) {
        console.error(`❌ Error processing trial expiration ${subscription._id}:`, trialError.message);
      }
    }
  } catch (error) {
    console.error('❌ Error processing trial expirations:', error.message);
  }
}

/**
 * Manually trigger renewal checks (useful for testing)
 */
exports.triggerRenewalCheck = async () => {
  console.log('🔔 Manually triggering renewal check...');
  await processRenewalReminders();
  await processExpiredSubscriptions();
  await processTrialExpirations();
};

/**
 * Get scheduler status
 */
exports.getStatus = () => {
  return {
    initialized: isInitialized,
    description: 'Sends renewal reminders at 7, 3, and 1 days before expiry; marks expired subscriptions as inactive'
  };
};

/**
 * Get upcoming renewals (for admin dashboard)
 */
exports.getUpcomingRenewals = async (days = 7) => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const upcomingRenewals = await Subscription.find({
    endDate: {
      $gte: now,
      $lte: futureDate
    },
    status: 'active',
    isActive: true
  })
  .populate('user', 'fullName email')
  .populate('plan', 'name price')
  .sort({ endDate: 1 });

  return upcomingRenewals;
};

/**
 * Get expired subscriptions count (for metrics)
 */
exports.getExpiredCount = async (days = 30) => {
  const pastDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return await Subscription.countDocuments({
    status: 'expired',
    endDate: { $gte: pastDate }
  });
};
