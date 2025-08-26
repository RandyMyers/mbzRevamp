const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// File type categories
const FILE_CATEGORIES = {
  IMAGES: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'],
  DOCUMENTS: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf'],
  ARCHIVES: ['zip', 'rar', '7z', 'tar', 'gz'],
  MEDIA: ['mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv']
};

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
  IMAGES: 5 * 1024 * 1024,      // 5MB
  DOCUMENTS: 10 * 1024 * 1024,  // 10MB
  ARCHIVES: 50 * 1024 * 1024,   // 50MB
  MEDIA: 100 * 1024 * 1024      // 100MB
};

/**
 * Get file category based on extension
 */
function getFileCategory(filename) {
  const extension = path.extname(filename).toLowerCase().substring(1);
  
  if (FILE_CATEGORIES.IMAGES.includes(extension)) return 'IMAGES';
  if (FILE_CATEGORIES.DOCUMENTS.includes(extension)) return 'DOCUMENTS';
  if (FILE_CATEGORIES.ARCHIVES.includes(extension)) return 'ARCHIVES';
  if (FILE_CATEGORIES.MEDIA.includes(extension)) return 'MEDIA';
  
  return 'UNKNOWN';
}

/**
 * Validate file size based on category
 */
function validateFileSize(fileSize, category) {
  const maxSize = MAX_FILE_SIZES[category] || MAX_FILE_SIZES.DOCUMENTS;
  return fileSize <= maxSize;
}

/**
 * Upload image to Cloudinary
 */
async function uploadToCloudinary(file, folder = 'task_attachments') {
  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' },  // Optimize quality
        { fetch_format: 'auto' }   // Auto-format
      ]
    });
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Save file to local storage
 */
async function saveToLocalStorage(file, folder = 'uploads/tasks') {
  try {
    // Create directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.name);
    const filename = `${timestamp}_${randomString}${extension}`;
    
    const filePath = path.join(uploadDir, filename);
    
    // Copy file from temp to permanent location
    fs.copyFileSync(file.tempFilePath, filePath);
    
    // Clean up temp file
    fs.unlinkSync(file.tempFilePath);
    
    return {
      success: true,
      filename: filename,
      originalName: file.name,
      path: filePath,
      url: `/uploads/tasks/${filename}`,
      size: file.size
    };
  } catch (error) {
    console.error('Local storage save error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main function to handle hybrid file upload
 */
async function handleFileUpload(file, folder = 'task_attachments') {
  try {
    // Validate file exists
    if (!file || !file.tempFilePath) {
      return {
        success: false,
        error: 'No file provided'
      };
    }
    
    // Get file category and validate size
    const category = getFileCategory(file.name);
    if (!validateFileSize(file.size, category)) {
      const maxSizeMB = MAX_FILE_SIZES[category] / (1024 * 1024);
      return {
        success: false,
        error: `File size exceeds maximum allowed size of ${maxSizeMB}MB for ${category.toLowerCase()}`
      };
    }
    
    let uploadResult;
    
    // Route to appropriate storage based on file type
    if (category === 'IMAGES') {
      // Images go to Cloudinary
      uploadResult = await uploadToCloudinary(file, folder);
      if (uploadResult.success) {
        return {
          success: true,
          storageType: 'cloudinary',
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          format: uploadResult.format,
          size: uploadResult.size,
          category: category
        };
      }
    } else {
      // Documents, archives, media go to local storage
      uploadResult = await saveToLocalStorage(file, folder);
      if (uploadResult.success) {
        return {
          success: true,
          storageType: 'local',
          filename: uploadResult.filename,
          originalName: uploadResult.originalName,
          url: uploadResult.url,
          path: uploadResult.path,
          size: uploadResult.size,
          category: category
        };
      }
    }
    
    return uploadResult;
    
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete file from storage
 */
async function deleteFile(attachment) {
  try {
    if (attachment.storageType === 'cloudinary' && attachment.publicId) {
      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(attachment.publicId);
      return result.result === 'ok';
    } else if (attachment.storageType === 'local' && attachment.path) {
      // Delete from local storage
      if (fs.existsSync(attachment.path)) {
        fs.unlinkSync(attachment.path);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
}

/**
 * Get file info for response
 */
function getFileInfo(uploadResult) {
  if (uploadResult.storageType === 'cloudinary') {
    return {
      filename: uploadResult.originalName || 'image',
      url: uploadResult.url,
      storageType: 'cloudinary',
      publicId: uploadResult.publicId,
      format: uploadResult.format,
      size: uploadResult.size,
      category: uploadResult.category
    };
  } else {
    return {
      filename: uploadResult.originalName,
      url: uploadResult.url,
      storageType: 'local',
      path: uploadResult.path,
      size: uploadResult.size,
      category: uploadResult.category
    };
  }
}

module.exports = {
  handleFileUpload,
  deleteFile,
  getFileInfo,
  getFileCategory,
  validateFileSize,
  FILE_CATEGORIES,
  MAX_FILE_SIZES
};
