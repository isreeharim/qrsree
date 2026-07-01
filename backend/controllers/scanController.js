const mongoose = require('mongoose');
const QRCode = require('../models/QRCode');
const ScanLog = require('../models/ScanLog');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { geoLookup, getClientIp } = require('../utils/geoLookup');

/**
 * Renders the small "redirecting" HTML page served at /q/:shortCode.
 *
 * Why an HTML page instead of an instant 302? A 302 redirect never lets
 * the browser run JavaScript, so we would lose the one thing GPS capture
 * needs: a page load in which we can call navigator.geolocation and ask
 * the visitor for permission. The base scan (IP, country/state/city,
 * timestamp) is already recorded server-side before this page is even
 * sent, so analytics are captured even if the visitor closes the tab
 * before the script finishes. GPS coordinates are a best-effort addition
 * layered on top, sent back to the server if/when permission is granted.
 */
function renderRedirectPage({ destinationUrl, scanLogId }) {
  // JSON.stringify safely escapes quotes/backslashes for embedding in a
  // <script> tag, and we additionally guard against a literal "</script>"
  // inside the destination URL breaking out of the tag.
  const safeDestination = JSON.stringify(destinationUrl).replace(/<\/script/gi, '<\\/script');
  const safeScanLogId = JSON.stringify(scanLogId).replace(/<\/script/gi, '<\\/script');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Redirecting…</title>
<style>
  html, body {
    margin: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0B1220;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
  }
  .wrap { text-align: center; color: #E7ECF3; }
  .spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 16px;
    border-radius: 50%;
    border: 3px solid rgba(0, 201, 167, 0.25);
    border-top-color: #00C9A7;
    animation: spin 0.8s linear infinite;
  }
  p { font-size: 14px; color: #8B99AE; letter-spacing: 0.02em; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="spinner"></div>
    <p>Redirecting…</p>
  </div>
  <script>
    (function () {
      var destination = ${safeDestination};
      var scanLogId = ${safeScanLogId};
      var redirected = false;

      function goToDestination() {
        if (redirected) return;
        redirected = true;
        window.location.replace(destination);
      }

      function sendLocation(latitude, longitude) {
        try {
          fetch('/api/public/scan/' + scanLogId + '/location', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: latitude, longitude: longitude }),
            keepalive: true,
          }).catch(function () {});
        } catch (e) {}
      }

      // Hard ceiling: never make a visitor wait more than ~3s on this page.
      var fallbackTimer = setTimeout(goToDestination, 3000);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function onSuccess(position) {
            clearTimeout(fallbackTimer);
            sendLocation(position.coords.latitude, position.coords.longitude);
            goToDestination();
          },
          function onError() {
            clearTimeout(fallbackTimer);
            goToDestination();
          },
          { timeout: 2500, maximumAge: 0 }
        );
      } else {
        clearTimeout(fallbackTimer);
        goToDestination();
      }
    })();
  </script>
</body>
</html>`;
}

function renderNotFoundPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Link not found</title>
<style>
  html, body {
    margin: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0B1220;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
    color: #E7ECF3;
    text-align: center;
    padding: 24px;
  }
  h1 { font-size: 20px; margin-bottom: 8px; }
  p { color: #8B99AE; font-size: 14px; }
</style>
</head>
<body>
  <div>
    <h1>This QR link doesn't exist</h1>
    <p>The code may have been deleted, or the link was typed incorrectly.</p>
  </div>
</body>
</html>`;
}

/**
 * GET /q/:shortCode
 * The route printed on every QR code. Records analytics immediately,
 * then serves a page that attempts GPS capture before redirecting.
 */
const handleRedirect = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;

  const qr = await QRCode.findOne({ shortCode });

  if (!qr) {
    res.status(404).set('Content-Type', 'text/html').send(renderNotFoundPage());
    return;
  }

  const ip = getClientIp(req);
  const { country, state, city } = await geoLookup(ip);

  const scanLog = await ScanLog.create({
    qrCode: qr._id,
    country,
    state,
    city,
    ipAddress: ip || null,
  });

  qr.scanCount += 1;
  await qr.save();

  res
    .status(200)
    .set('Content-Type', 'text/html')
    .send(renderRedirectPage({ destinationUrl: qr.destinationUrl, scanLogId: scanLog._id.toString() }));
});

/**
 * PATCH /api/public/scan/:scanLogId/location
 * Called from the redirect page's own JavaScript, only when the visitor's
 * browser has granted geolocation permission. Deliberately unauthenticated
 * (the visitor scanning the code isn't an admin) but scoped tightly: it can
 * only ever set lat/lon on one specific, already-created scan log.
 */
const updateScanLocation = asyncHandler(async (req, res) => {
  const { scanLogId } = req.params;
  const { latitude, longitude } = req.body;

  if (!mongoose.Types.ObjectId.isValid(scanLogId)) {
    throw new AppError('Invalid scan log reference', 400);
  }

  const scanLog = await ScanLog.findByIdAndUpdate(
    scanLogId,
    { latitude, longitude },
    { new: true, runValidators: true }
  );

  if (!scanLog) throw new AppError('Scan log not found', 404);

  res.status(200).json({ success: true });
});

/**
 * GET /api/qrcodes/:id/scans
 * Admin-only scan history for a single QR code, most recent first.
 */
const getScanHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

  const qr = await QRCode.findById(id);
  if (!qr) throw new AppError('QR code not found', 404);

  const scans = await ScanLog.find({ qrCode: id }).sort({ timestamp: -1 }).limit(limit);

  res.status(200).json({ success: true, data: scans });
});

module.exports = { handleRedirect, updateScanLocation, getScanHistory };
