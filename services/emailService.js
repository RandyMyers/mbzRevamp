const nodemailer = require('nodemailer');
const { createAuditLog } = require('../helpers/auditLogHelper');
const dotenv = require('dotenv');
dotenv.config();

// Email service configuration - Using MBZTECH SMTP settings with fallbacks (simplified)
console.log('🔧 [DEBUG] SMTP Configuration Check (Simplified):');
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'mbztechnology.com (fallback)');
console.log('SMTP_PORT:', process.env.SMTP_PORT || '465 (fallback)');
console.log('SMTP_USER:', process.env.SMTP_USER ? 'SET from env' : 'NOT SET - using fallback: info@mbztechnology.com');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET from env' : 'NOT SET - using fallback');
console.log('SMTP_FROM:', process.env.SMTP_FROM || 'NOT SET - using fallback with SMTP_USER');
console.log('🔧 [DEBUG] Using simplified SMTP config (no pooling/rate limiting)');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mbztechnology.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
  secure: true, // SSL for port 465
  auth: {
    user: process.env.SMTP_USER || 'info@mbztechnology.com',
    pass: process.env.SMTP_PASS || 'Dontmesswithus@0987654321'
  },
  authMethod: 'PLAIN', // Explicitly specify PLAIN authentication
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

// Add this function to validate email configuration
exports.validateEmailConfig = () => {
  // Check if we have either environment variables OR fallback values
  const smtpUser = process.env.SMTP_USER || 'info@mbztechnology.com';
  const smtpPass = process.env.SMTP_PASS || 'Dontmesswithus@0987654321';
  
  if (!smtpUser || !smtpPass) {
    console.error(`❌ [EMAIL CONFIG] Missing SMTP credentials - User: ${smtpUser ? 'SET' : 'NOT SET'}, Pass: ${smtpPass ? 'SET' : 'NOT SET'}`);
    return false;
  }
  
  console.log(`✅ [EMAIL CONFIG] SMTP configuration validated - Using ${process.env.SMTP_USER ? 'environment variables' : 'fallback values'}`);
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
      from: process.env.SMTP_FROM || `"MBZTECH" <${process.env.SMTP_USER || 'info@mbztechnology.com'}>`,
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
      from: process.env.SMTP_FROM || `"MBZTECH" <${process.env.SMTP_USER || 'info@mbztechnology.com'}>`,
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
    await transporter.verify();
    return { success: true };
  } catch (error) {
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
      from: process.env.SMTP_FROM || `"MBZTECH" <${process.env.SMTP_USER || 'info@mbztechnology.com'}>`,
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
      from: process.env.SMTP_FROM || `"MBZTECH" <${process.env.SMTP_USER || 'info@mbztechnology.com'}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      ...(textContent && { text: textContent })
    };
    
    // Send email
    console.log(`📧 [EMAIL SERVICE] Attempting to send email via SMTP to: ${to}`);
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
                <li><strong>IP Address:</strong> Unknown</li>
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
      - IP Address: Unknown
      
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
      from: process.env.SMTP_FROM || `"MBZTECH" <${process.env.SMTP_USER || 'info@mbztechnology.com'}>`,
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
          .code { background: #000F89; color: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 10px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
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
              <h3>Reset Details:</h3>
              <ul>
                <li><strong>Organization:</strong> ${organization.name}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Requested:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Code expires in:</strong> 15 minutes</li>
              </ul>
            </div>
            
            <p>Use this verification code to reset your password:</p>
            <div class="code">${code}</div>
            
            <div class="warning">
              <h4>⚠️ Security Notice:</h4>
              <ul>
                <li>This code will expire in <strong>15 minutes</strong></li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>For security, this code can only be used once</li>
                <li>Do not share this code with anyone</li>
                <li>If you're having trouble, contact your administrator</li>
              </ul>
            </div>
            
            <p>Enter this code in the password reset form to continue with your password reset.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from ${organization.name} - CRM System</p>
            <p>© ${new Date().getFullYear()} ${organization.name}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Password Reset Code - ${organization.name}
      
      Hello ${user.fullName}!
      
      You requested to reset your password for ${organization.name}.
      
      Reset Details:
      - Organization: ${organization.name}
      - Email: ${user.email}
      - Requested: ${new Date().toLocaleString()}
      - Code expires in: 15 minutes
      
      Your password reset code is: ${code}
      
      IMPORTANT SECURITY INFORMATION:
      - This code will expire in 15 minutes
      - This code can only be used once
      - If you didn't request this, please ignore this email
      - Do not share this code with anyone
      - If you're having trouble, contact your administrator
      
      Enter this code in the password reset form to continue with your password reset.
      
      This email was sent from ${organization.name} - CRM System
      © ${new Date().getFullYear()} ${organization.name}. All rights reserved.
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || `"MBZTECH" <${process.env.SMTP_USER || 'info@mbztechnology.com'}>`,
      to: user.email,
      subject: subject,
      html: htmlContent,
      text: textContent
    };

    console.log(`📧 [EMAIL SERVICE] Attempting to send password reset code email to: ${user.email}`);
    
    // Add timeout wrapper and retry logic
    const sendEmailWithRetry = async (options, maxRetries = 3) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`📧 [EMAIL SERVICE] Attempt ${attempt}/${maxRetries} - Sending email to ${user.email}`);
          
          const info = await Promise.race([
            transporter.sendMail(options),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
            )
          ]);
          
          console.log(`✅ Password reset code email sent successfully to ${user.email} - Message ID: ${info.messageId} (Attempt ${attempt})`);
          return info;
          
        } catch (error) {
          console.error(`❌ [EMAIL SERVICE] Attempt ${attempt}/${maxRetries} failed:`, error.message);
          
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ [EMAIL SERVICE] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };
    
    const info = await sendEmailWithRetry(mailOptions);

    // ✅ AUDIT LOG: Password Reset Code Email Sent
    await createAuditLog({
      action: 'Password Reset Code Email Sent',
      user: user._id,
      resource: 'password_reset_code',
      resourceId: null,
      details: {
        email: user.email,
        code: code,
        organizationId: organization._id,
        messageId: info.messageId
      },
      organization: organization._id,
      severity: 'info'
    });

    return {
      success: true,
      messageId: info.messageId,
      code: code
    };

  } catch (error) {
    console.error('❌ Password reset code email error:', error);
    
    // Parse specific error types for better user feedback
    let errorType = 'unknown';
    let userMessage = error.message;
    let technicalDetails = {};

    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorType = 'connection_timeout';
      userMessage = 'SMTP connection timeout - your hosting provider may be blocking outbound SMTP connections. Please contact your hosting provider or use an alternative email service.';
      technicalDetails = {
        errorCode: error.code,
        command: error.command || 'CONN',
        timeout: '30 seconds',
        suggestion: 'Check if your hosting provider allows outbound SMTP connections on port 465'
      };
    } else if (error.code === 'ENOTFOUND' || error.message.includes('ENOTFOUND')) {
      errorType = 'dns_error';
      userMessage = 'SMTP server not found - please check your SMTP host configuration';
      technicalDetails = {
        errorCode: error.code,
        host: process.env.SMTP_HOST || 'mbztechnology.com'
      };
    } else if (error.code === 'ECONNREFUSED') {
      errorType = 'connection_refused';
      userMessage = 'SMTP connection refused - server may be down or port is blocked';
      technicalDetails = {
        errorCode: error.code,
        port: process.env.SMTP_PORT || 465
      };
    } else if (error.code === 'EAUTH') {
      errorType = 'authentication_error';
      userMessage = 'SMTP authentication failed - please check your email credentials';
      technicalDetails = {
        errorCode: error.code,
        user: process.env.SMTP_USER || 'info@mbztechnology.com'
      };
    }

    // ✅ AUDIT LOG: Password Reset Code Email Failed
    try {
      await createAuditLog({
        action: 'Password Reset Code Email Failed',
        user: user._id,
        resource: 'password_reset_code',
        resourceId: null,
        details: {
          email: user.email,
          code: code,
          organizationId: organization._id,
          error: error.message,
          errorType: errorType,
          userMessage: userMessage,
          technicalDetails: technicalDetails
        },
        organization: organization._id,
        severity: 'error'
      });
    } catch (auditError) {
      console.error('Failed to create audit log for password reset code email failure:', auditError);
    }

    return {
      success: false,
      error: userMessage,
      errorType: errorType,
      technicalDetails: technicalDetails
    };
  }
};

// Send login OTP email
exports.sendLoginOTPEmail = async (user, code, organization) => {
  try {
    // ✅ VALIDATE EMAIL CONFIGURATION
    if (!this.validateEmailConfig()) {
      throw new Error('Email configuration is incomplete');
    }

    // Create email content
    const subject = `Login Verification Code - ${organization.name}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Login Verification Code - ${organization.name}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000F89; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .code { background: #000F89; color: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 10px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; color: #856404; }
          .security { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; margin: 15px 0; border-radius: 5px; color: #0c5460; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Login Verification Code</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${user.fullName}!</h2>
            <p>You're logging in to <strong>${organization.name}</strong> and we need to verify your identity.</p>
            
            <div class="details">
              <h3>Login Details:</h3>
              <ul>
                <li><strong>Organization:</strong> ${organization.name}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Login Time:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Code expires in:</strong> 5 minutes</li>
              </ul>
            </div>
            
            <p>Use this verification code to complete your login:</p>
            <div class="code">${code}</div>
            
            <div class="security">
              <h4>🔒 Security Notice:</h4>
              <ul>
                <li>This code will expire in <strong>5 minutes</strong></li>
                <li>If you didn't request this login, please ignore this email</li>
                <li>For security, this code can only be used once</li>
                <li>Do not share this code with anyone</li>
                <li>Our support team will never ask for this code</li>
              </ul>
            </div>
            
            <div class="warning">
              <h4>⚠️ Important:</h4>
              <p>If you didn't attempt to log in, please change your password immediately and contact our support team.</p>
            </div>
            
            <p>Enter this code in the login form to complete your authentication.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from ${organization.name} - CRM System</p>
            <p>© ${new Date().getFullYear()} ${organization.name}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Login Verification Code - ${organization.name}
      
      Hello ${user.fullName}!
      
      You're logging in to ${organization.name} and we need to verify your identity.
      
      Login Details:
      - Organization: ${organization.name}
      - Email: ${user.email}
      - Login Time: ${new Date().toLocaleString()}
      - Code expires in: 5 minutes
      
      Your login verification code is: ${code}
      
      SECURITY NOTICE:
      - This code will expire in 5 minutes
      - If you didn't request this login, please ignore this email
      - This code can only be used once
      - Do not share this code with anyone
      - Our support team will never ask for this code
      
      IMPORTANT:
      If you didn't attempt to log in, please change your password immediately and contact our support team.
      
      Enter this code in the login form to complete your authentication.
      
      This email was sent from ${organization.name} - CRM System
      © ${new Date().getFullYear()} ${organization.name}. All rights reserved.
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || `"MBZTECH" <${process.env.SMTP_USER || 'info@mbztechnology.com'}>`,
      to: user.email,
      subject: subject,
      html: htmlContent,
      text: textContent
    };

    console.log(`📧 [EMAIL SERVICE] Attempting to send login OTP email to: ${user.email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Login OTP email sent successfully to ${user.email} - Message ID: ${info.messageId}`);

    // ✅ AUDIT LOG: Login OTP Email Sent
    await createAuditLog({
      action: 'Login OTP Email Sent',
      user: user._id,
      resource: 'login_otp',
      resourceId: null,
      details: {
        email: user.email,
        code: code,
        organizationId: organization._id,
        messageId: info.messageId
      },
      organization: organization._id,
      severity: 'info'
    });

    return {
      success: true,
      messageId: info.messageId,
      code: code
    };

  } catch (error) {
    console.error('❌ Login OTP email error:', error);
    
    // ✅ AUDIT LOG: Login OTP Email Failed
    try {
      await createAuditLog({
        action: 'Login OTP Email Failed',
        user: user._id,
        resource: 'login_otp',
        resourceId: null,
        details: {
          email: user.email,
          code: code,
          organizationId: organization._id,
          error: error.message
        },
        organization: organization._id,
        severity: 'error'
      });
    } catch (auditError) {
      console.error('Failed to create audit log for login OTP email failure:', auditError);
    }

    return {
      success: false,
      error: error.message
    };
  }
};

// Test SMTP connection with simplified configuration
exports.testSMTPConnection = async () => {
  try {
    console.log('🔧 [SMTP TEST] Testing SMTP connection with simplified configuration...');
    console.log('🔧 [SMTP TEST] Host:', process.env.SMTP_HOST || 'mbztechnology.com (fallback)');
    console.log('🔧 [SMTP TEST] Port:', process.env.SMTP_PORT || '465 (fallback)');
    console.log('🔧 [SMTP TEST] User:', process.env.SMTP_USER || 'info@mbztechnology.com (fallback)');
    console.log('🔧 [SMTP TEST] Config: Simplified (no pooling/rate limiting)');
    
    await transporter.verify();
    console.log('✅ [SMTP TEST] Connection successful with simplified config!');
    return { success: true, message: 'SMTP connection verified successfully with simplified configuration' };
  } catch (error) {
    console.error('❌ [SMTP TEST] Connection failed:', error.message);
    return { success: false, error: error.message };
  }
}; 