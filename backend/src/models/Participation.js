const mongoose = require('mongoose');

const participationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  credits_used: {
    type: Number,
    required: true,
  },
  credits_purchased: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Unique constraint: user can participate only once per campaign
participationSchema.index({ user_id: 1, campaign_id: 1 }, { unique: true });
participationSchema.index({ user_id: 1 });
participationSchema.index({ campaign_id: 1 });

module.exports = mongoose.model('Participation', participationSchema);
