const crypto = require('crypto');

const generateReference = (prefix = 'PAY') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
};

const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  return phone.replace(/\D/g, '');
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const generateSignature = (data, secret) => {
  const stringData = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHmac('sha256', secret).update(stringData).digest('hex');
};

const formatAmount = (amount, currency = 'INR') => {
  return {
    minor: Math.round(amount * 100), // Amount in smallest currency unit
    major: amount, // Amount in major units
    currency: currency,
    formatted: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  };
};

const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  const { __v, ...sanitized } = userObj;
  return sanitized;
};

module.exports = {
  generateReference,
  formatPhoneNumber,
  validateEmail,
  generateSignature,
  formatAmount,
  sanitizeUser
};