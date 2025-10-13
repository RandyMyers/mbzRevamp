const sgMail = require('@sendgrid/mail');
const { createAuditLog } = require('../helpers/auditLogHelper');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class SendGridService {
  
  /**
   * Send email using SendGrid HTTP API
   * @param {Object} emailData - Email data object
   * @returns {Promise<Object>} Result object
   */
  static async sendEmail(emailData) {
    try {
      console.log(`📧 [SENDGRID] Sending email to: ${emailData.to}`);
      
      // Validate required fields
      if (!emailData.to || !emailData.subject || !emailData.html) {
        throw new Error('Missing required email fields: to, subject, html');
      }
      
      // Validate SendGrid API key
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY environment variable is not set');
      }
      
      // Prepare email message
      const msg = {
        to: emailData.to,
        from: {
          email: process.env.SMTP_USER || 'noreply@mbztechnology.com',
          name: process.env.FROM_NAME || 'MBZ Technology'
        },
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };
      
      // Add reply-to if provided
      if (emailData.replyTo) {
        msg.replyTo = emailData.replyTo;
      }
      
      // Send email via SendGrid
      const response = await sgMail.send(msg);
      
      console.log(`✅ [SENDGRID] Email sent successfully to: ${emailData.to}`);
      console.log(`📧 [SENDGRID] Response status: ${response[0].statusCode}`);
      
      // Create audit log
      try {
        await createAuditLog({
          action: 'Email Sent via SendGrid',
          user: emailData.userId || null,
          resource: 'email',
          resourceId: response[0].headers['x-message-id'] || 'unknown',
          details: {
            to: emailData.to,
            subject: emailData.subject,
            statusCode: response[0].statusCode,
            messageId: response[0].headers['x-message-id']
          },
          organization: emailData.organizationId || null
        });
      } catch (auditError) {
        console.error('Failed to create audit log for SendGrid email:', auditError);
      }
      
      return {
        success: true,
        messageId: response[0].headers['x-message-id'],
        statusCode: response[0].statusCode
      };
      
    } catch (error) {
      console.error('❌ [SENDGRID] Failed to send email:', error);
      console.error('❌ [SENDGRID] Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.body
      });
      
      // Create audit log for failed email
      try {
        await createAuditLog({
          action: 'Email Send Failed via SendGrid',
          user: emailData.userId || null,
          resource: 'email',
          resourceId: 'failed',
          details: {
            to: emailData.to,
            subject: emailData.subject,
            error: error.message,
            code: error.code
          },
          organization: emailData.organizationId || null
        });
      } catch (auditError) {
        console.error('Failed to create audit log for failed SendGrid email:', auditError);
      }
      
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }
  
  /**
   * Send verification email
   * @param {Object} user - User object
   * @param {string} verificationCode - 6-digit verification code
   * @param {string} baseUrl - Base URL for the application
   * @returns {Promise<Object>} Result object
   */
  static async sendVerificationEmail(user, verificationCode, baseUrl = 'https://api.elapix.store') {
    try {
      const emailData = {
        to: user.email,
        subject: 'Verify Your Email Address - MBZ Technology',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #007bff; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .verification-code { 
                background: #007bff; 
                color: white; 
                padding: 15px; 
                text-align: center; 
                font-size: 24px; 
                font-weight: bold; 
                margin: 20px 0; 
                border-radius: 5px;
                letter-spacing: 3px;
              }
              .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to MBZ Technology!</h1>
              </div>
              <div class="content">
                <h2>Hello ${user.fullName || user.email}!</h2>
                <p>Thank you for registering with MBZ Technology. To complete your registration, please verify your email address using the code below:</p>
                
                <div class="verification-code">
                  ${verificationCode}
                </div>
                
                <p>This verification code will expire in 15 minutes for security reasons.</p>
                
                <p>If you didn't create an account with us, please ignore this email.</p>
                
                <p>Best regards,<br>The MBZ Technology Team</p>
              </div>
              <div class="footer">
                <p>This email was sent from MBZ Technology Platform</p>
                <p>If you have any questions, please contact our support team.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        userId: user._id,
        organizationId: user.organization
      };
      
      return await this.sendEmail(emailData);
      
    } catch (error) {
      console.error('❌ [SENDGRID] Failed to send verification email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Test SendGrid connectivity
   * @returns {Promise<Object>} Test result
   */
  static async testConnection() {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        return {
          success: false,
          error: 'SENDGRID_API_KEY environment variable is not set'
        };
      }
      
      // Test with a simple API call
      const response = await fetch('https://api.sendgrid.com/v3/user/account', {
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return {
          success: true,
          message: 'SendGrid API connection successful'
        };
      } else {
        return {
          success: false,
          error: `SendGrid API error: ${response.status} ${response.statusText}`
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SendGridService;
