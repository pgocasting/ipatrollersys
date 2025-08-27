// Cloudinary configuration for file uploads
// Cloudinary is used for storing images, videos, and files

export const cloudinaryConfig = {
  cloudName: 'duooicxyl',
  uploadPreset: 'Files_Upload',
  apiKey: '193961254783825',
  // Note: API Secret is not needed for client-side uploads with upload preset
};

// Base URL for Cloudinary uploads
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`;

// Upload preset for different file types
export const UPLOAD_PRESETS = {
  images: 'Files_Upload',
  videos: 'Files_Upload',
  documents: 'Files_Upload',
  all: 'Files_Upload'
};

// File type validation
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  videos: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  all: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
};

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  images: 10 * 1024 * 1024, // 10MB
  videos: 100 * 1024 * 1024, // 100MB
  documents: 25 * 1024 * 1024, // 25MB
  all: 100 * 1024 * 1024 // 100MB
};

// Cloudinary utility functions
export const cloudinaryUtils = {
  // Upload file to Cloudinary
  async uploadFile(file, options = {}) {
    try {
      // Validate file type
      if (!this.isValidFileType(file)) {
        throw new Error('Invalid file type');
      }

      // Validate file size
      if (!this.isValidFileSize(file)) {
        throw new Error('File size exceeds limit');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', options.uploadPreset || cloudinaryConfig.uploadPreset);
      
      // Add additional options
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      if (options.public_id) {
        formData.append('public_id', options.public_id);
      }
      if (options.tags) {
        formData.append('tags', options.tags);
      }

      // Upload to Cloudinary
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          size: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration, // for videos
          resourceType: result.resource_type,
          createdAt: result.created_at
        }
      };

    } catch (error) {
      console.error('❌ Cloudinary upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Upload multiple files
  async uploadMultipleFiles(files, options = {}) {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, options));
      const results = await Promise.all(uploadPromises);
      
      const successful = results.filter(result => result.success);
      const failed = results.filter(result => !result.success);
      
      return {
        success: successful.length > 0,
        successful,
        failed,
        total: files.length,
        successfulCount: successful.length,
        failedCount: failed.length
      };

    } catch (error) {
      console.error('❌ Multiple files upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Validate file type
  isValidFileType(file) {
    return ALLOWED_FILE_TYPES.all.includes(file.type);
  },

  // Validate file size
  isValidFileSize(file) {
    return file.size <= FILE_SIZE_LIMITS.all;
  },

  // Get file type category
  getFileTypeCategory(file) {
    if (ALLOWED_FILE_TYPES.images.includes(file.type)) return 'images';
    if (ALLOWED_FILE_TYPES.videos.includes(file.type)) return 'videos';
    if (ALLOWED_FILE_TYPES.documents.includes(file.type)) return 'documents';
    return 'unknown';
  },

  // Generate optimized URL with transformations
  getOptimizedUrl(publicId, options = {}) {
    const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}`;
    const resourceType = options.resourceType || 'auto';
    
    let url = `${baseUrl}/${resourceType}/upload`;
    
    // Add transformations
    if (options.width) url += `/w_${options.width}`;
    if (options.height) url += `/h_${options.height}`;
    if (options.crop) url += `/c_${options.crop}`;
    if (options.quality) url += `/q_${options.quality}`;
    if (options.format) url += `/f_${options.format}`;
    
    url += `/${publicId}`;
    
    return url;
  },

  // Delete file from Cloudinary (requires server-side implementation)
  async deleteFile(publicId) {
    // Note: This requires server-side implementation due to security
    // Client-side deletion is not recommended
    console.warn('⚠️ File deletion requires server-side implementation');
    return {
      success: false,
      error: 'File deletion requires server-side implementation'
    };
  },

  // Get file info
  async getFileInfo(publicId) {
    try {
      const response = await fetch(
        `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${publicId}.json`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to get file info: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('❌ Failed to get file info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// React hook for file uploads
export const useCloudinaryUpload = () => {
  const uploadFile = async (file, options = {}) => {
    return await cloudinaryUtils.uploadFile(file, options);
  };

  const uploadMultipleFiles = async (files, options = {}) => {
    return await cloudinaryUtils.uploadMultipleFiles(files, options);
  };

  const isValidFile = (file) => {
    return cloudinaryUtils.isValidFileType(file) && cloudinaryUtils.isValidFileSize(file);
  };

  const getFileTypeCategory = (file) => {
    return cloudinaryUtils.getFileTypeCategory(file);
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    isValidFile,
    getFileTypeCategory,
    config: cloudinaryConfig,
    utils: cloudinaryUtils
  };
};

export default cloudinaryUtils;
