const Invitation = require('../models/invitation');
const User = require('../models/users');
const Organization = require('../models/organization');
const Role = require('../models/role');
const Group = require('../models/group');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createAuditLog } = require('../helpers/auditLogHelper');
const { sendInvitationEmail } = require('../services/emailService');

// Create a new invitation
exports.createInvitation = async (req, res) => {
  try {
    const { 
      email, 
      role, 
      department, 
      message, 
      expiresAt,
      organization,
      baseUrl // ✅ Get baseUrl from request body
    } = req.body;
    
    const invitedBy = req.user._id; // From authenticated user

    // ✅ VALIDATION 1: Check if user is authorized to invite
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to send invitations' 
      });
    }

    // ✅ VALIDATION 2: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    // ✅ VALIDATION 3: Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'A user with this email already exists' 
      });
    }

    // ✅ VALIDATION 4: Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({ 
      email: email.toLowerCase(), 
      status: 'pending',
      organization: organization || req.user.organization
    });
    
    if (existingInvitation) {
      return res.status(400).json({ 
        success: false, 
        message: 'An invitation has already been sent to this email address' 
      });
    }

    // ✅ VALIDATION 5: Validate organization
    const organizationDoc = await Organization.findById(organization || req.user.organization);
    if (!organizationDoc) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }
    

    // ✅ VALIDATION 6: Validate role if provided
    if (role) {
      const roleDoc = await Role.findById(role);
      if (!roleDoc) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid role specified' 
        });
      }
    }

    // ✅ VALIDATION 7: Validate baseUrl
    if (!baseUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Base URL is required for invitation links' 
      });
    }

    // ✅ GENERATE SECURE TOKEN
    const token = crypto.randomBytes(32).toString('hex');
    
    // ✅ SET EXPIRATION (default 7 days)
    const expirationDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // ✅ CREATE INVITATION
    const invitation = new Invitation({
      email: email.toLowerCase(),
      invitedBy,
      organization: organization || req.user.organization,
      role: role || null,
      department: department || null,
      groups: [], // Removed groups from here
      message: message || '',
      token,
      expiresAt: expirationDate,
      status: 'pending'
    });

    await invitation.save();

    // ✅ POPULATE REFERENCES FOR EMAIL
    await invitation.populate([
      { path: 'invitedBy', select: 'fullName email' },
      { path: 'organization', select: 'name' },
      { path: 'role', select: 'name' }
    ]);

    // ✅ SEND INVITATION EMAIL WITH BASEURL
    try {
      // ✅ VALIDATE DATA BEFORE SENDING EMAIL
      if (!invitation.organization || !invitation.invitedBy) {
        console.error('Missing required data for email:', {
          hasOrganization: !!invitation.organization,
          hasInvitedBy: !!invitation.invitedBy
        });
        throw new Error('Missing required invitation data');
      }

      const emailResult = await sendInvitationEmail(invitation, baseUrl);
      if (!emailResult.success) {
        console.error('❌ Email sending failed:', emailResult.error);
        throw new Error(`Failed to send invitation email: ${emailResult.error}`);
      }

      console.log('✅ Invitation email sent successfully');
      
      // ✅ AUDIT LOG SUCCESS
      await createAuditLog({
        userId: req.user.id,
        action: 'INVITATION_EMAIL_SENT',
        resourceType: 'INVITATION',
        resourceId: invitation._id,
        details: {
          invitationId: invitation._id,
          recipientEmail: invitation.email,
          organizationId: invitation.organization._id,
          role: invitation.role,
          groupId: invitation.group
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      
      // ✅ AUDIT LOG EMAIL FAILURE
      await createAuditLog({
        userId: req.user.id,
        action: 'INVITATION_EMAIL_FAILED',
        resourceType: 'INVITATION',
        resourceId: invitation._id,
        details: {
          invitationId: invitation._id,
          recipientEmail: invitation.email,
          error: emailError.message
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Continue with invitation creation even if email fails
      console.warn('⚠️ Continuing with invitation creation despite email failure');
    }

    // ✅ AUDIT LOG: Invitation Created
    await createAuditLog({
      action: 'Invitation Created',
      user: invitedBy,
      resource: 'invitation',
      resourceId: invitation._id,
      details: {
        inviteeEmail: email,
        role: role,
        department: department,
        organization: organization || req.user.organization,
        expiresAt: expirationDate,
        baseUrl: baseUrl,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: organization || req.user.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // ✅ SUCCESS RESPONSE
    res.status(201).json({ 
      success: true, 
      message: 'Invitation sent successfully',
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        department: invitation.department,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        invitedBy: invitation.invitedBy,
        organization: invitation.organization,
        createdAt: invitation.createdAt
      }
    });

  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all invitations (optionally by organization)
exports.getInvitations = async (req, res) => {
  try {
    const { organizationId } = req.query;
    const filter = organizationId ? { organization: organizationId } : {};
    const invitations = await Invitation.find(filter).populate('invitedBy organization');
    res.status(200).json({ success: true, invitations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch invitations' });
  }
};

// Get an invitation by ID
exports.getInvitationById = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const invitation = await Invitation.findById(invitationId).populate('invitedBy organization');
    if (!invitation) return res.status(404).json({ success: false, message: 'Invitation not found' });
    res.status(200).json({ success: true, invitation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch invitation' });
  }
};

// Resend invitation (reset token and expiresAt)
exports.resendInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { baseUrl } = req.body; // ✅ Get baseUrl from request body
    const invitedBy = req.user._id;

    // ✅ VALIDATION 1: Check if user is authorized
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to resend invitations' 
      });
    }

    // ✅ VALIDATION 2: Validate baseUrl
    if (!baseUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Base URL is required for invitation links' 
      });
    }

    // ✅ VALIDATION 3: Find invitation
    const invitation = await Invitation.findById(invitationId)
      .populate(['invitedBy', 'organization', 'role']);

    if (!invitation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invitation not found' 
      });
    }

    // ✅ VALIDATION 4: Check if invitation is already accepted
    if (invitation.status === 'accepted') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot resend an already accepted invitation' 
      });
    }

    // ✅ GENERATE NEW TOKEN AND UPDATE EXPIRATION
    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // ✅ UPDATE INVITATION
    invitation.token = newToken;
    invitation.expiresAt = newExpiration;
    invitation.status = 'pending';
    invitation.updatedAt = new Date();
    await invitation.save();

    // ✅ SEND NEW INVITATION EMAIL WITH BASEURL
    try {
      // ✅ VALIDATE DATA BEFORE SENDING EMAIL
      if (!invitation.organization || !invitation.invitedBy) {
        console.error('Missing required data for resend email:', {
          hasOrganization: !!invitation.organization,
          hasInvitedBy: !!invitation.invitedBy
        });
        throw new Error('Missing required invitation data for resend');
      }

      const emailResult = await sendInvitationEmail(invitation, baseUrl);
      if (!emailResult.success) {
        console.error('❌ Resend email failed:', emailResult.error);
        throw new Error(`Failed to resend invitation email: ${emailResult.error}`);
      }

      console.log('✅ Invitation email resent successfully');
      
      // ✅ AUDIT LOG SUCCESS
      await createAuditLog({
        userId: req.user.id,
        action: 'INVITATION_EMAIL_RESENT',
        resourceType: 'INVITATION',
        resourceId: invitation._id,
        details: {
          invitationId: invitation._id,
          recipientEmail: invitation.email,
          organizationId: invitation.organization._id,
          role: invitation.role,
          groupId: invitation.group
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

    } catch (emailError) {
      console.error('❌ Resend email error:', emailError);
      
      // ✅ AUDIT LOG EMAIL FAILURE
      await createAuditLog({
        userId: req.user.id,
        action: 'INVITATION_EMAIL_RESEND_FAILED',
        resourceType: 'INVITATION',
        resourceId: invitation._id,
        details: {
          invitationId: invitation._id,
          recipientEmail: invitation.email,
          error: emailError.message
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(500).json({ 
        success: false, 
        message: 'Failed to resend invitation email',
        error: emailError.message
      });
    }

    // ✅ AUDIT LOG: Invitation Resent
    await createAuditLog({
      action: 'Invitation Resent',
      user: invitedBy,
      resource: 'invitation',
      resourceId: invitation._id,
      details: {
        inviteeEmail: invitation.email,
        newExpiration: newExpiration,
        baseUrl: baseUrl,
        organization: invitation.organization._id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: invitation.organization._id,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // ✅ SUCCESS RESPONSE
    res.status(200).json({ 
      success: true, 
      message: 'Invitation resent successfully',
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        updatedAt: invitation.updatedAt
      }
    });

  } catch (error) {
    console.error('Resend invitation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to resend invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cancel invitation
exports.cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const invitation = await Invitation.findByIdAndUpdate(
      invitationId,
      { status: 'cancelled' },
      { new: true }
    );
    if (!invitation) return res.status(404).json({ success: false, message: 'Invitation not found' });
    res.status(200).json({ success: true, invitation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to cancel invitation' });
  }
};

// Accept invitation (create user, mark invitation as accepted)
exports.acceptInvitation = async (req, res) => {
  try {
    const { token, fullName, password, username } = req.body;

    // ✅ VALIDATION 1: Check required fields
    if (!token || !fullName || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token, full name, and password are required' 
      });
    }

    // ✅ VALIDATION 2: Password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // ✅ VALIDATION 3: Find valid invitation
    const invitation = await Invitation.findOne({ 
      token, 
      status: 'pending', 
      expiresAt: { $gt: new Date() } 
    }).populate(['organization', 'role']);

    if (!invitation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invitation not found, expired, or already used' 
      });
    }

    // ✅ VALIDATION 4: Check if user already exists
    const existingUser = await User.findOne({ email: invitation.email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'A user with this email already exists' 
      });
    }

    // ✅ VALIDATION 5: Username uniqueness (if provided)
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username is already taken' 
        });
      }
    }

    // ✅ HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 12);

    // ✅ CREATE USER
    const newUser = new User({
      email: invitation.email,
      fullName: fullName,
      username: username || null,
      password: hashedPassword,
      role: invitation.role || null,
      department: invitation.department || null,
      organization: invitation.organization._id,
      status: 'active',
      lastLogin: new Date()
    });

    await newUser.save();

    // ✅ UPDATE INVITATION STATUS
    invitation.status = 'accepted';
    invitation.updatedAt = new Date();
    await invitation.save();

    // ✅ GENERATE JWT TOKEN
    const jwtToken = jwt.sign(
      { 
        userId: newUser._id,
        email: newUser.email,
        organization: newUser.organization,
        role: newUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ AUDIT LOG: Invitation Accepted
    await createAuditLog({
      action: 'Invitation Accepted',
      user: newUser._id,
      resource: 'invitation',
      resourceId: invitation._id,
      details: {
        inviteeEmail: invitation.email,
        role: invitation.role,
        department: invitation.department,
        organization: invitation.organization._id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: invitation.organization._id,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // ✅ AUDIT LOG: User Created
    await createAuditLog({
      action: 'User Created via Invitation',
      user: newUser._id,
      resource: 'user',
      resourceId: newUser._id,
      details: {
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        department: newUser.department,
        organization: newUser.organization,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      organization: newUser.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // ✅ SUCCESS RESPONSE
    res.status(200).json({ 
      success: true, 
      message: 'Invitation accepted successfully',
      user: {
        _id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        username: newUser.username,
        role: newUser.role,
        department: newUser.department,
        organization: newUser.organization,
        status: newUser.status
      },
      token: jwtToken,
      invitation: {
        _id: invitation._id,
        status: invitation.status,
        organization: invitation.organization
      }
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to accept invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete invitation
exports.deleteInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const invitation = await Invitation.findByIdAndDelete(invitationId);
    if (!invitation) return res.status(404).json({ success: false, message: 'Invitation not found' });
    res.status(200).json({ success: true, message: 'Invitation deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete invitation' });
  }
}; 

// Accept invitation
const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invitation token is required'
      });
    }

    // Find valid invitation
    const invitation = await Invitation.findValidInvitation(token);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation token'
      });
    }

    // Check if invitation is already accepted
    if (invitation.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Invitation has already been accepted'
      });
    }

    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Create audit log
    await createAuditLog({
      userId: invitation.invitedBy?._id || 'system',
      action: 'INVITATION_ACCEPTED',
      resourceType: 'INVITATION',
      resourceId: invitation._id,
      details: {
        invitationId: invitation._id,
        recipientEmail: invitation.email,
        organizationId: invitation.organization?._id,
        role: invitation.role,
        groupId: invitation.group
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        invitationId: invitation._id,
        organizationId: invitation.organization?._id,
        role: invitation.role,
        groupId: invitation.group
      }
    });

  } catch (error) {
    console.error('Failed to accept invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept invitation',
      error: error.message
    });
  }
};

// Update invitation
exports.updateInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { status, role, department, message, expiresAt } = req.body;
    const userId = req.user._id;

    // Validate invitation ID
    if (!invitationId) {
      return res.status(400).json({ 
        success: false, 
        message: "Invitation ID is required" 
      });
    }

    // Find the invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ 
        success: false, 
        message: "Invitation not found" 
      });
    }

    // Check if user is authorized to update this invitation
    if (invitation.invitedBy.toString() !== userId.toString() && 
        req.user.role !== 'admin' && 
        req.user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: "You are not authorized to update this invitation" 
      });
    }

    // Update fields
    const updateData = {};
    if (status) updateData.status = status;
    if (role) updateData.role = role;
    if (department) updateData.department = department;
    if (message) updateData.message = message;
    if (expiresAt) updateData.expiresAt = new Date(expiresAt);

    // Update the invitation
    const updatedInvitation = await Invitation.findByIdAndUpdate(
      invitationId, 
      updateData, 
      { new: true, runValidators: true }
    );

    // Log the update
    await logEvent({
      action: 'update_invitation',
      user: userId,
      resource: 'Invitation',
      resourceId: invitationId,
      details: {
        email: updatedInvitation.email,
        status: updatedInvitation.status,
        role: updatedInvitation.role,
        department: updatedInvitation.department
      },
      organization: req.user.organization
    });

    res.json({
      success: true,
      message: 'Invitation updated successfully',
      data: updatedInvitation
    });

  } catch (error) {
    console.error('Failed to update invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invitation',
      error: error.message
    });
  }
};

// Test email configuration
exports.testEmailConfig = async (req, res) => {
  try {
    const { validateEmailConfig } = require('../services/emailService');
    
    const isValid = validateEmailConfig();
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Email configuration is incomplete',
        details: {
          SMTP_HOST: process.env.SMTP_HOST || 'Missing',
          SMTP_PORT: process.env.SMTP_PORT || 'Missing',
          SMTP_USER: process.env.SMTP_USER ? 'Set' : 'Missing',
          SMTP_PASS: process.env.SMTP_PASS ? 'Set' : 'Missing',
          SMTP_SECURE: process.env.SMTP_SECURE || 'Missing'
        }
      });
    }

    // Test SMTP connection
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.verify();
    
    res.json({
      success: true,
      message: 'Email configuration is valid and SMTP connection successful',
      details: {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_SECURE: process.env.SMTP_SECURE,
        SMTP_USER: 'Configured',
        SMTP_PASS: 'Configured'
      }
    });

  } catch (error) {
    console.error('Email configuration test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Email configuration test failed',
      error: error.message,
      details: {
        SMTP_HOST: process.env.SMTP_HOST || 'Missing',
        SMTP_PORT: process.env.SMTP_PORT || 'Missing',
        SMTP_SECURE: process.env.SMTP_SECURE || 'Missing',
        SMTP_USER: process.env.SMTP_USER ? 'Set' : 'Missing',
        SMTP_PASS: process.env.SMTP_PASS ? 'Set' : 'Missing'
      }
    });
  }
};

// All functions are exported using exports.functionName pattern above 