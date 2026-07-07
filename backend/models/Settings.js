const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  allowSelfRegistration: {
    type: Boolean,
    default: true,
  },
  maxQrLimitPerUser: {
    type: Number,
    default: 20,
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
