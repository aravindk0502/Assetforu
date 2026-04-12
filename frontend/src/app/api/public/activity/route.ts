export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireUser } from '@/app/api/_utils/userAuth';
import { loadCampaignTickets } from '@/app/api/_utils/blobCampaignTickets';
import { loadStoreOrders } from '@/app/api/_utils/blobStoreOrders';

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const [tickets, orders] = await Promise.all([loadCampaignTickets(), loadStoreOrders()]);

  const myTickets = tickets
    .filter((t) => t.phone_last10 === auth.phoneLast10)
    .map((t) => ({
      id: t.id,
      campaignId: t.campaign_id,
      campaignName: t.campaign_title || 'Campaign',
      creditsUsed: 0,
      status: 'Active Campaign',
      createdAt: t.created_at,
      ticketNumber: t.ticket_number,
    }));

  const myOrders = orders
    .filter((o) => o.phone_last10 === auth.phoneLast10)
    .map((o) => ({
      id: o.id,
      campaignId: o.items[0]?.item_id || o.id,
      campaignName: o.items[0]?.title || 'Order',
      creditsUsed: o.total_credits,
      status: 'Completed',
      createdAt: o.created_at,
      ticketNumber: undefined,
    }));

  // Sort newest first
  const combined = [...myTickets, ...myOrders].sort((a, b) => {
    const at = new Date(a.createdAt).getTime();
    const bt = new Date(b.createdAt).getTime();
    return bt - at;
  });

  return Response.json({
    success: true,
    data: {
      activity: combined,
      tickets: myTickets,
      orders: myOrders,
    },
  });
}

