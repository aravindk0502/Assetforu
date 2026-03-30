const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { generateToken, generateOTP, sendOTP } = require('../utils/auth');

// POST /auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number required' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate old OTPs
    await query(`UPDATE otp_store SET used = true WHERE phone = $1 AND used = false`, [phone]);

    // Store new OTP
    await query(
      `INSERT INTO otp_store (phone, otp, expires_at) VALUES ($1, $2, $3)`,
      [phone, otp, expiresAt]
    );

    await sendOTP(phone, otp);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      otp, // always return OTP for local/dev convenience
      // Also keep legacy dev-only field
      ...(process.env.NODE_ENV === 'development' && { dev_otp: otp }),
    });
  } catch (err) {
    console.error('[send-otp]', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// POST /auth/dev-login (development-only shortcut for quick testing)
router.post('/dev-login', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ success: false, message: 'Dev login is allowed only in development mode' });
    }

    const { phone, terms_accepted } = req.body;

    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number required' });
    }

    if (!terms_accepted) {
      return res.status(400).json({ success: false, message: 'Terms must be accepted' });
    }

    // Dev-only: create mock user without database
    const mockUserId = `dev_${phone}_${Date.now()}`;
    const mockUser = {
      id: mockUserId,
      phone,
      name: `User ${phone.slice(-4)}`,
      role: 'user',
      is_active: true,
    };

    const token = generateToken({ userId: mockUser.id, phone: mockUser.phone, role: mockUser.role });

    res.json({
      success: true,
      message: 'Dev login successful (mock user)',
      token,
      user: {
        id: mockUser.id,
        phone: mockUser.phone,
        name: mockUser.name,
        role: mockUser.role,
        isNew: true,
      },
    });
  } catch (err) {
    console.error('[dev-login]', err);
    res.status(500).json({ success: false, message: 'Dev login failed' });
  }
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, terms_accepted } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP required' });
    }

    // Fetch valid OTP
    const otpResult = await query(
      `SELECT id FROM otp_store
       WHERE phone = $1 AND otp = $2 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, otp]
    );

    if (!otpResult.rows.length) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await query(`UPDATE otp_store SET used = true WHERE id = $1`, [otpResult.rows[0].id]);

    // Upsert user
    let userResult = await query(`SELECT * FROM users WHERE phone = $1`, [phone]);
    let user;
    let isNew = false;

    if (!userResult.rows.length) {
      if (!terms_accepted) {
        return res.status(400).json({ success: false, message: 'Terms must be accepted for new accounts' });
      }
      const insertResult = await query(
        `INSERT INTO users (phone, is_verified) VALUES ($1, true) RETURNING *`,
        [phone]
      );
      user = insertResult.rows[0];
      // Create wallet
      await query(`INSERT INTO wallets (user_id, balance) VALUES ($1, 0)`, [user.id]);
      isNew = true;
    } else {
      user = userResult.rows[0];
      if (!user.is_active) {
        return res.status(403).json({ success: false, message: 'Account is disabled' });
      }
      // Ensure wallet exists
      await query(
        `INSERT INTO wallets (user_id, balance) VALUES ($1, 0) ON CONFLICT DO NOTHING`,
        [user.id]
      );
    }

    const token = generateToken({ userId: user.id, phone: user.phone, role: user.role });

    res.json({
      success: true,
      message: isNew ? 'Account created successfully' : 'Logged in successfully',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        isNew,
      },
    });
  } catch (err) {
    console.error('[verify-otp]', err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

module.exports = router;
