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
  'Spam': { model: Inbox, status: 'spam' }, // Spam emails go to Inbox with spam status
  'All Mail': { model: Inbox, status: 'unread' } // Gmail specific
};

// Common email providers folder names (realistic expectations)
const PROVIDER_FOLDERS = {
  'gmail.com': ['INBOX', 'Sent', 'Drafts', 'Trash', 'Archive', 'All Mail', 'Spam'],
  'outlook.com': ['INBOX', 'Sent Items', 'Drafts', 'Deleted Items', 'Archive', 'Spam'],
  'hotmail.com': ['INBOX', 'Sent Items', 'Drafts', 'Deleted Items', 'Archive', 'Spam'],
  'yahoo.com': ['INBOX', 'Sent', 'Drafts', 'Trash', 'Archive', 'Spam'],
  'default': ['INBOX', 'Sent', 'Drafts', 'Trash', 'Spam'] // Removed Archive as it's not universal
};

// Tier 1: Incoming email listener (frequent, efficient)
const incomingEmailListener = async (receiverId) => {
  try {
    const receiver = await Receiver.findById(receiverId);
    if (!receiver || !receiver.isActive) {
      console.log(`Receiver ${receiverId} is not active or not found.`);
      return;
    }

    console.log(`📧 Checking for new incoming emails for ${receiver.email}`);

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
      // Only check INBOX for NEW emails
      await connection.openBox('INBOX');
      
      // Only fetch UNSEEN emails (new incoming emails)
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT', ''],
        markSeen: false, // Don't mark as seen when fetching
      };

      const results = await connection.search(searchCriteria, fetchOptions);
      
      if (results.length > 0) {
        console.log(`📬 Found ${results.length} new incoming emails`);
        
        // Process only new emails
        for (const email of results) {
          await processEmailFromFolder(email, 'INBOX', receiver, connection);
        }
      } else {
        console.log('📭 No new incoming emails');
      }
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

// Tier 2: Full email sync (infrequent, comprehensive)
const fullEmailSync = async (receiverId) => {
  try {
    const receiver = await Receiver.findById(receiverId);
    if (!receiver || !receiver.isActive) {
      console.log(`Receiver ${receiverId} is not active or not found.`);
      return;
    }

    console.log(`🔄 Starting full email sync for ${receiver.email}`);

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

        // Fetch ALL emails from this folder
        const searchCriteria = ['ALL'];
        const fetchOptions = {
          bodies: ['HEADER', 'TEXT', ''],
          markSeen: false,
        };

        const results = await connection.search(searchCriteria, fetchOptions);
        console.log(`📧 Found ${results.length} emails in ${actualFolderName}`);

        // Process emails from this folder
        for (const email of results) {
          await processEmailFromFolder(email, actualFolderName, receiver, connection);
        }

      } catch (folderError) {
        console.error(`❌ Error processing folder ${folderName}:`, folderError.message);
        continue; // Continue with next folder
      }
    }

    // Close the IMAP connection
    if (connection) {
      connection.end();
      console.log('🔌 IMAP connection closed successfully.');
    }

    console.log(`✅ Full email sync completed for ${receiver.email}`);
  } catch (error) {
    console.error('Error in full email sync:', error.message);
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

const processEmailFromFolder = async (email, folderPath, receiver, connection) => {
  try {
    const header = email.parts.find((part) => part.which === 'HEADER');
    const body = email.parts.find((part) => part.which === '');

    // Parse the email with `simpleParser`
    const parsedEmail = await simpleParser(body.body);

    // Determine which model to use based on folder
    const folderConfig = FOLDER_MAPPING[folderPath] || FOLDER_MAPPING['INBOX'];
    const EmailModel = folderConfig.model;

    // Enhanced duplicate prevention - check multiple fields
    let existingEmail = null;
    
    if (parsedEmail.messageId) {
      existingEmail = await EmailModel.findOne({ 
        messageId: parsedEmail.messageId,
        organization: receiver.organization 
      });
    }
    
    // If no messageId or not found, check by subject, sender, and receivedAt
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
      folder: folderPath.toLowerCase(), // Store original folder for reference
    };

    // Add model-specific fields
    if (EmailModel === Draft) {
      emailData.recipients = parsedEmail.to ? parsedEmail.to.map(addr => addr.text) : [];
      emailData.cc = parsedEmail.cc ? parsedEmail.cc.map(addr => addr.text) : [];
      emailData.bcc = parsedEmail.bcc ? parsedEmail.bcc.map(addr => addr.text) : [];
      emailData.lastSavedAt = moment(header.date).toDate();
    } else if (EmailModel === Trash) {
      emailData.originalFolder = 'inbox'; // Default, could be enhanced to track original folder
      emailData.deletedAt = moment(header.date).toDate();
    } else if (EmailModel === Archived) {
      emailData.originalFolder = 'inbox'; // Default, could be enhanced to track original folder
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

    console.log(`💾 Saving email to ${EmailModel.modelName}:`, {
      subject: emailData.subject,
      sender: emailData.sender,
      folder: folderPath
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

module.exports = { 
  incomingEmailListener, 
  fullEmailSync, 
  manualSync, 
  receiverEmails, 
  getFolderStats 
};
