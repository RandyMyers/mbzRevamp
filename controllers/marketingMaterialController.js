const MarketingMaterial = require('../models/MarketingMaterial');
const Affiliate = require('../models/Affiliate');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * @swagger
 * /api/marketing-materials:
 *   get:
 *     summary: Get all marketing materials with pagination and filters
 *     tags: [Marketing Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [banner, video, document, link]
 *         description: Filter by material type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by material status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [social, email, website, print, other]
 *         description: Filter by material category
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags to filter by
 *     responses:
 *       200:
 *         description: Marketing materials retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 materials:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MarketingMaterial'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 totalMaterials:
 *                   type: integer
 *                   example: 50
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error message"
 */
// Get all marketing materials with pagination and filters
exports.getMarketingMaterials = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;
    const status = req.query.status;
    const category = req.query.category;
    const tags = req.query.tags ? req.query.tags.split(',') : [];

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;
    if (tags.length > 0) query.tags = { $in: tags };

    const materials = await MarketingMaterial.find(query)
      .populate('createdBy', 'fullName email')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await MarketingMaterial.countDocuments(query);

    res.json({
      materials,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalMaterials: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/marketing-materials/{id}:
 *   get:
 *     summary: Get single marketing material by ID
 *     tags: [Marketing Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Marketing material ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Marketing material retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MarketingMaterial'
 *       404:
 *         description: Marketing material not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Marketing material not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error message"
 */
// Get single marketing material by ID
exports.getMarketingMaterial = async (req, res) => {
  try {
    const material = await MarketingMaterial.findById(req.params.id)
      .populate('createdBy', 'fullName email');

    if (!material) {
      return res.status(404).json({ message: 'Marketing material not found' });
    }

    res.json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/marketing-materials/create:
 *   post:
 *     summary: Create new marketing material
 *     tags: [Marketing Materials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - url
 *             properties:
 *               title:
 *                 type: string
 *                 description: Marketing material title
 *                 example: "Summer Sale Banner"
 *               type:
 *                 type: string
 *                 enum: [banner, video, document, link]
 *                 description: Type of marketing material
 *               url:
 *                 type: string
 *                 description: URL or file path to the material
 *                 example: "https://example.com/banner.jpg"
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the material
 *                 properties:
 *                   size:
 *                     type: string
 *                     example: "2.5 MB"
 *                   format:
 *                     type: string
 *                     example: "JPEG"
 *                   dimensions:
 *                     type: string
 *                     example: "1920x1080"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tags for categorization
 *                 example: ["summer", "sale", "banner"]
 *               category:
 *                 type: string
 *                 enum: [social, email, website, print, other]
 *                 default: "other"
 *                 description: Material category
 *               affiliateId:
 *                 type: string
 *                 format: ObjectId
 *                 description: Optional affiliate ID to associate with
 *     responses:
 *       201:
 *         description: Marketing material created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MarketingMaterial'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error message"
 */
// Create new marketing material
exports.createMarketingMaterial = async (req, res) => {
  try {
    const { title, type, url, metadata, tags, category } = req.body;

    const material = new MarketingMaterial({
      title,
      type,
      url,
      metadata,
      tags,
      category,
      createdBy: req.user._id,
      status: 'active'
    });

    await material.save();

    // If affiliateId is provided, add material to affiliate's materials
    if (req.body.affiliateId) {
      const affiliate = await Affiliate.findById(req.body.affiliateId);
      if (affiliate) {
        affiliate.marketingMaterials.push(material._id);
        await affiliate.save();
      }
    }

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/marketing-materials/update/{id}:
 *   patch:
 *     summary: Update marketing material
 *     tags: [Marketing Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Marketing material ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Marketing material title
 *                 example: "Updated Summer Sale Banner"
 *               type:
 *                 type: string
 *                 enum: [banner, video, document, link]
 *                 description: Type of marketing material
 *               url:
 *                 type: string
 *                 description: URL or file path to the material
 *                 example: "https://example.com/updated-banner.jpg"
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the material
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tags for categorization
 *               category:
 *                 type: string
 *                 enum: [social, email, website, print, other]
 *                 description: Material category
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Material status
 *     responses:
 *       200:
 *         description: Marketing material updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MarketingMaterial'
 *       404:
 *         description: Marketing material not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Marketing material not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error message"
 */
// Update marketing material
exports.updateMarketingMaterial = async (req, res) => {
  try {
    const { title, type, url, metadata, tags, category, status } = req.body;

    const material = await MarketingMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Marketing material not found' });
    }

    if (title) material.title = title;
    if (type) material.type = type;
    if (url) material.url = url;
    if (metadata) material.metadata = metadata;
    if (tags) material.tags = tags;
    if (category) material.category = category;
    if (status) material.status = status;

    await material.save();
    res.json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/marketing-materials/delete/{id}:
 *   delete:
 *     summary: Delete marketing material
 *     tags: [Marketing Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Marketing material ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Marketing material deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Marketing material deleted successfully"
 *       404:
 *         description: Marketing material not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Marketing material not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error message"
 */
// Delete marketing material
exports.deleteMarketingMaterial = async (req, res) => {
  try {
    const material = await MarketingMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Marketing material not found' });
    }

    // Remove material from all affiliates' materials
    await Affiliate.updateMany(
      { marketingMaterials: material._id },
      { $pull: { marketingMaterials: material._id } }
    );

    await material.remove();
    res.json({ message: 'Marketing material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/marketing-materials/{id}/track-view:
 *   post:
 *     summary: Track material view
 *     tags: [Marketing Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Marketing material ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: View tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "View tracked successfully"
 *       404:
 *         description: Marketing material not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Marketing material not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error message"
 */
// Track material view
exports.trackView = async (req, res) => {
  try {
    const material = await MarketingMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Marketing material not found' });
    }

    await material.trackView();
    res.json({ message: 'View tracked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/marketing-materials/{id}/track-click:
 *   post:
 *     summary: Track material click
 *     tags: [Marketing Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Marketing material ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Click tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Click tracked successfully"
 *       404:
 *         description: Marketing material not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Marketing material not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error message"
 */

/**
 * @swagger
 * /api/marketing-materials/{id}/track-click:
 *   post:
 *     summary: Track material click
 *     tags: [Marketing Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Marketing material ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Click tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Click tracked successfully"
 *       404:
 *         description: Marketing material not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Marketing material not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error message"
 */
// Track material click
exports.trackClick = async (req, res) => {
  try {
    const material = await MarketingMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Marketing material not found' });
    }

    await material.trackClick();
    res.json({ message: 'Click tracked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/marketing-materials/{id}/track-conversion:
 *   post:
 *     summary: Track material conversion
 *     tags: [Marketing Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Marketing material ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Conversion tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Conversion tracked successfully"
 *       404:
 *         description: Marketing material not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Marketing material not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error message"
 */
// Track material conversion
exports.trackConversion = async (req, res) => {
  try {
    const material = await MarketingMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Marketing material not found' });
    }

    await material.trackConversion();
    res.json({ message: 'Conversion tracked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get material statistics
exports.getMaterialStats = async (req, res) => {
  try {
    const material = await MarketingMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Marketing material not found' });
    }

    const stats = {
      views: material.usage.views,
      clicks: material.usage.clicks,
      conversions: material.usage.conversions,
      clickThroughRate: material.usage.views > 0 ? (material.usage.clicks / material.usage.views) * 100 : 0,
      conversionRate: material.usage.clicks > 0 ? (material.usage.conversions / material.usage.clicks) * 100 : 0
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get materials by category
exports.getMaterialsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const materials = await MarketingMaterial.find({
      category,
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get materials by tags
exports.getMaterialsByTags = async (req, res) => {
  try {
    const tags = req.query.tags.split(',');
    const materials = await MarketingMaterial.find({
      tags: { $in: tags },
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get affiliate materials
exports.getAffiliateMaterials = async (req, res, next) => {
  try {
    const materials = await MarketingMaterial.find({ affiliateId: req.params.affiliateId });
    
    res.status(200).json({
      status: 'success',
      results: materials.length,
      data: {
        materials
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single material
exports.getMaterial = async (req, res, next) => {
  try {
    const material = await MarketingMaterial.findById(req.params.id);
    
    if (!material) {
      return next(new NotFoundError('No marketing material found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        material
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new material
exports.createMaterial = async (req, res, next) => {
  try {
    const material = await MarketingMaterial.create({
      ...req.body,
      affiliateId: req.params.affiliateId
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        material
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update material
exports.updateMaterial = async (req, res, next) => {
  try {
    const material = await MarketingMaterial.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!material) {
      return next(new NotFoundError('No marketing material found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        material
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete material
exports.deleteMaterial = async (req, res, next) => {
  try {
    const material = await MarketingMaterial.findByIdAndDelete(req.params.id);

    if (!material) {
      return next(new NotFoundError('No marketing material found with that ID'));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Get my materials (for affiliate)
exports.getMyMaterials = async (req, res, next) => {
  try {
    const materials = await MarketingMaterial.find({ affiliateId: req.user.affiliateId });
    
    res.status(200).json({
      status: 'success',
      results: materials.length,
      data: {
        materials
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create my material (for affiliate)
exports.createMyMaterial = async (req, res, next) => {
  try {
    const material = await MarketingMaterial.create({
      ...req.body,
      affiliateId: req.user.affiliateId
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        material
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update my material (for affiliate)
exports.updateMyMaterial = async (req, res, next) => {
  try {
    const material = await MarketingMaterial.findOneAndUpdate(
      { _id: req.params.id, affiliateId: req.user.affiliateId },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!material) {
      return next(new NotFoundError('No marketing material found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        material
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete my material (for affiliate)
exports.deleteMyMaterial = async (req, res, next) => {
  try {
    const material = await MarketingMaterial.findOneAndDelete({
      _id: req.params.id,
      affiliateId: req.user.affiliateId
    });

    if (!material) {
      return next(new NotFoundError('No marketing material found with that ID'));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
}; 