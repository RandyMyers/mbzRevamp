const cloudinary = require('cloudinary').v2;

/**
 * HR File Upload Service
 * Handles file uploads for HR management system using Cloudinary
 */

class HRFileUploadService {
  /**
   * Upload employee avatar/profile picture
   * @param {Object} file - File object from req.files
   * @param {String} employeeId - Employee ID for unique naming
   * @returns {Promise<Object>} Upload result with secure_url
   */
  static async uploadEmployeeAvatar(file, employeeId) {
    try {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only PNG, JPEG, JPG, and WebP are allowed.');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.');
      }

      // Generate unique public ID
      const timestamp = Date.now();
      const publicId = `elapix/hr/avatars/${employeeId}_${timestamp}`;

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
        public_id: publicId,
        folder: 'elapix/hr/avatars',
        resource_type: 'image',
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      return {
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        size: uploadResult.bytes
      };
    } catch (error) {
      console.error('Error uploading employee avatar:', error);
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }
  }

  /**
   * Upload resume/CV document
   * @param {Object} file - File object from req.files
   * @param {String} applicantId - Applicant ID for unique naming
   * @returns {Promise<Object>} Upload result with secure_url
   */
  static async uploadResume(file, applicantId) {
    try {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT are allowed.');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 10MB.');
      }

      // Generate unique public ID
      const timestamp = Date.now();
      const publicId = `elapix/hr/resumes/${applicantId}_${timestamp}`;

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
        public_id: publicId,
        folder: 'elapix/hr/resumes',
        resource_type: 'raw'
      });

      return {
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        size: uploadResult.bytes
      };
    } catch (error) {
      console.error('Error uploading resume:', error);
      throw new Error(`Failed to upload resume: ${error.message}`);
    }
  }

  /**
   * Upload training material/document
   * @param {Object} file - File object from req.files
   * @param {String} materialId - Material ID for unique naming
   * @param {String} type - Material type (document, video, etc.)
   * @returns {Promise<Object>} Upload result with secure_url
   */
  static async uploadTrainingMaterial(file, materialId, type = 'document') {
    try {
      let allowedTypes, folder, resourceType;

      switch (type) {
        case 'document':
          allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain'
          ];
          folder = 'elapix/hr/training/documents';
          resourceType = 'raw';
          break;
        case 'video':
          allowedTypes = [
            'video/mp4',
            'video/avi',
            'video/mov',
            'video/wmv',
            'video/webm'
          ];
          folder = 'elapix/hr/training/videos';
          resourceType = 'video';
          break;
        case 'image':
          allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
          folder = 'elapix/hr/training/images';
          resourceType = 'image';
          break;
        default:
          throw new Error('Invalid material type');
      }

      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(`Invalid file type for ${type}. Allowed types: ${allowedTypes.join(', ')}`);
      }

      // Validate file size based on type
      const maxSizes = {
        document: 20 * 1024 * 1024, // 20MB
        video: 100 * 1024 * 1024,   // 100MB
        image: 10 * 1024 * 1024     // 10MB
      };

      if (file.size > maxSizes[type]) {
        throw new Error(`File size too large for ${type}. Maximum size is ${maxSizes[type] / (1024 * 1024)}MB.`);
      }

      // Generate unique public ID
      const timestamp = Date.now();
      const publicId = `elapix/hr/training/${type}/${materialId}_${timestamp}`;

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
        public_id: publicId,
        folder: folder,
        resource_type: resourceType
      });

      return {
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        size: uploadResult.bytes
      };
    } catch (error) {
      console.error('Error uploading training material:', error);
      throw new Error(`Failed to upload training material: ${error.message}`);
    }
  }

  /**
   * Upload onboarding document
   * @param {Object} file - File object from req.files
   * @param {String} taskId - Task ID for unique naming
   * @returns {Promise<Object>} Upload result with secure_url
   */
  static async uploadOnboardingDocument(file, taskId) {
    try {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'text/plain'
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only PDF, DOC, DOCX, images, and TXT are allowed.');
      }

      // Validate file size (max 15MB)
      const maxSize = 15 * 1024 * 1024; // 15MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 15MB.');
      }

      // Generate unique public ID
      const timestamp = Date.now();
      const publicId = `elapix/hr/onboarding/${taskId}_${timestamp}`;

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
        public_id: publicId,
        folder: 'elapix/hr/onboarding',
        resource_type: 'auto'
      });

      return {
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        size: uploadResult.bytes
      };
    } catch (error) {
      console.error('Error uploading onboarding document:', error);
      throw new Error(`Failed to upload onboarding document: ${error.message}`);
    }
  }

  /**
   * Delete file from Cloudinary
   * @param {String} publicId - Cloudinary public ID
   * @param {String} resourceType - Resource type (image, video, raw)
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteFile(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });

      return {
        success: result.result === 'ok',
        result: result.result
      };
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file info from Cloudinary
   * @param {String} publicId - Cloudinary public ID
   * @returns {Promise<Object>} File information
   */
  static async getFileInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        success: true,
        info: result
      };
    } catch (error) {
      console.error('Error getting file info from Cloudinary:', error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }
}

module.exports = HRFileUploadService;


