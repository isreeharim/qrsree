const express = require('express');
const rateLimit = require('express-rate-limit');
const { handleRedirect, updateScanLocation } = require('../controllers/scanController');
const { scanLocationRules, validate } = require('../middleware/validate');

const router = express.Router();

// Generous limiter — these endpoints are hit by real visitors scanning
// codes, not admins, so we only guard against obvious abuse/scripting.
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// Mounted at "/q" in server.js -> GET /q/:shortCode
router.get('/q/:shortCode', publicLimiter, handleRedirect);

// Mounted at "/api/public" in server.js -> PATCH /api/public/scan/:scanLogId/location
router.patch(
  '/api/public/scan/:scanLogId/location',
  publicLimiter,
  scanLocationRules,
  validate,
  updateScanLocation
);

module.exports = router;
