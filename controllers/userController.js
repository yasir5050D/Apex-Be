const User = require('../models/User');
const Payment = require('../models/Payment');
const emailService = require('../services/emailService');
const { sanitizeUser } = require('../utils/helpers');

const userController = {
  // Register new user
  async register(req, res) {
    try {
      const { firstName, lastName, parentage, grade, email, phoneNumber, address, tehsil, district } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User already exists with this email'
        });
      }

      // Create user
      const user = new User({
        firstName,
        lastName,
        email,
        grade,
        parentage,
        phoneNumber,
        address,
        district,
        tehsil
      });

      await user.save();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: sanitizeUser(user)
        }
      });

    } catch (error) {
      console.error('User registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed: ' + error.message
      });
    }
  },
  async getUser(req, res) {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            grade: user.grade,
            parentage: user.parentage,
            isActive: user.isActive,
            status: user.status,
            registrationDate: user.registrationDate,
            address: user.address,
            tehsil: user.tehsil,
            district: user.district,
            lastPaymentDate: user.lastPaymentDate,
            lastLogin: user.lastLogin
          }
        }
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user'
      });
    }
  },
  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: sanitizeUser(user)
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  },

  // Get user dashboard
  async getDashboard(req, res) {
    try {
      const user = await User.findById(req.user._id);
      const payments = await Payment.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5);

      const totalPayments = await Payment.countDocuments({ user: req.user._id });
      const successfulPayments = await Payment.countDocuments({
        user: req.user._id,
        status: 'completed'
      });

      res.json({
        success: true,
        data: {
          user: sanitizeUser(user),
          recentPayments: payments,
          stats: {
            totalPayments,
            successfulPayments,
            successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0
          }
        }
      });

    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard'
      });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { name, phoneNumber, address } = req.body;
      const updates = {};

      if (name) updates.name = name;
      if (phoneNumber) updates.phoneNumber = phoneNumber;
      if (address) updates.address = address;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: sanitizeUser(user)
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }
};

module.exports = userController;