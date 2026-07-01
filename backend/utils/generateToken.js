const jwt = require('jsonwebtoken');

/**
 * Signs a JWT for the given user. Only non-sensitive identifiers are
 * embedded in the payload — never the password hash.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = generateToken;
