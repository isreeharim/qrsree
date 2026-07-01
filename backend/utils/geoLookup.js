const axios = require('axios');

const UNKNOWN_GEO = { country: 'Unknown', state: 'Unknown', city: 'Unknown' };

/**
 * Extracts the client's real IP address from the request, accounting for
 * reverse proxies (Nginx, load balancers) that set X-Forwarded-For.
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For can be a comma-separated list; the first entry is
    // the original client.
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '';
}

function isPrivateOrLoopback(ip) {
  if (!ip) return true;
  const cleaned = ip.replace('::ffff:', '');
  return (
    cleaned === '::1' ||
    cleaned === '127.0.0.1' ||
    cleaned.startsWith('10.') ||
    cleaned.startsWith('192.168.') ||
    cleaned.startsWith('172.16.') ||
    cleaned === '' 
  );
}

/**
 * Resolves country / state (region) / city from an IP address using the
 * free ip-api.com service. Falls back to "Unknown" values for local/private
 * IPs (e.g. during local development) or if the lookup fails for any
 * reason — a scan should always be recorded even when geolocation isn't
 * available.
 */
async function geoLookup(ip) {
  if (isPrivateOrLoopback(ip)) {
    return { ...UNKNOWN_GEO };
  }

  try {
    const { data } = await axios.get(`http://ip-api.com/json/${ip}`, {
      params: { fields: 'status,message,country,regionName,city' },
      timeout: 3000,
    });

    if (data.status !== 'success') {
      return { ...UNKNOWN_GEO };
    }

    return {
      country: data.country || 'Unknown',
      state: data.regionName || 'Unknown',
      city: data.city || 'Unknown',
    };
  } catch (err) {
    console.warn('[geoLookup] Failed to resolve IP location:', err.message);
    return { ...UNKNOWN_GEO };
  }
}

module.exports = { geoLookup, getClientIp };
