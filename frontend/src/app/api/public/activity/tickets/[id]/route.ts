export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireUser } from '@/app/api/_utils/userAuth';
import { loadCampaignTickets } from '@/app/api/_utils/blobCampaignTickets';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const { id } = await ctx.params;
  const tickets = await loadCampaignTickets();
  const found = tickets.find((t) => t.phone_last10 === auth.phoneLast10 && String(t.id) === String(id));
  if (!found) return Response.json({ success: false, message: 'Ticket not found' }, { status: 404 });

  return Response.json({ success: true, data: found });
}

