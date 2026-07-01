const QRCode = require('../models/QRCode');
const ScanLog = require('../models/ScanLog');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/dashboard/stats
 * Aggregates the headline numbers and recent activity shown on the
 * admin dashboard in a single round trip.
 */
const getStats = asyncHandler(async (req, res) => {
  const [totalQrCodes, totalScansResult, recentScans] = await Promise.all([
    QRCode.countDocuments(),
    QRCode.aggregate([{ $group: { _id: null, total: { $sum: '$scanCount' } } }]),
    ScanLog.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('qrCode', 'title shortCode'),
  ]);

  const totalScans = totalScansResult[0]?.total || 0;

  res.status(200).json({
    success: true,
    data: {
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
    },
  });
});

module.exports = { getStats };
