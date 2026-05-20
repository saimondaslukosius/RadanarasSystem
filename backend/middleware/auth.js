/**
 * JWT Authentication Middleware
 * Reads token from Authorization: Bearer <token> header.
 * Token stored in frontend localStorage as 'rauth_token'.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'radanaras-dev-secret-CHANGE-IN-PRODUCTION';

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Neprisijungta', code: 'UNAUTHORIZED' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Negaliojantis arba pasibaigęs sesijos raktas', code: 'INVALID_TOKEN' });
  }
}

module.exports = { requireAuth, JWT_SECRET };
