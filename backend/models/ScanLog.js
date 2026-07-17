const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema({
  qrCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QRCode',
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  country: {
    type: String,
    default: 'Unknown',
  },
  state: {
    type: String,
    default: 'Unknown',
  },
  city: {
    type: String,
    default: 'Unknown',
  },
  // Only ever populated when the visitor's browser grants GPS permission.
  // Left null when permission is denied, unsupported, or times out.
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
  // Kept for debugging/security purposes (e.g. spotting abuse). Not shown
  // as a headline analytics field but useful to retain alongside geo data.
  ipAddress: {
    type: String,
    default: null,
  },
});

scanLogSchema.index({ qrCode: 1, timestamp: -1 });

module.exports = mongoose.model('ScanLog', scanLogSchema);
