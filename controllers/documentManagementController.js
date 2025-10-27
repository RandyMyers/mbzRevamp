const Employee = require('../models/Employee');
const HRFileUploadService = require('../services/hrFileUploadService');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * tags:
 *   - name: Document Management
 *     description: HR document management and storage
 */

// In-memory document storage (in production, this would be a database model)
let documents = [];

/**
 * @swagger
 * /api/admin/documents:
 *   get:
 *     summary: Get all documents
 *     tags: [Document Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by document category
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Filter by employee ID
 *       - in: query
 *         name: isConfidential
 *         schema:
 *           type: boolean
 *         description: Filter by confidentiality
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 */
exports.listDocuments = async (req, res, next) => {
  try {
    const { category, employeeId, isConfidential, search } = req.query;

    let filteredDocuments = documents;

    if (category) {
      filteredDocuments = filteredDocuments.filter(doc => doc.category === category);
    }

    if (employeeId) {
      filteredDocuments = filteredDocuments.filter(doc => doc.employeeId === employeeId);
    }

    if (isConfidential !== undefined) {
      const confidentialFilter = isConfidential === 'true';
      filteredDocuments = filteredDocuments.filter(doc => doc.isConfidential === confidentialFilter);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.title.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by upload date (newest first)
    filteredDocuments.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.status(200).json({
      success: true,
      data: filteredDocuments,
      message: 'Documents retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving documents:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve documents',
      message: `Failed to retrieve documents: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/documents/upload:
 *   post:
 *     summary: Upload new document
 *     tags: [Document Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - title
 *               - category
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file
 *               title:
 *                 type: string
 *                 description: Document title
 *               description:
 *                 type: string
 *                 description: Document description
 *               category:
 *                 type: string
 *                 enum: [policy, contract, certificate, id, training, performance, other]
 *                 description: Document category
 *               employeeId:
 *                 type: string
 *                 description: Associated employee ID (optional)
 *               isConfidential:
 *                 type: boolean
 *                 description: Whether document is confidential
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *               expiryDate:
 *                 type: string
 *                 format: date
 *                 description: Document expiry date (optional)
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    const { title, description, category, employeeId, isConfidential, tags, expiryDate } = req.body;

    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Title and category are required'
      });
    }

    const validCategories = ['policy', 'contract', 'certificate', 'id', 'training', 'performance', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category',
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    // Upload file to Cloudinary
    let fileUrl;
    try {
      const uploadResult = await HRFileUploadService.uploadDocument(
        req.files.file, 
        'documents', 
        `doc_${Date.now()}`
      );
      fileUrl = uploadResult.url;
    } catch (uploadError) {
      return res.status(400).json({
        success: false,
        error: 'File upload failed',
        message: uploadError.message
      });
    }

    // Create document record
    const document = {
      id: (documents.length + 1).toString(),
      title,
      description: description || '',
      category,
      fileUrl,
      fileName: req.files.file.name,
      fileSize: req.files.file.size,
      mimeType: req.files.file.mimetype,
      employeeId: employeeId || null,
      isConfidential: isConfidential === 'true' || false,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
      version: 1,
      status: 'active',
      accessPermissions: [],
      downloadCount: 0,
      lastAccessedAt: null
    };

    documents.push(document);

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully'
    });
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
      message: `Failed to upload the document: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Document Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 */
exports.getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = documents.find(doc => doc.id === id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        message: 'No document found with the provided ID'
      });
    }

    // Update access tracking
    document.downloadCount++;
    document.lastAccessedAt = new Date();

    res.status(200).json({
      success: true,
      data: document,
      message: 'Document retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving document:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve document',
      message: `Failed to retrieve the document: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/documents/{id}:
 *   put:
 *     summary: Update document
 *     tags: [Document Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               isConfidential:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               expiryDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Document updated successfully
 */
exports.updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const documentIndex = documents.findIndex(doc => doc.id === id);
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        message: 'No document found with the provided ID'
      });
    }

    // Update document
    documents[documentIndex] = {
      ...documents[documentIndex],
      ...updateData,
      updatedAt: new Date(),
      updatedBy: req.user.id
    };

    res.status(200).json({
      success: true,
      data: documents[documentIndex],
      message: 'Document updated successfully'
    });
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update document',
      message: `Failed to update the document: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Document Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const documentIndex = documents.findIndex(doc => doc.id === id);
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        message: 'No document found with the provided ID'
      });
    }

    // Soft delete - mark as archived
    documents[documentIndex].status = 'archived';
    documents[documentIndex].archivedAt = new Date();
    documents[documentIndex].archivedBy = req.user.id;

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
      message: `Failed to delete the document: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/documents/{id}/permissions:
 *   post:
 *     summary: Set document access permissions
 *     tags: [Document Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [viewer, editor]
 *     responses:
 *       200:
 *         description: Document permissions updated successfully
 */
exports.setDocumentPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid permissions',
        message: 'Permissions must be an array'
      });
    }

    const documentIndex = documents.findIndex(doc => doc.id === id);
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        message: 'No document found with the provided ID'
      });
    }

    documents[documentIndex].accessPermissions = permissions;
    documents[documentIndex].updatedAt = new Date();
    documents[documentIndex].updatedBy = req.user.id;

    res.status(200).json({
      success: true,
      data: documents[documentIndex],
      message: 'Document permissions updated successfully'
    });
  } catch (err) {
    console.error('Error setting document permissions:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to set document permissions',
      message: `Failed to set document permissions: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/documents/templates:
 *   get:
 *     summary: Get document templates
 *     tags: [Document Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by template category
 *     responses:
 *       200:
 *         description: Document templates retrieved successfully
 */
exports.getDocumentTemplates = async (req, res, next) => {
  try {
    const { category } = req.query;

    // Mock document templates (in production, this would be from a database)
    const templates = [
      {
        id: '1',
        name: 'Employment Contract Template',
        category: 'contract',
        description: 'Standard employment contract template',
        fileUrl: '/templates/employment-contract.docx',
        version: '1.2',
        lastUpdated: new Date('2024-01-15'),
        isActive: true
      },
      {
        id: '2',
        name: 'Performance Review Form',
        category: 'performance',
        description: 'Annual performance review template',
        fileUrl: '/templates/performance-review.pdf',
        version: '2.0',
        lastUpdated: new Date('2024-02-01'),
        isActive: true
      },
      {
        id: '3',
        name: 'Employee Handbook',
        category: 'policy',
        description: 'Company policies and procedures',
        fileUrl: '/templates/employee-handbook.pdf',
        version: '3.1',
        lastUpdated: new Date('2024-01-20'),
        isActive: true
      },
      {
        id: '4',
        name: 'Training Certificate Template',
        category: 'certificate',
        description: 'Training completion certificate',
        fileUrl: '/templates/training-certificate.docx',
        version: '1.0',
        lastUpdated: new Date('2024-01-10'),
        isActive: true
      }
    ];

    let filteredTemplates = templates;
    if (category) {
      filteredTemplates = templates.filter(template => template.category === category);
    }

    res.status(200).json({
      success: true,
      data: filteredTemplates,
      message: 'Document templates retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving document templates:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve document templates',
      message: `Failed to retrieve document templates: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/documents/analytics:
 *   get:
 *     summary: Get document analytics
 *     tags: [Document Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: monthly
 *         description: Analytics period
 *     responses:
 *       200:
 *         description: Document analytics retrieved successfully
 */
exports.getDocumentAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;

    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const recentDocuments = documents.filter(doc => 
      new Date(doc.uploadedAt) >= startDate
    );

    const analytics = {
      period,
      summary: {
        totalDocuments: documents.length,
        recentUploads: recentDocuments.length,
        totalDownloads: documents.reduce((sum, doc) => sum + doc.downloadCount, 0),
        averageFileSize: documents.length > 0 ? 
          documents.reduce((sum, doc) => sum + doc.fileSize, 0) / documents.length : 0
      },
      byCategory: {},
      byConfidentiality: {
        confidential: documents.filter(doc => doc.isConfidential).length,
        public: documents.filter(doc => !doc.isConfidential).length
      },
      topDocuments: documents
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 5)
        .map(doc => ({
          id: doc.id,
          title: doc.title,
          category: doc.category,
          downloadCount: doc.downloadCount
        })),
      storageUsage: {
        totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
        averageSize: documents.length > 0 ? 
          documents.reduce((sum, doc) => sum + doc.fileSize, 0) / documents.length : 0
      }
    };

    // Calculate category breakdown
    documents.forEach(doc => {
      if (!analytics.byCategory[doc.category]) {
        analytics.byCategory[doc.category] = 0;
      }
      analytics.byCategory[doc.category]++;
    });

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'Document analytics retrieved successfully'
    });
  } catch (err) {
    console.error('Error retrieving document analytics:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve document analytics',
      message: `Failed to retrieve document analytics: ${err.message}`
    });
  }
};


