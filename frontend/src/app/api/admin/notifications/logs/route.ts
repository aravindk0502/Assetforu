export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireAdmin } from '@/app/api/_utils/adminAuth';
import { loadNotificationLogs } from '@/app/api/_utils/blobNotificationLogs';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const logs = await loadNotificationLogs();
  const sorted = logs
    .slice()
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  return Response.json({ success: true, data: sorted });
}

