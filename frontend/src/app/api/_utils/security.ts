type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

function nowMs() {
  return Date.now();
}

function isProdLike() {
  if (envTrue(process.env.ALLOW_LOCAL_DEV_AUTH)) return false;
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV || '').toLowerCase();
  return nodeEnv === 'production' || vercelEnv === 'production';
}

export function envTrue(raw: string | undefined) {
  if (!raw) return false;
  return ['true', '1', 'yes', 'y', 'on'].includes(raw.trim().toLowerCase());
}

export function requireServerEnv(name: string): string {
  const v = getServerEnv(name);
  if (!v) throw new Error(`Server misconfigured: missing ${name}`);
  return v;
}

const ENV_ALIASES: Record<string, string[]> = {
  MSG91_API_KEY: ['smsGatewayAPIKey'],
  MSG91_TEMPLATE_ID: ['smsOTPDLTEID'],
  MSG91_FLOW_ID: ['smsOTPFlowID', 'smsFlowID'],
  MSG91_SENDER_ID: ['smsSenderId', 'MSG91_SENDER'],
  MSG91_ROUTE: ['smsRoute', 'MSG91_MSG_ROUTE'],
  MSG91_DLT_ID: ['smsDltId', 'smsOTPDLTEID_ALT'],
  JWT_SECRET: ['JWT', 'JWT_SECRET_KEY'],
  RAZORPAY_KEY_ID: ['RAZORPAY_ID'],
  RAZORPAY_KEY_SECRET: ['RAZORPAY_SECRET'],
  FIREBASE_SERVICE_ACCOUNT_JSON: ['GOOGLE_APPLICATION_CREDENTIALS_JSON'],
  FIREBASE_PROJECT_ID: ['GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT', 'FIREBASE_ADMIN_PROJECT_ID'],
  FIREBASE_CLIENT_EMAIL: ['GOOGLE_CLIENT_EMAIL', 'FIREBASE_ADMIN_CLIENT_EMAIL'],
  FIREBASE_PRIVATE_KEY: ['GOOGLE_PRIVATE_KEY', 'FIREBASE_ADMIN_PRIVATE_KEY'],
  NEXT_PUBLIC_FIREBASE_API_KEY: ['FIREBASE_API_KEY'],
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ['FIREBASE_AUTH_DOMAIN'],
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: ['FIREBASE_PROJECT_ID'],
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ['FIREBASE_STORAGE_BUCKET'],
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ['FIREBASE_MESSAGING_SENDER_ID'],
  NEXT_PUBLIC_FIREBASE_APP_ID: ['FIREBASE_APP_ID'],
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: ['FIREBASE_MEASUREMENT_ID'],
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: ['FIREBASE_VAPID_KEY'],
};

export function getServerEnv(name: string): string {
  const candidates = [name, ...(ENV_ALIASES[name] || [])];
  for (const key of candidates) {
    const value = process.env[key];
    if (value && String(value).trim()) return String(value).trim();
  }
  return '';
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xrip = req.headers.get('x-real-ip');
  if (xrip) return xrip.trim();
  return 'unknown';
}

function getStore(): Map<string, RateLimitState> {
  const g = globalThis as unknown as { __assetforuRateLimit?: Map<string, RateLimitState> };
  if (!g.__assetforuRateLimit) g.__assetforuRateLimit = new Map();
  return g.__assetforuRateLimit;
}

export function rateLimitOrThrow(opts: RateLimitOptions): void {
  const store = getStore();
  const current = store.get(opts.key);
  const t = nowMs();

  if (!current || current.resetAt <= t) {
    store.set(opts.key, { count: 1, resetAt: t + opts.windowMs });
    return;
  }

  if (current.count >= opts.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - t) / 1000));
    const err = new Error('Too many requests');
    (err as any).status = 429;
    (err as any).retryAfterSeconds = retryAfterSeconds;
    throw err;
  }

  current.count += 1;
  store.set(opts.key, current);
}

export function isDevOtpAllowed(phoneLast10: string): boolean {
  if (isProdLike()) return false;
  if (!envTrue(process.env.DEV_OTP_ENABLED)) return false;
  const raw = process.env.DEV_AUTH_PHONES || '';
  // Local developer convenience: when DEV_AUTH_PHONES is empty and dev OTP is
  // explicitly enabled, allow all phones in non-production environments.
  if (!raw.trim()) return true;
  const allow = new Set(
    raw
      .split(',')
      .map((p) => p.trim().replace(/\D/g, ''))
      .filter(Boolean)
      .map((digits) => (digits.length > 10 ? digits.slice(-10) : digits.padStart(10, '0').slice(-10)))
  );
  return allow.has(phoneLast10);
}
