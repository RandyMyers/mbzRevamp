const mongoose = require('mongoose');

const EmailLogsSchema = new mongoose.Schema(
  {
    emailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Email', // Reference to the email being sent
      required: true,
    },
    attempt: {
      type: Number, // Track the number of attempts (useful for retries)
      default: 1,
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'failed', 'bounced', 'unsubscribed', 'received','unread'],
      default: 'queued',
    }, 
    bounceReason: {
      type: String, // Stores the reason for the bounce if the email fails
    },
    unsubscribed: {
      type: Boolean,
      default: false, // Track if the recipient unsubscribed
    },
    errorMessage: {
      type: String, // If an error occurs, store the error message
    },
    sentAt: {
      type: Date, // Timestamp when the email was sent
    },
    // --- Analytics fields ---
    deviceType: {
      type: String, // e.g., 'mobile', 'desktop', 'tablet'
    },
    client: {
      type: String, // e.g., 'Gmail', 'Outlook', 'Apple Mail'
    },
    country: {
      type: String, // e.g., 'USA', 'Nigeria', 'UK'
    },
    // --- End analytics fields ---
    createdAt: {
      type: Date,
      default: Date.now, // Automatically set to the current timestamp
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailLogs', EmailLogsSchema);
