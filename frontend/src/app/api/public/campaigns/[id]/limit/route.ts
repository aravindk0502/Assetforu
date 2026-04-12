export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { loadCampaigns } from '@/app/api/_utils/blobCampaigns';
import { loadCampaignPurchases } from '@/app/api/_utils/blobCampaignPurchases';
import { requireUser } from '@/app/api/_utils/userAuth';

function asInt(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function deriveStatus(c: any): 'active' | 'upcoming' | 'closed' {
  const status = String(c?.status ?? '').trim().toLowerCase();
  const normalized =
    status === 'closed' || status === 'active' || status === 'upcoming'
      ? status
      : status === 'close'
        ? 'closed'
        : 'active';
  const filled = Number(c?.filled_slots);
  const total = Number(c?.total_slots);
  if (Number.isFinite(filled) && Number.isFinite(total) && total > 0 && filled >= total) return 'closed';
  return normalized as any;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const campaigns = await loadCampaigns();
  const campaign = campaigns.find((c) => String(c.id) === String(id));
  if (!campaign) return Response.json({ success: false, message: 'Campaign not found' }, { status: 404 });

  const maxQty = Math.max(1, Math.min(20, asInt((campaign as any).max_qty, 3)));
  const status = deriveStatus(campaign as any);
  const totalSlots = Math.max(0, asInt((campaign as any).total_slots, 0));
  const filledSlots = Math.max(0, asInt((campaign as any).filled_slots, 0));
  const remainingSlots = totalSlots > 0 ? Math.max(0, totalSlots - filledSlots) : null;
  const soldOutAnnouncement =
    String((campaign as any)?.sold_out_announcement || '').trim() ||
    'Campaign closed — will announce live event soon.';

  // If not signed in, return the max.
  const auth = await requireUser(req);
  if (!auth.ok) {
    return Response.json({
      success: true,
      data: {
        limit: maxQty,
        already_purchased: 0,
        remaining_limit: maxQty,
        status,
        filled_slots: filledSlots,
        total_slots: totalSlots,
        remaining_slots: remainingSlots,
        sold_out_announcement: soldOutAnnouncement,
      },
    });
  }

  const purchases = await loadCampaignPurchases();
  const match = purchases.find(
    (p) => p.phone_last10 === auth.phoneLast10 && String(p.campaign_id) === String(id)
  );
  const already = Math.max(0, asInt(match?.quantity, 0));
  const remaining = Math.max(0, maxQty - already);
  return Response.json({
    success: true,
    data: {
      limit: maxQty,
      already_purchased: already,
      remaining_limit: remaining,
      status,
      filled_slots: filledSlots,
      total_slots: totalSlots,
      remaining_slots: remainingSlots,
      sold_out_announcement: soldOutAnnouncement,
    },
  });
}
