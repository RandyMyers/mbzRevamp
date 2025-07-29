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
      groups, 
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

    // ✅ VALIDATION 7: Validate groups if provided
    if (groups && groups.length > 0) {
      const groupDocs = await Group.find({ _id: { $in: groups } });
      if (groupDocs.length !== groups.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'One or more specified groups are invalid' 
        });
      }
    }

    // ✅ VALIDATION 8: Validate baseUrl
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
      groups: groups || [],
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
      const emailResult = await sendInvitationEmail(invitation, baseUrl);
      if (!emailResult.success) {
        console.error('Failed to send invitation email:', emailResult.error);
        // Don't fail the request, but log the error
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue with the invitation creation even if email fails
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
        groups: groups,
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
        groups: invitation.groups,
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
      const emailResult = await sendInvitationEmail(invitation, baseUrl);
      if (!emailResult.success) {
        console.error('Failed to send resend invitation email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Email sending error on resend:', emailError);
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
    }).populate(['organization', 'role', 'groups']);

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
      groups: invitation.groups || [],
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