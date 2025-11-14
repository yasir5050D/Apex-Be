// routes/payments.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { 
  validatePaymentInitiation, 
  validatePaymentCallback 
} = require('../middleware/validation');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes
router.post('/callback', paymentController.handleCallback);
router.get('/verify/:orderId', paymentController.getPaymentStatus);
router.put('/update-status', paymentController.updatePaymentStatus);

// Protected routes
router.post('/initiate', validatePaymentInitiation, paymentController.initiateRegistrationPayment);
router.get('/user/:userId?', authenticate, paymentController.getUserPayments);
router.post('/:reference/cancel', authenticate, paymentController.cancelPayment);
router.get('/stats', authenticate, paymentController.getPaymentStats);

module.exports = router;