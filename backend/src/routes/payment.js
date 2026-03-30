const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { verifyRazorpaySignature } = require('../utils/auth');
const { query } = require('../db');

// Razorpay setup (lazy init to avoid crash if keys not set)
let Razorpay;
const getRazorpay = () => {
  if (!Razorpay) {
    const RazorpaySDK = require('razorpay');
    Razorpay = new RazorpaySDK({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
    });
  }
  return Razorpay;
};

// POST /payment/create-order
// Body: { amount_inr: 300 }  → will receive 300 credits for ₹300
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { amount_inr } = req.body;
    if (!amount_inr || amount_inr < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const credits = parseFloat(amount_inr); // 1:1 ratio ₹1 = 1 credit
    const amountPaise = Math.round(amount_inr * 100); // Razorpay needs paise

    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      notes: {
        user_id: req.user.id,
        credits: credits.toString(),
      },
    });

    // Store pending payment order
    await query(
      `INSERT INTO payment_orders (user_id, razorpay_order_id, amount, credits, status)
       VALUES ($1, $2, $3, $4, 'created')`,
      [req.user.id, razorpayOrder.id, amount_inr, credits]
    );

    res.json({
      success: true,
      data: {
        razorpay_order_id: razorpayOrder.id,
        amount: amountPaise,
        currency: 'INR',
        credits,
        key_id: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    console.error('[payment-create]', err);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

// POST /payment/verify
// Called after Razorpay frontend callback
router.post('/verify', authenticate, async (req, res) => {
  const client = await require('../db').pool.connect();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    await client.query('BEGIN');

    // Get the pending payment order
    const poResult = await client.query(
      `SELECT * FROM payment_orders WHERE razorpay_order_id = $1 AND user_id = $2 AND status = 'created'
       FOR UPDATE`,
      [razorpay_order_id, req.user.id]
    );

    if (!poResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Payment order not found' });
    }

    const po = poResult.rows[0];

    // Update payment order
    await client.query(
      `UPDATE payment_orders
       SET razorpay_payment_id = $1, razorpay_signature = $2, status = 'paid', updated_at = NOW()
       WHERE id = $3`,
      [razorpay_payment_id, razorpay_signature, po.id]
    );

    // Credit wallet
    await client.query(
      `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2`,
      [po.credits, req.user.id]
    );

    // Transaction record
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, credits, direction, description, reference_id, status)
       VALUES ($1, 'credit_purchase', $2, $3, 'credit', 'Asset Credits purchased via Razorpay', $4, 'completed')`,
      [req.user.id, po.amount, po.credits, razorpay_payment_id]
    );

    const walletResult = await client.query(`SELECT balance FROM wallets WHERE user_id = $1`, [req.user.id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment verified. Asset Credits added to your wallet.',
      data: {
        credits_added: po.credits,
        new_balance: walletResult.rows[0].balance,
        payment_id: razorpay_payment_id,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[payment-verify]', err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
