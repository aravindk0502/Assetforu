export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { handleSendPushNotification } from '@/app/api/admin/notifications/send/route';

export async function POST(req: Request) {
  return handleSendPushNotification(req);
}
