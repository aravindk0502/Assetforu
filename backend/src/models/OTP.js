const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expires_at: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // Auto-delete after expiry
  },
  used: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast lookup
otpSchema.index({ phone: 1 });

module.exports = mongoose.model('OTP', otpSchema);
