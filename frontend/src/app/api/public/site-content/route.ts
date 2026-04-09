export const runtime = 'nodejs';

import { loadSiteContent } from '@/app/api/_utils/blobSiteContent';

export async function GET() {
  const content = await loadSiteContent();
  return Response.json({ success: true, data: content });
}

