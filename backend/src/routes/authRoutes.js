const express = require('express');
const router = express.Router();
const { register, login, getMe, getAllUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const { registerValidator, loginValidator } = require('../middleware/validators');

// Public routes
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);

// Protected routes (Requires Authorization: Bearer <token>)
router.get('/me', protect, getMe);
router.get('/users', protect, getAllUsers);

module.exports = router;
