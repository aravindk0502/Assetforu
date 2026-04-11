import { verifyJwtHS256 } from '@/app/api/_utils/jwt';
import { loadDynamicAdminPhones, parsePhonesToLast10 } from '@/app/api/_utils/blobAdminPhones';

export type AdminLevel = 'owner' | 'team';

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

async function getAdminLevelByPhone(last10: string): Promise<AdminLevel | null> {
  const envAdmins = parsePhonesToLast10(process.env.ADMIN_PHONES);
  if (envAdmins.has(last10)) return 'owner';
  const dynamic = await loadDynamicAdminPhones();
  if (dynamic.includes(last10)) return 'team';
  return null;
}

export async function requireAdmin(
  req: Request,
  opts?: { ownerOnly?: boolean }
): Promise<
  | { ok: true; payload: Record<string, any>; adminLevel: AdminLevel }
  | { ok: false; status: number; message: string }
> {
  const token = getBearer(req);
  const secret = process.env.JWT_SECRET || process.env.MSG91_API_KEY || 'dev-secret';
  if (!token) return { ok: false, status: 401, message: 'No token provided' };
  const payload = verifyJwtHS256(token, secret) as Record<string, any> | null;
  if (!payload) return { ok: false, status: 401, message: 'Invalid or expired token' };
  if (payload.role !== 'admin') return { ok: false, status: 403, message: 'Admin access required' };

  const last10 = normalizeLast10(payload.phone || payload.sub || '');
  const adminLevel = await getAdminLevelByPhone(last10);
  if (!adminLevel) return { ok: false, status: 403, message: 'Admin access revoked' };
  if (opts?.ownerOnly && adminLevel !== 'owner') return { ok: false, status: 403, message: 'Owner admin required' };

  return { ok: true, payload, adminLevel };
}
