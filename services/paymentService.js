// services/paymentService.js
const Payment = require('../models/Payment');
const User = require('../models/User');
const axios = require('axios');

class PaymentService {

    SMEPAY_BASE_URL = process.env.SMEPAY_BASE_URL;
    SMEPAY_API_KEY = process.env.SMEPAY_API_KEY;
    SMEPAY_SECRET_KEY = process.env.SMEPAY_SECRET_KEY;


    /**
* Authenticate with SMEPay and return Bearer token
*/
    async getAuthToken() {
        try {
            const response = await axios.post(`${this.SMEPAY_BASE_URL}wiz/external/auth`, {
                client_id: this.SMEPAY_API_KEY,
                client_secret: this.SMEPAY_SECRET_KEY
            });

            const token = response?.data?.access_token;
            if (!token) {
                throw new Error("SMEPay did not return access_token");
            }

            return token;
        } catch (error) {
            console.error("❌ SMEPay Auth Failed:", error.message);
            throw new Error("Failed to authenticate with SMEPay");
        }
    }

    async initiatePayment(userId, amount, currency = 'INR', metadata = {}) {
        try {

            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const paymentReference = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const orderSlug = `order_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
            const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            // STEP 1: Authenticate with SMEPay

            const accessToken = await this.getAuthToken();
            if (!accessToken) throw new Error('Failed to get access token from SMEPay');


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

    /**
   * Validate order status from SMEPay
   */
    async validateOrder(amount, slug) {
        try {
            const token = await this.getAuthToken();
            const payload = {
                client_id: this.SMEPAY_API_KEY,
                amount: amount,
                slug: slug
            };

            const response = await axios.post(
                `${this.SMEPAY_BASE_URL}wiz/external/order/validate`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            const smepayStatus = this.mapPaymentStatus(response.data.payment_status);

            return {
                paymentStatus: smepayStatus,
                status: response.data.status,
            };

        } catch (error) {
            console.error("❌ SMEPay Order Validation Error:", error.message);
            throw new Error("Something went wrong while validating order");
        }
    }


    async simulatePaymentSuccess(orderSlug) {
        try {

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


    async handlePaymentCallback(payload) {
        console.log("Incoming SMEPay Callback:", payload);

        // -----------------------------------------------
        // 1. IGNORE empty/minimal callbacks
        // -----------------------------------------------
        if (!payload.ref_id && !payload.transaction_id && !payload.order_id && payload.status === "SUCCESS") {

            return {
                success: true,
                ignored: true,
                redirect: true,
                message: "Payment Completed"
            };
        }

        // -----------------------------------------------
        // 2. Extract identifiers safely
        // -----------------------------------------------
        const smepayRefId = payload.ref_id || null;
        const smepayTxnId = payload.transaction_id || null;
        const smepayStatus = payload.status || "UNKNOWN";


        // -----------------------------------------------
        // 3. Find payment by transaction ID
        // -----------------------------------------------
        const payment = await Payment.findOne({
            orderSlug: smepayTxnId
        }).populate("user");

        if (!payment) {
            console.error("❌ Payment not found for callback:", smepayTxnId);

            return {
                success: false,
                error: "Payment not found",
                ignored: true
            };
        }
        payment.status = this.mapPaymentStatus(smepayStatus);

        await payment.save();

        console.log("✅ Payment updated:", {
            id: payment._id,
            status: payment.status
        });

        return {
            success: true,
            status: payment.status,
            paymentId: payment._id,
            userId: payment.user ? payment.user._id : null,
        };
    }

    async checkPaymentStatus(orderId) {
        const payment = await Payment.findOne({ orderId });

        if (!payment) {
            return { status: "PENDING" };
        }

        return { status: payment.status };
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
            'TEST_SUCCESS': 'completed',
            'SUCCESS': 'completed',
            'Success': 'completed',

            'FAILED': 'failed',
            'Failed': 'failed',
            'TEST_FAILED': 'failed',

            'PENDING': 'pending',
            'Pending': 'pending',

            'CANCELLED': 'cancelled',
            'Cancelled': 'cancelled',

            'CREATED': 'created',
            'Created': 'created'
        };
        return statusMap[smepayStatus] || 'failed';
    }
}

module.exports = new PaymentService();