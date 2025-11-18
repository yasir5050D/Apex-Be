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

  async validateOrder(req, res) {
    const { orderId } = req.params;

    try {

      const amount = REGISTRATION_FEE;

      const result = await paymentService.validateOrder(amount, orderId);

      const payment = await Payment.findOne({
        orderSlug: orderId
      }).populate("user");

      if (result?.paymentStatus == "completed") {

        return res.json({
          success: true,
          message: "Payment Verified Successfully",
          data: {
            ...result,
            transactionId: payment ? payment.smepayTransactionId : null,
            amount: amount
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Payment not completed or invalid",
        });
      }

    } catch (error) {
      console.error("❌ Payment Status Error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to validate payment",
        error: error.message
      });
    }
  },

  async handleCallback(req, res) {
    try {
      console.log("🔄 Payment callback received:", req.body);

      const result = await paymentService.handlePaymentCallback(req.body);

      // Handle ignored callbacks
      if (result.redirect) {
        return res.status(200).json({
          success: true,
          ignored: true,
          message: result.message || "Callback ignored (already processed)"
        });
      }



      const payment = await Payment.findById(result.paymentId).populate("user");

      if (result.status === "completed") {
        await emailService.sendPaymentConfirmationEmail(payment.user, payment);
      } else if (result.status === "failed") {
        await emailService.sendPaymentFailedEmail(payment.user, payment);
      }

      res.status(200).json({
        success: true,
        message: "Callback processed successfully"
      });

    } catch (err) {
      console.error("❌ Payment callback error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Internal Server Error"
      });
    }
  },

  async checkPaymentStatus(req, res) {
    try {

      const { orderId } = req.params;
      const result = await paymentService.checkPaymentStatus(orderId);

      return res.json(result);

    } catch (error) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ status: "FAILED", error: "Server error" });
    }
  },

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