const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary with improved settings
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Validate Cloudinary configuration
const validateConfig = () => {
  const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing Cloudinary configuration: ${missingVars.join(', ')}`);
  }
};

/**
 * Check if a string is a valid base64 data URL
 * @param {string} str - String to check
 * @returns {boolean} - Whether the string is a valid base64 data URL
 */
const isValidDataUrl = (str) => {
  if (!str || typeof str !== 'string') return false;
  const dataUrlPattern = /^data:(.+);base64,/;
  return dataUrlPattern.test(str);
};

/**
 * Get MIME type from data URL
 * @param {string} dataUrl - Data URL to extract MIME type from
 * @returns {string|null} - MIME type or null if invalid
 */
const getMimeType = (dataUrl) => {
  if (!isValidDataUrl(dataUrl)) return null;
  const matches = dataUrl.match(/^data:([^;]+);/);
  return matches ? matches[1] : null;
};

/**
 * Check if file type should be handled as raw
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} - Whether the file should be handled as raw
 */
const isRawType = (mimeType) => {
  if (!mimeType || typeof mimeType !== 'string') return false;
  
  const rawTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];
  
  return rawTypes.includes(mimeType) || 
         mimeType.includes('pdf') || 
         mimeType.includes('document') || 
         mimeType.includes('msword');
};

/**
 * Upload a file to Cloudinary with improved error handling and timeout settings
 * @param {string} fileData - Base64 encoded file data or file path
 * @param {string} folder - Folder to upload to in Cloudinary
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadFile = async (fileData, folder, options = {}) => {
  try {
    // Input validation
    if (!fileData) {
      throw new Error('No file data provided');
    }

    if (typeof fileData !== 'string') {
      throw new Error('File data must be a string');
    }

    // Validate configuration before attempting upload
    console.log('[Cloudinary] Validating configuration');
    validateConfig();
    console.log('[Cloudinary] Configuration validated successfully');

    const uploadOptions = {
      folder: folder || 'uploads',
      resource_type: 'auto',
      timeout: 120000, // 2 minute timeout
      ...options
    };

    console.log('[Cloudinary] Upload options:', {
      folder: uploadOptions.folder,
      resource_type: uploadOptions.resource_type,
      timeout: uploadOptions.timeout,
      hasPublicId: !!uploadOptions.public_id,
      hasTags: !!uploadOptions.tags
    });

    // Handle base64 data URLs
    if (isValidDataUrl(fileData)) {
      const mimeType = getMimeType(fileData);
      console.log('[Cloudinary] Detected MIME type:', mimeType);

      if (isRawType(mimeType)) {
        console.log('[Cloudinary] Using raw resource type for:', mimeType);
        uploadOptions.resource_type = 'raw';
      }

      // For large files
      if (fileData.length > 10000000) { // 10MB
        console.log('[Cloudinary] Large file detected, using chunked upload');
        return await new Promise((resolve, reject) => {
          let attempt = 0;
          const maxAttempts = 3;
          
          const attemptUpload = async () => {
            try {
              attempt++;
              console.log(`[Cloudinary] Upload attempt ${attempt} of ${maxAttempts}`);
              
              const result = await cloudinary.uploader.upload(fileData, {
                ...uploadOptions,
                chunk_size: 5000000, // 5MB chunks
                timeout: 300000 // 5 minutes for large files
              });
              
              console.log('[Cloudinary] Upload successful:', {
                public_id: result.public_id,
                hasUrl: !!result.secure_url,
                resource_type: result.resource_type
              });
              
              resolve(result);
            } catch (error) {
              console.error(`[Cloudinary] Upload attempt ${attempt} failed:`, {
                error: error,
                message: error.message,
                code: error.http_code,
                details: error.error || error
              });
              
              if (attempt < maxAttempts) {
                console.log(`[Cloudinary] Retrying upload in 2 seconds...`);
                setTimeout(attemptUpload, 2000);
              } else {
                reject(new Error('Upload failed after multiple attempts'));
              }
            }
          };
          
          attemptUpload();
        });
      }

      // For smaller files
      console.log('[Cloudinary] Using regular upload');
      let attempt = 0;
      const maxAttempts = 3;
      
      while (attempt < maxAttempts) {
        try {
          attempt++;
          console.log(`[Cloudinary] Upload attempt ${attempt} of ${maxAttempts}`);
          const result = await cloudinary.uploader.upload(fileData, uploadOptions);
          
          console.log('[Cloudinary] Upload successful:', {
            public_id: result.public_id,
            hasUrl: !!result.secure_url,
            resource_type: result.resource_type
          });
          
          return result;
        } catch (error) {
          console.error(`[Cloudinary] Upload attempt ${attempt} failed:`, {
            error: error,
            message: error.message,
            code: error.http_code,
            details: error.error || error
          });
          
          if (attempt === maxAttempts) {
            throw error;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Handle file paths
    if (typeof fileData === 'string' && !isValidDataUrl(fileData)) {
      if (!fs.existsSync(fileData)) {
        throw new Error('File not found: ' + fileData);
      }

      console.log('[Cloudinary] Uploading file from path:', path.basename(fileData));
      const result = await cloudinary.uploader.upload(fileData, uploadOptions);
      return result;
    }

    throw new Error('Invalid file data format');
  } catch (error) {
    console.error('[Cloudinary] Error uploading to Cloudinary:', {
      message: error.message,
      code: error.http_code,
      details: error.error || error,
      stack: error.stack
    });

    // Enhance error message based on the type of error
    if (error.http_code === 499 || error.message.includes('timeout')) {
      throw new Error('Upload timeout - please try again with a smaller file or better connection');
    } else if (error.http_code === 413) {
      throw new Error('File too large - maximum size is 10MB');
    } else if (error.message && error.message.includes('CLOUDINARY_')) {
      throw new Error('Cloudinary configuration error - please contact support');
    } else if (error.error && error.error.message) {
      throw new Error(`Upload failed: ${error.error.message}`);
    } else {
      throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @param {Object} options - Additional delete options
 * @returns {Promise<Object>} - Cloudinary delete result
 */
const deleteFile = async (publicId, options = {}) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, options);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

/**
 * Get a signed URL for a file
 * @param {string} publicId - Public ID of the file
 * @param {Object} options - Additional options for URL generation
 * @returns {string} - Signed URL
 */
const getSignedUrl = (publicId, options = {}) => {
  try {
    return cloudinary.utils.private_download_url(publicId, 'pdf', options);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  getSignedUrl,
}; 