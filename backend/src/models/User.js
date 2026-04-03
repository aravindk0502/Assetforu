const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
    lowercase: true,
  },
  is_verified: {
    type: Boolean,
    default: false,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  kyc_status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  password_hash: {
    type: String,
    default: '',
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
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
