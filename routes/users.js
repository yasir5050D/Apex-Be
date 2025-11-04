// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUserRegistration } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', validateUserRegistration, userController.register);

// Protected routes
router.get('/:id',userController.getUser)
router.get('/profile', authenticate, userController.getProfile);
router.get('/dashboard', authenticate, userController.getDashboard);
router.put('/profile', authenticate, userController.updateProfile);

module.exports = router;