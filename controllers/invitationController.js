const dotenv = require('dotenv');
dotenv.config();

const Invitation = require('../models/invitation');
const User = require('../models/users');
const Organization = require('../models/organization');
const Role = require('../models/role');
const Group = require('../models/group');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createAuditLog } = require('../helpers/auditLogHelper');
// Using SendGrid instead of SMTP (most hosting providers block SMTP ports)
const SendGridService = require('../services/sendGridService');
// const { sendInvitationEmail } = require('../services/emailService');

/**
 * @swagger
 * components:
 *   schemas:
 *     Invitation:
 *       type: object
 *       required:
 *         - email
 *         - invitedBy
 *         - organization
 *         - token
 *         - expiresAt
 *         - status
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique invitation ID
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the invited user
 *         invitedBy:
 *           type: string
 *           format: ObjectId
 *           description: ID of the user who sent the invitation
 *         organization:
 *           type: string
 *           format: ObjectId
 *           description: ID of the organization the user is invited to
 *         role:
 *           type: string
 *           format: ObjectId
 *           description: Role assigned to the invited user
 *         department:
 *           type: string
 *           description: Department assigned to the invited user
 *         groups:
 *           type: array
 *           items:
 *             type: string
 *             format: ObjectId
 *           description: Groups the user will be added to
 *         message:
 *           type: string
 *           description: Custom message for the invitation
 *         token:
 *           type: string
 *           description: Secure token for invitation acceptance
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Expiration date of the invitation
 *         status:
 *           type: string
 *           enum: [pending, accepted, cancelled, expired]
 *           default: pending
 *           description: Current status of the invitation
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the invitation was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the invitation was last updated
 *         acceptedAt:
 *           type: string
 *           format: date-time
 *           description: When the invitation was accepted
 */

/**
 * @swagger
 * /api/invitations:
 *   post:
 *     summary: Create a new invitation
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the person to invite
 *                 example: "user@example.com"
 *               role:
 *                 type: string
 *                 format: ObjectId
 *                 description: Role ID to assign to the invited user
 *                 example: "507f1f77bcf86cd799439011"
 *               department:
 *                 type: string
 *                 enum: [Customer Support, IT, HR, Sales, Marketing, Finance, Billing, Shipping]
 *                 description: Department to assign to the invited user
 *                 example: "IT"
 *               message:
 *                 type: string
 *                 description: Custom message to include in the invitation
 *                 example: "Welcome to our team!"
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Custom expiration date (defaults to 7 days)
 *                 example: "2024-12-31T23:59:59.000Z"
 *               organization:
 *                 type: string
 *                 format: ObjectId
 *                 description: Organization ID (defaults to authenticated user's organization)
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Invitation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Invitation sent successfully"
 *                 invitation:
 *                   $ref: '#/components/schemas/Invitation'
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You are not authorized to resend invitations"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User not authorized to send invitations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You are not authorized to send invitations"
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Organization not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to create invitation"
 */

/**
 * @swagger
 * /api/invitations:
 *   get:
 *     summary: Get all invitations (optionally by organization)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Filter invitations by organization ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Invitations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 invitations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invitation'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch invitations"
 */

/**
 * @swagger
 * /api/invitations/{invitationId}:
 *   get:
 *     summary: Get an invitation by ID
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Invitation ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Invitation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 invitation:
 *                   $ref: '#/components/schemas/Invitation'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Invitation not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invitation not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch invitation"
 */

/**
 * @swagger
 * /api/invitations/{invitationId}/resend:
 *   post:
 *     summary: Resend invitation (reset token and expiresAt)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Invitation ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: {}
 *     responses:
 *       200:
 *         description: Invitation resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Invitation resent successfully"
 *                 invitation:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       format: ObjectId
 *                     email:
 *                       type: string
 *                     status:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You are not authorized to resend invitations"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User not authorized to resend invitations
 *       404:
 *         description: Invitation not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to resend invitation"
 */


/**
 * @swagger
 * /api/invitations/accept:
 *   post:
 *     summary: Accept invitation (create user, mark invitation as accepted)
 *     tags: [Invitations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - fullName
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Invitation token
 *                 example: "abc123def456..."
 *               fullName:
 *                 type: string
 *                 description: User's full name
 *                 example: "John Doe"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password (minimum 6 characters)
 *                 example: "password123"
 *               username:
 *                 type: string
 *                 description: Optional username (must be unique)
 *                 example: "johndoe"
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Invitation accepted successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       format: ObjectId
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                       format: ObjectId
 *                     department:
 *                       type: string
 *                     organization:
 *                       type: string
 *                       format: ObjectId
 *                     status:
 *                       type: string
 *                 token:
 *                   type: string
 *                   description: JWT token for the new user
 *                 invitation:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       format: ObjectId
 *                     status:
 *                       type: string
 *                     organization:
 *                       type: string
 *                       format: ObjectId
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token, full name, and password are required"
 *       404:
 *         description: Invitation not found, expired, or already used
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invitation not found, expired, or already used"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to accept invitation"
 */

/**
 * @swagger
 * /api/invitations/{invitationId}:
 *   delete:
 *     summary: Delete invitation
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Invitation ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Invitation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Invitation deleted"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Invitation not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invitation not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to delete invitation"
 */

/**
 * @swagger
 * /api/invitations/{invitationId}:
 *   put:
 *     summary: Update invitation details
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Invitation ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, cancelled, expired]
 *                 description: New status for the invitation
 *                 example: "cancelled"
 *               role:
 *                 type: string
 *                 format: ObjectId
 *                 description: New role ID
 *                 example: "507f1f77bcf86cd799439011"
 *               department:
 *                 type: string
 *                 enum: [Customer Support, IT, HR, Sales, Marketing, Finance, Billing, Shipping]
 *                 description: New department
 *                 example: "Sales"
 *               message:
 *                 type: string
 *                 description: New message
 *                 example: "Updated invitation message"
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: New expiration date
 *                 example: "2024-12-31T23:59:59.000Z"
 *     responses:
 *       200:
 *         description: Invitation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Invitation updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Invitation'
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invitation ID is required"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User not authorized to update this invitation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You are not authorized to update this invitation"
 *       404:
 *         description: Invitation not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invitation not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to update invitation"
 */

/**
 * @swagger
 * /api/invitations/test-email-config:
 *   post:
 *     summary: Test email configuration
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email configuration test successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Email configuration is valid and SMTP connection successful"
 *                 details:
 *                   type: object
 *                   properties:
 *                     SMTP_HOST:
 *                       type: string
 *                       example: "smtp.gmail.com"
 *                     SMTP_PORT:
 *                       type: string
 *                       example: "587"
 *                     SMTP_SECURE:
 *                       type: string
 *                       example: "false"
 *                     SMTP_USER:
 *                       type: string
 *                       example: "Configured"
 *                     SMTP_PASS:
 *                       type: string
 *                       example: "Configured"
 *       400:
 *         description: Email configuration incomplete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Email configuration is incomplete"
 *                 details:
 *                   type: object
 *                   properties:
 *                     SMTP_HOST:
 *                       type: string
 *                       example: "Missing"
 *                     SMTP_PORT:
 *                       type: string
 *                       example: "Missing"
 *                     SMTP_USER:
 *                       type: string
 *                       example: "Missing"
 *                     SMTP_PASS:
 *                       type: string
 *                       example: "Missing"
 *                     SMTP_SECURE:
 *                       type: string
 *                       example: "Missing"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       500:
 *         description: Email configuration test failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Email configuration test failed"
 *                 error:
 *                   type: string
 *                   example: "SMTP connection failed"
 *                 details:
 *                   type: object
 *                   properties:
 *                     SMTP_HOST:
 *                       type: string
 *                       example: "smtp.gmail.com"
 *                     SMTP_PORT:
 *                       type: string
 *                       example: "587"
 *                     SMTP_SECURE:
 *                       type: string
 *                       example: "false"
 *                     SMTP_USER:
 *                       type: string
 *                       example: "Missing"
 *                     SMTP_PASS:
 *                       type: string
 *                       example: "Missing"
 */

// Create a new invitation
exports.createInvitation = async (req, res) => {
  try {
    const { 
      email, 
      role, 
      department, 
      message, 
      expiresAt,
      organization
    } = req.body;
    
    // ✅ Hardcoded baseUrl for invitation links
    const baseUrl = 'https://crm.mbztechnology.com';
    
    const invitedBy = req.user._id; // From authenticated user

    // ✅ VALIDATION 1: Check if user is authorized to invite
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // ✅ FLEXIBLE AUTHORIZATION: Check if user can send invitations
    let canSendInvitations = false;
    
    // ✅ FALLBACK 1: Check for super-admin (always allowed)
    if (req.user.role === 'super-admin') {
      canSendInvitations = true;
    }
    
    // ✅ FALLBACK 2: Check for admin role (legacy support)
    else if (req.user.role === 'admin') {
      canSendInvitations = true;
    }
    
    // ✅ FALLBACK 3: Check role permissions if user has roleId
    else if (req.user.roleId) {
      try {
        const Role = require('../models/role');
        const userRole = await Role.findById(req.user.roleId).select('permissions name');
        
        if (userRole && userRole.permissions) {
          // Check if role has invitation permissions
          canSendInvitations = userRole.permissions.invite_users === true || 
                              userRole.permissions.user_management === true ||
                              userRole.permissions.admin_access === true;
        }
      } catch (roleError) {
        console.error('❌ Error checking role permissions:', roleError.message);
      }
    }
    
    // ✅ FALLBACK 4: Check if user is in the same organization (basic authorization)
    else if (req.user.organization) {
      // Allow any user in an organization to send invitations (can be restricted later)
      canSendInvitations = true;
    }
    
    if (!canSendInvitations) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to send invitations. Please contact your administrator to update your permissions.' 
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

    // ✅ baseUrl is now hardcoded, no validation needed

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

      const emailResult = await SendGridService.sendInvitationEmail(invitation);
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
    // ✅ Hardcoded baseUrl for invitation links
    const baseUrl = 'https://crm.mbztechnology.com';
    const invitedBy = req.user._id;

    // ✅ VALIDATION 1: Check if user is authorized
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to resend invitations' 
      });
    }

    // ✅ baseUrl is now hardcoded, no validation needed

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

      const emailResult = await sendInvitationEmail(invitation);
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

    // ✅ FLEXIBLE AUTHORIZATION: Check if user can update this invitation
    let canUpdateInvitation = false;
    
    // ✅ FALLBACK 1: User is the one who sent the invitation
    if (invitation.invitedBy.toString() === userId.toString()) {
      canUpdateInvitation = true;
    }
    
    // ✅ FALLBACK 2: Check for super-admin (always allowed)
    else if (req.user.role === 'super-admin') {
      canUpdateInvitation = true;
    }
    
    // ✅ FALLBACK 3: Check for admin role (legacy support)
    else if (req.user.role === 'admin') {
      canUpdateInvitation = true;
    }
    
    // ✅ FALLBACK 4: Check role permissions if user has roleId
    else if (req.user.roleId) {
      try {
        const Role = require('../models/role');
        const userRole = await Role.findById(req.user.roleId).select('permissions name');
        
        if (userRole && userRole.permissions) {
          // Check if role has invitation management permissions
          canUpdateInvitation = userRole.permissions.invite_users === true || 
                               userRole.permissions.user_management === true ||
                               userRole.permissions.admin_access === true;
        }
      } catch (roleError) {
        console.error('❌ Error checking role permissions for invitation update:', roleError.message);
      }
    }
    
    if (!canUpdateInvitation) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not authorized to update this invitation. Please contact your administrator to update your permissions." 
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
    await createAuditLog({
      userId: userId,
      action: 'INVITATION_UPDATED',
      resourceType: 'INVITATION',
      resourceId: invitationId,
      details: {
        email: updatedInvitation.email,
        status: updatedInvitation.status,
        role: updatedInvitation.role,
        department: updatedInvitation.department
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
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

// Test email configuration (using SendGrid instead of SMTP)
exports.testEmailConfig = async (req, res) => {
  try {
    // Test SendGrid connection instead of SMTP
    const connectionTest = await SendGridService.testConnection();
    
    if (!connectionTest.success) {
      return res.status(500).json({
        success: false,
        message: 'SendGrid API connection failed',
        error: connectionTest.error,
        details: {
          SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'Set' : 'Missing',
          SMTP_USER: process.env.SMTP_USER ? 'Set' : 'Missing (used as "from" email)'
        }
      });
    }

    res.json({
      success: true,
      message: 'SendGrid API connection successful',
      details: {
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'Set' : 'Missing',
        SMTP_USER: process.env.SMTP_USER ? process.env.SMTP_USER : 'noreply@mbztechnology.com (default)',
        connectionTest: connectionTest.message
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

