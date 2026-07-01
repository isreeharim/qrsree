const QRCode = require('../models/QRCode');
const ScanLog = require('../models/ScanLog');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { generateUniqueShortCode } = require('../utils/generateShortCode');

/**
 * Builds the full public short URL for a QR document, e.g.
 * "https://api.yourdomain.com/q/aB3xZ9k"
 */
function buildShortUrl(shortCode) {
  const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  return `${base}/q/${shortCode}`;
}

function serializeQr(qr) {
  return {
    id: qr._id,
    title: qr.title,
    shortCode: qr.shortCode,
    shortUrl: buildShortUrl(qr.shortCode),
    destinationUrl: qr.destinationUrl,
    scanCount: qr.scanCount,
    createdBy: qr.createdBy,
    createdAt: qr.createdAt,
    updatedAt: qr.updatedAt,
  };
}

/**
 * POST /api/qrcodes
 * Creates a new QR code entry. The short code is generated server-side —
 * the client never supplies it — so uniqueness is always guaranteed.
 */
const createQr = asyncHandler(async (req, res) => {
  const { title, destinationUrl } = req.body;

  const shortCode = await generateUniqueShortCode();

  const qr = await QRCode.create({
    title,
    destinationUrl,
    shortCode,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: serializeQr(qr) });
});

/**
 * GET /api/qrcodes
 * Returns all QR codes, most recently created first. Scoped by user unless admin.
 */
const getAllQr = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
  const qrs = await QRCode.find(filter).populate('createdBy', 'username email').sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: qrs.map(serializeQr) });
});

/**
 * GET /api/qrcodes/:id
 * Returns a single QR code by its Mongo _id. Scoped by ownership.
 */
const getQrById = asyncHandler(async (req, res) => {
  const qr = await QRCode.findById(req.params.id);
  if (!qr) throw new AppError('QR code not found', 404);

  if (req.user.role !== 'admin' && qr.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to access this QR code', 403);
  }

  res.status(200).json({ success: true, data: serializeQr(qr) });
});

/**
 * PUT /api/qrcodes/:id
 * Updates the title and/or destination URL. Scoped by ownership.
 */
const updateQr = asyncHandler(async (req, res) => {
  const { title, destinationUrl } = req.body;

  const qr = await QRCode.findById(req.params.id);
  if (!qr) throw new AppError('QR code not found', 404);

  if (req.user.role !== 'admin' && qr.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to access this QR code', 403);
  }

  if (title !== undefined) qr.title = title;
  if (destinationUrl !== undefined) qr.destinationUrl = destinationUrl;

  await qr.save();

  res.status(200).json({ success: true, data: serializeQr(qr) });
});

/**
 * DELETE /api/qrcodes/:id
 * Deletes a QR code and all of its associated scan logs. Scoped by ownership.
 */
const deleteQr = asyncHandler(async (req, res) => {
  const qr = await QRCode.findById(req.params.id);
  if (!qr) throw new AppError('QR code not found', 404);

  if (req.user.role !== 'admin' && qr.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to access this QR code', 403);
  }

  await ScanLog.deleteMany({ qrCode: qr._id });
  await qr.deleteOne();

  res.status(200).json({ success: true, message: 'QR code deleted successfully' });
});

module.exports = { createQr, getAllQr, getQrById, updateQr, deleteQr, buildShortUrl, serializeQr };
