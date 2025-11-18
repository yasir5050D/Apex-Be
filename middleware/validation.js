// middleware/validation.js
const Joi = require('joi');

const validateUserRegistration = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(100).required().trim(),
    lastName: Joi.string().min(2).max(100).required().trim(),
    parentage: Joi.string().min(2).max(100).required().trim(),
    grade: Joi.string().min(2).max(20).required().trim(),
    email: Joi.string().email().required().trim().lowercase(),
    phoneNumber: Joi.string().min(10).max(15).required().trim(),
    tehsil: Joi.string().min(5).max(20).required().trim(),
    district: Joi.string().min(5).max(20).required().trim(),
    address: Joi.string().min(10).max(500).required().trim()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

const validatePaymentInitiation = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    amount: Joi.number().min(1).required(),
    currency: Joi.string().valid('USD', 'INR', 'EUR', 'GBP', 'NGN', 'KES').default('INR'),
    metadata: Joi.object().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

const validatePaymentCallback = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid('TEST_SUCCESS', 'SUCCESS', 'FAILED','TEST_FAILED','PENDING', 'CANCELLED').required(),
    transaction_id: Joi.string().optional(),
    amount: Joi.number().optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid callback data'
    });
  }
  next();
};

module.exports = {
  validateUserRegistration,
  validatePaymentInitiation,
  validatePaymentCallback
};