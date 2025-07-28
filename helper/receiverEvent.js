const cron = require('node-cron');
const Receiver = require('../models/receiver');
const { incomingEmailListener, fullEmailSync } = require('./receiverEmail');

// Flag to prevent multiple simultaneous processing
let isProcessingIncoming = false;
let isProcessingFullSync = false;

// Schedule the two-tier email sync system
exports.scheduleEmailSync = () => {
  // Tier 1: Incoming email listener - every 2 minutes (frequent, efficient)
  cron.schedule('*/2 * * * *', async () => {
    // Prevent multiple simultaneous runs
    if (isProcessingIncoming) {
      console.log('📧 Incoming email processing already in progress, skipping...');
      return;
    }

    isProcessingIncoming = true;
    
    try {
      console.log('🔄 Checking for new incoming emails...');

      // Get all active receivers
      const receivers = await Receiver.find({ isActive: true });

      if (receivers.length === 0) {
        console.log('📭 No active receivers found.');
        return;
      }

      console.log(`📧 Found ${receivers.length} active receivers`);

      // Loop through each receiver and check for new incoming emails
      for (const receiver of receivers) {
        try {
          console.log(`📬 Processing incoming emails for receiver: ${receiver.email}`);
          await incomingEmailListener(receiver._id);
        } catch (receiverError) {
          console.error(`❌ Error processing incoming emails for ${receiver.email}:`, receiverError.message);
          // Continue with next receiver instead of stopping the entire process
        }
      }

      console.log('✅ Incoming email check completed successfully.');
    } catch (error) {
      console.error('❌ Error in incoming email check:', error.message);
    } finally {
      isProcessingIncoming = false;
    }
  });

  // Tier 2: Full sync - once daily at 2 AM (infrequent, comprehensive)
  cron.schedule('0 2 * * *', async () => {
    // Prevent multiple simultaneous runs
    if (isProcessingFullSync) {
      console.log('🔄 Full sync already in progress, skipping...');
      return;
    }

    isProcessingFullSync = true;
    
    try {
      console.log('🔄 Starting daily full email sync...');

      // Get all active receivers
      const receivers = await Receiver.find({ isActive: true });

      if (receivers.length === 0) {
        console.log('📭 No active receivers found for full sync.');
        return;
      }

      console.log(`🔄 Found ${receivers.length} active receivers for full sync`);

      // Loop through each receiver and perform full sync
      for (const receiver of receivers) {
        try {
          console.log(`🔄 Performing full sync for receiver: ${receiver.email}`);
          await fullEmailSync(receiver._id);
        } catch (receiverError) {
          console.error(`❌ Error in full sync for ${receiver.email}:`, receiverError.message);
          // Continue with next receiver instead of stopping the entire process
        }
      }

      console.log('✅ Daily full email sync completed successfully.');
    } catch (error) {
      console.error('❌ Error in daily full email sync:', error.message);
    } finally {
      isProcessingFullSync = false;
    }
  });
};

// Legacy function for backward compatibility
exports.scheduleReceiverEmails = () => {
  console.log('⚠️ Using legacy scheduleReceiverEmails. Consider using scheduleEmailSync.');
  // This will use the new two-tier system
  exports.scheduleEmailSync();
};

// Log the schedule when this module is loaded
console.log('✅ Email sync scheduled:');
console.log('   📧 Incoming email check: Every 2 minutes');
console.log('   🔄 Full email sync: Daily at 2:00 AM');
