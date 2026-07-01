const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, getMe, register } = require('../controllers/authController');
const { loginRules, registerRules, validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Slows down brute-force login/register attempts without affecting normal use.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', loginLimiter, registerRules, validate, register);
router.post('/login', loginLimiter, loginRules, validate, login);
router.get('/me', protect, getMe);

module.exports = router;
