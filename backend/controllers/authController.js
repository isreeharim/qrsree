const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

/**
 * POST /api/auth/register
 * Registers a new user with default role 'user'.
 */
const register = asyncHandler(async (req, res) => {
  const { username, email, password, department } = req.body;

  const existingUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
  });

  if (existingUser) {
    if (existingUser.username === username.toLowerCase()) {
      throw new AppError('Username already taken', 409);
    } else {
      throw new AppError('Email already registered', 409);
    }
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    department: department.trim(),
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
});

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT + profile info.
 */
const login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;
  try {
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
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Login runtime error: ' + err.message,
      stack: err.stack,
    });
  }
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
    },
  });
});

module.exports = { register, login, getMe };
