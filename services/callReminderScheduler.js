const cron = require('node-cron');
const CallScheduler = require('../models/callScheduler');
const callNotificationService = require('./callNotificationService');

/**
 * Call Reminder Scheduler
 * Sends reminder notifications 15 minutes before scheduled calls
 */

let isInitialized = false;

/**
 * Initialize the call reminder scheduler
 * Runs every minute to check for upcoming calls
 */
exports.initializeCallReminderScheduler = () => {
  if (isInitialized) {
    console.log('⚠️ Call Reminder Scheduler already initialized');
    return;
  }

  console.log('🔔 Initializing Call Reminder Scheduler...');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      await checkAndSendReminders();
    } catch (error) {
      console.error('❌ Error in call reminder scheduler:', error.message);
    }
  });

  isInitialized = true;
  console.log('✅ Call Reminder Scheduler initialized - checking every minute for upcoming calls');
};

/**
 * Check for upcoming calls and send reminders
 */
async function checkAndSendReminders() {
  const now = new Date();
  const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
  const sixteenMinutesLater = new Date(now.getTime() + 16 * 60 * 1000);

  try {
    // Find calls starting in ~15 minutes that haven't received reminders
    const upcomingCalls = await CallScheduler.find({
      startTime: {
        $gte: fifteenMinutesLater,
        $lt: sixteenMinutesLater
      },
      status: 'scheduled',
      reminderSent: { $ne: true }
    })
    .populate('participants', 'name email fullName')
    .populate('userId', 'name email fullName');

    if (upcomingCalls.length === 0) {
      return; // No upcoming calls
    }

    console.log(`🔔 Found ${upcomingCalls.length} call(s) starting in ~15 minutes`);

    for (const call of upcomingCalls) {
      try {
        // Send reminder to all participants
        if (call.participants && call.participants.length > 0) {
          const participantIds = call.participants.map(p => p._id);
          await callNotificationService.sendCallReminder(call, participantIds);
          console.log(`✅ Sent reminder for call: ${call.title}`);
        }

        // Also send to external participants if any
        if (call.externalParticipants && call.externalParticipants.length > 0) {
          // External participants get notified via the reminder as well
          console.log(`📧 ${call.externalParticipants.length} external participant(s) will receive reminder`);
        }

        // Mark reminder as sent
        await CallScheduler.findByIdAndUpdate(call._id, {
          reminderSent: true,
          reminderSentAt: new Date()
        });

      } catch (callError) {
        console.error(`❌ Error sending reminder for call ${call._id}:`, callError.message);
        // Continue with other calls even if one fails
      }
    }

  } catch (error) {
    console.error('❌ Error checking for upcoming calls:', error.message);
    throw error;
  }
}

/**
 * Manually trigger reminder check (useful for testing)
 */
exports.triggerReminderCheck = async () => {
  console.log('🔔 Manually triggering reminder check...');
  await checkAndSendReminders();
};

/**
 * Get scheduler status
 */
exports.getStatus = () => {
  return {
    initialized: isInitialized,
    description: 'Sends reminders 15 minutes before scheduled calls'
  };
};
