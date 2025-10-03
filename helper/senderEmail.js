const dotenv = require('dotenv');
dotenv.config();

const nodemailer = require('nodemailer');
const Sender = require('../models/sender');
const Email = require('../models/emails');
const EmailLogs = require('../models/emailLogs'); // Import the EmailLogs model


const sendEmail = async ({ senderId, campaign, workflow, organization, createdBy, emailTemplate, variables, to, subject, text, html }) => {
  try {
    // Fetch the sender details
    const sender = await Sender.findById(senderId);

    if (!sender || !sender.isActive) {
      throw new Error('Sender email is not active or not found.');
    }

    // Create the Nodemailer transporter with proper timeout and connection settings
    const transporter = nodemailer.createTransport({
      host: sender.smtpHost,
      port: sender.smtpPort,
      secure: sender.smtpPort === 465, // true if port is 465
      auth: {
        user: sender.username,
        pass: sender.password,
        authMethod: 'PLAIN' // Explicitly set auth method
      },
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,     // 60 seconds
      pool: true,               // Use connection pooling
      maxConnections: 5,        // Maximum number of connections in the pool
      maxMessages: 100,         // Maximum number of messages to send through a single connection
      rateDelta: 20000,         // Rate limiting: 20 seconds
      rateLimit: 5,             // Maximum 5 emails per rateDelta
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
        ciphers: 'SSLv3'
      },
      debug: false, // Set to true for debugging
      logger: false // Set to true for logging
    });

    // Verify the connection before sending
    console.log(`🔍 Verifying SMTP connection for ${sender.email}...`);
    try {
      await transporter.verify();
      console.log(`✅ SMTP connection verified for ${sender.email}`);
    } catch (verifyError) {
      console.error(`❌ SMTP connection verification failed for ${sender.email}:`, verifyError.message);
      throw new Error(`SMTP connection failed: ${verifyError.message}`);
    }

    // Send the email with timeout wrapper
    console.log(`📧 Sending email from ${sender.email} to ${to}...`);
    const info = await Promise.race([
      transporter.sendMail({
        from: sender.email, // Use sender email if 'from' is not specified
        to,
        subject,
        text,
        html,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
      )
    ]);

    console.log('Email sent: %s', info.messageId); // Log the success

    // Save the email data in the Email collection
    const emailData = {
      recipient: to,
      subject,
      body: html || text, // Store the email body (prefer HTML if available)
      variables,
      emailTemplate,
      campaign,
      workflow,
      createdBy,
      organization,
      messageId: info.messageId,
      status: 'sent',
      sentAt: new Date()
    };

    const newEmail = new Email(emailData);
    await newEmail.save(); // Save the email data

    console.log('Email saved to database: %s', newEmail._id); // Log the saved email ID

    // Create an EmailLog entry
    const emailLog = new EmailLogs({
      emailId: newEmail._id,
      status: 'sent',
      sentAt: new Date(),
    });

    await emailLog.save(); // Save the email log

    // Update Email document to reference the created log
    newEmail.emailLogs.push(emailLog._id);
    await newEmail.save(); // Save the updated Email document

    console.log('Email log saved with status sent');

    // Update sender's daily count
    sender.emailsSentToday += 1;
    sender.lastUsedAt = new Date();
    await sender.save();

    // Return boolean for backward compatibility with campaign controller
    // Also return object for enhanced functionality in email controller
    const result = {
      success: true,
      messageId: info.messageId,
      emailId: newEmail._id,
      status: 'sent'
    };

    // For backward compatibility, return true if successful
    return result;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);

    // Parse specific error types for better user feedback
    let errorType = 'unknown';
    let userMessage = error.message;

    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      errorType = 'timeout';
      userMessage = 'Connection timeout - please check your SMTP server settings and network connection';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      errorType = 'connection';
      userMessage = 'Cannot connect to SMTP server - please verify your SMTP host and port settings';
    } else if (error.message.includes('EAUTH') || error.message.includes('authentication')) {
      errorType = 'authentication';
      userMessage = 'SMTP authentication failed - please check your username and password';
    } else if (error.message.includes('certificate') || error.message.includes('SSL')) {
      errorType = 'ssl';
      userMessage = 'SSL/TLS certificate issue - please check your SMTP security settings';
    }

    // Save the failed email to the Email collection
    const emailData = {
      recipient: to,
      subject,
      body: html || text,
      status: 'failed',
      errorMessage: error.message, // Technical error message
      errorType: errorType, // Categorized error type
      userMessage: userMessage, // User-friendly error message
      createdBy,
      organization,
    };

    const failedEmail = new Email(emailData);
    await failedEmail.save(); // Save the failed email

    // Create an EmailLog entry for the failed attempt
    const emailLog = new EmailLogs({
      emailId: failedEmail._id,
      status: 'failed',
      errorMessage: error.message,
      errorType: errorType,
      userMessage: userMessage,
      sentAt: new Date(),
    });

    await emailLog.save(); // Save the failed email log

    // Update the failed Email document to reference the created log
    failedEmail.emailLogs.push(emailLog._id);
    await failedEmail.save(); // Save the updated Email document

    // Return more detailed error information
    throw new Error(`${errorType.toUpperCase()}: ${userMessage}`);
  }
};

module.exports = sendEmail;
