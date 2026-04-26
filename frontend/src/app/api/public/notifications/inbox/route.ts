export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireUser } from '@/app/api/_utils/userAuth';
import { loadNotificationLogs, type NotificationSendLog } from '@/app/api/_utils/blobNotificationLogs';

function parseLimit(raw: string | null) {
  const n = Number.parseInt(String(raw || '').trim(), 10);
  if (!Number.isFinite(n)) return 30;
  return Math.min(100, Math.max(1, n));
}

function normalizeLast10(raw: unknown) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 10) return digits.padStart(10, '0').slice(-10);
  return digits.slice(-10);
}

function canSeeLog(log: NotificationSendLog, userPhoneLast10: string) {
  if (!log || !log.id) return false;
  if (log.target === 'all') return true;
  const selected = Array.isArray(log.target_phones_last10) ? log.target_phones_last10.map((x) => normalizeLast10(x)) : [];
  return selected.includes(userPhoneLast10);
}

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const url = new URL(req.url);
  const limit = parseLimit(url.searchParams.get('limit'));
  const phone = normalizeLast10(auth.phoneLast10);

  const logs = await loadNotificationLogs();
  const visible = logs
    .filter((log) => canSeeLog(log, phone))
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, limit)
    .map((log) => ({
      id: log.id,
      title: log.title,
      message: log.body || '',
      link: log.link || undefined,
      createdAt: log.created_at,
    }));

  return Response.json({ success: true, data: visible });
}
