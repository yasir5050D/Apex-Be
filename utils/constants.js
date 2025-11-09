const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
};

const PAYMENT_METHODS = {
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  MOBILE_MONEY: 'mobile_money',
  OTHER: 'other'
};

const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  NGN: 'NGN',
  KES: 'KES'
};

const REGISTRATION_FEE =1; // $1.00 in cents

module.exports = {
  PAYMENT_STATUS,
  USER_STATUS,
  PAYMENT_METHODS,
  CURRENCIES,
  REGISTRATION_FEE
};