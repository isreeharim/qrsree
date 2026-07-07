const User = require('../models/User');
const QRCode = require('../models/QRCode');
const ScanLog = require('../models/ScanLog');
const Settings = require('../models/Settings');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).select('-password');
  
  const usersWithCounts = await Promise.all(
    users.map(async (user) => {
      const qrCount = await QRCode.countDocuments({ createdBy: user._id });
      return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        qrCount,
        createdAt: user.createdAt,
      };
    })
  );

  res.status(200).json({ success: true, data: usersWithCounts });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) throw new AppError('User not found', 404);

  const qrCodes = await QRCode.find({ createdBy: user._id }).sort({ createdAt: -1 });

  const { buildShortUrl } = require('./qrController');

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
      createdAt: user.createdAt,
      qrCodes: qrCodes.map((qr) => ({
        id: qr._id,
        title: qr.title,
        shortCode: qr.shortCode,
        shortUrl: buildShortUrl(qr.shortCode),
        destinationUrl: qr.destinationUrl,
        scanCount: qr.scanCount,
        createdAt: qr.createdAt,
      })),
    },
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    throw new AppError('Role must be admin or user', 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError('Cannot change your own role', 400);
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError('Cannot delete your own account', 400);
  }

  const userQrCodes = await QRCode.find({ createdBy: user._id });
  const qrIds = userQrCodes.map((qr) => qr._id);

  await ScanLog.deleteMany({ qrCode: { $in: qrIds } });
  await QRCode.deleteMany({ createdBy: user._id });
  await user.deleteOne();

  res.status(200).json({ success: true, message: 'User and all associated data deleted' });
});

const getSystemSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne() || await Settings.create({});
  res.status(200).json({ success: true, data: settings });
});

const updateSystemSettings = asyncHandler(async (req, res) => {
  const { allowSelfRegistration, maxQrLimitPerUser } = req.body;
  
  const settings = await Settings.findOne() || await Settings.create({});
  
  if (allowSelfRegistration !== undefined) settings.allowSelfRegistration = allowSelfRegistration;
  if (maxQrLimitPerUser !== undefined) settings.maxQrLimitPerUser = maxQrLimitPerUser;
  
  await settings.save();
  
  res.status(200).json({ success: true, data: settings });
});

module.exports = { getAllUsers, getUserById, updateUserRole, deleteUser, getSystemSettings, updateSystemSettings };
