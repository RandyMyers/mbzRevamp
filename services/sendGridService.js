const sgMail = require('@sendgrid/mail');
const { createAuditLog } = require('../helpers/auditLogHelper');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class SendGridService {

  /**
   * Generate uniform email template with MBZ branding
   * @param {Object} params - Template parameters
   * @returns {string} HTML email template
   */
  static generateEmailTemplate({ title, heading, content, buttonText, buttonUrl, footer }) {
    const logoUrl = 'https://i.ibb.co/9gZ8QJf/mbz-logo.png'; // You can update this URL later
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
              <p>© ${new Date().getFullYear()} MBZ Technology. All rights reserved.</p>
            `}
          </div>
        </div>
      </body>
      </html>
    `;
  }

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
          name: process.env.FROM_NAME || 'Elapix'
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
          resourceId: null, // Set to null instead of 'failed' to avoid ObjectId casting error
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
   * Send invitation email
   * @param {Object} invitation - Invitation object with organization, invitedBy, role, etc.
   * @returns {Promise<Object>} Result object
   */
  static async sendInvitationEmail(invitation) {
    try {
      // Validate required data
      if (!invitation.organization || !invitation.organization.name) {
        throw new Error('Organization data is missing or invalid');
      }
      
      if (!invitation.invitedBy || !invitation.invitedBy.fullName) {
        throw new Error('Inviter data is missing or invalid');
      }

      const baseUrl = process.env.FRONTEND_URL || 'https://elapix.store';
      const invitationUrl = `${baseUrl}/accept-invitation?token=${invitation.token}`;

      const content = `
        <h2>Hello!</h2>

        <p>You've been invited by <strong>${invitation.invitedBy.fullName}</strong> to join <strong>${invitation.organization.name}</strong> on the MBZ Technology Platform.</p>

        <div class="info-box">
          <h3>📋 Invitation Details:</h3>
          <ul>
            <li><strong>Organization:</strong> ${invitation.organization.name}</li>
            ${invitation.role ? `<li><strong>Role:</strong> ${invitation.role.name}</li>` : ''}
            ${invitation.department ? `<li><strong>Department:</strong> ${invitation.department}</li>` : ''}
            <li><strong>Expires:</strong> ${new Date(invitation.expiresAt).toLocaleDateString()}</li>
          </ul>
        </div>

        ${invitation.message ? `
          <div class="info-box">
            <h3>💬 Personal Message:</h3>
            <p style="margin: 0; font-style: italic;">"${invitation.message}"</p>
            <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 14px;">- ${invitation.invitedBy.fullName}</p>
          </div>
        ` : ''}

        <p><strong>Click the button below to accept this invitation and create your account:</strong></p>

        <div style="text-align: center;">
          <a href="${invitationUrl}" class="button">Accept Invitation</a>
        </div>

        <p style="color: #6c757d; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <div class="link-box">${invitationUrl}</div>

        <div class="warning-box">
          <strong>⚠️ Important:</strong> This invitation will expire on <strong>${new Date(invitation.expiresAt).toLocaleDateString()}</strong>. If you don't accept it by then, you'll need to request a new invitation.
        </div>

        <div class="divider"></div>

        <p style="color: #6c757d; font-size: 14px;">If you didn't expect this invitation, please ignore this email and no account will be created.</p>
      `;

      const htmlContent = this.generateEmailTemplate({
        title: `Invitation to Join ${invitation.organization.name}`,
        heading: `🎉 You're Invited!`,
        content: content,
        footer: `
          <p>This invitation was sent from MBZ Technology Platform.</p>
          <p>© ${new Date().getFullYear()} MBZ Technology. All rights reserved.</p>
        `
      });

      const emailData = {
        to: invitation.email,
        subject: `You've been invited to join ${invitation.organization.name}`,
        html: htmlContent,
        organizationId: invitation.organization._id
      };

      const result = await this.sendEmail(emailData);

      if (result.success) {
        console.log(`✅ [SENDGRID] Invitation email sent to ${invitation.email}`);
      }

      return result;

    } catch (error) {
      console.error('❌ [SENDGRID] Failed to send invitation email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send account activation email (for admin-created users)
   * @param {Object} data - User data with activationToken, email, name, etc.
   * @returns {Promise<Object>} Result object
   */
  static async sendAccountActivationEmail(data) {
    try {
      // Validate required data
      if (!data.email || !data.activationToken) {
        throw new Error('Email and activation token are required');
      }

      const baseUrl = process.env.FRONTEND_URL || 'https://elapix.store';
      const activationUrl = `${baseUrl}/activate-account?token=${data.activationToken}`;
      const userName = data.name || 'there';
      const organizationName = data.organizationName || 'MBZ Tech';
      const roleName = data.roleName || 'team member';
      const createdBy = data.createdBy || 'your administrator';

      const content = `
        <h2>Hello ${userName}!</h2>

        <p>Great news! ${createdBy} has created an account for you on the ${organizationName} platform.</p>

        <div class="info-box">
          <h3>📋 Your Account Details:</h3>
          <ul>
            <li><strong>Email:</strong> ${data.email}</li>
            <li><strong>Organization:</strong> ${organizationName}</li>
            <li><strong>Role:</strong> ${roleName}</li>
          </ul>
        </div>

        <p><strong>To get started, you need to activate your account and set your password:</strong></p>

        <div style="text-align: center;">
          <a href="${activationUrl}" class="button">Activate Your Account</a>
        </div>

        <p style="color: #6c757d; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <div class="link-box">${activationUrl}</div>

        <div class="warning-box">
          <strong>⚠️ Important:</strong>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>This activation link is valid for <strong>7 days</strong></li>
            <li>After activation, you'll set your own secure password</li>
            <li>Once activated, you'll have full access to the platform</li>
          </ul>
        </div>

        <p>After activating your account, you'll be able to:</p>
        <ul>
          <li>Access your dashboard</li>
          <li>Manage your profile settings</li>
          <li>Start working with your team</li>
          <li>Access all features based on your role permissions</li>
        </ul>

        <div class="divider"></div>

        <p style="color: #6c757d; font-size: 14px;">If you have any questions or need assistance, please contact your administrator or our support team.</p>

        <p>We're excited to have you on board!</p>

        <p style="margin-top: 30px;">Best regards,<br>
        <strong>${organizationName} Team</strong></p>
      `;

      const htmlContent = this.generateEmailTemplate({
        title: `Activate Your Account - ${organizationName}`,
        heading: `🎉 Welcome to ${organizationName}!`,
        content: content,
        footer: `
          <p>This is an automated message from MBZ Technology Platform.</p>
          <p>If you didn't expect this email, please contact your administrator.</p>
          <p>© ${new Date().getFullYear()} MBZ Technology. All rights reserved.</p>
        `
      });

      const textContent = `
        Welcome to ${organizationName}!

        Hello ${userName}!

        ${createdBy} has created an account for you on the ${organizationName} platform.

        Your Account Details:
        - Email: ${data.email}
        - Organization: ${organizationName}
        - Role: ${roleName}

        To get started, activate your account and set your password by clicking this link:
        ${activationUrl}

        This activation link is valid for 7 days.

        After activation, you'll have full access to the platform based on your role permissions.

        Best regards,
        ${organizationName} Team

        ---
        This is an automated message. If you didn't expect this email, please contact your administrator.
        © ${new Date().getFullYear()} MBZ Technology. All rights reserved.
      `;

      const emailData = {
        to: data.email,
        subject: `Activate Your Account - ${organizationName}`,
        html: htmlContent,
        text: textContent
      };

      const result = await this.sendEmail(emailData);

      if (result.success) {
        console.log(`✅ [SENDGRID] Account activation email sent to ${data.email}`);
      }

      return result;

    } catch (error) {
      console.error('❌ [SENDGRID] Failed to send account activation email:', error);
      return {
        success: false,
        error: error.message
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
      const content = `
        <h2>Hello ${user.fullName || 'there'}!</h2>

        <p>Welcome to MBZ Technology Platform! To complete your registration and activate your account, please verify your email address using the code below:</p>

        <div style="background: white; color: #800020; padding: 30px; text-align: center; font-size: 36px; font-weight: bold; margin: 25px 0; border-radius: 8px; letter-spacing: 8px; border: 3px solid #800020;">
          ${verificationCode}
        </div>

        <div class="info-box">
          <h3>⏱️ Important Information:</h3>
          <ul>
            <li>This verification code will expire in <strong>15 minutes</strong></li>
            <li>Never share this code with anyone</li>
            <li>MBZ Technology will never ask for your verification code via phone or email</li>
            <li>If you didn't create an account, please ignore this email</li>
          </ul>
        </div>

        <p>Once verified, you'll have full access to your dashboard and can start managing your business operations.</p>

        <div class="divider"></div>

        <p style="color: #6c757d; font-size: 14px;">If you have any questions or need assistance, please contact our support team.</p>

        <p style="margin-top: 30px;">Best regards,<br>
        <strong>MBZ Technology Team</strong></p>
      `;

      const htmlContent = this.generateEmailTemplate({
        title: 'Verify Your Email Address',
        heading: '🔐 Verify Your Email',
        content: content
      });

      const emailData = {
        to: user.email,
        subject: 'Verify Your Email Address - MBZ Technology Platform',
        html: htmlContent,
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
   * Send password reset email with token link
   * @param {Object} user - User object
   * @param {Object} resetToken - Reset token object
   * @param {Object} organization - Organization object
   * @returns {Promise<Object>} Result object
   */
  static async sendPasswordResetEmail(user, resetToken, organization) {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'https://elapix.store';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken.token}`;

      const content = `
        <h2>Hello ${user.fullName}!</h2>

        <p>You requested to reset your password for <strong>${organization.name}</strong> on the MBZ Technology Platform.</p>

        <div class="info-box">
          <h3>📋 Reset Details:</h3>
          <ul>
            <li><strong>Organization:</strong> ${organization.name}</li>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Requested:</strong> ${new Date().toLocaleString()}</li>
            <li><strong>Expires:</strong> ${new Date(resetToken.expiresAt).toLocaleString()}</li>
          </ul>
        </div>

        <p><strong>Click the button below to reset your password:</strong></p>

        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>

        <p style="color: #6c757d; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <div class="link-box">${resetUrl}</div>

        <div class="warning-box">
          <strong>⚠️ Important Security Information:</strong>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>This link will expire in <strong>1 hour</strong></li>
            <li>This link can only be used <strong>once</strong></li>
            <li>If you didn't request this, please ignore this email</li>
            <li>Your password will remain unchanged until you click the link above</li>
          </ul>
        </div>

        <div class="divider"></div>

        <p style="color: #6c757d; font-size: 14px;">If you didn't request this password reset, please contact your administrator immediately.</p>

        <p style="margin-top: 30px;">Best regards,<br>
        <strong>MBZ Technology Team</strong></p>
      `;

      const htmlContent = this.generateEmailTemplate({
        title: `Reset Your Password - ${organization.name}`,
        heading: '🔐 Reset Your Password',
        content: content
      });

      const emailData = {
        to: user.email,
        subject: `Reset Your Password - ${organization.name}`,
        html: htmlContent,
        userId: user._id,
        organizationId: organization._id
      };

      const result = await this.sendEmail(emailData);

      if (result.success) {
        console.log(`✅ [SENDGRID] Password reset email sent to ${user.email}`);
      }

      return result;

    } catch (error) {
      console.error('❌ [SENDGRID] Failed to send password reset email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send password reset code email
   * @param {Object} user - User object
   * @param {string} code - 6-digit reset code
   * @param {Object} organization - Organization object
   * @returns {Promise<Object>} Result object
   */
  static async sendPasswordResetCodeEmail(user, code, organization) {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset Code - ${organization.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f8f9fa;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #ffffff;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #800020 0%, #a0002a 100%); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
              border-radius: 8px 8px 0 0;
            }
            .content { 
              padding: 30px; 
              background: #ffffff; 
            }
            .code-container {
              background: #ffffff;
              border: 2px solid #800020;
              border-radius: 12px;
              padding: 25px;
              margin: 25px 0;
              text-align: center;
              box-shadow: 0 2px 8px rgba(128, 0, 32, 0.1);
            }
            .code { 
              font-size: 32px; 
              font-weight: bold; 
              color: #800020; 
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
              margin: 10px 0;
            }
            .warning { 
              background: #fff3cd; 
              border: 1px solid #ffeaa7; 
              padding: 20px; 
              margin: 20px 0; 
              border-radius: 8px; 
              color: #856404;
              border-left: 4px solid #ffc107;
            }
            .footer { 
              text-align: center; 
              padding: 20px; 
              color: #666; 
              font-size: 12px; 
              background-color: #f8f9fa;
              border-top: 1px solid #e9ecef;
              border-radius: 0 0 8px 8px;
            }
          </style>
        </head>
        <body>
          <div style="padding: 20px;">
            <div class="container">
              <div class="header">
                <div style="font-size: 24px;">🔐</div>
                <h1>Password Reset Code</h1>
                <p style="margin: 10px 0 0; opacity: 0.9;">Secure access to your account</p>
              </div>
              
              <div class="content">
                <h2 style="color: #800020; margin-top: 0;">Hello ${user.fullName}!</h2>
                <p>You requested to reset your password for <strong>${organization.name}</strong>.</p>
                
                <div class="code-container">
                  <p style="margin: 0 0 10px; font-size: 14px; color: #666;">Your 6-digit reset code:</p>
                  <div class="code">${code}</div>
                  <p style="margin: 10px 0 0; font-size: 12px; color: #999;">Enter this code to reset your password</p>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Important Security Information:</strong>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This code will expire in <strong>15 minutes</strong></li>
                    <li>Never share this code with anyone</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>For security, this code can only be used once</li>
                  </ul>
                </div>
                
                <p style="margin-top: 30px;">If you need help or didn't request this password reset, please contact our support team immediately.</p>
              </div>
              
              <div class="footer">
                <p style="margin: 5px 0;"><strong>${organization.name}</strong></p>
                <p style="margin: 5px 0;">© ${new Date().getFullYear()} MBZ Technology. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailData = {
        to: user.email,
        subject: `Password Reset Code - ${organization.name}`,
        html: htmlContent,
        userId: user._id,
        organizationId: organization._id
      };

      const result = await this.sendEmail(emailData);

      if (result.success) {
        console.log(`✅ [SENDGRID] Password reset code email sent to ${user.email}`);
      }

      return result;

    } catch (error) {
      console.error('❌ [SENDGRID] Failed to send password reset code email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send password reset success email
   * @param {Object} user - User object
   * @param {Object} organization - Organization object
   * @param {Object} req - Request object (optional, for IP tracking)
   * @returns {Promise<Object>} Result object
   */
  static async sendPasswordResetSuccessEmail(user, organization, req = null) {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset Successful - ${organization.name}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 15px 0; border-radius: 5px; color: #155724; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Reset Successful</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${user.fullName}!</h2>
              <p>Your password has been successfully reset for <strong>${organization.name}</strong>.</p>
              
              <div class="details">
                <h3>Reset Details:</h3>
                <ul>
                  <li><strong>Organization:</strong> ${organization.name}</li>
                  <li><strong>Email:</strong> ${user.email}</li>
                  <li><strong>Reset Completed:</strong> ${new Date().toLocaleString()}</li>
                  <li><strong>IP Address:</strong> ${req?.ip || 'Unknown'}</li>
                </ul>
              </div>
              
              <div class="success">
                <strong>✅ Your password has been successfully updated!</strong>
                <p>You can now log in to your account using your new password.</p>
              </div>
              
              <p>If you did not make this change, please contact your administrator immediately as your account may have been compromised.</p>
              
              <p>For security reasons, we recommend:</p>
              <ul>
                <li>Using a strong, unique password</li>
                <li>Enabling two-factor authentication if available</li>
                <li>Regularly updating your password</li>
                <li>Not sharing your password with anyone</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>This notification was sent from Elapix Platform</p>
              <p>If you did not reset your password, please contact support immediately.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailData = {
        to: user.email,
        subject: `Password Reset Successful - ${organization.name}`,
        html: htmlContent,
        userId: user._id,
        organizationId: organization._id
      };

      const result = await this.sendEmail(emailData);

      if (result.success) {
        console.log(`✅ [SENDGRID] Password reset success email sent to ${user.email}`);
      }

      return result;

    } catch (error) {
      console.error('❌ [SENDGRID] Failed to send password reset success email:', error);
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
      
      // Simple validation - just check if API key is set and has correct format
      const apiKey = process.env.SENDGRID_API_KEY;
      if (apiKey && apiKey.startsWith('SG.')) {
        return {
          success: true,
          message: 'SendGrid API key format is valid'
        };
      } else {
        return {
          success: false,
          error: 'SendGrid API key format is invalid (should start with SG.)'
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
