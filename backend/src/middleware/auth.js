const { verifyToken } = require('../utils/auth');
const { query } = require('../db');

// Protect routes — require valid JWT
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Fetch fresh user
    const result = await query('SELECT id, phone, name, role, is_active FROM users WHERE id = $1', [decoded.userId]);
    if (!result.rows.length || !result.rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Optional auth — attach user if token present, but don't block
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      const result = await query('SELECT id, phone, name, role FROM users WHERE id = $1', [decoded.userId]);
      if (result.rows.length) req.user = result.rows[0];
    }
  } catch (_) {
    // ignore
  }
  next();
};

// Admin-only
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

module.exports = { authenticate, optionalAuth, requireAdmin };
