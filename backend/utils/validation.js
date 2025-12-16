const Joi = require('joi');

const contractValidationSchema = Joi.object({
  terms: Joi.string()
    .required()
    .min(10)
    .max(5000)
    .messages({
      'string.empty': 'Terms are required',
      'string.min': 'Terms must be at least 10 characters long',
      'string.max': 'Terms cannot exceed 5000 characters'
    }),

  description: Joi.string()
    .required()
    .min(10)
    .max(1000)
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 1000 characters'
    }),
});

// Schema specifically for contract submission
const contractSubmissionSchema = Joi.object({
  description: Joi.string()
    .required()
    .min(10)
    .max(1000)
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 1000 characters'
    }),
});

const fileValidation = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ],
  validateFileType: (mimetype) => {
    return fileValidation.allowedTypes.includes(mimetype);
  },
  validateFileSize: (size) => {
    return size <= fileValidation.maxSize;
  }
};

const validateContract = (data) => {
  return contractValidationSchema.validate(data, { abortEarly: false });
};

const validateContractSubmission = (data) => {
  return contractSubmissionSchema.validate(data, { abortEarly: false });
};

const formatValidationError = (error) => {
  if (!error) return null;
  
  return {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: error.details.reduce((acc, curr) => {
      const key = curr.path[0];
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr.message);
      return acc;
    }, {})
  };
};

module.exports = {
  validateContract,
  validateContractSubmission,
  formatValidationError,
  fileValidation
}; 