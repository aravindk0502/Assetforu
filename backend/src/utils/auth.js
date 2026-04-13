const jwt = require('jsonwebtoken');

// Enforce JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.error('\n❌ FATAL ERROR: JWT_SECRET environment variable is not set!');
  console.error('Set it in your .env file before running the server.\n');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS (stub — plug in Twilio / MSG91 in production)
const sendOTP = async (phone, otp) => {
  if (process.env.SMS_PROVIDER === 'console' || process.env.NODE_ENV === 'development') {
    console.log(`\n📱 OTP for ${phone}: ${otp}\n`);
    return { success: true, provider: 'console' };
  }

  // --- Twilio example (uncomment & configure) ---
  // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await twilio.messages.create({
  //   body: `Your AssetForU OTP is: ${otp}. Valid for 10 minutes.`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: `+91${phone}`,
  // });

  return { success: true };
};

// Razorpay signature verification
const crypto = require('crypto');
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured');
  }
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
  const a = Buffer.from(String(expectedSignature || ''), 'utf8');
  const b = Buffer.from(String(signature || ''), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = { generateToken, verifyToken, generateOTP, sendOTP, verifyRazorpaySignature };
