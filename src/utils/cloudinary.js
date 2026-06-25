// Cloudinary configuration and utility functions for browser use
// Primary account is used first; when its 25-credit limit is hit, uploads switch to fallback.
// Existing photo URLs in Firebase are unchanged — old photos stay on whichever account uploaded them.

const CLOUDINARY_ACCOUNTS = {
  primary: {
    id: 'primary',
    cloud_name: 'drr2jwqv8',
    api_key: '319342433492267',
    upload_preset: 'ipatrollersys',
    upload_url: 'https://api.cloudinary.com/v1_1/drr2jwqv8/image/upload'
  },
  fallback: {
    id: 'fallback',
    cloud_name: 'duooicxyl',
    api_key: '193961254783825',
    upload_preset: 'Files_Upload',
    upload_url: 'https://api.cloudinary.com/v1_1/duooicxyl/image/upload'
  }
};

const ACTIVE_ACCOUNT_STORAGE_KEY = 'ipatroller_cloudinary_active_account';

const getActiveUploadAccount = () => {
  const stored = localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);
  if (stored === 'fallback') {
    return CLOUDINARY_ACCOUNTS.fallback;
  }
  return CLOUDINARY_ACCOUNTS.primary;
};

const markPrimaryQuotaExceeded = () => {
  localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, 'fallback');
};

export const resetCloudinaryToPrimary = () => {
  localStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
};

const isQuotaOrLimitError = (errorData) => {
  const message = (errorData?.error?.message || errorData?.message || '').toLowerCase();
  const httpCode = errorData?.error?.http_code;

  return (
    httpCode === 420 ||
    message.includes('quota') ||
    message.includes('limit') ||
    message.includes('credit') ||
    message.includes('storage') ||
    message.includes('exceeded') ||
    message.includes('insufficient')
  );
};

const resolveAccountFromUrl = (urlOrPublicId) => {
  if (typeof urlOrPublicId === 'string' && urlOrPublicId.includes('cloudinary.com')) {
    const match = urlOrPublicId.match(/res\.cloudinary\.com\/([^/]+)/);
    if (match) {
      const cloudName = match[1];
      if (cloudName === CLOUDINARY_ACCOUNTS.primary.cloud_name) {
        return CLOUDINARY_ACCOUNTS.primary;
      }
      if (cloudName === CLOUDINARY_ACCOUNTS.fallback.cloud_name) {
        return CLOUDINARY_ACCOUNTS.fallback;
      }
    }
  }
  return getActiveUploadAccount();
};

const buildUploadFormData = (file, config, options = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.upload_preset);

  if (options.folder) {
    formData.append('folder', options.folder);
  }

  if (options.publicId) {
    formData.append('public_id', options.publicId);
  }

  if (options.quality) {
    formData.append('quality', options.quality);
  }

  if (options.format) {
    formData.append('format', options.format);
  }

  return formData;
};

const mapUploadResult = (result) => ({
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
});

const performUpload = async (config, file, options = {}) => {
  try {
    console.log('📤 Uploading to Cloudinary:', {
      account: config.id,
      cloudName: config.cloud_name,
      preset: config.upload_preset,
      folder: options.folder,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileName: file.name
    });

    const response = await fetch(config.upload_url, {
      method: 'POST',
      body: buildUploadFormData(file, config, options)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Upload successful on ${config.cloud_name}:`, result.public_id);
      return mapUploadResult(result);
    }

    const errorData = await response.json().catch(() => ({}));
    console.warn(`⚠️ Upload failed on ${config.cloud_name}:`, errorData.error?.message);

    return {
      success: false,
      error: errorData.error?.message || response.statusText,
      quotaExceeded: isQuotaOrLimitError(errorData)
    };
  } catch (error) {
    console.warn(`⚠️ Upload error on ${config.cloud_name}:`, error.message);
    return {
      success: false,
      error: error.message,
      quotaExceeded: false
    };
  }
};

const uploadWithFailover = async (file, options = {}) => {
  const activeAccount = getActiveUploadAccount();

  if (activeAccount.id === 'fallback') {
    return performUpload(CLOUDINARY_ACCOUNTS.fallback, file, options);
  }

  const primaryResult = await performUpload(CLOUDINARY_ACCOUNTS.primary, file, options);
  if (primaryResult.success) {
    return primaryResult;
  }

  if (primaryResult.quotaExceeded) {
    markPrimaryQuotaExceeded();
    console.warn('⚠️ Primary Cloudinary account limit reached. New uploads will use fallback account.');

    const fallbackResult = await performUpload(CLOUDINARY_ACCOUNTS.fallback, file, options);
    if (fallbackResult.success) {
      return fallbackResult;
    }

    return {
      success: false,
      error: fallbackResult.error || 'Primary account limit reached and fallback upload failed.'
    };
  }

  return primaryResult;
};

export const cloudinaryUtils = {
  async uploadImage(file, options = {}) {
    const result = await uploadWithFailover(file, options);

    if (!result.success) {
      return {
        success: false,
        error:
          result.error ||
          'Upload failed. Check unsigned upload presets on both Cloudinary accounts.'
      };
    }

    return result;
  },

  async uploadVideo(file, options = {}) {
    const result = await uploadWithFailover(file, options);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return result;
  },

  async uploadFile(file, options = {}) {
    const result = await uploadWithFailover(file, options);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return result;
  },

  async deleteResource(publicId, resourceType = 'image') {
    try {
      console.log(`🗑️ Attempting to delete resource: ${publicId}`);

      const account = resolveAccountFromUrl(publicId);

      let actualPublicId = publicId;
      if (publicId.includes('cloudinary.com')) {
        const urlParts = publicId.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1) {
          actualPublicId = urlParts.slice(uploadIndex + 1).join('/').split('.')[0];
          actualPublicId = actualPublicId.replace(/^v\d+\//, '');
        }
      }

      console.log(`📝 Deleting from ${account.cloud_name}, public_id: ${actualPublicId}`);

      const deleteUrl = `https://api.cloudinary.com/v1_1/${account.cloud_name}/${resourceType}/destroy`;
      const formData = new FormData();
      formData.append('public_id', actualPublicId);
      formData.append('upload_preset', account.upload_preset);

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
      }

      console.warn(`⚠️ Delete failed or not permitted: ${result.error?.message || 'Unknown error'}`);
      return {
        success: false,
        error: result.error?.message || 'Deletion not permitted. Images remain in Cloudinary.',
        partialSuccess: true
      };
    } catch (error) {
      console.error('❌ Error deleting resource:', error);
      return {
        success: false,
        error: 'Could not delete from Cloudinary. Image links removed but files remain in cloud storage.',
        partialSuccess: true
      };
    }
  },

  async getResourceInfo(publicId, resourceType = 'auto') {
    console.warn('⚠️ Resource info retrieval requires server-side implementation');
    console.warn('⚠️ This function is not available in browser-only mode');

    return {
      success: false,
      error: 'Resource info retrieval requires server-side implementation. Use the Cloudinary dashboard or implement a server endpoint.'
    };
  },

  generateUploadSignature(params = {}) {
    console.warn('⚠️ Upload signature generation requires server-side implementation');
    console.warn('⚠️ This function is not available in browser-only mode');

    return {
      success: false,
      error: 'Upload signature generation requires server-side implementation. Use upload_preset instead.'
    };
  },

  getConfig() {
    const activeAccount = getActiveUploadAccount();
    return {
      activeAccount: activeAccount.id,
      cloudName: activeAccount.cloud_name,
      apiKey: activeAccount.api_key,
      uploadPreset: activeAccount.upload_preset,
      uploadUrl: activeAccount.upload_url,
      primary: {
        cloudName: CLOUDINARY_ACCOUNTS.primary.cloud_name,
        apiKey: CLOUDINARY_ACCOUNTS.primary.api_key,
        uploadPreset: CLOUDINARY_ACCOUNTS.primary.upload_preset,
        uploadUrl: CLOUDINARY_ACCOUNTS.primary.upload_url
      },
      fallback: {
        cloudName: CLOUDINARY_ACCOUNTS.fallback.cloud_name,
        apiKey: CLOUDINARY_ACCOUNTS.fallback.api_key,
        uploadPreset: CLOUDINARY_ACCOUNTS.fallback.upload_preset,
        uploadUrl: CLOUDINARY_ACCOUNTS.fallback.upload_url
      }
    };
  },

  getActiveUploadAccount,
  resetCloudinaryToPrimary
};

export const clientUploadUtils = {
  async uploadToCloudinary(file, options = {}) {
    return uploadWithFailover(file, options);
  },

  async uploadMultipleFiles(files, options = {}) {
    try {
      const uploadPromises = files.map((file) => this.uploadToCloudinary(file, options));
      const results = await Promise.all(uploadPromises);
      const successful = results.filter((result) => result.success);
      const failed = results.filter((result) => !result.success);

      if (failed.length > 0) {
        console.warn(`⚠️ ${failed.length} files failed to upload`);
      }

      return {
        success: true,
        data: {
          successful: successful.map((r) => r.data),
          failed: failed.map((r) => r.error),
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

export default cloudinaryUtils;
