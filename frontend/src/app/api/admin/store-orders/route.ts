export const runtime = 'nodejs';

import { requireAdmin } from '@/app/api/_utils/adminAuth';
import { loadStoreOrders } from '@/app/api/_utils/blobStoreOrders';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  try {
    const orders = await loadStoreOrders();
    const sorted = orders
      .slice()
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return Response.json({ success: true, data: sorted });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load store orders';
    return Response.json({ success: false, message }, { status: 500 });
  }
}
