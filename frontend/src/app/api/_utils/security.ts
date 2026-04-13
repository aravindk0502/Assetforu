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
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV || '').toLowerCase();
  return nodeEnv === 'production' || vercelEnv === 'production';
}

export function envTrue(raw: string | undefined) {
  if (!raw) return false;
  return ['true', '1', 'yes', 'y', 'on'].includes(raw.trim().toLowerCase());
}

export function requireServerEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Server misconfigured: missing ${name}`);
  return v;
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
  if (!raw) return false;
  const allow = new Set(
    raw
      .split(',')
      .map((p) => p.trim().replace(/\D/g, ''))
      .filter(Boolean)
      .map((digits) => (digits.length > 10 ? digits.slice(-10) : digits.padStart(10, '0').slice(-10)))
  );
  return allow.has(phoneLast10);
}

