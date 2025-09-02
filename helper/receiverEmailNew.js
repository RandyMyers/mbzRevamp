const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const Receiver = require('../models/receiver');
const moment = require('moment');
const Email = require('../models/emails');
const Inbox = require('../models/inbox');
const Draft = require('../models/draft');
const Trash = require('../models/trash');
const Archived = require('../models/archived');
const EmailLogs = require('../models/emailLogs');

// Folder mapping configuration
const FOLDER_MAPPING = {
  'INBOX': { model: Inbox, status: 'unread' },
  'Sent': { model: Email, status: 'sent' },
  'Sent Items': { model: Email, status: 'sent' },
  'Drafts': { model: Draft, status: 'draft' },
  'Trash': { model: Trash, status: 'unread' },
  'Deleted Items': { model: Trash, status: 'unread' },
  'Archive': { model: Archived, status: 'archived' },
  'Spam': { model: Inbox, status: 'spam' },
  'All Mail': { model: Inbox, status: 'unread' } // Gmail specific
};

// Common email providers folder names
const PROVIDER_FOLDERS = {
  'gmail.com': ['INBOX', 'Sent', 'Drafts', 'Trash', 'Archive', 'All Mail', 'Spam'],
  'outlook.com': ['INBOX', 'Sent Items', 'Drafts', 'Deleted Items', 'Archive', 'Spam'],
  'hotmail.com': ['INBOX', 'Sent Items', 'Drafts', 'Deleted Items', 'Archive', 'Spam'],
  'yahoo.com': ['INBOX', 'Sent', 'Drafts', 'Trash', 'Archive', 'Spam'],
  'default': ['INBOX', 'Sent', 'Drafts', 'Trash', 'Spam']
};

// NEW: Get the last sync timestamp for a receiver
const getLastSyncTimestamp = async (receiverId) => {
  try {
    const receiver = await Receiver.findById(receiverId);
    if (!receiver) return null;
    
    // Return the lastFetchedAt timestamp, or 24 hours ago if never synced
    return receiver.lastFetchedAt || moment().subtract(24, 'hours').toDate();
  } catch (error) {
    console.error('Error getting last sync timestamp:', error);
    return moment().subtract(24, 'hours').toDate(); // Default to 24 hours ago
  }
};

// NEW: Update the last sync timestamp for a receiver
const updateLastSyncTimestamp = async (receiverId) => {
  try {
    await Receiver.findByIdAndUpdate(receiverId, {
      lastFetchedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating last sync timestamp:', error);
  }
};

// NEW: Optimized incoming email listener - only checks for NEW emails since last sync
const incomingEmailListener = async (receiverId) => {
  try {
    const receiver = await Receiver.findById(receiverId);
    if (!receiver || !receiver.isActive) {
      console.log(`Receiver ${receiverId} is not active or not found.`);
      return;
    }

    console.log(`📧 Checking for NEW incoming emails for ${receiver.email}`);

    // Get the last sync timestamp
    const lastSyncTime = await getLastSyncTimestamp(receiverId);
    console.log(`🕐 Last sync: ${moment(lastSyncTime).format('YYYY-MM-DD HH:mm:ss')}`);

    // IMAP configuration
    const config = {
      imap: {
        user: receiver.username,
        password: receiver.password,
        host: receiver.imapHost,
        port: receiver.imapPort,
        tls: receiver.useTLS,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 30000,
        authTimeout: 15000,
        keepalive: true,
      },
    };

    // Connect to IMAP server
    let connection;
    try {
      connection = await imaps.connect(config);
      console.log(`✅ Connected to IMAP server: ${receiver.imapHost}:${receiver.imapPort}`);
    } catch (connectionError) {
      console.error(`❌ Failed to connect to IMAP server ${receiver.imapHost}:${receiver.imapPort}:`, connectionError.message);
      throw new Error(`IMAP connection failed: ${connectionError.message}`);
    }

    try {
      // Only check INBOX for NEW emails since last sync
      await connection.openBox('INBOX');
      
      // NEW: Search for emails since last sync time
      const searchCriteria = ['SINCE', lastSyncTime];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT', ''],
        markSeen: false, // Don't mark as seen when fetching
      };

      const results = await connection.search(searchCriteria, fetchOptions);
      
      if (results.length > 0) {
        console.log(`📬 Found ${results.length} NEW emails since last sync`);
        
        // Process only new emails
        for (const email of results) {
          await processEmailFromFolder(email, 'INBOX', receiver, connection);
        }
      } else {
        console.log('📭 No new emails since last sync');
      }

      // Update the last sync timestamp
      await updateLastSyncTimestamp(receiverId);
      console.log(`✅ Updated last sync timestamp for ${receiver.email}`);

    } catch (error) {
      console.error('Error processing incoming emails:', error.message);
    } finally {
      // Close the IMAP connection
      if (connection) {
        connection.end();
        console.log('🔌 IMAP connection closed successfully.');
      }
    }

  } catch (error) {
    console.error('Error in incoming email listener:', error.message);
  }
};

// NEW: Optimized full email sync - only syncs NEW emails from all folders
const fullEmailSync = async (receiverId) => {
  try {
    const receiver = await Receiver.findById(receiverId);
    if (!receiver || !receiver.isActive) {
      console.log(`Receiver ${receiverId} is not active or not found.`);
      return;
    }

    console.log(`🔄 Starting optimized full email sync for ${receiver.email}`);

    // Get the last sync timestamp
    const lastSyncTime = await getLastSyncTimestamp(receiverId);
    console.log(`🕐 Last sync: ${moment(lastSyncTime).format('YYYY-MM-DD HH:mm:ss')}`);

    // IMAP configuration
    const config = {
      imap: {
        user: receiver.username,
        password: receiver.password,
        host: receiver.imapHost,
        port: receiver.imapPort,
        tls: receiver.useTLS,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 30000,
        authTimeout: 15000,
        keepalive: true,
      },
    };

    // Connect to IMAP server
    let connection;
    try {
      connection = await imaps.connect(config);
      console.log(`✅ Connected to IMAP server: ${receiver.imapHost}:${receiver.imapPort}`);
    } catch (connectionError) {
      console.error(`❌ Failed to connect to IMAP server ${receiver.imapHost}:${receiver.imapPort}:`, connectionError.message);
      throw new Error(`IMAP connection failed: ${connectionError.message}`);
    }

    // Get all available mailboxes
    let mailboxes;
    try {
      mailboxes = await connection.getBoxes();
      console.log('📁 Available mailboxes:', Object.keys(mailboxes));
    } catch (mailboxError) {
      console.error('Failed to list mailboxes:', mailboxError.message);
      if (connection && connection.end) {
        connection.end();
      }
      throw new Error(`Failed to list mailboxes: ${mailboxError.message}`);
    }

    // Determine which folders to check based on email provider
    const emailDomain = receiver.email.split('@')[1];
    const expectedFolders = PROVIDER_FOLDERS[emailDomain] || PROVIDER_FOLDERS.default;

    console.log(`📂 Processing folders: ${expectedFolders.join(', ')}`);

    let totalNewEmails = 0;

    // Process each folder
    for (const folderName of expectedFolders) {
      try {
        // Check if folder exists in mailboxes object
        const folderExists = Object.keys(mailboxes).some(mbName => 
          mbName.toLowerCase() === folderName.toLowerCase() ||
          mbName.toLowerCase().includes(folderName.toLowerCase())
        );

        if (!folderExists) {
          console.log(`⚠️ Folder ${folderName} not found, skipping...`);
          continue;
        }

        // Find the actual folder name (case-insensitive)
        const actualFolderName = Object.keys(mailboxes).find(mbName => 
          mbName.toLowerCase() === folderName.toLowerCase() ||
          mbName.toLowerCase().includes(folderName.toLowerCase())
        );

        if (!actualFolderName) continue;

        console.log(`📁 Processing folder: ${actualFolderName}`);

        // Open the folder
        await connection.openBox(actualFolderName);

        // NEW: Only fetch emails since last sync time
        const searchCriteria = ['SINCE', lastSyncTime];
        const fetchOptions = {
          bodies: ['HEADER', 'TEXT', ''],
          markSeen: false,
        };

        const results = await connection.search(searchCriteria, fetchOptions);
        console.log(`📧 Found ${results.length} NEW emails in ${actualFolderName} since last sync`);

        // Process emails from this folder
        for (const email of results) {
          await processEmailFromFolder(email, actualFolderName, receiver, connection);
        }

        totalNewEmails += results.length;

      } catch (folderError) {
        console.error(`❌ Error processing folder ${folderName}:`, folderError.message);
        continue; // Continue with next folder
      }
    }

    // Update the last sync timestamp
    await updateLastSyncTimestamp(receiverId);
    console.log(`✅ Updated last sync timestamp for ${receiver.email}`);

    // Close the IMAP connection
    if (connection) {
      connection.end();
      console.log('🔌 IMAP connection closed successfully.');
    }

    console.log(`✅ Optimized full email sync completed for ${receiver.email} - ${totalNewEmails} new emails processed`);
  } catch (error) {
    console.error('Error in optimized full email sync:', error.message);
  }
};

// Manual sync function for admin use
const manualSync = async (receiverId, folderType = 'all') => {
  if (folderType === 'incoming') {
    return await incomingEmailListener(receiverId);
  } else {
    return await fullEmailSync(receiverId);
  }
};

// Legacy function for backward compatibility
const receiverEmails = async (receiverId) => {
  console.log('⚠️ Using legacy receiverEmails function. Consider using incomingEmailListener or fullEmailSync.');
  return await fullEmailSync(receiverId);
};

// Enhanced email processing with better duplicate prevention
const processEmailFromFolder = async (email, folderPath, receiver, connection) => {
  try {
    const header = email.parts.find((part) => part.which === 'HEADER');
    const body = email.parts.find((part) => part.which === '');

    // Parse the email with `simpleParser`
    const parsedEmail = await simpleParser(body.body);

    // Determine which model to use based on folder
    const folderConfig = FOLDER_MAPPING[folderPath] || FOLDER_MAPPING['INBOX'];
    const EmailModel = folderConfig.model;

    // ENHANCED: Better duplicate prevention
    let existingEmail = null;
    
    // Method 1: Check by messageId (most reliable)
    if (parsedEmail.messageId) {
      existingEmail = await EmailModel.findOne({ 
        messageId: parsedEmail.messageId,
        organization: receiver.organization 
      });
    }
    
    // Method 2: Check by subject, sender, and receivedAt (fallback)
    if (!existingEmail && parsedEmail.subject && parsedEmail.from) {
      const receivedDate = moment(header.date).toDate();
      const startOfDay = moment(receivedDate).startOf('day').toDate();
      const endOfDay = moment(receivedDate).endOf('day').toDate();
      
      existingEmail = await EmailModel.findOne({
        subject: parsedEmail.subject,
        sender: parsedEmail.from.text,
        organization: receiver.organization,
        receivedAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });
    }

    // Method 3: Check by unique combination of fields
    if (!existingEmail && parsedEmail.from && header.date) {
      const receivedDate = moment(header.date).toDate();
      existingEmail = await EmailModel.findOne({
        sender: parsedEmail.from.text,
        organization: receiver.organization,
        receivedAt: receivedDate,
        subject: parsedEmail.subject || 'No Subject'
      });
    }
      
    if (existingEmail) {
      console.log(`⏭️ Email already exists (${parsedEmail.subject}), skipping...`);
      return;
    }

    // Prepare email data
    const emailData = {
      sender: parsedEmail.from ? parsedEmail.from.text : 'Unknown Sender',
      subject: parsedEmail.subject || 'No Subject',
      body: parsedEmail.html || parsedEmail.text || '',
      status: folderConfig.status,
      receivedAt: moment(header.date).toDate(),
      organization: receiver.organization,
      user: receiver.userId,
      messageId: parsedEmail.messageId,
      folder: folderPath.toLowerCase(),
    };

    // Add model-specific fields
    if (EmailModel === Draft) {
      emailData.recipients = parsedEmail.to ? parsedEmail.to.map(addr => addr.text) : [];
      emailData.cc = parsedEmail.cc ? parsedEmail.cc.map(addr => addr.text) : [];
      emailData.bcc = parsedEmail.bcc ? parsedEmail.bcc.map(addr => addr.text) : [];
      emailData.lastSavedAt = moment(header.date).toDate();
    } else if (EmailModel === Trash) {
      emailData.originalFolder = 'inbox';
      emailData.deletedAt = moment(header.date).toDate();
    } else if (EmailModel === Archived) {
      emailData.originalFolder = 'inbox';
      emailData.archivedAt = moment(header.date).toDate();
    } else if (EmailModel === Email) {
      emailData.recipient = parsedEmail.to ? parsedEmail.to.map(addr => addr.text).join(', ') : '';
      emailData.createdBy = receiver.userId;
    } else if (EmailModel === Inbox) {
      emailData.recipient = receiver.email;
    }

    // Add attachments if any
    if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
      emailData.attachments = parsedEmail.attachments.map(attachment => ({
        filename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size
      }));
    }

    console.log(`💾 Saving NEW email to ${EmailModel.modelName}:`, {
      subject: emailData.subject,
      sender: emailData.sender,
      folder: folderPath,
      receivedAt: emailData.receivedAt
    });

    // Save the email to the appropriate model
    const newEmail = new EmailModel(emailData);
    await newEmail.save();

    // Create an EmailLog entry
    const emailLog = new EmailLogs({
      emailId: newEmail._id,
      status: folderConfig.status,
      receivedAt: new Date(),
      folder: folderPath
    });

    await emailLog.save();

    // Link the log to the email
    newEmail.emailLogs.push(emailLog._id);
    await newEmail.save();

  } catch (error) {
    console.error('Error processing email from folder:', error.message);
    // Continue processing other emails
  }
};

// Function to get folder statistics
const getFolderStats = async (receiverId) => {
  try {
    const receiver = await Receiver.findById(receiverId);
    if (!receiver || !receiver.isActive) {
      throw new Error('Receiver email is not active or not found.');
    }

    const stats = {
      inbox: await Inbox.countDocuments({ organization: receiver.organization }),
      sent: await Email.countDocuments({ 
        organization: receiver.organization, 
        status: 'sent' 
      }),
      drafts: await Draft.countDocuments({ organization: receiver.organization }),
      trash: await Trash.countDocuments({ organization: receiver.organization }),
      archived: await Archived.countDocuments({ organization: receiver.organization })
    };

    return stats;
  } catch (error) {
    console.error('Error getting folder stats:', error.message);
    throw error;
  }
};

// NEW: Function to reset sync timestamp (useful for testing)
const resetSyncTimestamp = async (receiverId) => {
  try {
    await Receiver.findByIdAndUpdate(receiverId, {
      $unset: { lastFetchedAt: 1 }
    });
    console.log(`✅ Reset sync timestamp for receiver ${receiverId}`);
  } catch (error) {
    console.error('Error resetting sync timestamp:', error);
  }
};

module.exports = { 
  incomingEmailListener, 
  fullEmailSync, 
  manualSync, 
  receiverEmails, 
  getFolderStats,
  getLastSyncTimestamp,
  updateLastSyncTimestamp,
  resetSyncTimestamp
};
