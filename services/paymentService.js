// services/paymentService.js
const Payment = require('../models/Payment');
const User = require('../models/User');
const axios = require('axios');

class PaymentService {
    constructor() {
        this.config = {
            baseUrl: process.env.SMEPAY_BASE_URL || 'https://api.smepay.io',
            apiKey: process.env.SMEPAY_API_KEY,
            secretKey: process.env.SMEPAY_SECRET_KEY
        };
        this.isDevelopment = process.env.NODE_ENV === 'development' || !this.config.apiKey || this.config.apiKey === process.env.SMEPAY_API_KEY;
    }

    // async initiatePayment(userId, amount, currency = 'INR', metadata = {}) {
    //     try {
    //         console.log('🔄 Initiating payment for user:', userId);
    //         console.log('🔧 Development mode:', this.isDevelopment);

    //         const user = await User.findById(userId);
    //         if (!user) {
    //             throw new Error('User not found');
    //         }

    //         // Generate unique payment reference and order slug
    //         const paymentReference = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    //         const orderSlug = `order_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

    //         // Create payment record
    //         const payment = new Payment({
    //             user: userId,
    //             amount: 100,
    //             currency,
    //             paymentReference,
    //             orderSlug, // Store the slug for SMEpay
    //             description: 'User Registration Fee',
    //             metadata: {
    //                 ...metadata,
    //                 isMock: false
    //             }
    //         });

    //         await payment.save();
    //         console.log('✅ Payment record created:', paymentReference);

    //         // Use mock payment for development
    //         if (this.isDevelopment) {
    //             console.log('🎯 Using MOCK SMEpay system for development');
    //             return {
    //                 paymentId: payment._id,
    //                 order_slug: orderSlug, // SMEpay widget expects this
    //                 payment_reference: paymentReference,
    //                 amount: 100,
    //                 currency: currency,
    //                 userId: userId,
    //                 checkout_url: `https://checkout.smepay.io/widget?slug=${orderSlug}`,
    //                 isMock: false
    //             };
    //         }

    //         // Real SMEpay.io API call
    //         try {
    //             const orderRequest = {
    //                 amount: amount,
    //                 currency: currency,
    //                 customer_email: user.email,
    //                 customer_name: user.name,
    //                 customer_phone: user.phoneNumber,
    //                 reference: paymentReference,
    //                 callback_url: `${process.env.BASE_URL}/api/payments/callback`,
    //                 redirect_url: `${process.env.FRONTEND_URL}/payment/success`,
    //                 metadata: {
    //                     userId: userId.toString(),
    //                     purpose: 'registration'
    //                 }
    //             };

    //             const response = await axios.post(
    //                 `${this.config.baseUrl}/api/v1/orders`, // SMEpay create order endpoint
    //                 orderRequest,
    //                 {
    //                     headers: {
    //                         'Authorization': `Bearer ${this.config.apiKey}`,
    //                         'Content-Type': 'application/json',
    //                         'X-Signature': this.generateSignature(orderRequest)
    //                     },
    //                     timeout: 10000
    //                 }
    //             );

    //             // Update payment with SMEpay order data
    //             if (response.data.order_slug) {
    //                 payment.orderSlug = response.data.order_slug;
    //                 payment.smepayTransactionId = response.data.order_id;
    //                 await payment.save();
    //             }

    //             return {
    //                 paymentId: payment._id,
    //                 order_slug: response.data.order_slug, // Actual SMEpay order slug
    //                 payment_reference: paymentReference,
    //                 amount: amount,
    //                 currency: currency,
    //                 userId: userId,
    //                 checkout_url: response.data.checkout_url,
    //                 isMock: false
    //             };

    //         } catch (gatewayError) {
    //             console.warn('⚠️ SMEpay API failed, falling back to mock:', gatewayError.message);
    //             // Fallback to mock response
    //             return {
    //                 paymentId: payment._id,
    //                 order_slug: orderSlug,
    //                 payment_reference: paymentReference,
    //                 amount: 100,
    //                 currency: currency,
    //                 userId: userId,
    //                 checkout_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/mock-payment?slug=${orderSlug}`,
    //                 isMock: true
    //             };
    //         }

    //     } catch (error) {
    //         console.error('❌ Payment initiation error:', error);
    //         throw new Error(`Payment initiation failed: ${error.message}`);
    //     }
    // }
    // async initiatePayment(userId, amount, currency = 'INR', metadata = {}) {
    //     try {
    //         console.log('🔄 Initiating payment for user:', userId);
    //         console.log('🔧 Environment mode:', process.env.NODE_ENV);

    //         const user = await User.findById(userId);
    //         if (!user) throw new Error('User not found');

    //         // Generate unique identifiers
    //         const paymentReference = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    //         const orderSlug = `order_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

    //         // 🟢 Prepare order request for SMEPay
    //         const orderRequest = {
    //             amount,
    //             currency,
    //             customer_email: user.email,
    //             customer_name: user.name,
    //             customer_phone: user.phoneNumber,
    //             reference: paymentReference,
    //             callback_url: `http://localhost:5000/api/payments/callback`,
    //             redirect_url: `${process.env.FRONTEND_URL}/payment/success`,
    //             metadata: {
    //                 userId: userId.toString(),
    //                 purpose: 'registration'
    //             }
    //         };

    //         console.log('📤 Creating real SMEPay order:', orderRequest);

    //         let response;
    //         try {
    //             // 🧭 Create order via SMEPay API
    //             response = await axios.post(
    //                 `${this.config.baseUrl}/orders`,
    //                 orderRequest,
    //                 {
    //                     headers: {
    //                         'Authorization': `Bearer ${this.config.apiKey}`,
    //                         'Content-Type': 'application/json',
    //                         'X-Signature': this.generateSignature(orderRequest)
    //                     },
    //                     timeout: 10000
    //                 }
    //             );
    //             console.log('✅ SMEPay API response:', response.data);
    //         } catch (gatewayError) {
    //             console.warn('⚠️ SMEPay API failed, switching to mock:', gatewayError.message);
    //         }

    //         // 🧾 Build payment document (save regardless of SMEPay success)
    //         const payment = new Payment({
    //             user: userId,
    //             amount,
    //             currency,
    //             paymentReference,
    //             orderSlug: response?.data?.order_slug || orderSlug,
    //             smepayTransactionId: response?.data?.order_id || null,
    //             description: 'User Registration Fee',
    //             metadata: {
    //                 ...metadata,
    //                 isMock: !response?.data?.order_id
    //             },
    //             paymentGateway: 'smepay',
    //             status: 'pending'
    //         });

    //         await payment.save();
    //         console.log('✅ Payment record created:', paymentReference);

    //         // ✅ Return appropriate checkout URL
    //         const checkoutUrl = response?.data?.checkout_url
    //             ? response.data.checkout_url
    //             : `https://checkout.smepay.io/widget?slug=${orderSlug}`;

    //         return {
    //             paymentId: payment._id,
    //             order_slug: payment.orderSlug,
    //             order_id: payment.smepayTransactionId, // null if mock
    //             payment_reference: paymentReference,
    //             amount,
    //             currency,
    //             userId,
    //             checkout_url: checkoutUrl,
    //             isMock: !response?.data?.order_id
    //         };

    //     } catch (error) {
    //         console.error('❌ Payment initiation error:', error);
    //         throw new Error(`Payment initiation failed: ${error.message}`);
    //     }
    // }
    // const axios = require('axios');
    // const Payment = require('../models/Payment');
    // const User = require('../models/User');

    async initiatePayment(userId, amount, currency = 'INR', metadata = {}) {
        try {
            console.log('🔄 Initiating payment for user:', userId);

            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const paymentReference = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const orderSlug = `order_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
            const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            // 🟢 STEP 1: Authenticate with SMEPay
            console.log('🔑 Authenticating with SMEPay...');
            const authResponse = await axios.post('https://staging.smepay.in/api/wiz/external/auth', {
                client_id: process.env.SMEPAY_API_KEY,
                client_secret: process.env.SMEPAY_SECRET_KEY
            });

            const accessToken = authResponse.data?.access_token;
            if (!accessToken) {
                throw new Error('Failed to get access token from SMEPay');
            }

            console.log('✅ SMEPay Authentication successful');

            // 🟢 STEP 2: Create Order
            console.log('📦 Creating order with SMEPay...');
            const orderPayload = {
                client_id: process.env.SMEPAY_API_KEY,
                amount: amount.toString(),
                order_id: orderId,
                callback_url: `http://localhost:5000/api/payments/callback`,
                customer_details: {
                    email: user.email,
                    mobile: user.phoneNumber,
                    name: user.name || 'Customer'
                }
            };

            const orderResponse = await axios.post(
                'https://extranet.smepay.in/api/wiz/external/order/create',
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

            // 🧾 STEP 3: Save payment record
            const payment = new Payment({
                user: userId,
                amount,
                smepayOrderId: orderResponse.data.order_id,
                currency,
                paymentReference,
                orderSlug: orderData.order_slug || orderSlug,
                smepayTransactionId: orderData.order_id || orderId,
                description: 'User Registration Fee',
                paymentGateway: 'smepay',
                metadata: {
                    ...metadata,
                    isMock: false
                },
                status: 'pending'
            });

            await payment.save();
            console.log('💾 Payment saved successfully:', paymentReference);

            // 🟢 STEP 4: Return structured response
            return {
                success: true,
                message: 'Payment initiated successfully',
                data: {
                    paymentId: payment._id,
                    order_id: orderResponse?.data?.order_id,
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
            const { reference, order_slug, status, transaction_id, failure_reason } = callbackData;

            // Find payment by reference or order_slug
            let payment;
            if (reference) {
                payment = await Payment.findOne({ paymentReference: reference });
            } else if (order_slug) {
                payment = await Payment.findOne({ orderSlug: order_slug });
            }

            if (!payment) {
                throw new Error('Payment not found');
            }

            // Update payment status
            payment.status = this.mapPaymentStatus(status);
            payment.smepayTransactionId = transaction_id || payment.smepayTransactionId;

            if (status === 'success') {
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
            const payment = await Payment.findOne({ smepayOrderId:paymentReference })
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
            'success': 'completed',
            'failed': 'failed',
            'pending': 'pending',
            'cancelled': 'cancelled'
        };
        return statusMap[smepayStatus] || 'failed';
    }
}

module.exports = new PaymentService();