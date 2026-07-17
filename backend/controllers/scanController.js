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

function renderDisabledPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>QR Code Inactive</title>
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  html, body {
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #090d16;
    color: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
  }

  /* Sleek, human-engineered grid background reminiscent of developer tools */
  .grid-bg {
    position: absolute;
    inset: 0;
    background-size: 24px 24px;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    z-index: 0;
    pointer-events: none;
  }

  /* Subtle vignette */
  .radial-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 50%, transparent 20%, #090d16 80%);
    z-index: 1;
    pointer-events: none;
  }

  /* Content wrapper */
  .container {
    position: relative;
    z-index: 2;
    max-width: 440px;
    width: 100%;
    padding: 0 24px;
  }

  /* Sleek panel with fine border lines */
  .panel {
    background-color: #111726;
    border: 1px solid #1f293d;
    border-radius: 16px;
    padding: 40px 32px;
    text-align: center;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 
                0 8px 10px -6px rgba(0, 0, 0, 0.5);
  }

  /* Custom broken link icon with crisp red/amber accent */
  .icon-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background-color: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    margin-bottom: 24px;
  }

  .icon-container svg {
    width: 24px;
    height: 24px;
    color: #ef4444;
  }

  /* Clean typography, high contrast */
  h1 {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: #f9fafb;
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
    line-height: 1.57;
    color: #9ca3af;
    margin-bottom: 24px;
  }

  /* Clean, status label */
  .status-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 550;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #9ca3af;
    background-color: #1a2333;
    padding: 4px 12px;
    border-radius: 6px;
    border: 1px solid #28354d;
    margin-bottom: 20px;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    background-color: #9ca3af;
    border-radius: 50%;
  }

  .divider {
    height: 1px;
    background-color: #1f293d;
    margin: 24px 0 0 0;
  }
</style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="radial-overlay"></div>

  <div class="container">
    <div class="panel">
      <div class="icon-container">
        <!-- Crisp Custom SVG for Broken Link / Deactivated State -->
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>

      <div class="status-label">
        <span class="status-dot"></span>
        Temporarily Inactive
      </div>

      <h1>QR Code Deactivated</h1>
      
      <p>
        The administrator has temporarily deactivated this link. If you scanned a physical code or leaflet, please check back again later.
      </p>

      <div class="divider"></div>
    </div>
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

  if (!qr.isActive || (qr.expiresAt && new Date() > new Date(qr.expiresAt))) {
    res.status(410).set('Content-Type', 'text/html').send(renderDisabledPage());
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

const getScanHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const skip = (page - 1) * limit;

  const qr = await QRCode.findById(id);
  if (!qr) throw new AppError('QR code not found', 404);

  if (req.user.role !== 'admin' && qr.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to access this QR code scans', 403);
  }

  const total = await ScanLog.countDocuments({ qrCode: id });
  const scans = await ScanLog.find({ qrCode: id })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: scans,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: skip + scans.length < total,
    },
  });
});

module.exports = { handleRedirect, updateScanLocation, getScanHistory };
