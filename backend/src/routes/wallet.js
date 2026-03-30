const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../db');

// GET /wallet
router.get('/', authenticate, async (req, res) => {
  try {
    const walletResult = await query(
      `SELECT balance FROM wallets WHERE user_id = $1`,
      [req.user.id]
    );
    const txnResult = await query(
      `SELECT id, type, amount, credits, direction, description, reference_id, status, created_at
       FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        balance: walletResult.rows[0]?.balance || 0,
        transactions: txnResult.rows,
      },
    });
  } catch (err) {
    console.error('[wallet-get]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch wallet' });
  }
});

// POST /wallet/add — called internally after payment verification
router.post('/add', authenticate, async (req, res) => {
  const client = await require('../db').pool.connect();
  try {
    const { credits, amount, reference_id, description } = req.body;
    if (!credits || credits <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid credit amount' });
    }

    await client.query('BEGIN');

    const updated = await client.query(
      `UPDATE wallets SET balance = balance + $1, updated_at = NOW()
       WHERE user_id = $2 RETURNING balance`,
      [credits, req.user.id]
    );

    await client.query(
      `INSERT INTO transactions (user_id, type, amount, credits, direction, description, reference_id, status)
       VALUES ($1, 'credit_purchase', $2, $3, 'credit', $4, $5, 'completed')`,
      [req.user.id, amount || 0, credits, description || 'Credits added', reference_id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Credits added successfully',
      data: { new_balance: updated.rows[0].balance },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[wallet-add]', err);
    res.status(500).json({ success: false, message: 'Failed to add credits' });
  } finally {
    client.release();
  }
});

// POST /wallet/deduct — internal use for store purchases
router.post('/deduct', authenticate, async (req, res) => {
  const client = await require('../db').pool.connect();
  try {
    const { credits, description, reference_id } = req.body;
    if (!credits || credits <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid credit amount' });
    }

    await client.query('BEGIN');

    const check = await client.query(`SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE`, [req.user.id]);
    if (!check.rows.length || parseFloat(check.rows[0].balance) < credits) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Insufficient credits' });
    }

    const updated = await client.query(
      `UPDATE wallets SET balance = balance - $1, updated_at = NOW()
       WHERE user_id = $2 RETURNING balance`,
      [credits, req.user.id]
    );

    await client.query(
      `INSERT INTO transactions (user_id, type, amount, credits, direction, description, reference_id, status)
       VALUES ($1, 'store_purchase', 0, $2, 'debit', $3, $4, 'completed')`,
      [req.user.id, credits, description || 'Store purchase', reference_id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Credits deducted',
      data: { new_balance: updated.rows[0].balance },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[wallet-deduct]', err);
    res.status(500).json({ success: false, message: 'Deduction failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
