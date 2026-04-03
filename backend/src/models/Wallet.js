const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast lookup
walletSchema.index({ user_id: 1 });

module.exports = mongoose.model('Wallet', walletSchema);
