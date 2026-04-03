const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: '',
  },
  image_url: {
    type: String,
    default: '',
  },
  credit_price: {
    type: Number,
    required: true,
  },
  total_slots: {
    type: Number,
    default: 100,
  },
  filled_slots: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'upcoming'],
    default: 'active',
  },
  end_time: {
    type: Date,
    default: null,
  },
  badge: {
    type: String,
    default: '',
  },
  is_featured: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast lookup
campaignSchema.index({ status: 1 });
campaignSchema.index({ is_featured: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
