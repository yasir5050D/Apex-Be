// services/paymentService.js
const Payment = require('../models/Payment');
const User = require('../models/User');
const axios = require('axios');

class PaymentService {
    SMEPAY_BASE_URL =
        process.env.NODE_ENV === 'development'
            ? process.env.SMEPAY_STAGING_BASE_URL
            : process.env.SMEPAY_PRODUCTION_BASE_URL;

    SMEPAY_API_KEY =
        process.env.NODE_ENV === 'development'
            ? process.env.SMEPAY_DEV_API_KEY
            : process.env.SMEPAY_PROD_API_KEY;

    SMEPAY_SECRET_KEY =
        process.env.NODE_ENV === 'development'
            ? process.env.SMEPAY_DEV_SECRET_KEY
            : process.env.SMEPAY_PROD_SECRET_KEY;

    async initiatePayment(userId, amount, currency = 'INR', metadata = {}) {
        try {
            console.log('🔄 Initiating payment for user:', userId);

            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const paymentReference = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const orderSlug = `order_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
            const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            // STEP 1: Authenticate with SMEPay
            console.log('🔑 Authenticating with SMEPay...');
            const authResponse = await axios.post(`${this.SMEPAY_BASE_URL}wiz/external/auth`, {
                client_id: this.SMEPAY_API_KEY,
                client_secret: this.SMEPAY_SECRET_KEY
            });

            const accessToken = authResponse.data?.access_token;
            if (!accessToken) throw new Error('Failed to get access token from SMEPay');

            console.log('✅ SMEPay Authentication successful');

            // STEP 2: Create Order
            console.log('📦 Creating order with SMEPay...');
            const orderPayload = {
                client_id: this.SMEPAY_API_KEY,
                amount: amount.toString(),
                order_id: orderId,
                callback_url: process.env.CALLBACK_URL,
                customer_details: {
                    email: user.email,
                    mobile: user.phoneNumber,
                    name: user.firstName || 'Student'
                }
            };

            const orderResponse = await axios.post(
                `${this.SMEPAY_BASE_URL}wiz/external/order/create`,
                orderPayload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ SMEPay Order Created:', orderResponse.data);

            const orderData = orderResponse.data || {};

            // STEP 3: Save payment record
            const payment = new Payment({
                user: userId,
                amount,
                smepayOrderId: orderData.order_id,
                currency,
                paymentReference,
                orderSlug: orderData.order_slug || orderSlug,
                smepayTransactionId: orderData.order_id || orderId,
                description: 'User Registration Fee',
                paymentGateway: 'smepay',
                metadata: { ...metadata, isMock: false },
                status: 'pending'
            });

            await payment.save();
            console.log('💾 Payment saved successfully:', paymentReference);

            // STEP 4: Return structured response
            return {
                success: true,
                message: 'Payment initiated successfully',
                data: {
                    paymentId: payment._id,
                    order_id: orderData.order_id,
                    order_slug: payment.orderSlug,
                    payment_reference: paymentReference,
                    amount,
                    currency,
                    userId,
                    checkout_url: `https://checkout.smepay.io/widget?slug=${payment.orderSlug}`,
                    isMock: false
                }
            };
        } catch (error) {
            console.error('❌ Payment initiation failed:', error.message);
            throw new Error(`Payment initiation failed: ${error.message}`);
        }
    }

    async simulatePaymentSuccess(orderSlug) {
        try {
            console.log('🎯 Simulating successful payment for:', orderSlug);

            const payment = await Payment.findOne({ orderSlug });
            if (!payment) {
                throw new Error('Payment not found');
            }

            // Update payment as completed
            payment.status = 'completed';
            payment.completedAt = new Date();
            payment.smepayTransactionId = `MOCK_TXN_${Date.now()}`;
            payment.paymentMethod = 'card';
            await payment.save();

            // Activate user
            await User.findByIdAndUpdate(payment.user, {
                isActive: true,
                status: 'active',
                lastPaymentDate: new Date()
            });

            console.log('✅ Payment simulation successful for user:', payment.user);

            return {
                success: true,
                paymentId: payment._id,
                status: payment.status,
                userId: payment.user
            };

        } catch (error) {
            console.error('❌ Simulate payment error:', error);
            throw new Error(`Payment simulation failed: ${error.message}`);
        }
    }

    async simulatePaymentFailure(orderSlug, reason = 'Payment failed in simulation') {
        try {
            console.log('🎯 Simulating failed payment for:', orderSlug);

            const payment = await Payment.findOne({ orderSlug });
            if (!payment) {
                throw new Error('Payment not found');
            }

            // Update payment as failed
            payment.status = 'failed';
            payment.failureReason = reason;
            await payment.save();

            return {
                success: true,
                paymentId: payment._id,
                status: payment.status,
                userId: payment.user
            };

        } catch (error) {
            console.error('❌ Simulate payment error:', error);
            throw new Error(`Payment simulation failed: ${error.message}`);
        }
    }

    async handlePaymentCallback(callbackData) {
        try {
          
            const {amount, processed_at, ref_id, transaction_id,  created_at, status } = callbackData;

            // Find payment by reference or order_slug
            let payment;
            if (transaction_id) {
                payment = await Payment.findOne({ orderSlug: transaction_id });
            }
            // } else if (order_slug) {
            //     payment = await Payment.findOne({ orderSlug: order_slug });
            // }

            if (!payment) {
                throw new Error('Payment not found');
            }

            // Update payment status
            payment.status = this.mapPaymentStatus(status);
          //  payment.smepayTransactionId = transaction_id || payment.smepayTransactionId;

            if (status === 'TEST_SUCCESS') {
                payment.completedAt = new Date();

                // Activate user
                await User.findByIdAndUpdate(payment.user, {
                    isActive: true,
                    status: 'active',
                    lastPaymentDate: new Date()
                });
            } else if (status === 'failed') {
                payment.failureReason = failure_reason || 'Payment failed';
            }

            await payment.save();

            return {
                success: true,
                paymentId: payment._id,
                status: payment.status,
                userId: payment.user
            };

        } catch (error) {
            console.error('Payment callback error:', error);
            throw new Error(`Callback processing failed: ${error.message}`);
        }
    }

    async getPaymentStatus(paymentReference) {
        try {
            const payment = await Payment.findOne({ smepayOrderId: paymentReference })
                .populate('user', 'name email phoneNumber isActive');

            if (!payment) {
                throw new Error('Payment not found');
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
            throw new Error(`Status check failed: ${error.message}`);
        }
    }

    async getUserPayments(userId, limit = 10, page = 1) {
        try {
            const payments = await Payment.find({ user: userId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit)
                .select('-metadata');

            const total = await Payment.countDocuments({ user: userId });

            return {
                payments,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            };

        } catch (error) {
            console.error('Get user payments error:', error);
            throw new Error(`Failed to get user payments: ${error.message}`);
        }
    }

    async cancelPayment(paymentReference) {
        try {
            const payment = await Payment.findOne({ paymentReference });

            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status !== 'pending') {
                throw new Error(`Cannot cancel payment with status: ${payment.status}`);
            }

            payment.status = 'cancelled';
            await payment.save();

            return {
                success: true,
                message: 'Payment cancelled successfully'
            };

        } catch (error) {
            console.error('Cancel payment error:', error);
            throw new Error(`Payment cancellation failed: ${error.message}`);
        }
    }

    generateSignature(requestData) {
        const crypto = require('crypto');
        const data = JSON.stringify(requestData) + (this.config.secretKey || '');
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    mapPaymentStatus(smepayStatus) {
        const statusMap = {
            'success': 'TEST_SUCCESS',
            'failed': 'failed',
            'pending': 'pending',
            'cancelled': 'cancelled'
        };
        return statusMap[smepayStatus] || 'failed';
    }
}

module.exports = new PaymentService();