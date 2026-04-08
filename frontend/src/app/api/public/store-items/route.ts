export const runtime = 'nodejs';

import { loadStoreItems } from '@/app/api/_utils/blobStoreItems';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const category = searchParams.get('category');

  const items = await loadStoreItems();
  const filtered = items.filter((i) => {
    if (type && i.type !== type) return false;
    if (category && String(i.category).toLowerCase() !== String(category).toLowerCase()) return false;
    return true;
  });
  return Response.json({ success: true, data: filtered });
}

