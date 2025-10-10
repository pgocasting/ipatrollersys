// Cloudinary configuration and utility functions for browser use
// This version only uses client-side uploads to avoid Node.js dependencies

// Cloudinary configuration constants
const CLOUDINARY_CONFIG = {
  cloud_name: 'duooicxyl',
  api_key: '193961254783825',
  upload_preset: 'Files_Upload',
  upload_url: 'https://api.cloudinary.com/v1_1/duooicxyl/auto/upload'
};

// Utility functions for Cloudinary operations
export const cloudinaryUtils = {
  // Upload image to Cloudinary
  async uploadImage(file, options = {}) {
    try {
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);
      
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options.publicId) {
        formData.append('public_id', options.publicId);
      }

      // Add image-specific transformations
      if (options.quality) {
        formData.append('quality', options.quality);
      }
      
      if (options.format) {
        formData.append('format', options.format);
      }

      const response = await fetch(CLOUDINARY_CONFIG.upload_url, {
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
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.bytes,
          uploadedAt: result.created_at
        }
      };
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Upload video to Cloudinary
  async uploadVideo(file, options = {}) {
    try {
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);
      
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options.publicId) {
        formData.append('public_id', options.publicId);
      }

      // Add video-specific transformations
      if (options.quality) {
        formData.append('quality', options.quality);
      }
      
      if (options.format) {
        formData.append('format', options.format);
      }

      const response = await fetch(CLOUDINARY_CONFIG.upload_url, {
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
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.bytes,
          duration: result.duration,
          uploadedAt: result.created_at
        }
      };
    } catch (error) {
      console.error('❌ Video upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Upload file to Cloudinary
  async uploadFile(file, options = {}) {
    try {
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);
      
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options.publicId) {
        formData.append('public_id', options.publicId);
      }

      const response = await fetch(CLOUDINARY_CONFIG.upload_url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('✅ File uploaded successfully:', result.public_id);
      return {
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          size: result.bytes,
          uploadedAt: result.created_at
        }
      };
    } catch (error) {
      console.error('❌ File upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Delete resource from Cloudinary (requires server-side implementation)
  async deleteResource(publicId, resourceType = 'auto') {
    console.warn('⚠️ Resource deletion requires server-side implementation');
    console.warn('⚠️ This function is not available in browser-only mode');
    
    return {
      success: false,
      error: 'Resource deletion requires server-side implementation. Use the Cloudinary dashboard or implement a server endpoint.'
    };
  },

  // Get resource information (requires server-side implementation)
  async getResourceInfo(publicId, resourceType = 'auto') {
    console.warn('⚠️ Resource info retrieval requires server-side implementation');
    console.warn('⚠️ This function is not available in browser-only mode');
    
    return {
      success: false,
      error: 'Resource info retrieval requires server-side implementation. Use the Cloudinary dashboard or implement a server endpoint.'
    };
  },

  // Generate upload signature (requires server-side implementation)
  generateUploadSignature(params = {}) {
    console.warn('⚠️ Upload signature generation requires server-side implementation');
    console.warn('⚠️ This function is not available in browser-only mode');
    
    return {
      success: false,
      error: 'Upload signature generation requires server-side implementation. Use upload_preset instead.'
    };
  },

  // Get Cloudinary configuration
  getConfig() {
    return {
      cloudName: CLOUDINARY_CONFIG.cloud_name,
      apiKey: CLOUDINARY_CONFIG.api_key,
      uploadPreset: CLOUDINARY_CONFIG.upload_preset,
      uploadUrl: CLOUDINARY_CONFIG.upload_url
    };
  }
};

// Client-side upload functions (for browser use)
export const clientUploadUtils = {
  // Upload file directly from browser to Cloudinary
  async uploadToCloudinary(file, options = {}) {
    try {
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);
      
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options.publicId) {
        formData.append('public_id', options.publicId);
      }

      const response = await fetch(CLOUDINARY_CONFIG.upload_url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('✅ File uploaded successfully:', result.public_id);
      return {
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          size: result.bytes,
          uploadedAt: result.created_at
        }
      };
    } catch (error) {
      console.error('❌ File upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Upload multiple files
  async uploadMultipleFiles(files, options = {}) {
    try {
      
      const uploadPromises = files.map(file => 
        this.uploadToCloudinary(file, options)
      );
      
      const results = await Promise.all(uploadPromises);
      const successful = results.filter(result => result.success);
      const failed = results.filter(result => !result.success);
      
      if (failed.length > 0) {
        console.warn(`⚠️ ${failed.length} files failed to upload`);
      }
      
      return {
        success: true,
        data: {
          successful: successful.map(r => r.data),
          failed: failed.map(r => r.error),
          total: files.length,
          successCount: successful.length,
          failureCount: failed.length
        }
      };
    } catch (error) {
      console.error('❌ Multiple file upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Export the main utility object
export default cloudinaryUtils;
