const Training = require('../models/Training');
const TrainingMaterial = require('../models/TrainingMaterial');
const TrainingEnrollment = require('../models/TrainingEnrollment');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const HRFileUploadService = require('../services/hrFileUploadService');
const { BadRequestError, NotFoundError } = require('../utils/errors');

/**
 * @swagger
 * /api/admin/training/trainings:
 *   get:
 *     summary: List all trainings
 *     tags: [Admin Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, Draft]
 *         description: Filter by training status
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *     responses:
 *       200:
 *         description: List of trainings
 */
exports.listTrainings = async (req, res, next) => {
  try {
    const { status, department } = req.query;
    let query = {};

    if (status) query.status = status;
    if (department) query.department = department;

    const trainings = await Training.find(query)
      .populate('department', 'name')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: trainings.length,
      data: trainings
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/training/trainings:
 *   post:
 *     summary: Create a new training
 *     tags: [Admin Training]
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
 *               - description
 *               - department
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               department:
 *                 type: string
 *               duration:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Draft]
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Training created successfully
 */
exports.createTraining = async (req, res, next) => {
  try {
    const { title, description, department, duration, status = 'Draft', prerequisites = [] } = req.body;

    if (!title || !description || !department) {
      throw new BadRequestError('Title, description, and department are required');
    }

    const training = await Training.create({
      title,
      description,
      department,
      duration,
      status,
      prerequisites,
      createdBy: req.user.id
    });

    await training.populate('department', 'name');
    await training.populate('createdBy', 'fullName');

    res.status(201).json({
      success: true,
      data: training,
      message: 'Training created successfully'
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message).join(', ');
      return next(new BadRequestError(message));
    }
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/training/trainings/{id}:
 *   patch:
 *     summary: Update a training
 *     tags: [Admin Training]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               department:
 *                 type: string
 *               duration:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Draft]
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Training updated successfully
 */
exports.updateTraining = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestError('Invalid training ID format');
    }

    const training = await Training.findByIdAndUpdate(id, updateData, { new: true })
      .populate('department', 'name')
      .populate('createdBy', 'fullName');

    if (!training) {
      throw new NotFoundError('Training not found');
    }

    res.status(200).json({
      success: true,
      data: training,
      message: 'Training updated successfully'
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message).join(', ');
      return next(new BadRequestError(message));
    }
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/training/trainings/{id}:
 *   delete:
 *     summary: Delete a training
 *     tags: [Admin Training]
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
 *         description: Training deleted successfully
 */
exports.deleteTraining = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestError('Invalid training ID format');
    }

    const training = await Training.findByIdAndDelete(id);

    if (!training) {
      throw new NotFoundError('Training not found');
    }

    res.status(200).json({
      success: true,
      message: 'Training deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/training/trainings/{id}/materials:
 *   post:
 *     summary: Add material to training
 *     tags: [Admin Training]
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
 *             required:
 *               - title
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Document, Video, Quiz, Link, Assignment]
 *               url:
 *                 type: string
 *               isRequired:
 *                 type: boolean
 *               order:
 *                 type: number
 *     responses:
 *       201:
 *         description: Material added successfully
 */
exports.addTrainingMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, type, url, isRequired = true, order = 0 } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestError('Invalid training ID format');
    }

    if (!title || !type) {
      throw new BadRequestError('Title and type are required');
    }

    const training = await Training.findById(id);
    if (!training) {
      throw new NotFoundError('Training not found');
    }

    let fileUrl = url;
    let fileSize, mimeType, filePath;

    if (req.files && req.files.file) {
      try {
        const uploadResult = await HRFileUploadService.uploadTrainingMaterial(req.files.file, id, type.toLowerCase());
        fileUrl = uploadResult.url;
        fileSize = uploadResult.size;
        mimeType = req.files.file.mimetype;
        filePath = uploadResult.publicId;
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        throw new BadRequestError('File upload failed: ' + uploadError.message);
      }
    }

    const material = await TrainingMaterial.create({
      trainingId: id,
      title,
      description,
      type,
      url: fileUrl,
      filePath,
      fileSize,
      mimeType,
      uploadedBy: req.user.id,
      isRequired,
      order
    });

    res.status(201).json({
      success: true,
      data: material,
      message: 'Material added successfully'
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message).join(', ');
      return next(new BadRequestError(message));
    }
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/training/trainings/{id}/enroll:
 *   post:
 *     summary: Enroll employee in training
 *     tags: [Admin Training]
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
 *             required:
 *               - employeeId
 *             properties:
 *               employeeId:
 *                 type: string
 *               assignedBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee enrolled successfully
 */
exports.enrollTraining = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { employeeId, assignedBy } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestError('Invalid training ID format');
    }

    if (!employeeId) {
      throw new BadRequestError('Employee ID is required');
    }

    const training = await Training.findById(id);
    if (!training) {
      throw new NotFoundError('Training not found');
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    // Check if already enrolled
    const existingEnrollment = await TrainingEnrollment.findOne({
      trainingId: id,
      employeeId: employeeId
    });

    if (existingEnrollment) {
      throw new BadRequestError('Employee is already enrolled in this training');
    }

    const enrollment = await TrainingEnrollment.create({
      trainingId: id,
      employeeId: employeeId,
      assignedBy: assignedBy || req.user.id,
      status: 'Assigned'
    });

    await enrollment.populate('employeeId', 'fullName email');
    await enrollment.populate('trainingId', 'title');

    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Employee enrolled successfully'
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message).join(', ');
      return next(new BadRequestError(message));
    }
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/training/trainings/{id}/complete:
 *   post:
 *     summary: Mark training as completed
 *     tags: [Admin Training]
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
 *             required:
 *               - employeeId
 *             properties:
 *               employeeId:
 *                 type: string
 *               completionDate:
 *                 type: string
 *                 format: date
 *               score:
 *                 type: number
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Training completed successfully
 */
exports.completeTraining = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { employeeId, completionDate, score, feedback } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestError('Invalid training ID format');
    }

    if (!employeeId) {
      throw new BadRequestError('Employee ID is required');
    }

    const enrollment = await TrainingEnrollment.findOne({
      trainingId: id,
      employeeId: employeeId
    });

    if (!enrollment) {
      throw new NotFoundError('Training enrollment not found');
    }

    enrollment.status = 'Completed';
    enrollment.completionDate = completionDate || new Date();
    enrollment.score = score;
    enrollment.feedback = feedback;

    await enrollment.save();

    await enrollment.populate('employeeId', 'fullName email');
    await enrollment.populate('trainingId', 'title');

    res.status(200).json({
      success: true,
      data: enrollment,
      message: 'Training completed successfully'
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message).join(', ');
      return next(new BadRequestError(message));
    }
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/training/materials:
 *   get:
 *     summary: List training materials
 *     tags: [Admin Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: trainingId
 *         schema:
 *           type: string
 *         description: Filter by training ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Document, Video, Quiz, Link, Assignment]
 *         description: Filter by material type
 *     responses:
 *       200:
 *         description: List of training materials
 */
exports.listTrainingMaterials = async (req, res, next) => {
  try {
    const { trainingId, type, page = 1, limit = 10 } = req.query;
    
    const query = { isActive: true };
    if (trainingId) query.trainingId = trainingId;
    if (type) query.type = type;

    const materials = await TrainingMaterial.find(query)
      .populate('trainingId', 'title description')
      .populate('uploadedBy', 'firstName lastName')
      .sort({ order: 1, uploadDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TrainingMaterial.countDocuments(query);

    res.status(200).json({
      success: true,
      data: materials,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error('Error listing training materials:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch training materials',
      message: `Failed to retrieve training materials: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/training/materials:
 *   post:
 *     summary: Create training material
 *     tags: [Admin Training]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trainingId
 *               - title
 *               - type
 *             properties:
 *               trainingId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Document, Video, Quiz, Link, Assignment]
 *               url:
 *                 type: string
 *               filePath:
 *                 type: string
 *               isRequired:
 *                 type: boolean
 *               order:
 *                 type: number
 *               duration:
 *                 type: number
 *     responses:
 *       201:
 *         description: Training material created successfully
 */
exports.createTrainingMaterial = async (req, res, next) => {
  try {
    const {
      trainingId,
      title,
      description,
      type,
      url,
      isRequired = true,
      order = 0,
      duration,
      quiz,
      assignment,
      video,
      access
    } = req.body;

    // Validate required fields
    if (!trainingId || !title || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Training ID, title, and type are required'
      });
    }

    // Validate training exists
    const training = await Training.findById(trainingId);
    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Training not found',
        message: 'The specified training does not exist'
      });
    }

    // Handle file upload if provided
    let fileUrl = url;
    let fileSize, mimeType, filePath;
    
    if (req.files && req.files.file) {
      try {
        const uploadResult = await HRFileUploadService.uploadTrainingMaterial(
          req.files.file, 
          trainingId, 
          type.toLowerCase()
        );
        fileUrl = uploadResult.url;
        fileSize = uploadResult.size;
        mimeType = req.files.file.mimetype;
        filePath = uploadResult.publicId;
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          error: 'File upload failed',
          message: uploadError.message
        });
      }
    }

    const material = await TrainingMaterial.create({
      trainingId,
      title,
      description,
      type,
      url: fileUrl,
      filePath,
      fileSize,
      mimeType,
      uploadedBy: req.user.id,
      isRequired,
      order,
      duration,
      quiz,
      assignment,
      video,
      access
    });

    res.status(201).json({
      success: true,
      data: material,
      message: 'Training material created successfully'
    });
  } catch (err) {
    console.error('Error creating training material:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create training material',
      message: `Failed to create the training material: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/training/materials/{id}:
 *   get:
 *     summary: Get training material by ID
 *     tags: [Admin Training]
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
 *         description: Training material details
 */
exports.getTrainingMaterialById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const material = await TrainingMaterial.findById(id)
      .populate('trainingId', 'title description')
      .populate('uploadedBy', 'firstName lastName');

    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Training material not found',
        message: 'The requested training material does not exist'
      });
    }

    res.status(200).json({
      success: true,
      data: material
    });
  } catch (err) {
    console.error('Error fetching training material:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid training material ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch training material',
      message: `Failed to retrieve the training material: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/training/enrollments:
 *   get:
 *     summary: List training enrollments
 *     tags: [Admin Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: trainingId
 *         schema:
 *           type: string
 *         description: Filter by training ID
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Filter by employee ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Enrolled, In Progress, Completed, Dropped]
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: List of training enrollments
 */
exports.listTrainingEnrollments = async (req, res, next) => {
  try {
    const { trainingId, employeeId, status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (trainingId) query.trainingId = trainingId;
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;

    const enrollments = await TrainingEnrollment.find(query)
      .populate('trainingId', 'title description startDate endDate')
      .populate('employeeId', 'firstName lastName email department')
      .sort({ enrollmentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TrainingEnrollment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: enrollments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error('Error listing training enrollments:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch training enrollments',
      message: `Failed to retrieve training enrollments: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/training/enrollments:
 *   post:
 *     summary: Enroll employee in training
 *     tags: [Admin Training]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trainingId
 *               - employeeId
 *             properties:
 *               trainingId:
 *                 type: string
 *               employeeId:
 *                 type: string
 *               enrollmentType:
 *                 type: string
 *                 enum: [Self, Assigned, Required]
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Employee enrolled successfully
 */
exports.enrollEmployee = async (req, res, next) => {
  try {
    const { trainingId, employeeId, enrollmentType = 'Assigned', dueDate } = req.body;

    // Validate required fields
    if (!trainingId || !employeeId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Training ID and Employee ID are required'
      });
    }

    // Check if training exists
    const training = await Training.findById(trainingId);
    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Training not found',
        message: 'The specified training does not exist'
      });
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
        message: 'The specified employee does not exist'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await TrainingEnrollment.findOne({
      trainingId,
      employeeId
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        error: 'Already enrolled',
        message: 'Employee is already enrolled in this training'
      });
    }

    const enrollment = await TrainingEnrollment.create({
      trainingId,
      employeeId,
      enrollmentType,
      enrolledBy: req.user.id,
      dueDate
    });

    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Employee enrolled successfully'
    });
  } catch (err) {
    console.error('Error enrolling employee:', err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please check the following fields: ' + validationErrors.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to enroll employee',
      message: `Failed to enroll the employee: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/training/enrollments/{id}/progress:
 *   patch:
 *     summary: Update training progress
 *     tags: [Admin Training]
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
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               materialsCompleted:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Progress updated successfully
 */
exports.updateTrainingProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { progress, materialsCompleted } = req.body;

    const enrollment = await TrainingEnrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found',
        message: 'The requested enrollment does not exist'
      });
    }

    if (progress !== undefined) {
      enrollment.progress = progress;
    }

    if (materialsCompleted) {
      enrollment.materialsCompleted = materialsCompleted;
    }

    // Auto-complete if progress reaches 100%
    if (enrollment.progress >= 100 && enrollment.status !== 'Completed') {
      await enrollment.completeTraining();
    } else {
      await enrollment.save();
    }

    res.status(200).json({
      success: true,
      data: enrollment,
      message: 'Training progress updated successfully'
    });
  } catch (err) {
    console.error('Error updating training progress:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid enrollment ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update training progress',
      message: `Failed to update the training progress: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/training/enrollments/{id}/assignment:
 *   post:
 *     summary: Submit assignment for enrollment
 *     tags: [Admin Training]
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
 *             required:
 *               - materialId
 *             properties:
 *               materialId:
 *                 type: string
 *               submittedFiles:
 *                 type: array
 *                 items:
 *                   type: object
 *               textSubmission:
 *                 type: string
 *               urlSubmission:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assignment submitted successfully
 */
exports.submitAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { materialId, submittedFiles, textSubmission, urlSubmission } = req.body;

    if (!materialId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'Material ID is required'
      });
    }

    const enrollment = await TrainingEnrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found',
        message: 'The requested enrollment does not exist'
      });
    }

    const submissionData = {
      submittedFiles,
      textSubmission,
      urlSubmission
    };

    await enrollment.submitAssignment(materialId, submissionData);

    res.status(200).json({
      success: true,
      data: enrollment,
      message: 'Assignment submitted successfully'
    });
  } catch (err) {
    console.error('Error submitting assignment:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid enrollment ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to submit assignment',
      message: `Failed to submit the assignment: ${err.message}`
    });
  }
};

/**
 * @swagger
 * /api/admin/training/analytics:
 *   get:
 *     summary: Get training analytics
 *     tags: [Admin Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: trainingId
 *         schema:
 *           type: string
 *         description: Filter by training ID
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *     responses:
 *       200:
 *         description: Training analytics data
 */
exports.getTrainingAnalytics = async (req, res, next) => {
  try {
    const { trainingId, department } = req.query;

    const matchQuery = {};
    if (trainingId) matchQuery.trainingId = trainingId;
    if (department) {
      matchQuery['employeeId.department'] = department;
    }

    // Get enrollment statistics
    const enrollmentStats = await TrainingEnrollment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get completion rates by training
    const completionRates = await TrainingEnrollment.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'trainings',
          localField: 'trainingId',
          foreignField: '_id',
          as: 'training'
        }
      },
      {
        $group: {
          _id: '$trainingId',
          trainingName: { $first: '$training.title' },
          totalEnrollments: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          averageProgress: { $avg: '$progress' }
        }
      },
      {
        $addFields: {
          completionRate: {
            $multiply: [
              { $divide: ['$completed', '$totalEnrollments'] },
              100
            ]
          }
        }
      }
    ]);

    // Get material analytics
    const materialStats = await TrainingMaterial.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalViews: { $sum: '$analytics.views' },
          totalCompletions: { $sum: '$analytics.completions' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        enrollmentStats,
        completionRates,
        materialStats
      }
    });
  } catch (err) {
    console.error('Error fetching training analytics:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch training analytics',
      message: `Failed to retrieve training analytics: ${err.message}`
    });
  }
};