export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireUser } from '@/app/api/_utils/userAuth';
import { loadStoreOrders } from '@/app/api/_utils/blobStoreOrders';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const { id } = await ctx.params;
  const orders = await loadStoreOrders();
  const found = orders.find((o) => o.phone_last10 === auth.phoneLast10 && String(o.id) === String(id));
  if (!found) return Response.json({ success: false, message: 'Order not found' }, { status: 404 });
  return Response.json({ success: true, data: found });
}

