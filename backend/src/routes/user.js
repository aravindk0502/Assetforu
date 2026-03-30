const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../db');

// GET /user/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.phone, u.name, u.email, u.kyc_status, u.role, u.created_at,
              w.balance
       FROM users u
       LEFT JOIN wallets w ON w.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[profile]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /user/profile
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const result = await query(
      `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), updated_at = NOW()
       WHERE id = $3 RETURNING id, phone, name, email`,
      [name, email, req.user.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[update-profile]', err);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

module.exports = router;
