const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

/**
 * Protects a route: requires a valid `Authorization: Bearer <token>` header.
 * Attaches the authenticated user (without the password) to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Not authorized, no token provided', 401);
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Session expired, please log in again', 401);
    }
    throw new AppError('Not authorized, invalid token', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('The user for this token no longer exists', 401);
  }

  req.user = user;
  next();
});

module.exports = { protect };
