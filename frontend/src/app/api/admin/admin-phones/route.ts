export const runtime = 'nodejs';

import { verifyJwtHS256 } from '@/app/api/_utils/jwt';
import { loadDynamicAdminPhones, parsePhonesToLast10, saveDynamicAdminPhones } from '@/app/api/_utils/blobAdminPhones';

function getBearer(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice(7).trim();
}

function requireAdmin(req: Request) {
  const token = getBearer(req);
  const secret = process.env.JWT_SECRET || process.env.MSG91_API_KEY || 'dev-secret';
  if (!token) return { ok: false as const, status: 401, message: 'No token provided' };
  const payload = verifyJwtHS256(token, secret);
  if (!payload) return { ok: false as const, status: 401, message: 'Invalid or expired token' };
  if (payload.role !== 'admin') return { ok: false as const, status: 403, message: 'Admin access required' };
  return { ok: true as const, payload };
}

function normalizeLast10(raw: string) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 10) return digits.padStart(10, '0').slice(-10);
  return digits.slice(-10);
}

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const envAdmins = Array.from(parsePhonesToLast10(process.env.ADMIN_PHONES)).sort();
  const dynamicAdmins = await loadDynamicAdminPhones();
  const all = Array.from(new Set([...envAdmins, ...dynamicAdmins])).sort();
  return Response.json({ success: true, data: { all, env: envAdmins, dynamic: dynamicAdmins } });
}

export async function PATCH(req: Request) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  try {
    const body = (await req.json().catch(() => ({}))) as { add?: string; remove?: string; phones?: string[] };
    const envAdmins = parsePhonesToLast10(process.env.ADMIN_PHONES);
    const current = await loadDynamicAdminPhones();
    const set = new Set(current);

    if (Array.isArray(body.phones)) {
      set.clear();
      for (const p of body.phones) {
        const last10 = normalizeLast10(String(p));
        if (!last10) continue;
        if (envAdmins.has(last10)) continue; // env admins are always-admin; keep them out of dynamic list.
        set.add(last10);
      }
    }

    if (body.add) {
      const last10 = normalizeLast10(body.add);
      if (last10 && !envAdmins.has(last10)) set.add(last10);
    }
    if (body.remove) {
      const last10 = normalizeLast10(body.remove);
      if (last10) set.delete(last10);
    }

    const next = Array.from(set).sort();
    await saveDynamicAdminPhones(next);

    const all = Array.from(new Set([...Array.from(envAdmins), ...next])).sort();
    return Response.json({ success: true, data: { all, env: Array.from(envAdmins).sort(), dynamic: next } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Update failed';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}

