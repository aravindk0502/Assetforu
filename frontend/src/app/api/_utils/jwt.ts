import crypto from 'node:crypto';

type JwtPayload = Record<string, unknown> & { exp?: number };

function base64UrlToBuffer(input: string) {
  const pad = 4 - (input.length % 4 || 4);
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  return Buffer.from(b64, 'base64');
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function verifyJwtHS256(token: string, secret: string): JwtPayload | null {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const header = safeJsonParse<{ alg?: string }>(base64UrlToBuffer(headerB64).toString('utf8'));
  if (!header || header.alg !== 'HS256') return null;

  const signingInput = `${headerB64}.${payloadB64}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(signingInput).digest();
  const providedSig = base64UrlToBuffer(sigB64);

  // constant-time compare
  if (expectedSig.length !== providedSig.length) return null;
  if (!crypto.timingSafeEqual(expectedSig, providedSig)) return null;

  const payload = safeJsonParse<JwtPayload>(base64UrlToBuffer(payloadB64).toString('utf8'));
  if (!payload) return null;
  if (payload.exp && Date.now() / 1000 > payload.exp) return null;
  return payload;
}

