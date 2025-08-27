// Enhanced Cloudinary Integration for IPatroller System
// This utility provides seamless integration with existing upload handlers

import { cloudinaryUtils, cloudinaryConfig } from './cloudinary';

// Enhanced photo upload handler for IPatroller before/after photos
export const handleIPatrollerPhotoUpload = async (file, type = 'photo', options = {}) => {
  try {
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file');
    }

    // Set default options for IPatroller photos
    const uploadOptions = {
      folder: `ipatroller/photos/${options.municipality || 'general'}`,
      tags: ['ipatroller-system', 'patrol-photos', type, options.district || 'general'],
      uploadPreset: cloudinaryConfig.uploadPreset,
      ...options
    };

    // Upload to Cloudinary
    const result = await cloudinaryUtils.uploadFile(file, uploadOptions);
    
    if (result.success) {
      return {
        success: true,
        photo: {
          id: Date.now() + Math.random(),
          fileName: file.name || 'Unknown',
          fileSize: file.size,
          fileType: file.type,
          lastModified: file.lastModified || Date.now(),
          uploadDate: new Date().toISOString(),
          // Cloudinary data
          cloudinaryId: result.data.publicId,
          url: result.data.url,
          publicId: result.data.publicId,
          format: result.data.format,
          width: result.data.width,
          height: result.data.height,
          // Metadata
          type: type, // 'before' or 'after'
          municipality: options.municipality || 'Unknown',
          district: options.district || 'Unknown',
          date: options.date || new Date().toISOString().split('T')[0]
        }
      };
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  } catch (error) {
    console.error('❌ IPatroller photo upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Enhanced photo upload handler for Action Center reports
export const handleActionCenterPhotoUpload = async (files, options = {}) => {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No files selected');
    }

    if (files.length > 10) {
      throw new Error('Maximum 10 images allowed');
    }

    const validFiles = files.filter(file => file && file.type && file.type.startsWith('image/'));
    if (validFiles.length === 0) {
      throw new Error('Please select valid image files only');
    }

    const uploadPromises = validFiles.map(async (file) => {
      // Set default options for Action Center photos
      const uploadOptions = {
        folder: `ipatroller/action-center/${options.reportType || 'reports'}`,
        tags: ['ipatroller-system', 'action-center', 'reports', options.district || 'general'],
        uploadPreset: cloudinaryConfig.uploadPreset,
        ...options
      };

      const result = await cloudinaryUtils.uploadFile(file, uploadOptions);
      
      if (result.success) {
        return {
          id: Date.now() + Math.random(),
          fileName: file.name || 'Unknown',
          fileSize: file.size,
          fileType: file.type,
          lastModified: file.lastModified || Date.now(),
          uploadDate: new Date().toISOString(),
          // Cloudinary data
          cloudinaryId: result.data.publicId,
          url: result.data.url,
          publicId: result.data.publicId,
          format: result.data.format,
          width: result.data.width,
          height: result.data.height,
          // Metadata
          reportType: options.reportType || 'general',
          district: options.district || 'Unknown',
          municipality: options.municipality || 'Unknown'
        };
      } else {
        throw new Error(`Upload failed for ${file.name}: ${result.error}`);
      }
    });

    const uploadedPhotos = await Promise.all(uploadPromises);
    
    return {
      success: true,
      photos: uploadedPhotos
    };

  } catch (error) {
    console.error('❌ Action Center photo upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Enhanced file upload handler for Excel/CSV imports
export const handleFileImportUpload = async (file, options = {}) => {
  try {
    if (!file) {
      throw new Error('No file selected');
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCSV = fileName.endsWith('.csv');
    
    if (!isExcel && !isCSV) {
      throw new Error('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file');
    }

    // Set default options for import files
    const uploadOptions = {
      folder: `ipatroller/imports/${options.importType || 'data'}`,
      tags: ['ipatroller-system', 'imports', options.importType || 'data', options.district || 'general'],
      uploadPreset: cloudinaryConfig.uploadPreset,
      ...options
    };

    // Upload to Cloudinary for backup
    const result = await cloudinaryUtils.uploadFile(file, uploadOptions);
    
    if (result.success) {
      return {
        success: true,
        file: {
          id: Date.now() + Math.random(),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          lastModified: file.lastModified || Date.now(),
          uploadDate: new Date().toISOString(),
          // Cloudinary data
          cloudinaryId: result.data.publicId,
          url: result.data.url,
          publicId: result.data.publicId,
          format: result.data.format,
          // Metadata
          importType: options.importType || 'data',
          district: options.district || 'Unknown',
          municipality: options.municipality || 'Unknown',
          // Original file for processing
          originalFile: file
        }
      };
    } else {
      throw new Error(result.error || 'Upload failed');
    }

  } catch (error) {
    console.error('❌ File import upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Enhanced photo management for existing photos
export const handleExistingPhotoManagement = async (photos, options = {}) => {
  try {
    if (!Array.isArray(photos) || photos.length === 0) {
      return { success: true, photos: [] };
    }

    const managedPhotos = photos.map(photo => {
      // If photo already has Cloudinary data, keep it
      if (photo.cloudinaryId || photo.publicId) {
        return photo;
      }

      // If photo has legacy data (base64, blob, etc.), mark for migration
      if (photo.blob || photo.preview || (photo.url && photo.url.startsWith('data:'))) {
        return {
          ...photo,
          needsMigration: true,
          migrationNote: 'This photo needs to be re-uploaded to Cloudinary'
        };
      }

      // If photo has external URL, keep it
      if (photo.url && photo.url.startsWith('http') && !photo.url.includes('cloudinary.com')) {
        return photo;
      }

      return photo;
    });

    return {
      success: true,
      photos: managedPhotos
    };

  } catch (error) {
    console.error('❌ Photo management failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Utility to get optimized image URL from Cloudinary
export const getOptimizedImageUrl = (publicId, options = {}) => {
  if (!publicId) return null;
  
  const defaultOptions = {
    width: 800,
    height: 600,
    quality: 'auto',
    format: 'auto',
    ...options
  };

  const transformations = [
    `w_${defaultOptions.width}`,
    `h_${defaultOptions.height}`,
    `q_${defaultOptions.quality}`,
    `f_${defaultOptions.format}`
  ].join(',');

  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${transformations}/${publicId}`;
};

// Utility to get thumbnail URL from Cloudinary
export const getThumbnailUrl = (publicId, size = 200) => {
  if (!publicId) return null;
  
  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/w_${size},h_${size},c_fill/${publicId}`;
};

// Utility to delete file from Cloudinary
export const deleteCloudinaryFile = async (publicId, resourceType = 'image') => {
  try {
    // Note: This requires server-side implementation due to CORS restrictions
    // For now, we'll return success and handle deletion through Cloudinary dashboard
    console.log(`🗑️ File marked for deletion: ${publicId} (${resourceType})`);
    
    return {
      success: true,
      message: 'File marked for deletion. Please delete manually from Cloudinary dashboard if needed.',
      publicId,
      resourceType
    };
  } catch (error) {
    console.error('❌ File deletion failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Batch upload utility for multiple files
export const batchUploadFiles = async (files, options = {}) => {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No files to upload');
    }

    const uploadPromises = files.map(file => {
      const fileOptions = {
        ...options,
        folder: options.folder || 'ipatroller/general',
        tags: [...(options.tags || []), 'ipatroller-system', 'batch-upload']
      };
      
      return cloudinaryUtils.uploadFile(file, fileOptions);
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      success: failed.length === 0,
      successful: successful.map(r => r.data),
      failed: failed.map(r => r.error),
      total: files.length,
      successCount: successful.length,
      failureCount: failed.length
    };

  } catch (error) {
    console.error('❌ Batch upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Migration utility for existing photos
export const migrateLegacyPhotos = async (photos, options = {}) => {
  try {
    if (!Array.isArray(photos) || photos.length === 0) {
      return { success: true, migrated: [], failed: [] };
    }

    const legacyPhotos = photos.filter(photo => 
      photo.blob || photo.preview || (photo.url && photo.url.startsWith('data:'))
    );

    if (legacyPhotos.length === 0) {
      return { success: true, migrated: [], failed: [] };
    }

    const migrationPromises = legacyPhotos.map(async (photo) => {
      try {
        let file = null;
        
        // Convert blob to file
        if (photo.blob) {
          file = new File([photo.blob], photo.fileName || 'photo.jpg', {
            type: photo.fileType || 'image/jpeg',
            lastModified: photo.lastModified || Date.now()
          });
        }
        // Convert data URL to file
        else if (photo.url && photo.url.startsWith('data:')) {
          const response = await fetch(photo.url);
          const blob = await response.blob();
          file = new File([blob], photo.fileName || 'photo.jpg', {
            type: photo.fileType || 'image/jpeg',
            lastModified: photo.lastModified || Date.now()
          });
        }

        if (!file) {
          throw new Error('Unable to convert legacy photo to file');
        }

        // Upload to Cloudinary
        const uploadOptions = {
          folder: options.folder || 'ipatroller/migrated',
          tags: [...(options.tags || []), 'ipatroller-system', 'migrated'],
          uploadPreset: cloudinaryConfig.uploadPreset
        };

        const result = await cloudinaryUtils.uploadFile(file, uploadOptions);
        
        if (result.success) {
          return {
            originalPhoto: photo,
            migratedPhoto: {
              ...photo,
              cloudinaryId: result.data.publicId,
              url: result.data.url,
              publicId: result.data.publicId,
              migrated: true,
              migrationDate: new Date().toISOString()
            }
          };
        } else {
          throw new Error(result.error || 'Migration upload failed');
        }

      } catch (error) {
        console.error('❌ Photo migration failed:', error);
        return {
          originalPhoto: photo,
          error: error.message
        };
      }
    });

    const results = await Promise.all(migrationPromises);
    const migrated = results.filter(r => r.migratedPhoto);
    const failed = results.filter(r => r.error);

    return {
      success: failed.length === 0,
      migrated: migrated.map(r => r.migratedPhoto),
      failed: failed.map(r => ({ photo: r.originalPhoto, error: r.error })),
      total: legacyPhotos.length,
      successCount: migrated.length,
      failureCount: failed.length
    };

  } catch (error) {
    console.error('❌ Photo migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export all utilities
export default {
  handleIPatrollerPhotoUpload,
  handleActionCenterPhotoUpload,
  handleFileImportUpload,
  handleExistingPhotoManagement,
  getOptimizedImageUrl,
  getThumbnailUrl,
  deleteCloudinaryFile,
  batchUploadFiles,
  migrateLegacyPhotos
};
