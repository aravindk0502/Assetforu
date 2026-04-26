export const runtime = 'nodejs';

import { requireAdmin } from '@/app/api/_utils/adminAuth';
import { loadCampaignPurchases } from '@/app/api/_utils/blobCampaignPurchases';
import { loadCampaigns } from '@/app/api/_utils/blobCampaigns';
import { loadCampaignTickets } from '@/app/api/_utils/blobCampaignTickets';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  try {
    const [purchases, campaigns, tickets] = await Promise.all([
      loadCampaignPurchases(),
      loadCampaigns(),
      loadCampaignTickets(),
    ]);
    const campaignMap = new Map(campaigns.map((c) => [String(c.id), c]));

    const enriched = purchases.map((purchase) => {
      const campaign = campaignMap.get(String(purchase.campaign_id));
      const allTickets = tickets
        .filter(
          (t) =>
            String(t.campaign_id) === String(purchase.campaign_id) &&
            String(t.phone_last10) === String(purchase.phone_last10)
        )
        .map((t) => Number(t.ticket_number))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b);

      return {
        ...purchase,
        campaign_title:
          purchase.campaign_title || String((campaign as any)?.title || purchase.campaign_id || ''),
        campaign_status: String((campaign as any)?.status || ''),
        campaign_location: String((campaign as any)?.location || ''),
        campaign_credit_price: Number((campaign as any)?.credit_price || 0),
        ticket_numbers: allTickets,
      };
    });

    const sorted = enriched
      .slice()
      .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());

    return Response.json({ success: true, data: sorted });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load campaign purchases';
    return Response.json({ success: false, message }, { status: 500 });
  }
}
