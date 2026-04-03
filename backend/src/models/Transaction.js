const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['credit_purchase', 'store_purchase', 'campaign_access', 'refund'],
    required: true,
  },
  amount: {
    type: Number, // INR amount
    required: true,
  },
  credits: {
    type: Number, // Credit units
    required: true,
  },
  direction: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  reference_id: {
    type: String,
    default: '', // Razorpay order/payment ID
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast lookup
transactionSchema.index({ user_id: 1 });
transactionSchema.index({ reference_id: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
