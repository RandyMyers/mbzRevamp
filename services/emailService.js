const nodemailer = require('nodemailer');
const { createAuditLog } = require('../helpers/auditLogHelper');

// Email service configuration - Using MBZTECH SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mbztechnology.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
  secure: true, // SSL for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Add this function to validate email configuration
exports.validateEmailConfig = () => {
  const required = ['SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ [EMAIL CONFIG] Missing required email environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

// Send invitation email
exports.sendInvitationEmail = async (invitation) => {
  try {
    // ✅ VALIDATE EMAIL CONFIGURATION
    if (!this.validateEmailConfig()) {
      throw new Error('Email configuration is incomplete');
    }


    // ✅ VALIDATE REQUIRED DATA
    if (!invitation.organization || !invitation.organization.name) {
      throw new Error('Organization data is missing or invalid');
    }
    
    if (!invitation.invitedBy || !invitation.invitedBy.fullName) {
      throw new Error('Inviter data is missing or invalid');
    }

    // Generate invitation URL using hardcoded baseUrl
    const baseUrl = 'https://crm.mbztechnology.com';
    const invitationUrl = `${baseUrl}/accept-invitation?token=${invitation.token}`;

    // Create email content
    const subject = `You've been invited to join ${invitation.organization.name}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invitation to Join ${invitation.organization.name}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000F89; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #000F89; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You're Invited!</h1>
          </div>
          
          <div class="content">
            <h2>Hello!</h2>
            <p>You've been invited by <strong>${invitation.invitedBy.fullName}</strong> to join <strong>${invitation.organization.name}</strong> on our platform.</p>
            
            <div class="details">
              <h3>Invitation Details:</h3>
              <ul>
                <li><strong>Organization:</strong> ${invitation.organization.name}</li>
                ${invitation.role ? `<li><strong>Role:</strong> ${invitation.role.name}</li>` : ''}
                ${invitation.department ? `<li><strong>Department:</strong> ${invitation.department}</li>` : ''}
                <li><strong>Expires:</strong> ${new Date(invitation.expiresAt).toLocaleDateString()}</li>
              </ul>
            </div>
            
            ${invitation.message ? `<p><strong>Message from ${invitation.invitedBy.fullName}:</strong><br>${invitation.message}</p>` : ''}
            
            <p>Click the button below to accept this invitation and create your account:</p>
            
            <a href="${invitationUrl}" class="button">Accept Invitation</a>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px;">${invitationUrl}</p>
            
            <p><strong>Important:</strong> This invitation will expire on ${new Date(invitation.expiresAt).toLocaleDateString()}. If you don't accept it by then, you'll need to request a new invitation.</p>
          </div>
          
          <div class="footer">
            <p>This invitation was sent from MBZTECH Platform</p>
            <p>If you didn't expect this invitation, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      You've been invited to join ${invitation.organization.name}
      
      Invited by: ${invitation.invitedBy.fullName}
      Organization: ${invitation.organization.name}
      ${invitation.role ? `Role: ${invitation.role.name}` : ''}
      ${invitation.department ? `Department: ${invitation.department}` : ''}
      Expires: ${new Date(invitation.expiresAt).toLocaleDateString()}
      
      ${invitation.message ? `Message: ${invitation.message}` : ''}
      
      Accept your invitation by visiting: ${invitationUrl}
      
      This invitation will expire on ${new Date(invitation.expiresAt).toLocaleDateString()}.
    `;

    // Send email
    const mailOptions = {
      from: process.env.SMTP_FROM || `"MBZTECH" <${process.env.SMTP_USER}>`,
      to: invitation.email,
      subject: subject,
      html: htmlContent,
      text: textContent
    };

    const info = await transporter.sendMail(mailOptions);

    // ✅ AUDIT LOG: Email Sent
    await createAuditLog({
      action: 'Invitation Email Sent',
      user: invitation.invitedBy._id,
      resource: 'invitation',
      resourceId: invitation._id,
      details: {
        recipient: invitation.email,
        messageId: info.messageId,
        subject: subject,
        organization: invitation.organization._id
      },
      organization: invitation.organization._id,
      severity: 'info'
    });

    console.log(`✅ Email sent successfully to ${invitation.email} - Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error(`❌ Failed to send invitation email to ${invitation.email}:`, error.message);
    
    // ✅ AUDIT LOG: Email Failed
    try {
    await createAuditLog({
        userId: invitation.invitedBy?._id || 'system',
        action: 'INVITATION_EMAIL_FAILED',
        resourceType: 'INVITATION',
      resourceId: invitation._id,
      details: {
          recipientEmail: invitation.email,
          organizationId: invitation.organization?._id,
        error: error.message,
          stack: error.stack
      },
        ipAddress: 'system',
        userAgent: 'email-service'
    });
    } catch (auditError) {
      console.error('Failed to create audit log for email failure:', auditError);
    }

    return { success: false, error: error.message };
  }
};

// Send notification email
exports.sendNotificationEmail = async (user, subject, htmlContent, textContent) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || `"MBZTECH" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: subject,
      html: htmlContent,
      text: textContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Notification email sent to ${user.email}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error(`❌ Failed to send notification email to ${user.email}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Verify email configuration
exports.verifyEmailConfig = async () => {
  try {
    console.log('📧 [EMAIL CONFIG TEST] Testing SMTP connection...');
    console.log('📧 [EMAIL CONFIG TEST] Host:', process.env.SMTP_HOST || 'mbztechnology.com');
    console.log('📧 [EMAIL CONFIG TEST] Port:', process.env.SMTP_PORT || '465');
    console.log('📧 [EMAIL CONFIG TEST] Secure:', true);
    console.log('📧 [EMAIL CONFIG TEST] User:', process.env.SMTP_USER ? '***SET***' : '❌ MISSING');
    
    await transporter.verify();
    console.log('✅ [EMAIL CONFIG TEST] SMTP connection successful!');
    return { success: true };
  } catch (error) {
    console.error('❌ [EMAIL CONFIG TEST] SMTP connection failed:', error.message);
    console.error('❌ [EMAIL CONFIG TEST] Error details:', {
      name: error.name,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return { 
      success: false, 
      error: error.message,
      details: {
        name: error.name,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      }
    };
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (user, resetToken, organization) => {
  try {
    // ✅ VALIDATE EMAIL CONFIGURATION
    if (!this.validateEmailConfig()) {
      throw new Error('Email configuration is incomplete');
    }


    // Generate reset URL using hardcoded baseUrl
    const baseUrl = 'https://crm.mbztechnology.com';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken.token}`;

    // Create email content
    const subject = `Reset Your Password - ${organization.name}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - ${organization.name}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000F89; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #000F89; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Your Password</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${user.fullName}!</h2>
            <p>You requested to reset your password for <strong>${organization.name}</strong>.</p>
            
            <div class="details">
              <h3>Reset Details:</h3>
              <ul>
                <li><strong>Organization:</strong> ${organization.name}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Requested:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Expires:</strong> ${new Date(resetToken.expiresAt).toLocaleString()}</li>
              </ul>
            </div>
            
            <p>Click the button below to reset your password:</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px;">${resetUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul>
                <li>This link will expire in <strong>1 hour</strong></li>
                <li>This link can only be used <strong>once</strong></li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password will remain unchanged until you click the link above</li>
              </ul>
            </div>
            
            <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
          </div>
          
          <div class="footer">
            <p>This password reset was requested from MBZTECH Platform</p>
            <p>If you didn't request this password reset, please contact your administrator immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Reset Your Password - ${organization.name}
      
      Hello ${user.fullName}!
      
      You requested to reset your password for ${organization.name}.
      
      Reset Details:
      - Organization: ${organization.name}
      - Email: ${user.email}
      - Requested: ${new Date().toLocaleString()}
      - Expires: ${new Date(resetToken.expiresAt).toLocaleString()}
      
      To reset your password, visit this link:
      ${resetUrl}
      
      IMPORTANT SECURITY INFORMATION:
      - This link will expire in 1 hour
      - This link can only be used once
      - If you didn't request this, please ignore this email
      - Your password will remain unchanged until you click the link above
      
      If you're having trouble with the link, copy and paste the URL above into your web browser.
      
      This password reset was requested from MBZTECH Platform
      If you didn't request this password reset, please contact your administrator immediately.
    `;

    // Send email
    const mailOptions = {
      from: process.env.SMTP_FROM || `"MBZTECH" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: subject,
      html: htmlContent,
      text: textContent
    };

    const info = await transporter.sendMail(mailOptions);

    // ✅ AUDIT LOG: Password Reset Email Sent
    await createAuditLog({
      action: 'Password Reset Email Sent',
      user: user._id,
      resource: 'password_reset',
      resourceId: resetToken._id,
      details: {
        recipient: user.email,
        messageId: info.messageId,
        subject: subject,
        organization: organization._id,
        resetUrl: resetUrl
      },
      organization: organization._id,
      severity: 'info'
    });

    console.log(`✅ Password reset email sent to ${user.email} - Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${user.email}:`, error.message);
    
    // ✅ AUDIT LOG: Password Reset Email Failed
    try {
      await createAuditLog({
        userId: user?._id || 'system',
        action: 'PASSWORD_RESET_EMAIL_FAILED',
        resourceType: 'PASSWORD_RESET',
        resourceId: resetToken?._id,
        details: {
          recipientEmail: user?.email,
          organizationId: organization?._id,
          error: error.message,
          stack: error.stack
        },
        ipAddress: 'system',
        userAgent: 'email-service'
      });
    } catch (auditError) {
      console.error('Failed to create audit log for password reset email failure:', auditError);
    }

    return { success: false, error: error.message };
  }
};

// Send system email (for email verification, notifications, etc.)
exports.sendSystemEmail = async (to, subject, htmlContent, textContent = null) => {
  try {
    
    // ✅ VALIDATE EMAIL CONFIGURATION
    if (!exports.validateEmailConfig()) {
      throw new Error('Email configuration is incomplete');
    }

    // ✅ VALIDATE REQUIRED PARAMETERS
    if (!to || !subject || !htmlContent) {
      throw new Error('Missing required parameters: to, subject, and htmlContent are required');
    }

    // ✅ VALIDATE EMAIL FORMAT
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error(`Invalid email address: ${to}`);
    }

    // Create mail options
    const mailOptions = {
      from: process.env.SMTP_FROM || `"MBZTECH" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      ...(textContent && { text: textContent })
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to} - Message ID: ${info.messageId}`);

    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    };

  } catch (error) {
    console.error('❌ [EMAIL SERVICE] Failed to send system email:', error.message);
    console.error('❌ [EMAIL SERVICE] Error details:', {
      name: error.name,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    return { 
      success: false, 
      error: error.message,
      details: {
        name: error.name,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      }
    };
  }
};

// Send password reset code email (6-digit code)
exports.sendPasswordResetCodeEmail = async (user, code, organization) => {
  try {
    // ✅ VALIDATE EMAIL CONFIGURATION
    if (!this.validateEmailConfig()) {
      throw new Error('Email configuration is incomplete');
    }

    // Create email content
    const subject = `Password Reset Code - ${organization.name}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Code - ${organization.name}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000F89; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .code { background: #f8f9fa; border: 2px solid #000F89; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; color: #000F89; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Code</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${user.fullName}!</h2>
            <p>You requested to reset your password for <strong>${organization.name}</strong>.</p>
            
            <div class="details">
              <h3>Your Reset Code:</h3>
              <div class="code">${code}</div>
              <p><strong>Please enter this 6-digit code to reset your password.</strong></p>
            </div>
            
            <div class="warning">
              <h4>⚠️ Important Security Information:</h4>
              <ul>
                <li>This code will expire in <strong>15 minutes</strong></li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>For security, this code can only be used once</li>
              </ul>
            </div>
            
            <div class="details">
              <h3>Reset Details:</h3>
              <ul>
                <li><strong>Organization:</strong> ${organization.name}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Requested:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Expires:</strong> ${new Date(Date.now() + 15 * 60 * 1000).toLocaleString()}</li>
              </ul>
            </div>
            
            <p>If you need help or didn't request this password reset, please contact our support team.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent by ${organization.name}</p>
            <p>© ${new Date().getFullYear()} MBZ Technology. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Password Reset Code - ${organization.name}
      
      Hello ${user.fullName}!
      
      You requested to reset your password for ${organization.name}.
      
      Your Reset Code: ${code}
      
      Please enter this 6-digit code to reset your password.
      
      Important Security Information:
      - This code will expire in 15 minutes
      - Never share this code with anyone
      - If you didn't request this reset, please ignore this email
      - For security, this code can only be used once
      
      Reset Details:
      - Organization: ${organization.name}
      - Email: ${user.email}
      - Requested: ${new Date().toLocaleString()}
      - Expires: ${new Date(Date.now() + 15 * 60 * 1000).toLocaleString()}
      
      If you need help or didn't request this password reset, please contact our support team.
      
      © ${new Date().getFullYear()} MBZ Technology. All rights reserved.
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"${organization.name}" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: subject,
      text: textContent,
      html: htmlContent
    });

    // ✅ AUDIT LOG: Password Reset Code Email Sent
    try {
      await createAuditLog({
        userId: user._id,
        action: 'PASSWORD_RESET_CODE_EMAIL_SENT',
        resourceType: 'PASSWORD_RESET',
        resourceId: user._id,
        details: {
          recipientEmail: user.email,
          organizationId: organization._id,
          codeLength: code.length,
          messageId: info.messageId
        },
        ipAddress: 'system',
        userAgent: 'email-service'
      });
    } catch (auditError) {
      console.error('Failed to create audit log for password reset code email:', auditError);
    }

    console.log(`✅ Password reset code email sent to ${user.email} - Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error(`❌ Failed to send password reset code email to ${user.email}:`, error.message);
    
    // ✅ AUDIT LOG: Password Reset Code Email Failed
    try {
      await createAuditLog({
        userId: user?._id || 'system',
        action: 'PASSWORD_RESET_CODE_EMAIL_FAILED',
        resourceType: 'PASSWORD_RESET',
        resourceId: user?._id,
        details: {
          recipientEmail: user?.email,
          organizationId: organization?._id,
          error: error.message,
          stack: error.stack
        },
        ipAddress: 'system',
        userAgent: 'email-service'
      });
    } catch (auditError) {
      console.error('Failed to create audit log for password reset code email failure:', auditError);
    }

    return { success: false, error: error.message };
  }
};

// Send password reset success email
exports.sendPasswordResetSuccessEmail = async (user, organization) => {
  try {
    // ✅ VALIDATE EMAIL CONFIGURATION
    if (!this.validateEmailConfig()) {
      throw new Error('Email configuration is incomplete');
    }


    // Create email content
    const subject = `Password Reset Successful - ${organization.name}`;
    
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
            <p>This notification was sent from MBZTECH Platform</p>
            <p>If you did not reset your password, please contact support immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Password Reset Successful - ${organization.name}
      
      Hello ${user.fullName}!
      
      Your password has been successfully reset for ${organization.name}.
      
      Reset Details:
      - Organization: ${organization.name}
      - Email: ${user.email}
      - Reset Completed: ${new Date().toLocaleString()}
      - IP Address: ${req?.ip || 'Unknown'}
      
      ✅ Your password has been successfully updated!
      You can now log in to your account using your new password.
      
      If you did not make this change, please contact your administrator immediately as your account may have been compromised.
      
      For security reasons, we recommend:
      - Using a strong, unique password
      - Enabling two-factor authentication if available
      - Regularly updating your password
      - Not sharing your password with anyone
      
      This notification was sent from MBZTECH Platform
      If you did not reset your password, please contact support immediately.
    `;

    // Send email
    const mailOptions = {
      from: process.env.SMTP_FROM || `"MBZTECH" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: subject,
      html: htmlContent,
      text: textContent
    };

    const info = await transporter.sendMail(mailOptions);

    // ✅ AUDIT LOG: Password Reset Success Email Sent
    await createAuditLog({
      action: 'Password Reset Success Email Sent',
      user: user._id,
      resource: 'password_reset',
      resourceId: user._id,
      details: {
        recipient: user.email,
        messageId: info.messageId,
        subject: subject,
        organization: organization._id
      },
      organization: organization._id,
      severity: 'info'
    });

    console.log(`✅ Password reset success email sent to ${user.email} - Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error(`❌ Failed to send password reset success email to ${user.email}:`, error.message);
    
    // ✅ AUDIT LOG: Password Reset Success Email Failed
    try {
      await createAuditLog({
        userId: user?._id || 'system',
        action: 'PASSWORD_RESET_SUCCESS_EMAIL_FAILED',
        resourceType: 'PASSWORD_RESET',
        resourceId: user?._id,
        details: {
          recipientEmail: user?.email,
          organizationId: organization?._id,
          error: error.message,
          stack: error.stack
        },
        ipAddress: 'system',
        userAgent: 'email-service'
      });
    } catch (auditError) {
      console.error('Failed to create audit log for password reset success email failure:', auditError);
    }

    return { success: false, error: error.message };
  }
}; 