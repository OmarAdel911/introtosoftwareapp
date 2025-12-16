const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation Error',
        details: errors
      });
    }

    next();
  };
};

// Common validation schemas
const schemas = {
  user: {
    create: Joi.object({
      firstName: Joi.string().required().min(2).max(50),
      lastName: Joi.string().required().min(2).max(50),
      email: Joi.string().email().required(),
      password: Joi.string().required().min(8),
      role: Joi.string().valid('FREELANCER', 'CLIENT', 'ADMIN').required()
    }),
    update: Joi.object({
      firstName: Joi.string().min(2).max(50),
      lastName: Joi.string().min(2).max(50),
      email: Joi.string().email(),
      bio: Joi.string().max(500),
      skills: Joi.array().items(Joi.string()),
      hourlyRate: Joi.number().min(0),
      phone: Joi.string(),
      location: Joi.string(),
      website: Joi.string().uri(),
      linkedin: Joi.string().uri(),
      github: Joi.string().uri()
    })
  },
  job: {
    create: Joi.object({
      title: Joi.string().required().min(5).max(100),
      description: Joi.string().required().min(20),
      budget: Joi.number().required().min(0),
      skills: Joi.array().items(Joi.string()).required(),
      category: Joi.string().required(),
      deadline: Joi.date().greater('now')
    }),
    update: Joi.object({
      title: Joi.string().min(5).max(100),
      description: Joi.string().min(20),
      budget: Joi.number().min(0),
      skills: Joi.array().items(Joi.string()),
      category: Joi.string(),
      status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CLOSED'),
      deadline: Joi.date().greater('now')
    })
  },
  proposal: {
    create: Joi.object({
      jobId: Joi.string().required(),
      coverLetter: Joi.string().required().min(50),
      amount: Joi.number().required().min(0)
    }),
    update: Joi.object({
      coverLetter: Joi.string().min(50),
      amount: Joi.number().min(0),
      status: Joi.string().valid('PENDING', 'ACCEPTED', 'REJECTED')
    })
  }
};

module.exports = {
  validate,
  schemas
}; 