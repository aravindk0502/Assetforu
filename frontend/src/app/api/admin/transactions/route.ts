export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireAdmin } from '@/app/api/_utils/adminAuth';
import { loadTransactions } from '@/app/api/_utils/blobTransactions';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const txns = await loadTransactions();
  const sorted = txns
    .slice()
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  return Response.json({ success: true, data: sorted });
}

