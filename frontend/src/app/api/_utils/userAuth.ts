import { verifyJwtHS256 } from '@/app/api/_utils/jwt';

function getBearer(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice(7).trim();
}

function normalizeLast10(raw: unknown) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 10) return digits.padStart(10, '0').slice(-10);
  return digits.slice(-10);
}

export async function requireUser(
  req: Request
): Promise<
  | { ok: true; payload: Record<string, any>; phoneLast10: string }
  | { ok: false; status: number; message: string }
> {
  const token = getBearer(req);
  const secret = process.env.JWT_SECRET || process.env.MSG91_API_KEY || 'dev-secret';
  if (!token) return { ok: false, status: 401, message: 'No token provided' };
  const payload = verifyJwtHS256(token, secret) as Record<string, any> | null;
  if (!payload) return { ok: false, status: 401, message: 'Invalid or expired token' };
  const phoneLast10 = normalizeLast10(payload.phone || payload.sub || '');
  if (!phoneLast10) return { ok: false, status: 401, message: 'Invalid token payload' };
  return { ok: true, payload, phoneLast10 };
}

