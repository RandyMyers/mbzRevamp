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
    console.error(`❌ Missing required email environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

// Send invitation email
exports.sendInvitationEmail = async (invitation, baseUrl) => {
  try {
    // ✅ VALIDATE EMAIL CONFIGURATION
    if (!this.validateEmailConfig()) {
      throw new Error('Email configuration is incomplete');
    }

    console.log(`📧 Sending invitation email to: ${invitation.email}`);

    // ✅ VALIDATE REQUIRED DATA
    if (!invitation.organization || !invitation.organization.name) {
      throw new Error('Organization data is missing or invalid');
    }
    
    if (!invitation.invitedBy || !invitation.invitedBy.fullName) {
      throw new Error('Inviter data is missing or invalid');
    }

    // Generate invitation URL using provided baseUrl
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

    console.log(`✅ Invitation email sent successfully to ${invitation.email}`);
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
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return { success: true };
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return { success: false, error: error.message };
  }
}; 