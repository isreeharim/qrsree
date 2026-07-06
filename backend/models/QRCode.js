const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    destinationUrl: {
      type: String,
      required: [true, 'Destination URL is required'],
      trim: true,
    },
    scanCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true } // createdAt, updatedAt
);

// Virtual: the full public short URL is built from PUBLIC_BASE_URL + shortCode
// at read time (in the controller) rather than stored, so it stays correct
// even if the server's domain changes.

module.exports = mongoose.model('QRCode', qrCodeSchema);
