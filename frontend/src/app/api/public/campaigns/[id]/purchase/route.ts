export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import crypto from 'node:crypto';
import { loadCampaigns, saveCampaigns } from '@/app/api/_utils/blobCampaigns';
import { loadCampaignPurchases, saveCampaignPurchases } from '@/app/api/_utils/blobCampaignPurchases';
import { loadCampaignTickets, saveCampaignTickets } from '@/app/api/_utils/blobCampaignTickets';
import { loadTransactions, saveTransactions } from '@/app/api/_utils/blobTransactions';
import { requireUser } from '@/app/api/_utils/userAuth';
import { getClientIp, rateLimitOrThrow } from '@/app/api/_utils/security';

function nowIso() {
  return new Date().toISOString();
}

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

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  try {
    const ip = getClientIp(req);
    rateLimitOrThrow({ key: `campaign-purchase:ip:${ip}`, limit: 60, windowMs: 15 * 60 * 1000 });
    rateLimitOrThrow({ key: `campaign-purchase:phone:${auth.phoneLast10}`, limit: 30, windowMs: 15 * 60 * 1000 });
  } catch (e) {
    if (e && typeof e === 'object' && (e as any).status === 429) {
      const retryAfter = (e as any).retryAfterSeconds || 60;
      return new Response(JSON.stringify({ success: false, message: 'Too many requests' }), {
        status: 429,
        headers: { 'content-type': 'application/json', 'retry-after': String(retryAfter) },
      });
    }
    return Response.json({ success: false, message: 'Request blocked' }, { status: 400 });
  }

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { quantity?: number };
  const qty = Math.max(1, Math.min(20, asInt(body.quantity, 1)));

  const campaigns = await loadCampaigns();
  const idx = campaigns.findIndex((c) => String(c.id) === String(id));
  if (idx < 0) return Response.json({ success: false, message: 'Campaign not found' }, { status: 404 });

  const campaign: any = campaigns[idx];
  const status = deriveStatus(campaign);
  if (status !== 'active') {
    return Response.json({ success: false, message: 'Campaign is not active' }, { status: 400 });
  }

  const totalSlots = Math.max(0, asInt(campaign.total_slots, 0));
  const filledSlots = Math.max(0, asInt(campaign.filled_slots, 0));
  if (totalSlots > 0 && filledSlots >= totalSlots) {
    return Response.json({ success: false, message: 'Campaign is sold out' }, { status: 400 });
  }

  const maxQty = Math.max(1, Math.min(20, asInt(campaign.max_qty, 3)));

  const purchases = await loadCampaignPurchases();
  const pIdx = purchases.findIndex(
    (p) => p.phone_last10 === auth.phoneLast10 && String(p.campaign_id) === String(id)
  );
  const existing = pIdx >= 0 ? purchases[pIdx] : null;
  const already = existing ? Math.max(0, asInt(existing.quantity, 0)) : 0;
  const remaining = Math.max(0, maxQty - already);
  if (remaining <= 0) {
    return Response.json(
      { success: false, message: 'Maximum participation limit reached for this campaign', remaining_limit: 0 },
      { status: 400 }
    );
  }
  if (qty > remaining) {
    return Response.json(
      { success: false, message: `You can only purchase ${remaining} more for this campaign`, remaining_limit: remaining },
      { status: 400 }
    );
  }

  if (totalSlots > 0 && filledSlots + qty > totalSlots) {
    return Response.json(
      { success: false, message: 'Not enough slots remaining', remaining_slots: Math.max(0, totalSlots - filledSlots) },
      { status: 400 }
    );
  }

  const nextFilled = filledSlots + qty;
  campaign.filled_slots = nextFilled;
  // Auto-close when sold out.
  if (totalSlots > 0 && nextFilled >= totalSlots) {
    campaign.status = 'closed';
  }
  campaigns[idx] = campaign;

  // Generate ticket records (used in Activity/Tickets across devices).
  const tickets = await loadCampaignTickets();
  const campaignTickets = tickets.filter((t) => String(t.campaign_id) === String(id));
  const maxTicketNum = campaignTickets.reduce((m, t) => Math.max(m, asInt((t as any).ticket_number, 0)), 0);
  const newTickets = Array.from({ length: qty }, (_, i) => {
    const ticketNumber = maxTicketNum + i + 1;
    return {
      id: `${String(id)}-${auth.phoneLast10}-${ticketNumber}`,
      phone_last10: auth.phoneLast10,
      campaign_id: String(id),
      campaign_title: String(campaign.title || ''),
      ticket_number: ticketNumber,
      created_at: nowIso(),
    };
  });
  tickets.push(...newTickets);

  const nextPurchase = existing
    ? { ...existing, quantity: already + qty, updated_at: nowIso() }
    : {
        id: crypto.randomUUID(),
        phone_last10: auth.phoneLast10,
        campaign_id: String(id),
        quantity: qty,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
  if (pIdx >= 0) purchases[pIdx] = nextPurchase;
  else purchases.push(nextPurchase);

  // Write a simple transaction record for admin visibility.
  const txns = await loadTransactions();
  const creditPrice = Math.max(0, Number(campaign.credit_price || 0));
  const credits = creditPrice * qty;
  txns.push({
    id: crypto.randomUUID(),
    type: 'campaign_credit_purchase',
    amount: 0,
    credits,
    direction: 'credit',
    description: `Purchased ${qty} pack${qty > 1 ? 's' : ''} for campaign: ${campaign.title || id}`,
    status: 'completed',
    created_at: nowIso(),
    phone_last10: auth.phoneLast10,
  } as any);

  await Promise.all([saveCampaigns(campaigns as any), saveCampaignPurchases(purchases), saveTransactions(txns)]);
  await saveCampaignTickets(tickets);

  return Response.json({
    success: true,
    message: 'Purchase recorded',
    data: {
      campaign_id: id,
      quantity_purchased: qty,
      already_purchased: already + qty,
      remaining_limit: Math.max(0, maxQty - (already + qty)),
      filled_slots: nextFilled,
      total_slots: totalSlots,
      status: deriveStatus(campaign),
      tickets: newTickets.map((t) => ({ id: t.id, ticket_number: t.ticket_number })),
    },
  });
}
