const { customAlphabet } = require('nanoid');
const QRCode = require('../models/QRCode');

// Unambiguous alphanumeric alphabet (no 0/O, 1/l/I confusion) so short codes
// are easy to read/type if someone ever needs to enter one manually.
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const generateId = customAlphabet(alphabet, 7);

/**
 * Generates a shortCode that does not already exist in the QRCodes
 * collection. Collisions are astronomically unlikely at length 7, but we
 * guard against them anyway rather than trusting probability alone.
 */
async function generateUniqueShortCode() {
  const MAX_ATTEMPTS = 5;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = generateId();
    // eslint-disable-next-line no-await-in-loop
    const existing = await QRCode.findOne({ shortCode: candidate }).lean();
    if (!existing) return candidate;
  }

  throw new Error('Could not generate a unique short code, please retry');
}

module.exports = { generateUniqueShortCode };
