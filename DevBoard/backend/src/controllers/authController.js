const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const {
  generateAccessToken,
  generateRefreshToken,
  sendRefreshTokenCookie
} = require('../utils/token');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email is already registered', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Send refresh token as HTTP-Only Cookie
  sendRefreshTokenCookie(res, refreshToken);

  // Don't send password in response
  user.password = undefined;

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      accessToken
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Find user and explicitly select password
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Send refresh token cookie
  sendRefreshTokenCookie(res, refreshToken);

  // Hide password in response
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: {
      user,
      accessToken
    }
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new AppError('Refresh token not found. Please log in.', 401));
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token. Please log in.', 401));
  }

  // Check if user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Generate new access token
  const accessToken = generateAccessToken(user);

  res.status(200).json({
    success: true,
    message: 'Access token refreshed successfully',
    data: {
      accessToken
    }
  });
});

// @desc    Logout user / Clear refresh cookie
// @route   POST /api/auth/logout
// @access  Public
exports.logout = catchAsync(async (req, res, next) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: null
  });
});

// @desc    Get all users (for assignment selects)
// @route   GET /api/auth/users
// @access  Private
exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({}).select('name email role');
  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: { users }
  });
});
