export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import crypto from 'node:crypto';
import { requireUser } from '@/app/api/_utils/userAuth';
import { loadStoreOrders, saveStoreOrders, type StoreOrderItem } from '@/app/api/_utils/blobStoreOrders';
import { loadTransactions, saveTransactions } from '@/app/api/_utils/blobTransactions';

function nowIso() {
  return new Date().toISOString();
}

function toInt(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as {
    items?: Array<Partial<StoreOrderItem> & { item_id?: string; title?: string; type?: string; credits?: number; quantity?: number }>;
    delivery_address?: any;
  };

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items: StoreOrderItem[] = rawItems
    .map((it) => {
      const type = String(it.type || '').toLowerCase() === 'service' ? 'service' : 'product';
      const credits = Math.max(0, toInt(it.credits, 0));
      const quantity = Math.max(1, Math.min(20, toInt(it.quantity, 1)));
      return {
        item_id: String(it.item_id || '').trim(),
        title: String(it.title || '').trim() || 'Store Item',
        type,
        credits,
        quantity,
      } satisfies StoreOrderItem;
    })
    .filter((it) => it.item_id && it.credits > 0);

  if (!items.length) {
    return Response.json({ success: false, message: 'No valid store items' }, { status: 400 });
  }

  const totalCredits = items.reduce((sum, it) => sum + it.credits * it.quantity, 0);
  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  const orders = await loadStoreOrders();
  orders.unshift({
    id: orderId,
    phone_last10: auth.phoneLast10,
    items,
    total_credits: totalCredits,
    delivery_address: body.delivery_address || undefined,
    created_at: nowIso(),
    status: 'placed',
  });
  await saveStoreOrders(orders);

  const txns = await loadTransactions();
  txns.push({
    id: crypto.randomUUID(),
    type: 'store_checkout',
    amount: 0,
    credits: totalCredits,
    direction: 'debit',
    reference_id: orderId,
    description: `Store checkout (${items.length} item${items.length > 1 ? 's' : ''})`,
    status: 'completed',
    created_at: nowIso(),
    phone_last10: auth.phoneLast10,
  } as any);
  await saveTransactions(txns);

  return Response.json({
    success: true,
    data: {
      order_id: orderId,
      total_credits: totalCredits,
      items_count: items.length,
    },
  });
}
