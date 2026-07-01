const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

/**
 * POST /api/auth/login
 * Authenticates an admin user and returns a JWT + basic profile info.
 * Deliberately returns the same generic error for "no such user" and
 * "wrong password" so we don't leak which one was wrong.
 */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username: username.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid username or password', 401);
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
    },
  });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated admin's profile. Useful for the
 * frontend to verify a stored token is still valid on app load.
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
    },
  });
});

module.exports = { login, getMe };
