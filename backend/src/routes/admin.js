const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { query } = require('../db');

router.use(authenticate, requireAdmin);

// GET /admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await query(
      `SELECT u.id, u.phone, u.name, u.email, u.kyc_status, u.role, u.created_at, w.balance
       FROM users u LEFT JOIN wallets w ON w.user_id = u.id
       ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, (page - 1) * limit]
    );
    const count = await query(`SELECT COUNT(*) FROM users`);
    res.json({ success: true, data: result.rows, meta: { total: parseInt(count.rows[0].count) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /admin/transactions
router.get('/transactions', async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, u.phone FROM transactions t
       JOIN users u ON u.id = t.user_id
       ORDER BY t.created_at DESC LIMIT 50`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /admin/campaigns — create campaign
router.post('/campaigns', async (req, res) => {
  try {
    const { title, description, location, image_url, credit_price, total_slots, end_time, badge, is_featured } = req.body;
    const result = await query(
      `INSERT INTO campaigns (title, description, location, image_url, credit_price, total_slots, end_time, badge, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, description, location, image_url, credit_price, total_slots || 100, end_time, badge, is_featured || false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create campaign' });
  }
});

// PATCH /admin/campaigns/:id
router.patch('/campaigns/:id', async (req, res) => {
  try {
    const fields = ['title', 'description', 'credit_price', 'status', 'end_time', 'badge', 'is_featured'];
    const updates = [];
    const values = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        values.push(req.body[f]);
        updates.push(`${f} = $${values.length}`);
      }
    });
    if (!updates.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
    values.push(req.params.id);
    const result = await query(
      `UPDATE campaigns SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// POST /admin/store-items
router.post('/store-items', async (req, res) => {
  try {
    const { title, description, image_url, type, category, credit_cost, is_popular } = req.body;
    const result = await query(
      `INSERT INTO store_items (title, description, image_url, type, category, credit_cost, is_popular)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, image_url, type, category, credit_cost, is_popular || false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create store item' });
  }
});

// GET /admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [users, txns, campaigns, revenue] = await Promise.all([
      query(`SELECT COUNT(*) FROM users`),
      query(`SELECT COUNT(*) FROM transactions WHERE status = 'completed'`),
      query(`SELECT COUNT(*) FROM campaigns WHERE status = 'active'`),
      query(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE direction = 'credit' AND type = 'credit_purchase'`),
    ]);
    res.json({
      success: true,
      data: {
        total_users: parseInt(users.rows[0].count),
        total_transactions: parseInt(txns.rows[0].count),
        active_campaigns: parseInt(campaigns.rows[0].count),
        total_revenue_inr: parseFloat(revenue.rows[0].total),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
