// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [1, 'Amount must be at least 1 cent'],
        validate: {
            validator: function (amount) {
                return amount > 0;
            },
            message: 'Amount must be a positive number'
        }
    },
    currency: {
        type: String,
        required: true,
        enum: ['USD', 'INR', 'EUR', 'GBP', 'NGN', 'KES'],
        default: 'INR',
        uppercase: true,
        trim: true
    },
    orderSlug: {
        type: String,
        unique: true,
        sparse: true
    },
    smepayOrderId: {
        type: String,
        trim: true,
        sparse: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
        default: 'pending',
        index: true
    },
    paymentReference: {
        type: String,
        required: [true, 'Payment reference is required'],
        unique: true,
        trim: true,
        index: true
    },
    smepayTransactionId: {
        type: String,
        sparse: true, // Allows multiple null values but enforces uniqueness for non-null
        trim: true
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'bank_transfer', 'mobile_money', 'wallet', 'other'],
        default: 'other'
    },
    paymentGateway: {
        type: String,
        default: 'smepay',
        enum: ['smepay', 'stripe', 'paypal', 'other']
    },
    description: {
        type: String,
        default: 'User Registration Fee',
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    metadata: {
        type: Map,
        of: String,
        default: new Map()
    },
    initiatedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    completedAt: {
        type: Date
    },
    failureReason: {
        type: String,
        maxlength: [1000, 'Failure reason cannot exceed 1000 characters']
    },
    refundAmount: {
        type: Number,
        min: 0,
        validate: {
            validator: function (amount) {
                return amount <= this.amount;
            },
            message: 'Refund amount cannot exceed original payment amount'
        }
    },
    refundedAt: {
        type: Date
    },
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true,
        maxlength: [500, 'User agent cannot exceed 500 characters']
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function () {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.currency
    }).format(this.amount / 100); // Assuming amount is in cents
});

// Virtual for payment duration (if completed)
paymentSchema.virtual('processingTime').get(function () {
    if (this.completedAt && this.initiatedAt) {
        return this.completedAt - this.initiatedAt;
    }
    return null;
});

// Virtual for isRefunded
paymentSchema.virtual('isRefunded').get(function () {
    return this.status === 'refunded' && this.refundAmount > 0;
});

// Indexes for better query performance
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1, initiatedAt: -1 });
paymentSchema.index({ paymentReference: 1 });
paymentSchema.index({ smepayTransactionId: 1 }, { sparse: true });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ completedAt: -1 });

// Static method to find successful payments
paymentSchema.statics.findSuccessfulPayments = function () {
    return this.find({ status: 'completed' });
};

// Static method to calculate total revenue
paymentSchema.statics.getTotalRevenue = async function (currency = 'INR') {
    const result = await this.aggregate([
        {
            $match: {
                status: 'completed',
                currency: currency
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    return result.length > 0 ? {
        totalAmount: result[0].totalAmount,
        count: result[0].count,
        formattedTotal: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(result[0].totalAmount / 100)
    } : { totalAmount: 0, count: 0, formattedTotal: '$0.00' };
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);

    return stats.reduce((acc, stat) => {
        acc[stat._id] = {
            count: stat.count,
            totalAmount: stat.totalAmount
        };
        return acc;
    }, {});
};

// Instance method to mark payment as completed
paymentSchema.methods.markAsCompleted = function (transactionId = null) {
    this.status = 'completed';
    this.completedAt = new Date();
    if (transactionId) {
        this.smepayTransactionId = transactionId;
    }
    return this.save();
};

// Instance method to mark payment as failed
paymentSchema.methods.markAsFailed = function (reason = 'Payment failed') {
    this.status = 'failed';
    this.failureReason = reason;
    return this.save();
};

// Instance method to process refund
paymentSchema.methods.processRefund = function (amount = null, reason = 'Refund processed') {
    this.status = 'refunded';
    this.refundAmount = amount || this.amount;
    this.refundedAt = new Date();
    this.metadata.set('refundReason', reason);
    return this.save();
};

// Pre-save middleware
paymentSchema.pre('save', function (next) {
    // Update metadata with current timestamp
    if (this.isModified('status')) {
        this.metadata.set(`status_${this.status}`, new Date().toISOString());
    }

    // Validate that completedAt is set when status is completed
    if (this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }

    // Validate refund amount
    if (this.refundAmount && this.refundAmount > this.amount) {
        next(new Error('Refund amount cannot exceed original payment amount'));
    }

    next();
});

// Post-save middleware to update user status
paymentSchema.post('save', async function (doc) {
    try {
        const User = mongoose.model('User');

        if (doc.status === 'completed') {
            // Update user to active when payment is completed
            await User.findByIdAndUpdate(doc.user, {
                isActive: true,
                status: 'active',
                lastPaymentDate: doc.completedAt
            });
        } else if (doc.status === 'failed' || doc.status === 'cancelled') {
            // Ensure user remains inactive if payment fails
            await User.findByIdAndUpdate(doc.user, {
                isActive: false,
                status: 'inactive'
            });
        }
    } catch (error) {
        console.error('Error updating user status after payment save:', error);
    }
});

module.exports = mongoose.model('Payment', paymentSchema);