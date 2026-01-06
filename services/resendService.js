const { Resend } = require('resend');
const { createAuditLog } = require('../helpers/auditLogHelper');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

class ResendService {

  /**
   * Generate uniform email template with MBZ branding
   * @param {Object} params - Template parameters
   * @returns {string} HTML email template
   */
  static generateEmailTemplate({ title, heading, content, buttonText, buttonUrl, footer }) {
    const logoUrl = 'https://elapix.store/logo-round.png'; // MBZ Technology logo
    const primaryColor = '#800020'; // Burgundy

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: ${primaryColor};
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 15px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
            background: #ffffff;
          }
          .content h2 {
            color: ${primaryColor};
            font-size: 20px;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .content p {
            margin: 15px 0;
            color: #555;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: ${primaryColor};
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            margin: 25px 0;
            font-weight: 600;
            font-size: 16px;
          }
          .button:hover {
            background: #a0002a;
          }
          .info-box {
            background: #f9f9f9;
            border-left: 4px solid ${primaryColor};
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .info-box h3 {
            margin-top: 0;
            color: ${primaryColor};
            font-size: 16px;
          }
          .info-box ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .info-box li {
            margin: 8px 0;
            color: #555;
          }
          .warning-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning-box strong {
            color: #856404;
          }
          .link-box {
            word-break: break-all;
            background: #e9ecef;
            padding: 12px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #495057;
            margin: 15px 0;
          }
          .footer {
            text-align: center;
            padding: 30px 20px;
            background: #f8f9fa;
            color: #6c757d;
            font-size: 13px;
            border-top: 1px solid #dee2e6;
          }
          .footer p {
            margin: 8px 0;
          }
          .divider {
            height: 1px;
            background: #dee2e6;
            margin: 30px 0;
          }
          @media only screen and (max-width: 600px) {
            .content {
              padding: 25px 20px;
            }
            .header {
              padding: 25px 15px;
            }
            .button {
              display: block;
              text-align: center;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <img src="${logoUrl}" alt="MBZ Technology" class="logo" />
            <h1>${heading}</h1>
          </div>

          <div class="content">
            ${content}
          </div>

          <div class="footer">
            ${footer || `
              <p>This is an automated message from MBZ Technology Platform.</p>
              <p>&copy; ${new Date().getFullYear()} MBZ Technology. All rights reserved.</p>
            `}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send email using Resend API
   * @param {Object} emailData - Email data object
   * @returns {Promise<Object>} Result object
   */
  static async sendEmail(emailData) {
    try {
      console.log(`📧 [RESEND] Sending email to: ${emailData.to}`);

      // Validate required fields
      if (!emailData.to || !emailData.subject || !emailData.html) {
        throw new Error('Missing required email fields: to, subject, html');
      }

      // Validate Resend API key
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY environment variable is not set');
      }

      // Prepare email message
      const emailPayload = {
        from: process.env.RESEND_FROM_EMAIL || `${process.env.FROM_NAME || 'Elapix'} <noreply@${process.env.RESEND_DOMAIN || 'elapix.store'}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      // Add reply-to if provided
      if (emailData.replyTo) {
        emailPayload.reply_to = emailData.replyTo;
      }

      // Send email via Resend
      const { data, error } = await resend.emails.send(emailPayload);

      if (error) {
        throw new Error(error.message || 'Failed to send email via Resend');
      }

      console.log(`✅ [RESEND] Email sent successfully to: ${emailData.to}`);
      console.log(`📧 [RESEND] Message ID: ${data.id}`);

      // Create audit log
      try {
        await createAuditLog({
          action: 'Email Sent via Resend',
          user: emailData.userId || null,
          resource: 'email',
          resourceId: data.id || 'unknown',
          details: {
            to: emailData.to,
            subject: emailData.subject,
            messageId: data.id
          },
          organization: emailData.organizationId || null
        });
      } catch (auditError) {
        console.error('Failed to create audit log for Resend email:', auditError);
      }

      return {
        success: true,
        messageId: data.id
      };

    } catch (error) {
      console.error('❌ [RESEND] Failed to send email:', error);
      console.error('❌ [RESEND] Error details:', {
        message: error.message,
        name: error.name
      });

      // Create audit log for failure
      try {
        await createAuditLog({
          action: 'Email Send Failed via Resend',
          user: emailData.userId || null,
          resource: 'email',
          resourceId: 'failed',
          details: {
            to: emailData.to,
            subject: emailData.subject,
            error: error.message
          },
          organization: emailData.organizationId || null,
          severity: 'error'
        });
      } catch (auditError) {
        console.error('Failed to create audit log for Resend email failure:', auditError);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send password reset email
   * @param {Object} params - Password reset parameters
   * @returns {Promise<Object>} Result object
   */
  static async sendPasswordResetEmail({ to, resetToken, userName, resetUrl }) {
    const content = `
      <h2>Password Reset Request</h2>
      <p>Hi ${userName || 'there'},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>
      <div class="warning-box">
        <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
      </div>
      <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      <div class="divider"></div>
      <p style="font-size: 12px; color: #6c757d;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <div class="link-box">${resetUrl}</div>
    `;

    const html = this.generateEmailTemplate({
      title: 'Reset Your Password',
      heading: 'Password Reset',
      content
    });

    return this.sendEmail({
      to,
      subject: 'Reset Your Password - Elapix',
      html
    });
  }

  /**
   * Send welcome email to new user
   * @param {Object} params - Welcome email parameters
   * @returns {Promise<Object>} Result object
   */
  static async sendWelcomeEmail({ to, userName, loginUrl }) {
    const content = `
      <h2>Welcome to Elapix!</h2>
      <p>Hi ${userName || 'there'},</p>
      <p>Thank you for joining Elapix. We're excited to have you on board!</p>
      <p>Your account has been successfully created. You can now log in and start exploring all the features we have to offer.</p>
      <p style="text-align: center;">
        <a href="${loginUrl || 'https://app.elapix.store/login'}" class="button">Log In to Your Account</a>
      </p>
      <div class="info-box">
        <h3>Getting Started</h3>
        <ul>
          <li>Complete your profile setup</li>
          <li>Explore the dashboard</li>
          <li>Connect your first store</li>
        </ul>
      </div>
      <p>If you have any questions, our support team is always here to help.</p>
    `;

    const html = this.generateEmailTemplate({
      title: 'Welcome to Elapix',
      heading: 'Welcome!',
      content
    });

    return this.sendEmail({
      to,
      subject: 'Welcome to Elapix!',
      html
    });
  }

  /**
   * Send verification email
   * @param {Object} params - Verification parameters
   * @returns {Promise<Object>} Result object
   */
  static async sendVerificationEmail({ to, userName, verificationUrl, verificationCode }) {
    const content = `
      <h2>Verify Your Email</h2>
      <p>Hi ${userName || 'there'},</p>
      <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
      ${verificationUrl ? `
        <p style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email</a>
        </p>
      ` : ''}
      ${verificationCode ? `
        <div class="info-box">
          <h3>Your Verification Code</h3>
          <p style="font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 4px;">${verificationCode}</p>
        </div>
      ` : ''}
      <div class="warning-box">
        <p><strong>Note:</strong> This verification link/code will expire in 24 hours.</p>
      </div>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `;

    const html = this.generateEmailTemplate({
      title: 'Verify Your Email',
      heading: 'Email Verification',
      content
    });

    return this.sendEmail({
      to,
      subject: 'Verify Your Email - Elapix',
      html
    });
  }

  /**
   * Send generic notification email
   * @param {Object} params - Notification parameters
   * @returns {Promise<Object>} Result object
   */
  static async sendNotificationEmail({ to, subject, heading, content, buttonText, buttonUrl }) {
    const emailContent = `
      ${content}
      ${buttonText && buttonUrl ? `
        <p style="text-align: center;">
          <a href="${buttonUrl}" class="button">${buttonText}</a>
        </p>
      ` : ''}
    `;

    const html = this.generateEmailTemplate({
      title: subject,
      heading: heading || subject,
      content: emailContent
    });

    return this.sendEmail({
      to,
      subject,
      html
    });
  }
}

module.exports = ResendService;
