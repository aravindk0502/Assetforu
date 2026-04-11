export const runtime = 'nodejs';

import { loadDynamicAdminPhones, parsePhonesToLast10, saveDynamicAdminPhones } from '@/app/api/_utils/blobAdminPhones';
import { requireAdmin } from '@/app/api/_utils/adminAuth';

function normalizeLast10(raw: string) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 10) return digits.padStart(10, '0').slice(-10);
  return digits.slice(-10);
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req, { ownerOnly: true });
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const envAdmins = Array.from(parsePhonesToLast10(process.env.ADMIN_PHONES)).sort();
  const dynamicAdmins = await loadDynamicAdminPhones();
  const all = Array.from(new Set([...envAdmins, ...dynamicAdmins])).sort();
  return Response.json({ success: true, data: { all, env: envAdmins, dynamic: dynamicAdmins } });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin(req, { ownerOnly: true });
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
