const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {protect} = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

// @route   GET /api/auth/me
// @desc    Get user profile
// @access  Private
router.get('/me', protect, authController.getProfile);

module.exports = router;