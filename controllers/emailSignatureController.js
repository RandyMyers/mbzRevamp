const EmailSignature = require('../models/emailSignature');
const { createAuditLog } = require('../helpers/auditLogHelper');
const logEvent = require('../helper/logEvent');

/**
 * @swagger
 * components:
 *   schemas:
 *     EmailSignature:
 *       type: object
 *       required:
 *         - name
 *         - content
 *         - user
 *         - organization
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: Unique signature ID
 *         name:
 *           type: string
 *           description: Signature name
 *           example: "Professional"
 *         content:
 *           type: string
 *           description: HTML content of the signature
 *           example: "<p><strong>John Doe</strong><br>Marketing Director</p>"
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default signature
 *           default: false
 *         user:
 *           type: string
 *           format: ObjectId
 *           description: User ID who owns this signature
 *         organization:
 *           type: string
 *           format: ObjectId
 *           description: Organization ID
 *         isActive:
 *           type: boolean
 *           description: Whether the signature is active
 *           default: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/email-signatures:
 *   get:
 *     summary: Get all email signatures for the authenticated user
 *     tags: [Email Signatures]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Signatures retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 signatures:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmailSignature'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// GET all signatures for a user
exports.getUserSignatures = async (req, res) => {
  try {
    const signatures = await EmailSignature.find({
      user: req.user._id,
      organization: req.user.organization,
      isActive: true
    }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      signatures
    });
  } catch (error) {
    console.error('Error fetching user signatures:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch signatures'
    });
  }
};

/**
 * @swagger
 * /api/email-signatures/default:
 *   get:
 *     summary: Get the default email signature for the authenticated user
 *     tags: [Email Signatures]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default signature retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 signature:
 *                   $ref: '#/components/schemas/EmailSignature'
 *       404:
 *         description: No default signature found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// GET default signature for a user
exports.getDefaultSignature = async (req, res) => {
  try {
    const defaultSignature = await EmailSignature.findOne({
      user: req.user._id,
      organization: req.user.organization,
      isDefault: true,
      isActive: true
    });

    if (!defaultSignature) {
      return res.status(404).json({
        success: false,
        message: 'No default signature found'
      });
    }

    res.status(200).json({
      success: true,
      signature: defaultSignature
    });
  } catch (error) {
    console.error('Error fetching default signature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch default signature'
    });
  }
};

/**
 * @swagger
 * /api/email-signatures:
 *   post:
 *     summary: Create a new email signature
 *     tags: [Email Signatures]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *                 description: Signature name
 *                 example: "Professional"
 *               content:
 *                 type: string
 *                 description: HTML content of the signature
 *                 example: "<p><strong>John Doe</strong><br>Marketing Director</p>"
 *               isDefault:
 *                 type: boolean
 *                 description: Whether to set this as default signature
 *                 default: false
 *     responses:
 *       201:
 *         description: Signature created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 signature:
 *                   $ref: '#/components/schemas/EmailSignature'
 *       400:
 *         description: Bad request - Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// CREATE new signature
exports.createSignature = async (req, res) => {
  try {
    const { name, content, isDefault } = req.body;

    // Validate required fields
    if (!name || !content) {
      return res.status(400).json({
        success: false,
        message: 'Name and content are required'
      });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await EmailSignature.updateMany(
        { user: req.user._id, organization: req.user.organization },
        { isDefault: false }
      );
    }

    const signature = new EmailSignature({
      name,
      content,
      isDefault: isDefault || false,
      user: req.user._id,
      organization: req.user.organization
    });

    await signature.save();

    // Audit log
    await createAuditLog({
      action: 'Email Signature Created',
      user: req.user._id,
      resource: 'emailSignature',
      resourceId: signature._id,
      details: { name, isDefault: signature.isDefault },
      organization: req.user.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Event log
    await logEvent({
      action: 'create_email_signature',
      user: req.user._id,
      resource: 'EmailSignature',
      resourceId: signature._id,
      details: { name, isDefault: signature.isDefault },
      organization: req.user.organization
    });

    res.status(201).json({
      success: true,
      signature
    });
  } catch (error) {
    console.error('Error creating signature:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create signature'
    });
  }
};

/**
 * @swagger
 * /api/email-signatures/{signatureId}:
 *   put:
 *     summary: Update an existing email signature
 *     tags: [Email Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: signatureId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Signature ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Signature name
 *               content:
 *                 type: string
 *                 description: HTML content of the signature
 *               isDefault:
 *                 type: boolean
 *                 description: Whether to set this as default signature
 *     responses:
 *       200:
 *         description: Signature updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 signature:
 *                   $ref: '#/components/schemas/EmailSignature'
 *       404:
 *         description: Signature not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// UPDATE signature
exports.updateSignature = async (req, res) => {
  try {
    const { signatureId } = req.params;
    const { name, content, isDefault } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await EmailSignature.updateMany(
        { user: req.user._id, organization: req.user.organization, _id: { $ne: signatureId } },
        { isDefault: false }
      );
    }

    const signature = await EmailSignature.findOneAndUpdate(
      { _id: signatureId, user: req.user._id, organization: req.user.organization },
      { 
        ...(name && { name }), 
        ...(content && { content }), 
        ...(isDefault !== undefined && { isDefault }),
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found'
      });
    }

    // Audit log
    await createAuditLog({
      action: 'Email Signature Updated',
      user: req.user._id,
      resource: 'emailSignature',
      resourceId: signature._id,
      details: { name, isDefault: signature.isDefault },
      organization: req.user.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      signature
    });
  } catch (error) {
    console.error('Error updating signature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update signature'
    });
  }
};

/**
 * @swagger
 * /api/email-signatures/{signatureId}:
 *   delete:
 *     summary: Delete an email signature (soft delete)
 *     tags: [Email Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: signatureId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Signature ID
 *     responses:
 *       200:
 *         description: Signature deleted successfully
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
 *                   example: "Signature deleted successfully"
 *       404:
 *         description: Signature not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// DELETE signature (soft delete)
exports.deleteSignature = async (req, res) => {
  try {
    const { signatureId } = req.params;

    const signature = await EmailSignature.findOneAndUpdate(
      { _id: signatureId, user: req.user._id, organization: req.user.organization },
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found'
      });
    }

    // Audit log
    await createAuditLog({
      action: 'Email Signature Deleted',
      user: req.user._id,
      resource: 'emailSignature',
      resourceId: signatureId,
      details: { name: signature.name },
      organization: req.user.organization,
      severity: 'warning',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Signature deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting signature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete signature'
    });
  }
};

/**
 * @swagger
 * /api/email-signatures/{signatureId}/default:
 *   patch:
 *     summary: Set a signature as the default signature
 *     tags: [Email Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: signatureId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Signature ID
 *     responses:
 *       200:
 *         description: Default signature set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 signature:
 *                   $ref: '#/components/schemas/EmailSignature'
 *       404:
 *         description: Signature not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// SET default signature
exports.setDefaultSignature = async (req, res) => {
  try {
    const { signatureId } = req.params;

    // Unset all other defaults
    await EmailSignature.updateMany(
      { user: req.user._id, organization: req.user.organization },
      { isDefault: false }
    );

    // Set new default
    const signature = await EmailSignature.findOneAndUpdate(
      { _id: signatureId, user: req.user._id, organization: req.user.organization },
      { isDefault: true, updatedAt: Date.now() },
      { new: true }
    );

    if (!signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found'
      });
    }

    // Audit log
    await createAuditLog({
      action: 'Email Signature Set as Default',
      user: req.user._id,
      resource: 'emailSignature',
      resourceId: signature._id,
      details: { name: signature.name },
      organization: req.user.organization,
      severity: 'info',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      signature
    });
  } catch (error) {
    console.error('Error setting default signature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default signature'
    });
  }
};
