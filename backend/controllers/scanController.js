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
<title>QR Code Disabled</title>
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  html, body {
    height: 100%;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  body {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #060d19;
    background-image:
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 80% 100%, rgba(244,63,94,0.08) 0%, transparent 50%),
      radial-gradient(ellipse 50% 40% at 10% 60%, rgba(14,165,233,0.06) 0%, transparent 50%);
    padding: 24px;
  }

  /* Floating particles */
  .particles {
    position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 0;
  }
  .particle {
    position: absolute;
    border-radius: 50%;
    opacity: 0;
    animation: float linear infinite;
  }
  .particle:nth-child(1)  { width:3px;height:3px;left:12%;background:rgba(99,102,241,0.4);animation-duration:18s;animation-delay:0s; }
  .particle:nth-child(2)  { width:2px;height:2px;left:28%;background:rgba(244,63,94,0.35);animation-duration:22s;animation-delay:3s; }
  .particle:nth-child(3)  { width:4px;height:4px;left:45%;background:rgba(14,165,233,0.3);animation-duration:16s;animation-delay:1s; }
  .particle:nth-child(4)  { width:2px;height:2px;left:62%;background:rgba(168,85,247,0.35);animation-duration:20s;animation-delay:5s; }
  .particle:nth-child(5)  { width:3px;height:3px;left:78%;background:rgba(244,63,94,0.3);animation-duration:24s;animation-delay:2s; }
  .particle:nth-child(6)  { width:2px;height:2px;left:90%;background:rgba(99,102,241,0.25);animation-duration:19s;animation-delay:4s; }
  .particle:nth-child(7)  { width:3px;height:3px;left:35%;background:rgba(14,165,233,0.3);animation-duration:21s;animation-delay:6s; }
  .particle:nth-child(8)  { width:2px;height:2px;left:55%;background:rgba(168,85,247,0.25);animation-duration:17s;animation-delay:1s; }

  @keyframes float {
    0%   { transform: translateY(110vh) scale(0); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(-10vh) scale(1); opacity: 0; }
  }

  /* Card */
  .card {
    position: relative; z-index: 1;
    max-width: 420px; width: 100%;
    padding: 48px 36px;
    text-align: center;
    border-radius: 24px;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(24px) saturate(140%);
    -webkit-backdrop-filter: blur(24px) saturate(140%);
    border: 1px solid rgba(255,255,255,0.06);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.03),
      0 25px 50px -12px rgba(0,0,0,0.5),
      0 0 80px rgba(244,63,94,0.06);
    animation: cardIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(30px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Shield icon */
  .icon-wrap {
    width: 80px; height: 80px;
    margin: 0 auto 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, rgba(244,63,94,0.15), rgba(239,68,68,0.08));
    border: 1px solid rgba(244,63,94,0.2);
    animation: iconIn 0.6s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
    position: relative;
  }
  .icon-wrap::before {
    content: '';
    position: absolute; inset: -4px;
    border-radius: 50%;
    border: 2px solid rgba(244,63,94,0.12);
    animation: pulse-ring 3s ease-in-out infinite;
  }

  @keyframes iconIn {
    from { opacity: 0; transform: scale(0.5) rotate(-10deg); }
    to   { opacity: 1; transform: scale(1) rotate(0); }
  }

  @keyframes pulse-ring {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50%      { transform: scale(1.15); opacity: 0; }
  }

  .icon-wrap svg {
    width: 36px; height: 36px;
    color: #f43f5e;
    filter: drop-shadow(0 0 8px rgba(244,63,94,0.4));
  }

  /* Text */
  h1 {
    font-size: 22px; font-weight: 700;
    letter-spacing: -0.02em;
    color: #f1f5f9;
    margin-bottom: 12px;
    animation: textIn 0.6s 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .subtitle {
    font-size: 15px; line-height: 1.6;
    color: #94a3b8;
    margin-bottom: 32px;
    animation: textIn 0.6s 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes textIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Divider */
  .divider {
    width: 48px; height: 2px; margin: 0 auto 24px;
    border-radius: 2px;
    background: linear-gradient(90deg, transparent, rgba(244,63,94,0.5), transparent);
    animation: textIn 0.6s 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  /* Footer note */
  .footer {
    font-size: 12px; color: #475569;
    animation: textIn 0.6s 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .footer svg { width: 14px; height: 14px; color: #64748b; }

  /* Status pill */
  .status {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 16px;
    border-radius: 999px;
    background: rgba(244,63,94,0.1);
    border: 1px solid rgba(244,63,94,0.2);
    font-size: 12px; font-weight: 600;
    color: #fb7185;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 24px;
    animation: textIn 0.6s 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .status-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #f43f5e;
    animation: blink 2s ease-in-out infinite;
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
</style>
</head>
<body>
  <div class="particles">
    <div class="particle"></div><div class="particle"></div>
    <div class="particle"></div><div class="particle"></div>
    <div class="particle"></div><div class="particle"></div>
    <div class="particle"></div><div class="particle"></div>
  </div>

  <div class="card">
    <div class="icon-wrap">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
      </svg>
    </div>

    <div class="status">
      <span class="status-dot"></span>
      Deactivated
    </div>

    <h1>This QR Code Has Been Disabled</h1>

    <p class="subtitle">
      The owner has temporarily deactivated this link.<br />
      Please contact them if you believe this is an error.
    </p>

    <div class="divider"></div>

    <div class="footer">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.572-.598-3.751h-.152c-3.196 0-6.1-1.25-8.25-3.286Z" />
      </svg>
      Powered by QR System
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

  if (!qr.isActive) {
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
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

  const qr = await QRCode.findById(id);
  if (!qr) throw new AppError('QR code not found', 404);

  if (req.user.role !== 'admin' && qr.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to access this QR code scans', 403);
  }

  const scans = await ScanLog.find({ qrCode: id }).sort({ timestamp: -1 }).limit(limit);

  res.status(200).json({ success: true, data: scans });
});

module.exports = { handleRedirect, updateScanLocation, getScanHistory };
