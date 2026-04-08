export const runtime = 'nodejs';

import { loadStoreItems } from '@/app/api/_utils/blobStoreItems';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const items = await loadStoreItems();
  const found = items.find((i) => String(i.id) === String(id));
  if (!found) return Response.json({ success: false, message: 'Item not found' }, { status: 404 });
  return Response.json({ success: true, data: found });
}

