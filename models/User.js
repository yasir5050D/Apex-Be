// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(phone) {
        // Basic phone validation - adjust based on your requirements
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
      },
      message: 'Please provide a valid phone number'
    }
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street cannot exceed 200 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters'],
      default: 'United States'
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: [20, 'ZIP code cannot exceed 20 characters']
    }
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'inactive'
  },
  lastPaymentDate: {
    type: Date
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  const addressParts = [];
  if (this.address.street) addressParts.push(this.address.street);
  if (this.address.city) addressParts.push(this.address.city);
  if (this.address.state) addressParts.push(this.address.state);
  if (this.address.country) addressParts.push(this.address.country);
  if (this.address.zipCode) addressParts.push(this.address.zipCode);
  
  return addressParts.join(', ') || 'No address provided';
});

// Virtual for getting user's payments
userSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ 'address.country': 1 });
userSchema.index({ registrationDate: -1 });
userSchema.index({ status: 1 });

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true, status: 'active' });
};

// Instance method to check if user can make payment
userSchema.methods.canMakePayment = function() {
  return this.status === 'active' || this.status === 'inactive';
};

// Middleware to update lastLogin field
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Pre-save middleware to validate data
userSchema.pre('save', function(next) {
  // Format phone number by removing non-digit characters
  if (this.phoneNumber && this.isModified('phoneNumber')) {
    this.phoneNumber = this.phoneNumber.replace(/\D/g, '');
  }
  
  // Ensure email is lowercase
  if (this.email && this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);