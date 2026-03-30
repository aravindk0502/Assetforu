const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { query } = require('../db');

// GET /campaigns
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 12 } = req.query;
    
    // Validate and bound pagination parameters
    const MAX_LIMIT = 100;
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit) || 12));
    
    if (parsedPage > 1000000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid page number' 
      });
    }
    
    const offset = (parsedPage - 1) * parsedLimit;

    const result = await query(
      `SELECT id, title, description, location, image_url, credit_price,
              total_slots, filled_slots, status, end_time, badge, is_featured, created_at
       FROM campaigns
       WHERE status = $1
       ORDER BY is_featured DESC, end_time ASC
       LIMIT $2 OFFSET $3`,
      [status, parsedLimit, offset]
    );

    const countResult = await query(`SELECT COUNT(*) FROM campaigns WHERE status = $1`, [status]);

    res.json({
      success: true,
      data: result.rows,
      meta: {
        total: parseInt(countResult.rows[0].count),
        page: parsedPage,
        limit: parsedLimit,
      },
    });
  } catch (err) {
    console.error('[campaigns-list]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch campaigns' });
  }
});

// GET /campaign/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM campaigns WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const campaign = result.rows[0];

    // Check if current user has participated
    let userParticipation = null;
    let remaining_limit = null;
    let already_purchased = 0;
    if (req.user) {
      const partResult = await query(
        `SELECT id, credits_used, credits_purchased, created_at FROM participations
         WHERE user_id = $1 AND campaign_id = $2`,
        [req.user.id, campaign.id]
      );
      userParticipation = partResult.rows[0] || null;
      already_purchased = Number(userParticipation?.credits_purchased || 0);
      remaining_limit = Math.max(0, 3 - already_purchased);
    }

    res.json({ success: true, data: { ...campaign, userParticipation, remaining_limit, already_purchased } });
  } catch (err) {
    console.error('[campaign-detail]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch campaign' });
  }
});

// GET /campaign/:id/limit
router.get('/:id/limit', optionalAuth, async (req, res) => {
  try {
    const limit = 3;
    if (!req.user) {
      return res.json({ success: true, data: { remaining_limit: limit, already_purchased: 0, limit } });
    }

    const sumResult = await query(
      `SELECT COALESCE(SUM(credits_purchased), 0) AS total
       FROM participations WHERE user_id = $1 AND campaign_id = $2`,
      [req.user.id, req.params.id]
    );
    const already = Number(sumResult.rows[0]?.total || 0);
    const remaining = Math.max(0, limit - already);
    return res.json({ success: true, data: { remaining_limit: remaining, already_purchased: already, limit } });
  } catch (err) {
    console.error('[campaign-limit]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch campaign limit' });
  }
});

// POST /participate — access a campaign using credits
router.post('/participate', authenticate, async (req, res) => {
  const client = await require('../db').pool.connect();
  try {
    const { campaign_id, quantity = 1 } = req.body;
    if (!campaign_id) return res.status(400).json({ success: false, message: 'campaign_id required' });
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    await client.query('BEGIN');

    // Fetch campaign
    const campaignResult = await client.query(
      `SELECT * FROM campaigns WHERE id = $1 AND status = 'active' FOR UPDATE`,
      [campaign_id]
    );
    if (!campaignResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Campaign not found or inactive' });
    }
    const campaign = campaignResult.rows[0];

    // Check existing participation + limits
    const existing = await client.query(
      `SELECT id, credits_purchased, credits_used FROM participations WHERE user_id = $1 AND campaign_id = $2 FOR UPDATE`,
      [req.user.id, campaign_id]
    );
    const alreadyPurchased = Number(existing.rows[0]?.credits_purchased || 0);
    const remainingLimit = Math.max(0, 3 - alreadyPurchased);
    if (remainingLimit <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'You have reached the maximum limit for this campaign',
        remaining_limit: 0,
      });
    }
    if (qty > remainingLimit) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `You can only purchase ${remainingLimit} more for this campaign`,
        remaining_limit: remainingLimit,
      });
    }

    // Check wallet
    const walletResult = await client.query(
      `SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [req.user.id]
    );
    const balance = parseFloat(walletResult.rows[0]?.balance || 0);
    const requiredCredits = campaign.credit_price * qty;
    if (balance < requiredCredits) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Insufficient Asset Credits',
        required: requiredCredits,
        available: balance,
      });
    }

    // Deduct credits
    await client.query(
      `UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2`,
      [requiredCredits, req.user.id]
    );

    // Record transaction
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, credits, direction, description, status)
       VALUES ($1, 'campaign_access', 0, $2, 'debit', $3, 'completed')`,
      [req.user.id, requiredCredits, `Campaign access: ${campaign.title} (${qty} pack${qty > 1 ? 's' : ''})`]
    );

    // Record participation
    const totalSoldResult = await client.query(
      `SELECT COALESCE(SUM(credits_purchased), 0) AS total
       FROM participations WHERE campaign_id = $1 FOR UPDATE`,
      [campaign_id]
    );
    const alreadySold = Number(totalSoldResult.rows[0]?.total || 0);
    const allocated_tickets = Array.from({ length: qty }, (_, i) => alreadySold + i + 1);

    let partResult;
    if (existing.rows.length) {
      partResult = await client.query(
        `UPDATE participations
         SET credits_used = credits_used + $1, credits_purchased = credits_purchased + $2
         WHERE user_id = $3 AND campaign_id = $4
         RETURNING *`,
        [requiredCredits, qty, req.user.id, campaign_id]
      );
    } else {
      partResult = await client.query(
        `INSERT INTO participations (user_id, campaign_id, credits_used, credits_purchased)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.user.id, campaign_id, requiredCredits, qty]
      );
    }

    // Update filled slots
    await client.query(
      `UPDATE campaigns SET filled_slots = filled_slots + $1, updated_at = NOW() WHERE id = $2`,
      [qty, campaign_id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'You are now eligible for this campaign. Benefits are complimentary. No guaranteed allocation.',
      data: { ...partResult.rows[0], allocated_tickets },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[participate]', err);
    res.status(500).json({ success: false, message: 'Failed to process participation' });
  } finally {
    client.release();
  }
});

module.exports = router;
