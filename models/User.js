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
      validator: function (email) {
        // Strict RFC-like validation for email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
        return emailRegex.test(email);
      },
      message: 'Please provide a valid email address (e.g., name@example.com)'
    }
  },

  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function (phone) {
        // ✅ Strict 10-digit Indian format + optional country code (+91)
        const phoneRegex = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
        return phoneRegex.test(phone);
      },
      message: 'Please provide a valid 10-digit mobile number'
    }
  },

  district: {
    type: String,
    trim: true,
    maxlength: [100, 'District name cannot exceed 100 characters']
  },

  tehsil: {
    type: String,
    required: [true, 'Tehsil is required'],
    trim: true,
    minlength: [3, 'Tehsil must be at least 3 characters long'],
    maxlength: [100, 'Tehsil cannot exceed 100 characters']
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
      default: 'India'
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
  timestamps: true, // adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔹 Virtual for full address
userSchema.virtual('fullAddress').get(function () {
  const addressParts = [];
  if (this.address.street) addressParts.push(this.address.street);
  if (this.address.city) addressParts.push(this.address.city);
  if (this.address.state) addressParts.push(this.address.state);
  if (this.address.country) addressParts.push(this.address.country);
  if (this.address.zipCode) addressParts.push(this.address.zipCode);
  return addressParts.join(', ') || 'No address provided';
});

// 🔹 Virtual relation to payments
userSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

// 🔹 Indexes
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ 'address.country': 1 });
userSchema.index({ registrationDate: -1 });
userSchema.index({ status: 1 });

// 🔹 Static method: find active users
userSchema.statics.findActiveUsers = function () {
  return this.find({ isActive: true, status: 'active' });
};

// 🔹 Instance method: check payment eligibility
userSchema.methods.canMakePayment = function () {
  return this.status === 'active' || this.status === 'inactive';
};

// 🔹 Instance method: update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// 🔹 Pre-save middleware for cleanup
userSchema.pre('save', function (next) {
  if (this.phoneNumber && this.isModified('phoneNumber')) {
    // Normalize phone number: remove spaces/dashes
    this.phoneNumber = this.phoneNumber.replace(/\s|-/g, '');
  }

  if (this.email && this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }

  next();
});

module.exports = mongoose.model('User', userSchema);
