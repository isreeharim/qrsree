const QRCode = require('../models/QRCode');
const ScanLog = require('../models/ScanLog');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/dashboard/stats
 * Aggregates the headline numbers and recent activity shown on the
 * dashboard in a single round trip. Scopes by user role.
 */
const getStats = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const filter = isAdmin ? {} : { createdBy: req.user._id };

  // For scanning logs, we find logs belonging to QRs owned by the user (if user) or all (if admin)
  let scanFilter = {};
  if (!isAdmin) {
    const userQrs = await QRCode.find({ createdBy: req.user._id }).select('_id');
    const userQrIds = userQrs.map((qr) => qr._id);
    scanFilter = { qrCode: { $in: userQrIds } };
  }

  const [totalQrCodes, totalScansResult, recentScans, totalUsers] = await Promise.all([
    QRCode.countDocuments(filter),
    QRCode.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$scanCount' } } }
    ]),
    ScanLog.find(scanFilter)
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('qrCode', 'title shortCode'),
    isAdmin ? User.countDocuments() : Promise.resolve(0),
  ]);

  const totalScans = totalScansResult[0]?.total || 0;

  const responseData = {
    totalQrCodes,
    totalScans,
    recentScans: recentScans.map((scan) => ({
      id: scan._id,
      qrTitle: scan.qrCode?.title || 'Deleted QR code',
      shortCode: scan.qrCode?.shortCode || '—',
      timestamp: scan.timestamp,
      country: scan.country,
      state: scan.state,
      city: scan.city,
      latitude: scan.latitude,
      longitude: scan.longitude,
    })),
  };

  if (isAdmin) {
    responseData.totalUsers = totalUsers;
  }

  res.status(200).json({
    success: true,
    data: responseData,
  });
});

module.exports = { getStats };
