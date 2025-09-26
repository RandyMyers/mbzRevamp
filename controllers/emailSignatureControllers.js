const EmailSignature = require('../models/EmailSignature');
const User = require('../models/users');
const Organization = require('../models/organization');

/**
 * @swagger
 * components:
 *   schemas:
 *     EmailSignature:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         organizationId:
 *           type: string
 *         userId:
 *           type: string
 *         name:
 *           type: string
 *         content:
 *           type: string
 *         isDefault:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         signatureType:
 *           type: string
 *           enum: [personal, department, company, role_based]
 *         department:
 *           type: string
 *         role:
 *           type: string
 *         variables:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               value:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, image, link, social]
 *         htmlContent:
 *           type: string
 *         plainTextContent:
 *           type: string
 *         createdBy:
 *           type: string
 *         lastUsed:
 *           type: string
 *           format: date-time
 *         usageCount:
 *           type: number
 */

/**
 * @swagger
 * /api/email-signatures:
 *   post:
 *     summary: Create email signature
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
 *               content:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               signatureType:
 *                 type: string
 *                 enum: [personal, department, company, role_based]
 *                 default: personal
 *               department:
 *                 type: string
 *               role:
 *                 type: string
 *               variables:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     value:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [text, image, link, social]
 *               htmlContent:
 *                 type: string
 *               plainTextContent:
 *                 type: string
 *     responses:
 *       201:
 *         description: Email signature created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/EmailSignature'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
const createEmailSignature = async (req, res) => {
  try {
    const {
      name,
      content,
      isDefault = false,
      isActive = true,
      signatureType = 'personal',
      department,
      role,
      variables = [],
      htmlContent,
      plainTextContent
    } = req.body;

    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    // If setting as default, unset other defaults for this user
    if (isDefault) {
      await EmailSignature.updateMany(
        { userId, organizationId, isDefault: true },
        { isDefault: false }
      );
    }

    const emailSignature = new EmailSignature({
      organizationId,
      userId,
      name,
      content,
      isDefault,
      isActive,
      signatureType,
      department,
      role,
      variables,
      htmlContent,
      plainTextContent,
      createdBy: userId
    });

    await emailSignature.save();
    await emailSignature.populate('userId', 'firstName lastName email');
    await emailSignature.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: emailSignature
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/email-signatures:
 *   get:
 *     summary: Get email signatures
 *     tags: [Email Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: signatureType
 *         schema:
 *           type: string
 *           enum: [personal, department, company, role_based]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Email signatures retrieved successfully
 */
const getEmailSignatures = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      signatureType,
      isActive,
      department,
      role,
      page = 1,
      limit = 10
    } = req.query;

    const query = { organizationId };

    if (signatureType) query.signatureType = signatureType;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (department) query.department = department;
    if (role) query.role = role;

    const emailSignatures = await EmailSignature.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await EmailSignature.countDocuments(query);

    res.json({
      success: true,
      data: emailSignatures,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/email-signatures/{id}:
 *   get:
 *     summary: Get email signature by ID
 *     tags: [Email Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email signature retrieved successfully
 *       404:
 *         description: Email signature not found
 *       403:
 *         description: Access denied
 */
const getEmailSignatureById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const emailSignature = await EmailSignature.findOne({
      _id: id,
      organizationId
    })
      .populate('userId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!emailSignature) {
      return res.status(404).json({
        success: false,
        message: 'Email signature not found'
      });
    }

    res.json({
      success: true,
      data: emailSignature
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/email-signatures/{id}:
 *   put:
 *     summary: Update email signature
 *     tags: [Email Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               content:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *               signatureType:
 *                 type: string
 *               department:
 *                 type: string
 *               role:
 *                 type: string
 *               variables:
 *                 type: array
 *               htmlContent:
 *                 type: string
 *               plainTextContent:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email signature updated successfully
 *       404:
 *         description: Email signature not found
 *       403:
 *         description: Access denied
 */
const updateEmailSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const updateData = req.body;

    const emailSignature = await EmailSignature.findOne({
      _id: id,
      organizationId
    });

    if (!emailSignature) {
      return res.status(404).json({
        success: false,
        message: 'Email signature not found'
      });
    }

    // If setting as default, unset other defaults for this user
    if (updateData.isDefault) {
      await EmailSignature.updateMany(
        { userId: emailSignature.userId, organizationId, isDefault: true },
        { isDefault: false }
      );
    }

    Object.assign(emailSignature, updateData);
    await emailSignature.save();
    await emailSignature.populate('userId', 'firstName lastName email');
    await emailSignature.populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      data: emailSignature
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/email-signatures/{id}:
 *   delete:
 *     summary: Delete email signature
 *     tags: [Email Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email signature deleted successfully
 *       404:
 *         description: Email signature not found
 *       403:
 *         description: Access denied
 */
const deleteEmailSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const emailSignature = await EmailSignature.findOneAndDelete({
      _id: id,
      organizationId
    });

    if (!emailSignature) {
      return res.status(404).json({
        success: false,
        message: 'Email signature not found'
      });
    }

    res.json({
      success: true,
      message: 'Email signature deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/email-signatures/{id}/set-default:
 *   post:
 *     summary: Set email signature as default
 *     tags: [Email Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email signature set as default successfully
 *       404:
 *         description: Email signature not found
 *       403:
 *         description: Access denied
 */
const setDefaultEmailSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    const emailSignature = await EmailSignature.findOne({
      _id: id,
      organizationId,
      userId
    });

    if (!emailSignature) {
      return res.status(404).json({
        success: false,
        message: 'Email signature not found'
      });
    }

    // Unset other defaults for this user
    await EmailSignature.updateMany(
      { userId, organizationId, isDefault: true },
      { isDefault: false }
    );

    // Set this one as default
    emailSignature.isDefault = true;
    await emailSignature.save();

    res.json({
      success: true,
      data: emailSignature
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/email-signatures/{id}/use:
 *   post:
 *     summary: Record email signature usage
 *     tags: [Email Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usage recorded successfully
 *       404:
 *         description: Email signature not found
 */
const recordUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const emailSignature = await EmailSignature.findOne({
      _id: id,
      organizationId
    });

    if (!emailSignature) {
      return res.status(404).json({
        success: false,
        message: 'Email signature not found'
      });
    }

    emailSignature.usageCount += 1;
    emailSignature.lastUsed = new Date();
    await emailSignature.save();

    res.json({
      success: true,
      data: {
        usageCount: emailSignature.usageCount,
        lastUsed: emailSignature.lastUsed
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/email-signatures/user/{userId}:
 *   get:
 *     summary: Get user's email signatures
 *     tags: [Email Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: User's email signatures retrieved successfully
 */
const getUserEmailSignatures = async (req, res) => {
  try {
    const { userId } = req.params;
    const organizationId = req.user.organizationId;
    const { isActive } = req.query;

    const query = { userId, organizationId };
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const emailSignatures = await EmailSignature.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      data: emailSignatures
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createEmailSignature,
  getEmailSignatures,
  getEmailSignatureById,
  updateEmailSignature,
  deleteEmailSignature,
  setDefaultEmailSignature,
  recordUsage,
  getUserEmailSignatures
};



