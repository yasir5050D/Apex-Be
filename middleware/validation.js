// middleware/validation.js
const Joi = require('joi');

const validateUserRegistration = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required().trim(),
    email: Joi.string().email().required().trim().lowercase(),
    phoneNumber: Joi.string().min(10).max(15).required().trim(),
    address: Joi.object({
      street: Joi.string().max(200).allow('').optional(),
      city: Joi.string().max(100).allow('').optional(),
      state: Joi.string().max(100).allow('').optional(),
      country: Joi.string().max(100).allow('').optional(),
      zipCode: Joi.string().max(20).allow('').optional()
    }).optional()
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
    currency: Joi.string().valid('USD','INR', 'EUR', 'GBP', 'NGN', 'KES').default('INR'),
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
    reference: Joi.string().required(),
    status: Joi.string().valid('success', 'failed', 'pending', 'cancelled').required(),
    transaction_id: Joi.string().optional(),
    failure_reason: Joi.string().optional(),
    amount: Joi.number().optional(),
    currency: Joi.string().optional()
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