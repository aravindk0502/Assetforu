const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { query } = require('../db');

// GET /store-items
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, category } = req.query;
    let sql = `SELECT * FROM store_items WHERE is_active = true`;
    const params = [];
    if (type) { sql += ` AND type = $${params.length + 1}`; params.push(type); }
    if (category) { sql += ` AND category = $${params.length + 1}`; params.push(category); }
    sql += ` ORDER BY is_popular DESC, credit_cost ASC`;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[store-items]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch store items' });
  }
});

// GET /store-items/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM store_items WHERE id = $1 AND is_active = true`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- CART ---

// GET /store/cart
router.get('/cart/items', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT ci.id, ci.quantity, ci.added_at,
              si.id as item_id, si.title, si.description, si.image_url, si.type, si.category,
              si.credit_cost, (si.credit_cost * ci.quantity) as subtotal
       FROM cart_items ci
       JOIN store_items si ON si.id = ci.store_item_id
       WHERE ci.user_id = $1`,
      [req.user.id]
    );

    const total = result.rows.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({ success: true, data: { items: result.rows, total_credits: total } });
  } catch (err) {
    console.error('[cart-get]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
});

// POST /store/cart — add item
router.post('/cart', authenticate, async (req, res) => {
  try {
    const { store_item_id, quantity = 1 } = req.body;
    if (!store_item_id) return res.status(400).json({ success: false, message: 'store_item_id required' });

    // Verify item exists
    const item = await query(`SELECT id FROM store_items WHERE id = $1 AND is_active = true`, [store_item_id]);
    if (!item.rows.length) return res.status(404).json({ success: false, message: 'Item not found' });

    await query(
      `INSERT INTO cart_items (user_id, store_item_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, store_item_id)
       DO UPDATE SET quantity = cart_items.quantity + $3`,
      [req.user.id, store_item_id, quantity]
    );

    res.json({ success: true, message: 'Item added to cart' });
  } catch (err) {
    console.error('[cart-add]', err);
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
});

// DELETE /store/cart/:itemId — remove item
router.delete('/cart/:itemId', authenticate, async (req, res) => {
  try {
    await query(`DELETE FROM cart_items WHERE user_id = $1 AND id = $2`, [req.user.id, req.params.itemId]);
    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

// POST /store/purchase — checkout cart using credits
router.post('/purchase', authenticate, async (req, res) => {
  const client = await require('../db').pool.connect();
  try {
    await client.query('BEGIN');

    // Get cart
    const cartResult = await client.query(
      `SELECT ci.quantity, si.id as item_id, si.title, si.credit_cost,
              (si.credit_cost * ci.quantity) as subtotal
       FROM cart_items ci
       JOIN store_items si ON si.id = ci.store_item_id
       WHERE ci.user_id = $1`,
      [req.user.id]
    );

    if (!cartResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const totalCredits = cartResult.rows.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);

    // Check wallet
    const walletResult = await client.query(
      `SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [req.user.id]
    );
    if (parseFloat(walletResult.rows[0]?.balance || 0) < totalCredits) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Insufficient Asset Credits' });
    }

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status, total_credits) VALUES ($1, 'completed', $2) RETURNING id`,
      [req.user.id, totalCredits]
    );
    const orderId = orderResult.rows[0].id;

    // Order items
    for (const item of cartResult.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, store_item_id, quantity, credit_cost_each, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.item_id, item.quantity, item.credit_cost, item.subtotal]
      );
    }

    // Deduct credits
    await client.query(
      `UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2`,
      [totalCredits, req.user.id]
    );

    // Transaction log
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, credits, direction, description, reference_id, status)
       VALUES ($1, 'store_purchase', 0, $2, 'debit', 'Store purchase', $3, 'completed')`,
      [req.user.id, totalCredits, orderId]
    );

    // Clear cart
    await client.query(`DELETE FROM cart_items WHERE user_id = $1`, [req.user.id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Purchase complete. You are purchasing Asset Credits. Credits are usable across services.',
      data: { order_id: orderId, credits_spent: totalCredits },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[purchase]', err);
    res.status(500).json({ success: false, message: 'Purchase failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
