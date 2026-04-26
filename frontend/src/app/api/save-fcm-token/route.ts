export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { handleSaveFcmToken } from '@/app/api/public/notifications/register/route';

export async function POST(req: Request) {
  return handleSaveFcmToken(req);
}
