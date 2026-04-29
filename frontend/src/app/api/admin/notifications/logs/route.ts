export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireAdmin } from '@/app/api/_utils/adminAuth';
import { loadNotificationLogs, saveNotificationLogs } from '@/app/api/_utils/blobNotificationLogs';

function trimText(value: unknown, max: number) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function normalizeLink(value: unknown) {
  const link = trimText(value, 2048);
  if (!link) return '';
  if (link.startsWith('/') && !link.startsWith('//')) return link;
  try {
    const u = new URL(link);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
  } catch {
    return '';
  }
  return '';
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const logs = await loadNotificationLogs();
  const sorted = logs
    .slice()
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  return Response.json({ success: true, data: sorted });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    title?: unknown;
    body?: unknown;
    link?: unknown;
  };
  const id = String(body?.id || '').trim();
  if (!id) return Response.json({ success: false, message: 'Notification id is required' }, { status: 400 });

  const nextTitle = trimText(body?.title, 80);
  const nextBody = trimText(body?.body, 240);
  const nextLink = normalizeLink(body?.link);
  if (!nextTitle) return Response.json({ success: false, message: 'Title is required' }, { status: 400 });

  const logs = await loadNotificationLogs();
  const idx = logs.findIndex((l) => l.id === id);
  if (idx < 0) return Response.json({ success: false, message: 'Notification not found' }, { status: 404 });

  const existing = logs[idx];
  logs[idx] = {
    ...existing,
    title: nextTitle,
    body: nextBody || undefined,
    link: nextLink || undefined,
  };
  await saveNotificationLogs(logs);

  return Response.json({ success: true, data: logs[idx] });
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as { id?: string; all?: boolean };
  if (body?.all === true) {
    await saveNotificationLogs([]);
    return Response.json({ success: true });
  }

  const id = String(body?.id || '').trim();
  if (!id) return Response.json({ success: false, message: 'Notification id is required' }, { status: 400 });

  const logs = await loadNotificationLogs();
  const before = logs.length;
  const next = logs.filter((l) => l.id !== id);
  if (next.length === before) return Response.json({ success: false, message: 'Notification not found' }, { status: 404 });
  await saveNotificationLogs(next);
  return Response.json({ success: true });
}
