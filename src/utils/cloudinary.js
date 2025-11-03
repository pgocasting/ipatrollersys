// Cloudinary configuration and utility functions for browser use
// This version only uses client-side uploads to avoid Node.js dependencies

// Cloudinary configuration constants
// IMPORTANT: You need to create an unsigned upload preset in your Cloudinary dashboard
// Go to: Settings > Upload > Upload presets > Add upload preset
// Name it 'ml_default' or update the upload_preset value below
const CLOUDINARY_CONFIG = {
  cloud_name: 'drr2jwqv8',
  api_key: '193961254783825',
  upload_preset: 'ipatrollersys', // Actual upload preset name
  upload_url: 'https://api.cloudinary.com/v1_1/drr2jwqv8/image/upload'
};

// Utility functions for Cloudinary operations
export const cloudinaryUtils = {
  // Upload image to Cloudinary
  async uploadImage(file, options = {}) {
    // Try multiple common preset names
    const presetsToTry = [
      CLOUDINARY_CONFIG.upload_preset, // ipatrollersys
      'ipatrollersys'
    ];

    let lastError = null;

    for (const preset of presetsToTry) {
      try {
        console.log(`📤 Trying upload with preset: ${preset}`);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', preset);
        
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

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Upload successful with preset: ${preset}`);
          console.log(`💡 Update your config to use: upload_preset: '${preset}'`);
          
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
        } else {
          const errorData = await response.json().catch(() => ({}));
          lastError = errorData;
          console.warn(`⚠️ Preset '${preset}' failed: ${errorData.error?.message}`);
        }
      } catch (error) {
        console.warn(`⚠️ Preset '${preset}' error:`, error.message);
        lastError = error;
      }
    }

    // All presets failed
    console.error('❌ All upload presets failed. Last error:', lastError);
    console.error('📋 To fix this:');
    console.error('   1. Go to https://console.cloudinary.com/');
    console.error('   2. Navigate to: Settings → Upload → Upload presets');
    console.error('   3. Click "Add upload preset"');
    console.error('   4. Set Signing Mode to "Unsigned"');
    console.error('   5. Name it (e.g., "ipatroller_unsigned")');
    console.error('   6. Update CLOUDINARY_CONFIG.upload_preset in cloudinary.js');
    throw new Error(`Upload failed: No valid upload preset found.\n\nPlease create an unsigned upload preset in Cloudinary dashboard:\n1. Go to https://console.cloudinary.com/\n2. Settings → Upload → Upload presets\n3. Add upload preset with Signing Mode = "Unsigned"\n4. Update the preset name in src/utils/cloudinary.js\n\nLast error: ${lastError?.error?.message || lastError?.message}`);
  },

  // Dummy method to maintain structure - will be replaced by actual result
  async _originalUploadImage(file, options = {}) {
    try {
      console.log('📤 Uploading image to Cloudinary:', {
        url: CLOUDINARY_CONFIG.upload_url,
        preset: CLOUDINARY_CONFIG.upload_preset,
        folder: options.folder,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileName: file.name
      });
      
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
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Cloudinary error response:', errorData);
        throw new Error(`Upload failed: ${response.statusText}. ${errorData.error?.message || 'Check upload preset configuration'}`);
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

  // Delete resource from Cloudinary
  async deleteResource(publicId, resourceType = 'image') {
    try {
      console.log(`🗑️ Attempting to delete resource: ${publicId}`);
      
      // Extract public_id from URL if a full URL was passed
      let actualPublicId = publicId;
      if (publicId.includes('cloudinary.com')) {
        const urlParts = publicId.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1) {
          // Get everything after 'upload' and remove file extension
          actualPublicId = urlParts.slice(uploadIndex + 1).join('/').split('.')[0];
        }
      }
      
      console.log(`📝 Extracted public_id: ${actualPublicId}`);
      
      // Note: Client-side deletion requires the upload preset to allow deletions
      // This may not work with all Cloudinary configurations
      const deleteUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/${resourceType}/destroy`;
      
      const formData = new FormData();
      formData.append('public_id', actualPublicId);
      formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);
      
      const response = await fetch(deleteUrl, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok && result.result === 'ok') {
        console.log(`✅ Successfully deleted: ${actualPublicId}`);
        return {
          success: true,
          message: 'Resource deleted successfully'
        };
      } else {
        console.warn(`⚠️ Delete failed or not permitted: ${result.error?.message || 'Unknown error'}`);
        return {
          success: false,
          error: result.error?.message || 'Deletion not permitted. Images remain in Cloudinary.',
          partialSuccess: true // Indicates the link was removed even if cloud deletion failed
        };
      }
    } catch (error) {
      console.error('❌ Error deleting resource:', error);
      return {
        success: false,
        error: 'Could not delete from Cloudinary. Image links removed but files remain in cloud storage.',
        partialSuccess: true
      };
    }
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
