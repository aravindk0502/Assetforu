require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./db');

const app = express();
app.set('trust proxy', 1);

// ─── Database Connection ────────────────────────────────────
connectDB().catch((err) => {
  console.error('Failed to connect to Postgres:', err);
  process.exit(1);
});

// ─── Security ───────────────────────────────────────────────
app.use(helmet());

// Enforce HTTPS in production behind proxies (Railway/Vercel).
app.use((req, res, next) => {
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  if (nodeEnv !== 'production') return next();
  const proto = (req.headers['x-forwarded-proto'] || '').toString().split(',')[0].trim();
  if (req.secure || proto === 'https') return next();
  const host = req.headers.host;
  if (!host) return next();
  return res.redirect(308, `https://${host}${req.originalUrl}`);
});

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Rate Limiting ──────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many requests' });
app.use('/api/auth', authLimiter);
app.use(limiter);

// ─── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic audit logging for auth/admin/payment endpoints (no secrets/OTPs).
app.use((req, res, next) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const path = req.originalUrl || '';
    const shouldLog = path.startsWith('/api/auth') || path.startsWith('/api/admin') || path.startsWith('/api/payment');
    if (!shouldLog) return;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    const msg = `[${level}] ${ip} ${req.method} ${path} ${res.statusCode} ${ms}ms`;
    // eslint-disable-next-line no-console
    console.log(msg);
  });
  next();
});

// ─── Health Check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── API Routes ─────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/campaign', require('./routes/campaigns'));          // alias
app.use('/api/store-items', require('./routes/store'));
app.use('/api/store', require('./routes/store'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));

// ─── 404 ────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  const baseUrl = `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`;
  console.log(`\n🌿 AssetForU API running on ${baseUrl}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: ${baseUrl}/health\n`);
});


module.exports = app;
