// // // controllers/paymentController.js
// // const Payment = require('../models/Payment');
// // const User = require('../models/User');
// // const paymentService = require('../services/paymentService');
// // const emailService = require('../services/emailService');
// // const { REGISTRATION_FEE } = require('../utils/constants');

// // const paymentController = {
// //   // Initiate payment for registration
// //   async initiateRegistrationPayment(req, res) {
// //     try {
// //       const { userId } = req.body;

// //       const user = await User.findById(userId);
// //       if (!user) {
// //         return res.status(404).json({
// //           success: false,
// //           error: 'User not found'
// //         });
// //       }

// //       const result = await paymentService.initiatePayment(
// //         userId,
// //         REGISTRATION_FEE,
// //         'INR',
// //         { purpose: 'registration' }
// //       );

// //       // Send registration email
// //       await emailService.sendRegistrationEmail(user, {
// //         paymentReference: result.paymentReference
// //       });

// //       res.json({
// //         success: true,
// //         message: 'Payment initiated successfully',
// //         data: result
// //       });

// //     } catch (error) {
// //       console.error('Payment initiation error:', error);
// //       res.status(500).json({
// //         success: false,
// //         error: error.message
// //       });
// //     }
// //   },

// //   // Handle payment callback from SMEpay.io
// //   async handleCallback(req, res) {
// //     try {
// //       const result = await paymentService.handlePaymentCallback(req.body);

// //       // Send appropriate email based on payment status
// //       const payment = await Payment.findById(result.paymentId).populate('user');

// //       if (result.status === 'completed') {
// //         await emailService.sendPaymentConfirmationEmail(payment.user, payment);
// //       } else if (result.status === 'failed') {
// //         await emailService.sendPaymentFailedEmail(payment.user, payment);
// //       }

// //       res.json({ 
// //         success: true, 
// //         message: 'Callback processed successfully' 
// //       });

// //     } catch (error) {
// //       console.error('Payment callback error:', error);
// //       res.status(500).json({
// //         success: false,
// //         error: error.message
// //       });
// //     }
// //   },

// //   // Get payment status
// //   async getPaymentStatus(req, res) {
// //     try {
// //       const { reference } = req.params;
// //       const status = await paymentService.getPaymentStatus(reference);

// //       res.json({
// //         success: true,
// //         data: status
// //       });

// //     } catch (error) {
// //       console.error('Get payment status error:', error);
// //       res.status(500).json({
// //         success: false,
// //         error: error.message
// //       });
// //     }
// //   },

// //   // Get user payment history
// //   async getUserPayments(req, res) {
// //     try {
// //       const userId = req.params.userId || req.user._id;
// //       const { limit = 10, page = 1 } = req.query;

// //       const payments = await paymentService.getUserPayments(
// //         userId, 
// //         parseInt(limit), 
// //         parseInt(page)
// //       );

// //       res.json({
// //         success: true,
// //         data: payments
// //       });

// //     } catch (error) {
// //       console.error('Get user payments error:', error);
// //       res.status(500).json({
// //         success: false,
// //         error: error.message
// //       });
// //     }
// //   },

// //   // Cancel payment
// //   async cancelPayment(req, res) {
// //     try {
// //       const { reference } = req.params;
// //       const result = await paymentService.cancelPayment(reference);

// //       res.json({
// //         success: true,
// //         data: result
// //       });

// //     } catch (error) {
// //       console.error('Cancel payment error:', error);
// //       res.status(500).json({
// //         success: false,
// //         error: error.message
// //       });
// //     }
// //   },

// //   // Get payment statistics (for admin)
// //   async getPaymentStats(req, res) {
// //     try {
// //       const totalPayments = await Payment.countDocuments();
// //       const completedPayments = await Payment.countDocuments({ status: 'completed' });
// //       const pendingPayments = await Payment.countDocuments({ status: 'pending' });
// //       const totalRevenue = await Payment.aggregate([
// //         { $match: { status: 'completed' } },
// //         { $group: { _id: null, total: { $sum: '$amount' } } }
// //       ]);

// //       const recentPayments = await Payment.find()
// //         .populate('user', 'name email')
// //         .sort({ createdAt: -1 })
// //         .limit(10);

// //       res.json({
// //         success: true,
// //         data: {
// //           stats: {
// //             totalPayments,
// //             completedPayments,
// //             pendingPayments,
// //             totalRevenue: totalRevenue[0]?.total || 0,
// //             successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0
// //           },
// //           recentPayments
// //         }
// //       });

// //     } catch (error) {
// //       console.error('Get payment stats error:', error);
// //       res.status(500).json({
// //         success: false,
// //         error: error.message
// //       });
// //     }
// //   }
// // };

// // module.exports = paymentController;
// // services/paymentService.js
// const Payment = require('../models/Payment');
// const User = require('../models/User');
// const axios = require('axios');

// class PaymentService {
//   constructor() {
//     this.config = {
//       baseUrl: process.env.SMEPAY_BASE_URL || 'https://api.smepay.io',
//       apiKey: process.env.SMEPAY_API_KEY,
//       secretKey: process.env.SMEPAY_SECRET_KEY
//     };
//     this.isDevelopment = process.env.NODE_ENV === 'development' || 
//                         !this.config.apiKey || 
//                         this.config.apiKey === 'your_smepay_api_key_here' ||
//                         this.config.baseUrl.includes('smepay.io');
//   }

//   async initiatePayment(userId, amount, currency = 'INR', metadata = {}) {
//     try {
//       console.log('🔄 Initiating payment for user:', userId);
//       console.log('🔧 Development mode:', this.isDevelopment);

//       const user = await User.findById(userId);
//       if (!user) {
//         throw new Error('User not found');
//       }

//       // Generate unique payment reference and order slug
//       const paymentReference = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//       const orderSlug = `order_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

//       // Create payment record
//       const payment = new Payment({
//         user: userId,
//         amount,
//         currency,
//         paymentReference,
//         orderSlug, // Store the slug for SMEpay
//         description: 'User Registration Fee',
//         metadata: {
//           ...metadata,
//           isMock: this.isDevelopment
//         }
//       });

//       await payment.save();
//       console.log('✅ Payment record created:', paymentReference);

//       // For development: Return mock SMEpay-compatible response
//       if (this.isDevelopment) {
//         console.log('🎯 Using MOCK SMEpay system for development');
//         return {
//           paymentId: payment._id,
//           order_slug: orderSlug, // SMEpay widget expects this
//           payment_reference: paymentReference,
//           amount: amount,
//           currency: currency,
//           userId: userId,
//           checkout_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/mock-payment?slug=${orderSlug}`,
//           isMock: true
//         };
//       }

//       // Real SMEpay.io API call - Create Order to get actual slug
//       try {
//         console.log('🚀 Attempting real SMEpay API...');
//         const orderRequest = {
//           amount: amount,
//           currency: currency,
//           customer_email: user.email,
//           customer_name: user.name,
//           customer_phone: user.phoneNumber,
//           reference: paymentReference,
//           callback_url: `${process.env.BASE_URL}/api/payments/callback`,
//           redirect_url: `${process.env.FRONTEND_URL}/payment/success`,
//           metadata: {
//             userId: userId.toString(),
//             purpose: 'registration'
//           }
//         };

//         const response = await axios.post(
//           `${this.config.baseUrl}/api/v1/orders`, // SMEpay create order endpoint
//           orderRequest,
//           {
//             headers: {
//               'Authorization': `Bearer ${this.config.apiKey}`,
//               'Content-Type': 'application/json',
//               'X-Signature': this.generateSignature(orderRequest)
//             },
//             timeout: 10000
//           }
//         );

//         // Update payment with SMEpay order data
//         if (response.data.order_slug) {
//           payment.orderSlug = response.data.order_slug;
//           payment.smepayTransactionId = response.data.order_id;
//           await payment.save();
//         }

//         return {
//           paymentId: payment._id,
//           order_slug: response.data.order_slug, // Actual SMEpay order slug
//           payment_reference: paymentReference,
//           amount: amount,
//           currency: currency,
//           userId: userId,
//           checkout_url: response.data.checkout_url,
//           isMock: false
//         };

//       } catch (gatewayError) {
//         console.warn('⚠️ SMEpay API failed, falling back to mock:', gatewayError.message);
//         // Fallback to mock response
//         return {
//           paymentId: payment._id,
//           order_slug: orderSlug,
//           payment_reference: paymentReference,
//           amount: amount,
//           currency: currency,
//           userId: userId,
//           checkout_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/mock-payment?slug=${orderSlug}`,
//           isMock: true
//         };
//       }

//     } catch (error) {
//       console.error('❌ Payment initiation error:', error);
//       throw new Error(`Payment initiation failed: ${error.message}`);
//     }
//   }

//   async handlePaymentCallback(callbackData) {
//     try {
//       const { reference, status, transaction_id, order_slug, failure_reason } = callbackData;

//       // Find payment by reference or order_slug
//       let payment;
//       if (reference) {
//         payment = await Payment.findOne({ paymentReference: reference });
//       } else if (order_slug) {
//         payment = await Payment.findOne({ orderSlug: order_slug });
//       }

//       if (!payment) {
//         throw new Error('Payment not found');
//       }

//       // Update payment status
//       payment.status = this.mapPaymentStatus(status);
//       payment.smepayTransactionId = transaction_id || payment.smepayTransactionId;

//       if (status === 'success') {
//         payment.completedAt = new Date();

//         // Activate user
//         await User.findByIdAndUpdate(payment.user, {
//           isActive: true,
//           status: 'active',
//           lastPaymentDate: new Date()
//         });
//       } else if (status === 'failed') {
//         payment.failureReason = failure_reason || 'Payment failed';
//       }

//       await payment.save();

//       return {
//         success: true,
//         paymentId: payment._id,
//         status: payment.status,
//         userId: payment.user
//       };

//     } catch (error) {
//       console.error('Payment callback error:', error);
//       throw new Error(`Callback processing failed: ${error.message}`);
//     }
//   }

//   async getPaymentStatus(paymentReference) {
//     try {
//       const payment = await Payment.findOne({ paymentReference })
//         .populate('user', 'name email phoneNumber isActive');

//       if (!payment) {
//         throw new Error('Payment not found');
//       }

//       return {
//         paymentReference: payment.paymentReference,
//         order_slug: payment.orderSlug,
//         amount: payment.amount,
//         currency: payment.currency,
//         status: payment.status,
//         initiatedAt: payment.initiatedAt,
//         completedAt: payment.completedAt,
//         user: payment.user,
//         failureReason: payment.failureReason,
//         isMock: payment.metadata?.isMock || false
//       };

//     } catch (error) {
//       console.error('Get payment status error:', error);
//       throw new Error(`Status check failed: ${error.message}`);
//     }
//   }

//   async getUserPayments(userId, limit = 10, page = 1) {
//     try {
//       const payments = await Payment.find({ user: userId })
//         .sort({ createdAt: -1 })
//         .limit(limit)
//         .skip((page - 1) * limit)
//         .select('-metadata');

//       const total = await Payment.countDocuments({ user: userId });

//       return {
//         payments,
//         pagination: {
//           current: page,
//           pages: Math.ceil(total / limit),
//           total
//         }
//       };

//     } catch (error) {
//       console.error('Get user payments error:', error);
//       throw new Error(`Failed to get user payments: ${error.message}`);
//     }
//   }

//   async cancelPayment(paymentReference) {
//     try {
//       const payment = await Payment.findOne({ paymentReference });

//       if (!payment) {
//         throw new Error('Payment not found');
//       }

//       if (payment.status !== 'pending') {
//         throw new Error(`Cannot cancel payment with status: ${payment.status}`);
//       }

//       payment.status = 'cancelled';
//       await payment.save();

//       return {
//         success: true,
//         message: 'Payment cancelled successfully'
//       };

//     } catch (error) {
//       console.error('Cancel payment error:', error);
//       throw new Error(`Payment cancellation failed: ${error.message}`);
//     }
//   }

//   async simulatePaymentSuccess(orderSlug) {
//     try {
//       console.log('🎯 Simulating successful payment for:', orderSlug);

//       const payment = await Payment.findOne({ orderSlug });
//       if (!payment) {
//         throw new Error('Payment not found');
//       }

//       // Update payment as completed
//       payment.status = 'completed';
//       payment.completedAt = new Date();
//       payment.smepayTransactionId = `MOCK_TXN_${Date.now()}`;
//       payment.paymentMethod = 'card';
//       await payment.save();

//       // Activate user
//       await User.findByIdAndUpdate(payment.user, {
//         isActive: true,
//         status: 'active',
//         lastPaymentDate: new Date()
//       });

//       console.log('✅ Payment simulation successful for user:', payment.user);

//       return {
//         success: true,
//         paymentId: payment._id,
//         status: payment.status,
//         userId: payment.user
//       };

//     } catch (error) {
//       console.error('❌ Simulate payment error:', error);
//       throw new Error(`Payment simulation failed: ${error.message}`);
//     }
//   }

//   async simulatePaymentFailure(orderSlug, reason = 'Payment failed in simulation') {
//     try {
//       console.log('🎯 Simulating failed payment for:', orderSlug);

//       const payment = await Payment.findOne({ orderSlug });
//       if (!payment) {
//         throw new Error('Payment not found');
//       }

//       // Update payment as failed
//       payment.status = 'failed';
//       payment.failureReason = reason;
//       await payment.save();

//       return {
//         success: true,
//         paymentId: payment._id,
//         status: payment.status,
//         userId: payment.user
//       };

//     } catch (error) {
//       console.error('❌ Simulate payment error:', error);
//       throw new Error(`Payment simulation failed: ${error.message}`);
//     }
//   }

//   generateSignature(requestData) {
//     const crypto = require('crypto');
//     const data = JSON.stringify(requestData) + (this.config.secretKey || '');
//     return crypto.createHash('sha256').update(data).digest('hex');
//   }

//   mapPaymentStatus(smepayStatus) {
//     const statusMap = {
//       'success': 'completed',
//       'failed': 'failed',
//       'pending': 'pending',
//       'cancelled': 'cancelled'
//     };
//     return statusMap[smepayStatus] || 'failed';
//   }
// }

// module.exports = new PaymentService();
// controllers/paymentController.js
const Payment = require('../models/Payment');
const User = require('../models/User');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const { REGISTRATION_FEE } = require('../utils/constants');

const paymentController = {
  // Initiate payment for registration
  async initiateRegistrationPayment(req, res) {
    try {
      console.log('🔄 Payment initiation request:', req.body);

      const { userId } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const result = await paymentService.initiatePayment(
        userId,
        REGISTRATION_FEE,
        'INR',
        { purpose: 'registration' }
      );

      console.log('✅ Payment initiated:', result);

      // Send registration email
      await emailService.sendRegistrationEmail(user, {
        paymentReference: result.payment_reference
      });

      res.json({
        success: true,
        message: 'Payment initiated successfully',
        data: result
      });

    } catch (error) {
      console.error('❌ Payment initiation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Handle payment callback from SMEpay.io
  async handleCallback(req, res) {
    try {
      console.log('🔄 Payment callback received:', req.body);

      const result = await paymentService.handlePaymentCallback(req.body);

      // Send appropriate email based on payment status
      const payment = await Payment.findById(result.paymentId).populate('user');

      if (result.status === 'completed') {
        await emailService.sendPaymentConfirmationEmail(payment.user, payment);
      } else if (result.status === 'failed') {
        await emailService.sendPaymentFailedEmail(payment.user, payment);
      }

      res.json({
        success: true,
        message: 'Callback processed successfully'
      });

    } catch (error) {
      console.error('❌ Payment callback error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  // async updatePaymentStatus(req, res) {
  //   try {
  //     const { orderId } = req.params;
  //     const status = await paymentService.getPaymentStatus(orderId);

  //     res.json({
  //       success: true,
  //       data: status
  //     });

  //   } catch (error) {
  //     console.error('❌ Get payment status error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: error.message
  //     });
  //   }
  // },
  // // Get payment status
  // async getPaymentStatus(req, res) {
  //   try {
  //     const { reference } = req.params;
  //     const status = await paymentService.getPaymentStatus(reference);

  //     res.json({
  //       success: true,
  //       data: status
  //     });

  //   } catch (error) {
  //     console.error('❌ Get payment status error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: error.message
  //     });
  //   }
  // },
  //Update payment status

  //Check status
  async getPaymentStatus(paymentReference) {
    try {
      const payment = await Payment.findOne({
        $or: [
          { smepayOrderId: paymentReference },
          { paymentReference: paymentReference }
        ]
      }).populate('user', 'name email phoneNumber isActive');

      if (!payment) {
        // Return success: false instead of throwing error
        return null;
      }

      return {
        paymentReference: payment.paymentReference,
        order_slug: payment.orderSlug,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        initiatedAt: payment.initiatedAt,
        completedAt: payment.completedAt,
        user: payment.user,
        failureReason: payment.failureReason,
        isMock: payment.metadata?.isMock || false
      };

    } catch (error) {
      console.error('Get payment status error:', error);
      return null;
    }
  },

  // Updated controller
  // Add this to your paymentService
  async updatePaymentStatus(orderId, newStatus, additionalData = {}) {
    try {
      const updateFields = {
        status: newStatus,
        updatedAt: new Date()
      };

      // Add completedAt if status is success/failed
      if (['success', 'failed', 'completed'].includes(newStatus)) {
        updateFields.completedAt = new Date();
      }

      // Add failure reason if provided
      if (additionalData.failureReason) {
        updateFields.failureReason = additionalData.failureReason;
      }

      // Find and update the payment
      const payment = await Payment.findOneAndUpdate(
        {
          $or: [
            { smepayOrderId: orderId },
            { paymentReference: orderId },
            { orderSlug: orderId }
          ]
        },
        updateFields,
        { new: true, runValidators: true } // Return updated document
      ).populate('user', 'name email phoneNumber isActive');

      if (!payment) {
        throw new Error('Payment not found');
      }

      return {
        paymentReference: payment.paymentReference,
        order_slug: payment.orderSlug,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status, // This will be the UPDATED status
        initiatedAt: payment.initiatedAt,
        completedAt: payment.completedAt,
        user: payment.user,
        failureReason: payment.failureReason,
        isMock: payment.metadata?.isMock || false
      };

    } catch (error) {
      console.error('Update payment status error:', error);
      throw new Error(`Payment update failed: ${error.message}`);
    }
  },
  // async updatePaymentStatus(req, res) {
  //     try {
  //       const { orderId } = req.params;
  //       const status = await paymentService.getPaymentStatus(orderId);

  //       if (!status) {
  //         return res.json({
  //           success: false,
  //           error: 'Payment not found'
  //         });
  //       }

  //       res.json({
  //         success: true,
  //         data: status
  //       });

  //     } catch (error) {
  //       console.error('❌ Get payment status error:', error);
  //       res.status(500).json({
  //         success: false,
  //         error: error.message
  //       });
  //     }
  //   },
  // Get user payment history
  async getUserPayments(req, res) {
    try {
      const userId = req.params.userId || req.user._id;
      const { limit = 10, page = 1 } = req.query;

      const payments = await paymentService.getUserPayments(
        userId,
        parseInt(limit),
        parseInt(page)
      );

      res.json({
        success: true,
        data: payments
      });

    } catch (error) {
      console.error('❌ Get user payments error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Cancel payment
  async cancelPayment(req, res) {
    try {
      const { reference } = req.params;
      const result = await paymentService.cancelPayment(reference);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Cancel payment error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get payment statistics (for admin)
  async getPaymentStats(req, res) {
    try {
      const totalPayments = await Payment.countDocuments();
      const completedPayments = await Payment.countDocuments({ status: 'completed' });
      const pendingPayments = await Payment.countDocuments({ status: 'pending' });
      const totalRevenue = await Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const recentPayments = await Payment.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10);

      res.json({
        success: true,
        data: {
          stats: {
            totalPayments,
            completedPayments,
            pendingPayments,
            totalRevenue: totalRevenue[0]?.total || 0,
            successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0
          },
          recentPayments
        }
      });

    } catch (error) {
      console.error('❌ Get payment stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

// Make sure this export is at the end
module.exports = paymentController;